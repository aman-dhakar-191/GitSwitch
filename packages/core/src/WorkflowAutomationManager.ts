import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { StorageManager } from './StorageManager';
import { GitManager } from './GitManager';
import { ProjectManager } from './ProjectManager';
import { SecurityManager } from './SecurityManager';
import { AdvancedGitManager } from './AdvancedGitManager';
import { 
  AutomationRule, 
  RuleTrigger, 
  RuleCondition, 
  RuleAction,
  CronExpression,
  GitAccount,
  Project,
  AuditEvent
} from '@gitswitch/types';

/**
 * WorkflowAutomationManager - Stage 3 Workflow Automation and Custom Rules Engine
 * Handles rule-based automation for git identity management and enterprise workflows
 */
export class WorkflowAutomationManager {
  private storageManager: StorageManager;
  private gitManager: GitManager;
  private projectManager: ProjectManager;
  private securityManager: SecurityManager;
  private advancedGitManager: AdvancedGitManager;
  private readonly rulesFile: string;
  private automationRules: AutomationRule[] = [];
  private activeSchedules: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor(
    storageManager: StorageManager, 
    gitManager: GitManager, 
    projectManager: ProjectManager,
    securityManager: SecurityManager,
    advancedGitManager: AdvancedGitManager
  ) {
    this.storageManager = storageManager;
    this.gitManager = gitManager;
    this.projectManager = projectManager;
    this.securityManager = securityManager;
    this.advancedGitManager = advancedGitManager;
    
    const dataDir = path.join(require('os').homedir(), '.gitswitch');
    this.rulesFile = path.join(dataDir, 'automation-rules.json');
    
    this.loadAutomationRules();
    this.startAutomationEngine();
  }

  // Rule Management

  /**
   * Create a new automation rule
   */
  createRule(ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'lastTriggered' | 'triggerCount' | 'errorCount'>): AutomationRule {
    const rule: AutomationRule = {
      ...ruleData,
      id: this.generateId(),
      createdAt: new Date(),
      triggerCount: 0,
      errorCount: 0
    };

    this.automationRules.push(rule);
    this.saveAutomationRules();

    // If it's a scheduled rule, set up the schedule
    if (rule.trigger.type === 'schedule' && rule.trigger.schedule) {
      this.scheduleRule(rule);
    }

    this.logAuditEvent('rule_created', { ruleId: rule.id, ruleName: rule.name });
    console.log(`✅ Automation rule created: "${rule.name}"`);
    return rule;
  }

  /**
   * Get all automation rules
   */
  getRules(teamId?: string): AutomationRule[] {
    return this.automationRules.filter(rule => {
      if (teamId) {
        return rule.teamId === teamId;
      }
      return true;
    });
  }

  /**
   * Update an automation rule
   */
  updateRule(ruleId: string, updates: Partial<AutomationRule>): boolean {
    try {
      const ruleIndex = this.automationRules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) {
        return false;
      }

      const oldRule = this.automationRules[ruleIndex];
      this.automationRules[ruleIndex] = { ...oldRule, ...updates };
      
      // Re-schedule if it's a scheduled rule
      if (updates.trigger?.type === 'schedule') {
        this.clearSchedule(ruleId);
        if (updates.enabled !== false) {
          this.scheduleRule(this.automationRules[ruleIndex]);
        }
      }

      this.saveAutomationRules();
      this.logAuditEvent('rule_updated', { ruleId, updates });
      console.log(`✅ Rule updated: ${ruleId}`);
      return true;
    } catch (error) {
      console.error('Failed to update rule:', error);
      return false;
    }
  }

  /**
   * Delete an automation rule
   */
  deleteRule(ruleId: string): boolean {
    try {
      const ruleIndex = this.automationRules.findIndex(r => r.id === ruleId);
      if (ruleIndex === -1) {
        return false;
      }

      const rule = this.automationRules[ruleIndex];
      this.automationRules.splice(ruleIndex, 1);
      this.clearSchedule(ruleId);
      this.saveAutomationRules();

      this.logAuditEvent('rule_deleted', { ruleId, ruleName: rule.name });
      console.log(`✅ Rule deleted: ${rule.name}`);
      return true;
    } catch (error) {
      console.error('Failed to delete rule:', error);
      return false;
    }
  }

  /**
   * Test a rule without executing actions
   */
  testRule(rule: AutomationRule, context: Record<string, any>): { match: boolean; reason: string; actions: RuleAction[] } {
    try {
      const conditionsMatch = this.evaluateConditions(rule.conditions, context);
      
      return {
        match: conditionsMatch,
        reason: conditionsMatch ? 'All conditions matched' : 'One or more conditions failed',
        actions: conditionsMatch ? rule.actions : []
      };
    } catch (error: any) {
      return {
        match: false,
        reason: `Test failed: ${error.message}`,
        actions: []
      };
    }
  }

  /**
   * Manually trigger a rule
   */
  async triggerRule(ruleId: string, context: Record<string, any> = {}): Promise<boolean> {
    try {
      const rule = this.automationRules.find(r => r.id === ruleId);
      if (!rule) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      if (!rule.enabled) {
        throw new Error(`Rule is disabled: ${rule.name}`);
      }

      return await this.executeRule(rule, context);
    } catch (error) {
      console.error('Failed to trigger rule:', error);
      return false;
    }
  }

  // Event-Based Triggers

  /**
   * Handle project open events
   */
  onProjectOpen(projectPath: string): void {
    const context = {
      projectPath,
      trigger: 'project_open',
      timestamp: new Date().toISOString()
    };

    this.processEventTriggers('project_open', context);
  }

  /**
   * Handle before commit events
   */
  onBeforeCommit(projectPath: string, branch?: string): void {
    const context = {
      projectPath,
      branch: branch || 'unknown',
      trigger: 'before_commit',
      timestamp: new Date().toISOString()
    };

    this.processEventTriggers('before_commit', context);
  }

  /**
   * Handle after clone events
   */
  onAfterClone(projectPath: string, remoteUrl: string): void {
    const context = {
      projectPath,
      remoteUrl,
      trigger: 'after_clone',
      timestamp: new Date().toISOString()
    };

    this.processEventTriggers('after_clone', context);
  }

  /**
   * Handle account switch events
   */
  onAccountSwitch(projectPath: string, fromAccountId: string, toAccountId: string): void {
    const context = {
      projectPath,
      fromAccountId,
      toAccountId,
      trigger: 'account_switch',
      timestamp: new Date().toISOString()
    };

    this.processEventTriggers('account_switch', context);
  }

  /**
   * Handle policy violation events
   */
  onPolicyViolation(projectPath: string, violation: string, severity: 'warning' | 'error'): void {
    const context = {
      projectPath,
      violation,
      severity,
      trigger: 'policy_violation',
      timestamp: new Date().toISOString()
    };

    this.processEventTriggers('policy_violation', context);
  }

  // Private implementation methods

  private startAutomationEngine(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Set up scheduled rules
    this.automationRules
      .filter(rule => rule.enabled && rule.trigger.type === 'schedule')
      .forEach(rule => this.scheduleRule(rule));

    console.log(`🚀 Workflow automation engine started with ${this.automationRules.length} rules`);
  }

  private stopAutomationEngine(): void {
    this.isRunning = false;
    
    // Clear all schedules
    this.activeSchedules.forEach((timeout, ruleId) => {
      clearTimeout(timeout);
    });
    this.activeSchedules.clear();

    console.log('🛑 Workflow automation engine stopped');
  }

  private processEventTriggers(triggerType: string, context: Record<string, any>): void {
    const matchingRules = this.automationRules.filter(rule => 
      rule.enabled && 
      rule.trigger.type === triggerType
    );

    for (const rule of matchingRules) {
      // Check debounce
      if (rule.trigger.debounceMs && rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.trigger.debounceMs) {
          continue;
        }
      }

      // Execute rule asynchronously
      setImmediate(() => this.executeRule(rule, context));
    }
  }

  private async executeRule(rule: AutomationRule, context: Record<string, any>): Promise<boolean> {
    try {
      console.log(`🔧 Executing rule: "${rule.name}"`);

      // Evaluate conditions
      if (!this.evaluateConditions(rule.conditions, context)) {
        console.log(`⏭️ Rule conditions not met: "${rule.name}"`);
        return false;
      }

      // Execute actions
      let actionSuccess = true;
      for (const action of rule.actions) {
        try {
          const success = await this.executeAction(action, context);
          if (!success && !action.continueOnError) {
            actionSuccess = false;
            break;
          }
        } catch (error) {
          console.error(`Action failed in rule "${rule.name}":`, error);
          rule.errorCount++;
          if (!action.continueOnError) {
            actionSuccess = false;
            break;
          }
        }
      }

      // Update rule statistics
      rule.lastTriggered = new Date();
      rule.triggerCount++;
      
      if (actionSuccess) {
        this.logAuditEvent('rule_executed', { ruleId: rule.id, ruleName: rule.name, context });
        console.log(`✅ Rule executed successfully: "${rule.name}"`);
      }

      this.saveAutomationRules();
      return actionSuccess;
    } catch (error) {
      console.error(`Rule execution failed: "${rule.name}"`, error);
      rule.errorCount++;
      this.saveAutomationRules();
      return false;
    }
  }

  private evaluateConditions(conditions: RuleCondition[], context: Record<string, any>): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(condition: RuleCondition, context: Record<string, any>): boolean {
    const { type, operator, value, caseSensitive = true } = condition;
    
    let actualValue: string = '';
    
    switch (type) {
      case 'path_contains':
        actualValue = context.projectPath || '';
        break;
      case 'remote_url':
        actualValue = context.remoteUrl || '';
        break;
      case 'branch_name':
        actualValue = context.branch || '';
        break;
      case 'file_exists':
        actualValue = fs.existsSync(path.join(context.projectPath || '', value)) ? 'true' : 'false';
        return operator === 'equals' ? actualValue === 'true' : actualValue === 'false';
      case 'time_range':
        // Simple time range check (format: HH:MM-HH:MM)
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return this.isTimeInRange(currentTime, value);
      default:
        return false;
    }

    const compareValue = caseSensitive ? value : value.toLowerCase();
    const actualCompareValue = caseSensitive ? actualValue : actualValue.toLowerCase();

    switch (operator) {
      case 'equals':
        return actualCompareValue === compareValue;
      case 'contains':
        return actualCompareValue.includes(compareValue);
      case 'matches':
        try {
          const regex = new RegExp(compareValue, caseSensitive ? '' : 'i');
          return regex.test(actualValue);
        } catch {
          return false;
        }
      case 'not_equals':
        return actualCompareValue !== compareValue;
      default:
        return false;
    }
  }

  private async executeAction(action: RuleAction, context: Record<string, any>): Promise<boolean> {
    const { type, parameters, timeoutMs = 30000 } = action;

    // Set up timeout
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Action timeout')), timeoutMs);
    });

    const actionPromise = this.performAction(type, parameters, context);

    try {
      return await Promise.race([actionPromise, timeoutPromise]);
    } catch (error) {
      console.error(`Action "${type}" failed:`, error);
      return false;
    }
  }

  private async performAction(type: string, parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    switch (type) {
      case 'switch_account':
        return this.actionSwitchAccount(parameters, context);
      
      case 'notify':
        return this.actionNotify(parameters, context);
      
      case 'run_command':
        return this.actionRunCommand(parameters, context);
      
      case 'set_config':
        return this.actionSetConfig(parameters, context);
      
      case 'block_action':
        return this.actionBlockAction(parameters, context);
      
      case 'send_webhook':
        return this.actionSendWebhook(parameters, context);
      
      case 'log_event':
        return this.actionLogEvent(parameters, context);
      
      default:
        console.error(`Unknown action type: ${type}`);
        return false;
    }
  }

  private async actionSwitchAccount(parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    try {
      const { accountId } = parameters;
      const projectPath = context.projectPath;

      if (!accountId || !projectPath) {
        return false;
      }

      const success = this.projectManager.switchGitIdentity(projectPath, accountId);
      if (success) {
        console.log(`🔄 Switched to account: ${accountId}`);
      }
      return success;
    } catch (error) {
      console.error('Switch account action failed:', error);
      return false;
    }
  }

  private async actionNotify(parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    try {
      const { message, title = 'GitSwitch Automation' } = parameters;
      
      // For now, just log to console. In a real implementation, this would show system notifications
      console.log(`🔔 ${title}: ${message}`);
      return true;
    } catch (error) {
      console.error('Notify action failed:', error);
      return false;
    }
  }

  private async actionRunCommand(parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    try {
      const { command, workingDirectory } = parameters;
      const cwd = workingDirectory || context.projectPath || process.cwd();

      execSync(command, { cwd, stdio: 'pipe' });
      console.log(`✅ Command executed: ${command}`);
      return true;
    } catch (error) {
      console.error('Run command action failed:', error);
      return false;
    }
  }

  private async actionSetConfig(parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    try {
      const { key, value } = parameters;
      const projectPath = context.projectPath;

      if (!projectPath || !key || value === undefined) {
        return false;
      }

      execSync(`git config ${key} "${value}"`, { cwd: projectPath });
      console.log(`⚙️ Set config: ${key} = ${value}`);
      return true;
    } catch (error) {
      console.error('Set config action failed:', error);
      return false;
    }
  }

  private async actionBlockAction(parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    const { message = 'Action blocked by automation rule' } = parameters;
    console.log(`🚫 ${message}`);
    throw new Error(message);
  }

  private async actionSendWebhook(parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    try {
      const { url, method = 'POST', headers = {}, data } = parameters;
      
      // For demonstration purposes, just log the webhook details
      console.log(`📡 Webhook: ${method} ${url}`, { headers, data: data || context });
      return true;
    } catch (error) {
      console.error('Send webhook action failed:', error);
      return false;
    }
  }

  private async actionLogEvent(parameters: Record<string, any>, context: Record<string, any>): Promise<boolean> {
    try {
      const { message, level = 'info' } = parameters;
      
      this.logAuditEvent('automation_event', { 
        message, 
        level, 
        context,
        source: 'workflow_automation'
      });
      
      console.log(`📝 Logged event: ${message}`);
      return true;
    } catch (error) {
      console.error('Log event action failed:', error);
      return false;
    }
  }

  private scheduleRule(rule: AutomationRule): void {
    if (!rule.trigger.schedule) {
      return;
    }

    try {
      const nextRun = this.getNextRunTime(rule.trigger.schedule);
      const delay = nextRun.getTime() - Date.now();

      if (delay > 0) {
        const timeout = setTimeout(() => {
          this.executeRule(rule, { trigger: 'schedule', scheduled: true });
          // Reschedule for next occurrence
          this.scheduleRule(rule);
        }, delay);

        this.activeSchedules.set(rule.id, timeout);
        console.log(`⏰ Scheduled rule "${rule.name}" to run at ${nextRun.toLocaleString()}`);
      }
    } catch (error) {
      console.error(`Failed to schedule rule "${rule.name}":`, error);
    }
  }

  private clearSchedule(ruleId: string): void {
    const timeout = this.activeSchedules.get(ruleId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeSchedules.delete(ruleId);
    }
  }

  private getNextRunTime(schedule: CronExpression): Date {
    // Simplified cron implementation for demonstration
    // In a real implementation, use a proper cron library
    const now = new Date();
    const next = new Date(now);
    
    // For simplicity, just add 1 hour to current time
    next.setHours(next.getHours() + 1);
    
    return next;
  }

  private isTimeInRange(currentTime: string, range: string): boolean {
    try {
      const [start, end] = range.split('-');
      return currentTime >= start && currentTime <= end;
    } catch {
      return false;
    }
  }

  private loadAutomationRules(): void {
    try {
      if (fs.existsSync(this.rulesFile)) {
        const data = fs.readFileSync(this.rulesFile, 'utf8');
        this.automationRules = JSON.parse(data).map((rule: any) => ({
          ...rule,
          createdAt: new Date(rule.createdAt),
          lastTriggered: rule.lastTriggered ? new Date(rule.lastTriggered) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load automation rules:', error);
      this.automationRules = [];
    }
  }

  private saveAutomationRules(): void {
    try {
      const data = JSON.stringify(this.automationRules, null, 2);
      fs.writeFileSync(this.rulesFile, data, 'utf8');
    } catch (error) {
      console.error('Failed to save automation rules:', error);
    }
  }

  private logAuditEvent(action: string, metadata: Record<string, any>): void {
    this.securityManager.logAuditEvent({
      userId: 'system',
      userEmail: 'system@gitswitch.local',
      action: action as any,
      severity: 'info',
      ipAddress: '127.0.0.1',
      userAgent: 'GitSwitch-Automation',
      sessionId: 'automation-session',
      metadata: { source: 'workflow_automation', ...metadata }
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Cleanup on shutdown
  destroy(): void {
    this.stopAutomationEngine();
  }
}

export default WorkflowAutomationManager;
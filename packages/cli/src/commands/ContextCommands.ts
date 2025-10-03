import { Command } from 'commander';
import inquirer from 'inquirer';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';
import { SmartDetector, WorkflowAutomationManager } from '@gitswitch/core';

/**
 * Context-aware identity management commands (Phase 3 - Q3 2024)
 */
export class ContextCommands extends BaseCommand implements ICommand {
  private smartDetector: SmartDetector;
  private workflowAutomationManager: WorkflowAutomationManager;

  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any,
    smartDetector: SmartDetector,
    workflowAutomationManager: WorkflowAutomationManager
  ) {
    super(gitManager, storageManager, projectManager);
    this.smartDetector = smartDetector;
    this.workflowAutomationManager = workflowAutomationManager;
  }

  register(program: Command): void {
    const contextCmd = program
      .command('context')
      .description('Context-aware identity management');

    this.registerDetectCommand(contextCmd);
    this.registerSwitchCommand(contextCmd);
    this.registerRulesCommand(contextCmd);
    this.registerValidateCommand(contextCmd);
  }

  private registerDetectCommand(contextCmd: Command): void {
    contextCmd
      .command('detect')
      .description('Detect current work context and suggest identity')
      .option('--path <path>', 'Path to analyze', process.cwd())
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          const targetPath = options.path || process.cwd();
          
          console.log(`🔍 Analyzing work context for: ${targetPath}`);

          // Gather context information
          const context: any = {
            path: targetPath,
            timestamp: new Date(),
            factors: []
          };

          // Check if it's a git repository
          let isGitRepo = false;
          let remoteUrl = null;
          try {
            remoteUrl = await this.gitManager.getRemoteUrl(targetPath);
            isGitRepo = true;
            context.factors.push({
              type: 'git_repository',
              value: true,
              remoteUrl
            });
          } catch (e) {
            context.factors.push({
              type: 'git_repository',
              value: false
            });
          }

          // Detect account suggestions
          let suggestions = [];
          if (isGitRepo && remoteUrl) {
            suggestions = await this.smartDetector.suggestAccountForUrl(remoteUrl);
            context.factors.push({
              type: 'url_pattern',
              matched: suggestions.length > 0,
              suggestions: suggestions.slice(0, 3)
            });
          } else {
            suggestions = await this.smartDetector.suggestAccountForPath(targetPath);
            context.factors.push({
              type: 'path_pattern',
              matched: suggestions.length > 0,
              suggestions: suggestions.slice(0, 3)
            });
          }

          // Check time of day
          const hour = new Date().getHours();
          let timeContext = 'after-hours';
          if (hour >= 9 && hour < 17) {
            timeContext = 'work-hours';
          } else if (hour >= 17 && hour < 22) {
            timeContext = 'evening';
          }
          context.factors.push({
            type: 'time_of_day',
            value: timeContext,
            hour
          });

          // Check for automation rules
          const matchingRules = await this.workflowAutomationManager.findMatchingRules(
            targetPath,
            'project_open'
          );
          context.factors.push({
            type: 'automation_rules',
            count: matchingRules.length,
            rules: matchingRules.map(r => r.name)
          });

          // Output results
          if (options.json) {
            console.log(JSON.stringify(context, null, 2));
            return;
          }

          console.log(`\n📊 Context Analysis Results`);
          console.log(`${'='.repeat(50)}`);

          if (isGitRepo) {
            console.log(`\n📂 Git Repository: Yes`);
            console.log(`   Remote: ${remoteUrl}`);
          } else {
            console.log(`\n📂 Git Repository: No`);
          }

          console.log(`\n⏰ Time Context: ${timeContext} (${hour}:00)`);

          if (suggestions.length > 0) {
            console.log(`\n🎯 Suggested Identities:`);
            suggestions.slice(0, 3).forEach((suggestion, idx) => {
              const confidence = Math.round(suggestion.confidence * 100);
              console.log(`   ${idx + 1}. ${suggestion.account.name} <${suggestion.account.email}>`);
              console.log(`      Confidence: ${confidence}%`);
              console.log(`      Reason: ${suggestion.reason}`);
            });
          } else {
            console.log(`\n⚠️  No identity suggestions found`);
            console.log(`   Consider adding account patterns or using more repositories`);
          }

          if (matchingRules.length > 0) {
            console.log(`\n🤖 Matching Automation Rules: ${matchingRules.length}`);
            matchingRules.forEach(rule => {
              console.log(`   • ${rule.name}`);
            });
          }

          // Current identity check
          if (isGitRepo) {
            try {
              const currentConfig = await this.gitManager.getCurrentConfig(targetPath);
              console.log(`\n📧 Current Identity:`);
              console.log(`   ${currentConfig.name} <${currentConfig.email}>`);

              if (suggestions.length > 0 && suggestions[0].account.email !== currentConfig.email) {
                console.log(`\n⚠️  Identity Mismatch Detected!`);
                console.log(`   Expected: ${suggestions[0].account.email}`);
                console.log(`   Current:  ${currentConfig.email}`);
                console.log(`\n   Run: gitswitch context switch`);
              } else {
                console.log(`\n✅ Identity matches context`);
              }
            } catch (e) {
              // No current config
            }
          }

        } catch (error: any) {
          CLIUtils.showError('Context detection failed', error);
        }
      });
  }

  private registerSwitchCommand(contextCmd: Command): void {
    contextCmd
      .command('switch')
      .description('Switch identity based on detected context')
      .option('--auto', 'Automatically switch without confirmation')
      .option('--path <path>', 'Path to switch identity for', process.cwd())
      .action(async (options) => {
        try {
          const targetPath = options.path || process.cwd();
          this.validateGitRepository(targetPath);

          console.log(`🔍 Detecting context for: ${targetPath}`);

          // Get suggestions
          const remoteUrl = await this.gitManager.getRemoteUrl(targetPath);
          const suggestions = await this.smartDetector.suggestAccountForUrl(remoteUrl);

          if (suggestions.length === 0) {
            console.log('⚠️  No suitable identity found for this context');
            console.log('   Consider adding account patterns or manually switching');
            return;
          }

          const topSuggestion = suggestions[0];
          
          // Auto switch or prompt
          let shouldSwitch = options.auto;
          
          if (!shouldSwitch) {
            const confidence = Math.round(topSuggestion.confidence * 100);
            const { confirm } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirm',
                message: `Switch to ${topSuggestion.account.email}? (confidence: ${confidence}%)`,
                default: true
              }
            ]);
            shouldSwitch = confirm;
          }

          if (shouldSwitch) {
            await this.gitManager.setConfig(targetPath, {
              name: topSuggestion.account.name,
              email: topSuggestion.account.email,
              signingKey: topSuggestion.account.signingKey
            });

            console.log(`✅ Identity switched successfully`);
            console.log(`📧 New identity: ${topSuggestion.account.name} <${topSuggestion.account.email}>`);
            console.log(`   Reason: ${topSuggestion.reason}`);

            // Record usage for learning
            await this.smartDetector.recordAccountUsage(
              topSuggestion.account.email,
              remoteUrl || targetPath
            );
          } else {
            console.log('Identity switch cancelled');
          }

        } catch (error: any) {
          CLIUtils.showError('Context switch failed', error);
        }
      });
  }

  private registerRulesCommand(contextCmd: Command): void {
    contextCmd
      .command('rules')
      .description('Manage context-based automation rules')
      .option('--list', 'List all context rules')
      .option('--add', 'Add a new context rule')
      .option('--delete <id>', 'Delete a rule by ID')
      .action(async (options) => {
        try {
          if (options.list || (!options.add && !options.delete)) {
            // List rules
            const rules = this.workflowAutomationManager.getRules();
            
            if (rules.length === 0) {
              console.log('No context rules configured');
              return;
            }

            console.log(`\n📋 Context Automation Rules (${rules.length})`);
            console.log(`${'='.repeat(50)}`);

            rules.forEach((rule, idx) => {
              const status = rule.enabled ? '✅' : '⏸️ ';
              console.log(`\n${idx + 1}. ${status} ${rule.name}`);
              console.log(`   ID: ${rule.id}`);
              console.log(`   Trigger: ${rule.trigger.type}`);
              console.log(`   Actions: ${rule.actions.length}`);
              console.log(`   Triggered: ${rule.triggerCount} times`);
              if (rule.description) {
                console.log(`   Description: ${rule.description}`);
              }
            });

            return;
          }

          if (options.add) {
            // Interactive rule creation
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'name',
                message: 'Rule name:',
                validate: (input: string) => input.length > 0 || 'Name is required'
              },
              {
                type: 'input',
                name: 'description',
                message: 'Description (optional):'
              },
              {
                type: 'list',
                name: 'trigger',
                message: 'Trigger type:',
                choices: [
                  { name: 'When project opens', value: 'project_open' },
                  { name: 'Before commit', value: 'before_commit' },
                  { name: 'After clone', value: 'after_clone' },
                  { name: 'On schedule', value: 'schedule' }
                ]
              },
              {
                type: 'input',
                name: 'pattern',
                message: 'URL/path pattern (e.g., github.com/company):',
                validate: (input: string) => input.length > 0 || 'Pattern is required'
              },
              {
                type: 'list',
                name: 'action',
                message: 'Action to perform:',
                choices: [
                  { name: 'Switch account', value: 'switch_account' },
                  { name: 'Show notification', value: 'notify' },
                  { name: 'Run command', value: 'run_command' }
                ]
              }
            ]);

            // Get account if action is switch_account
            let accountEmail = null;
            if (answers.action === 'switch_account') {
              const accounts = this.storageManager.getAccounts();
              const { selectedAccount } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'selectedAccount',
                  message: 'Select account to switch to:',
                  choices: accounts.map(acc => ({
                    name: `${acc.name} <${acc.email}>`,
                    value: acc.email
                  }))
                }
              ]);
              accountEmail = selectedAccount;
            }

            // Create rule
            const rule = this.workflowAutomationManager.createRule({
              name: answers.name,
              description: answers.description,
              trigger: {
                type: answers.trigger,
                debounceMs: 1000
              },
              conditions: [
                {
                  type: 'remote_url',
                  operator: 'contains',
                  value: answers.pattern
                }
              ],
              actions: [
                {
                  id: 'action-1',
                  type: answers.action,
                  parameters: {
                    accountEmail: accountEmail,
                    message: `Context rule: ${answers.name}`
                  },
                  continueOnError: false
                }
              ],
              enabled: true,
              priority: 1,
              createdBy: 'cli-user'
            });

            console.log(`\n✅ Context rule created: ${rule.name}`);
            console.log(`   ID: ${rule.id}`);

            return;
          }

          if (options.delete) {
            const success = this.workflowAutomationManager.deleteRule(options.delete);
            if (success) {
              console.log(`✅ Rule deleted: ${options.delete}`);
            } else {
              console.log(`⚠️  Rule not found: ${options.delete}`);
            }
            return;
          }

        } catch (error: any) {
          CLIUtils.showError('Context rules management failed', error);
        }
      });
  }

  private registerValidateCommand(contextCmd: Command): void {
    contextCmd
      .command('validate')
      .description('Validate current identity matches context')
      .option('--path <path>', 'Path to validate', process.cwd())
      .option('--strict', 'Use strict validation')
      .action(async (options) => {
        try {
          const targetPath = options.path || process.cwd();
          this.validateGitRepository(targetPath);

          console.log(`🔍 Validating identity for: ${targetPath}`);

          // Get current identity
          const currentConfig = await this.gitManager.getCurrentConfig(targetPath);
          
          // Get expected identity
          const remoteUrl = await this.gitManager.getRemoteUrl(targetPath);
          const suggestions = await this.smartDetector.suggestAccountForUrl(remoteUrl);

          console.log(`\n📧 Current Identity:`);
          console.log(`   ${currentConfig.name} <${currentConfig.email}>`);

          if (suggestions.length === 0) {
            console.log(`\n⚠️  No pattern matches found for this repository`);
            console.log(`   Unable to validate identity`);
            
            if (!options.strict) {
              console.log(`\n✅ Validation passed (no rules enforced)`);
              process.exit(0);
            } else {
              console.log(`\n❌ Validation failed (strict mode requires pattern match)`);
              process.exit(1);
            }
          }

          const expected = suggestions[0];
          const confidence = Math.round(expected.confidence * 100);

          console.log(`\n🎯 Expected Identity:`);
          console.log(`   ${expected.account.name} <${expected.account.email}>`);
          console.log(`   Confidence: ${confidence}%`);
          console.log(`   Reason: ${expected.reason}`);

          // Validate
          if (currentConfig.email === expected.account.email) {
            console.log(`\n✅ Identity validation passed`);
            console.log(`   Current identity matches expected pattern`);
            process.exit(0);
          } else {
            console.log(`\n❌ Identity validation failed`);
            console.log(`   Identity mismatch detected`);
            console.log(`\n   Expected: ${expected.account.email}`);
            console.log(`   Current:  ${currentConfig.email}`);
            console.log(`\n💡 Run: gitswitch context switch`);
            
            if (options.strict) {
              process.exit(1);
            }
          }

        } catch (error: any) {
          CLIUtils.showError('Context validation failed', error);
          process.exit(1);
        }
      });
  }
}

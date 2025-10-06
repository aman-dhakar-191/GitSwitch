import * as fs from 'fs';
import * as path from 'path';
import { StorageManager } from './StorageManager';
import { WorkflowAutomationManager } from './WorkflowAutomationManager';
import { AutomationRule } from '@gitswitch/types';

/**
 * AutomationTemplate - Pre-built automation rule template
 */
export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'project' | 'commit' | 'security' | 'workflow' | 'integration';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rule: Omit<AutomationRule, 'id' | 'createdAt' | 'lastTriggered' | 'triggerCount' | 'errorCount'>;
  tags: string[];
  usageCount: number;
  rating?: number;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * QuickstartScenario - Guided setup for common automation scenarios
 */
export interface QuickstartScenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: QuickstartStep[];
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'moderate' | 'advanced';
  templates: string[]; // Template IDs to apply
}

export interface QuickstartStep {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'input' | 'selection' | 'confirmation' | 'action';
  required: boolean;
  inputType?: 'text' | 'number' | 'select' | 'multiselect';
  options?: string[];
  defaultValue?: any;
  validation?: (value: any) => boolean;
}

/**
 * AutomationTemplateManager - Phase 4 Automation Template System
 * Manages pre-built automation rule templates and quickstart wizards
 */
export class AutomationTemplateManager {
  private storageManager: StorageManager;
  private workflowAutomationManager: WorkflowAutomationManager;
  private readonly templatesFile: string;
  private templates: AutomationTemplate[] = [];

  constructor(storageManager: StorageManager, workflowAutomationManager: WorkflowAutomationManager) {
    this.storageManager = storageManager;
    this.workflowAutomationManager = workflowAutomationManager;
    
    const dataDir = path.join(require('os').homedir(), '.gitswitch');
    this.templatesFile = path.join(dataDir, 'automation-templates.json');
    
    this.loadTemplates();
    this.initializeDefaultTemplates();
  }

  /**
   * Get all automation templates
   */
  getTemplates(category?: string): AutomationTemplate[] {
    if (category) {
      return this.templates.filter(t => t.category === category);
    }
    return this.templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Get template by ID
   */
  getTemplateById(templateId: string): AutomationTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  }

  /**
   * Apply an automation template
   */
  async applyTemplate(templateId: string, customizations?: Partial<AutomationRule>): Promise<AutomationRule | null> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      console.error(`❌ Template not found: ${templateId}`);
      return null;
    }

    console.log(`🔄 Applying automation template: "${template.name}"`);

    try {
      // Create automation rule from template with customizations
      const ruleData = {
        ...template.rule,
        ...customizations,
        name: customizations?.name || template.rule.name
      };

      const rule = await this.workflowAutomationManager.createRule(ruleData);

      // Increment usage count
      template.usageCount++;
      this.updateTemplate(templateId, { usageCount: template.usageCount });

      console.log(`✅ Automation template applied successfully`);
      return rule;

    } catch (error: any) {
      console.error(`❌ Failed to apply template: ${error.message}`);
      return null;
    }
  }

  /**
   * Create a custom automation template
   */
  createTemplate(templateData: Omit<AutomationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): AutomationTemplate {
    const template: AutomationTemplate = {
      ...templateData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this.templates.push(template);
    this.saveTemplates();

    console.log(`✅ Automation template created: "${template.name}"`);
    return template;
  }

  /**
   * Update an automation template
   */
  updateTemplate(templateId: string, updates: Partial<AutomationTemplate>): boolean {
    const templateIndex = this.templates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      console.error(`❌ Template not found: ${templateId}`);
      return false;
    }

    this.templates[templateIndex] = {
      ...this.templates[templateIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.saveTemplates();
    return true;
  }

  /**
   * Delete an automation template
   */
  deleteTemplate(templateId: string): boolean {
    const templateIndex = this.templates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      console.error(`❌ Template not found: ${templateId}`);
      return false;
    }

    const template = this.templates[templateIndex];
    this.templates.splice(templateIndex, 1);
    this.saveTemplates();

    console.log(`✅ Template deleted: "${template.name}"`);
    return true;
  }

  /**
   * Get quickstart scenarios
   */
  getQuickstartScenarios(): QuickstartScenario[] {
    return [
      {
        id: 'work-personal-split',
        name: 'Work & Personal Account Split',
        description: 'Automatically use work account for work projects and personal account for personal projects',
        icon: '👔',
        estimatedTime: 3,
        difficulty: 'easy',
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to GitSwitch Quickstart',
            description: 'We\'ll help you set up automatic account switching for work and personal projects.',
            type: 'info',
            required: true
          },
          {
            id: 'work-account',
            title: 'Select Work Account',
            description: 'Choose the git account you use for work projects',
            type: 'selection',
            required: true,
            options: []
          },
          {
            id: 'personal-account',
            title: 'Select Personal Account',
            description: 'Choose the git account you use for personal projects',
            type: 'selection',
            required: true,
            options: []
          },
          {
            id: 'work-patterns',
            title: 'Work Project Patterns',
            description: 'Enter patterns that identify work projects (e.g., github.com/company-name)',
            type: 'input',
            required: true,
            inputType: 'text'
          },
          {
            id: 'confirm',
            title: 'Review Setup',
            description: 'Review your configuration before applying',
            type: 'confirmation',
            required: true
          }
        ],
        templates: ['auto-switch-work', 'auto-switch-personal']
      },
      {
        id: 'signing-setup',
        name: 'Commit Signing Setup',
        description: 'Set up automatic GPG/SSH signing for all commits',
        icon: '🔒',
        estimatedTime: 5,
        difficulty: 'moderate' as const,
        steps: [
          {
            id: 'welcome',
            title: 'Commit Signing Setup',
            description: 'Configure automatic commit signing for enhanced security',
            type: 'info',
            required: true
          },
          {
            id: 'signing-type',
            title: 'Select Signing Method',
            description: 'Choose between GPG and SSH signing',
            type: 'selection',
            required: true,
            inputType: 'select',
            options: ['GPG', 'SSH']
          },
          {
            id: 'key-selection',
            title: 'Select Signing Key',
            description: 'Choose which key to use for signing',
            type: 'selection',
            required: true
          },
          {
            id: 'auto-sign',
            title: 'Enable Auto-Signing',
            description: 'Automatically sign all commits?',
            type: 'confirmation',
            required: true
          }
        ],
        templates: ['auto-sign-commits']
      },
      {
        id: 'hooks-validation',
        name: 'Git Hooks Validation',
        description: 'Install git hooks to prevent commits with wrong identity',
        icon: '🛡️',
        estimatedTime: 2,
        difficulty: 'easy',
        steps: [
          {
            id: 'welcome',
            title: 'Git Hooks Setup',
            description: 'Install hooks to validate identity before commits',
            type: 'info',
            required: true
          },
          {
            id: 'validation-level',
            title: 'Validation Level',
            description: 'Choose validation strictness',
            type: 'selection',
            required: true,
            inputType: 'select',
            options: ['Strict - Block wrong commits', 'Warning - Show warning only', 'Off - No validation']
          },
          {
            id: 'auto-fix',
            title: 'Enable Auto-Fix',
            description: 'Automatically fix identity before committing?',
            type: 'confirmation',
            required: true
          }
        ],
        templates: ['pre-commit-validation']
      },
      {
        id: 'monorepo-setup',
        name: 'Monorepo Management',
        description: 'Set up different accounts for different subprojects in a monorepo',
        icon: '📦',
        estimatedTime: 7,
        difficulty: 'advanced',
        steps: [
          {
            id: 'welcome',
            title: 'Monorepo Setup',
            description: 'Configure identity management for monorepo subprojects',
            type: 'info',
            required: true
          },
          {
            id: 'root-path',
            title: 'Monorepo Root',
            description: 'Enter the path to your monorepo root',
            type: 'input',
            required: true,
            inputType: 'text'
          },
          {
            id: 'subprojects',
            title: 'Define Subprojects',
            description: 'Define subproject paths and their associated accounts',
            type: 'input',
            required: true,
            inputType: 'multiselect'
          }
        ],
        templates: ['monorepo-auto-switch']
      }
    ];
  }

  /**
   * Execute a quickstart scenario
   */
  async executeQuickstart(scenarioId: string, responses: Record<string, any>): Promise<boolean> {
    const scenarios = this.getQuickstartScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);
    
    if (!scenario) {
      console.error(`❌ Quickstart scenario not found: ${scenarioId}`);
      return false;
    }

    console.log(`🚀 Starting quickstart: "${scenario.name}"`);

    try {
      // Apply each template referenced by the scenario
      for (const templateId of scenario.templates) {
        const template = this.getTemplateById(templateId);
        if (template) {
          await this.applyTemplate(templateId, {
            name: `${scenario.name} - ${template.name}`,
            enabled: true
          });
        }
      }

      console.log(`✅ Quickstart completed successfully`);
      return true;

    } catch (error: any) {
      console.error(`❌ Quickstart failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Search templates by query
   */
  searchTemplates(query: string): AutomationTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export template to JSON
   */
  exportTemplate(templateId: string, outputPath: string): boolean {
    const template = this.getTemplateById(templateId);
    if (!template) {
      console.error(`❌ Template not found: ${templateId}`);
      return false;
    }

    try {
      fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
      console.log(`✅ Template exported to: ${outputPath}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to export template: ${error.message}`);
      return false;
    }
  }

  /**
   * Import template from JSON
   */
  importTemplate(inputPath: string): AutomationTemplate | null {
    try {
      const data = fs.readFileSync(inputPath, 'utf-8');
      const templateData = JSON.parse(data);
      
      const template = this.createTemplate({
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        difficulty: templateData.difficulty,
        rule: templateData.rule,
        tags: templateData.tags || [],
        rating: templateData.rating,
        author: templateData.author || 'imported'
      });

      console.log(`✅ Template imported: "${template.name}"`);
      return template;
    } catch (error: any) {
      console.error(`❌ Failed to import template: ${error.message}`);
      return null;
    }
  }

  // Helper methods

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultTemplates(): void {
    // Only initialize if templates file doesn't exist
    if (this.templates.length > 0) {
      return;
    }

    console.log('📦 Initializing default automation templates...');

    // Template 1: Auto-switch work account
    this.createTemplate({
      name: 'Auto-switch Work Account',
      description: 'Automatically switch to work account for work projects',
      category: 'project',
      difficulty: 'beginner',
      rule: {
        name: 'Work Account Auto-Switch',
        description: 'Switch to work account when opening work projects',
        trigger: { type: 'project_open' },
        conditions: [
          {
            type: 'remote_url',
            operator: 'contains',
            value: 'github.com/company'
          }
        ],
        actions: [
          {
            id: 'switch-account',
            type: 'switch_account',
            parameters: { accountId: 'work-account-id' },
            continueOnError: false
          }
        ],
        enabled: true,
        priority: 10,
        createdBy: 'system'
      },
      tags: ['work', 'automatic', 'account-switch'],
      author: 'GitSwitch Team'
    });

    // Template 2: Pre-commit validation
    this.createTemplate({
      name: 'Pre-Commit Identity Validation',
      description: 'Validate git identity before each commit',
      category: 'security',
      difficulty: 'beginner',
      rule: {
        name: 'Validate Identity Before Commit',
        description: 'Ensure correct identity is set before committing',
        trigger: { type: 'before_commit' },
        conditions: [],
        actions: [
          {
            id: 'validate',
            type: 'block_action',
            parameters: { message: 'Wrong git identity!' },
            continueOnError: false
          }
        ],
        enabled: true,
        priority: 100,
        createdBy: 'system'
      },
      tags: ['validation', 'security', 'pre-commit'],
      author: 'GitSwitch Team'
    });

    // Template 3: Auto-sign commits
    this.createTemplate({
      name: 'Auto-Sign Commits',
      description: 'Automatically sign all commits with GPG/SSH',
      category: 'security',
      difficulty: 'intermediate' as const,
      rule: {
        name: 'Auto-Sign All Commits',
        description: 'Sign commits automatically for enhanced security',
        trigger: { type: 'before_commit' },
        conditions: [],
        actions: [
          {
            id: 'sign',
            type: 'set_config',
            parameters: { 
              key: 'commit.gpgsign',
              value: 'true'
            },
            continueOnError: false
          }
        ],
        enabled: true,
        priority: 50,
        createdBy: 'system'
      },
      tags: ['signing', 'security', 'gpg'],
      author: 'GitSwitch Team'
    });

    console.log(`✅ Initialized ${this.templates.length} default templates`);
  }

  private loadTemplates(): void {
    try {
      if (fs.existsSync(this.templatesFile)) {
        const data = fs.readFileSync(this.templatesFile, 'utf-8');
        this.templates = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load automation templates:', error);
      this.templates = [];
    }
  }

  private saveTemplates(): void {
    try {
      const dataDir = path.dirname(this.templatesFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.templatesFile, JSON.stringify(this.templates, null, 2));
    } catch (error) {
      console.error('Failed to save automation templates:', error);
    }
  }
}

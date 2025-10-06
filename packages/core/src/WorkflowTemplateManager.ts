import * as fs from 'fs';
import * as path from 'path';
import { StorageManager } from './StorageManager';
import { GitManager } from './GitManager';

/**
 * WorkflowTemplate - Represents a reusable workflow template
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'commit' | 'push' | 'pull' | 'clone' | 'sync' | 'custom';
  steps: WorkflowStep[];
  variables: Record<string, string>; // Template variables
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  author?: string;
  tags: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'git_command' | 'identity_switch' | 'validation' | 'hook' | 'custom';
  command?: string;
  parameters: Record<string, any>;
  continueOnError: boolean;
  timeout?: number;
}

export interface WorkflowRecording {
  id: string;
  name: string;
  description: string;
  startedAt: Date;
  endedAt?: Date;
  actions: RecordedAction[];
  status: 'recording' | 'completed' | 'error';
}

export interface RecordedAction {
  timestamp: Date;
  type: 'git_command' | 'identity_switch' | 'file_change';
  command?: string;
  parameters: Record<string, any>;
  result?: any;
}

/**
 * WorkflowTemplateManager - Phase 4 Workflow Template System
 * Manages workflow templates for reusable automation sequences
 */
export class WorkflowTemplateManager {
  private storageManager: StorageManager;
  private gitManager: GitManager;
  private readonly templatesFile: string;
  private readonly recordingsFile: string;
  private templates: WorkflowTemplate[] = [];
  private recordings: WorkflowRecording[] = [];
  private activeRecording: WorkflowRecording | null = null;

  constructor(storageManager: StorageManager, gitManager: GitManager) {
    this.storageManager = storageManager;
    this.gitManager = gitManager;
    
    const dataDir = path.join(require('os').homedir(), '.gitswitch');
    this.templatesFile = path.join(dataDir, 'workflow-templates.json');
    this.recordingsFile = path.join(dataDir, 'workflow-recordings.json');
    
    this.loadTemplates();
    this.loadRecordings();
  }

  /**
   * Create a new workflow template
   */
  createTemplate(templateData: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): WorkflowTemplate {
    const template: WorkflowTemplate = {
      ...templateData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this.templates.push(template);
    this.saveTemplates();

    console.log(`✅ Workflow template created: "${template.name}"`);
    return template;
  }

  /**
   * Get all workflow templates
   */
  getTemplates(category?: string): WorkflowTemplate[] {
    if (category) {
      return this.templates.filter(t => t.category === category);
    }
    return this.templates;
  }

  /**
   * Get template by ID
   */
  getTemplateById(templateId: string): WorkflowTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  }

  /**
   * Update a workflow template
   */
  updateTemplate(templateId: string, updates: Partial<WorkflowTemplate>): boolean {
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
    console.log(`✅ Template updated: ${templateId}`);
    return true;
  }

  /**
   * Delete a workflow template
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
   * Apply a workflow template
   */
  async applyTemplate(templateId: string, projectPath: string, variables?: Record<string, string>): Promise<boolean> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      console.error(`❌ Template not found: ${templateId}`);
      return false;
    }

    console.log(`🔄 Applying workflow template: "${template.name}"`);

    try {
      // Merge template variables with provided variables
      const resolvedVars = { ...template.variables, ...variables };

      // Execute each step in the template
      for (const step of template.steps) {
        console.log(`  ▶ Executing step: ${step.name}`);

        try {
          await this.executeWorkflowStep(step, projectPath, resolvedVars);
          console.log(`    ✅ Step completed`);
        } catch (error: any) {
          console.error(`    ❌ Step failed: ${error.message}`);
          
          if (!step.continueOnError) {
            throw error;
          }
          console.log(`    ⚠ Continuing despite error...`);
        }
      }

      // Increment usage count
      template.usageCount++;
      this.updateTemplate(templateId, { usageCount: template.usageCount });

      console.log(`✅ Workflow template applied successfully`);
      return true;

    } catch (error: any) {
      console.error(`❌ Failed to apply template: ${error.message}`);
      return false;
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(step: WorkflowStep, projectPath: string, variables: Record<string, string>): Promise<void> {
    // Replace variables in command and parameters
    const resolvedCommand = step.command ? this.resolveVariables(step.command, variables) : undefined;
    const resolvedParams = this.resolveVariables(JSON.stringify(step.parameters), variables);
    const params = JSON.parse(resolvedParams);

    switch (step.type) {
      case 'git_command':
        if (resolvedCommand) {
          await this.executeGitCommand(projectPath, resolvedCommand);
        }
        break;

      case 'identity_switch':
        if (params.accountId) {
          await this.switchIdentity(projectPath, params.accountId);
        }
        break;

      case 'validation':
        await this.validateProject(projectPath, params);
        break;

      case 'hook':
        await this.executeHook(projectPath, params);
        break;

      case 'custom':
        if (resolvedCommand) {
          await this.executeCustomCommand(projectPath, resolvedCommand);
        }
        break;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Start recording a workflow
   */
  startRecording(name: string, description: string): WorkflowRecording {
    if (this.activeRecording) {
      throw new Error('A recording is already in progress');
    }

    const recording: WorkflowRecording = {
      id: this.generateId(),
      name,
      description,
      startedAt: new Date(),
      actions: [],
      status: 'recording'
    };

    this.activeRecording = recording;
    this.recordings.push(recording);
    this.saveRecordings();

    console.log(`🔴 Started recording workflow: "${name}"`);
    return recording;
  }

  /**
   * Record an action during workflow recording
   */
  recordAction(type: RecordedAction['type'], command?: string, parameters?: Record<string, any>, result?: any): void {
    if (!this.activeRecording) {
      return; // Silently ignore if not recording
    }

    const action: RecordedAction = {
      timestamp: new Date(),
      type,
      command,
      parameters: parameters || {},
      result
    };

    this.activeRecording.actions.push(action);
    this.saveRecordings();
  }

  /**
   * Stop recording and save the workflow
   */
  stopRecording(): WorkflowRecording | null {
    if (!this.activeRecording) {
      console.error('❌ No recording in progress');
      return null;
    }

    this.activeRecording.endedAt = new Date();
    this.activeRecording.status = 'completed';

    const recording = this.activeRecording;
    this.activeRecording = null;
    this.saveRecordings();

    console.log(`⏹ Stopped recording workflow: "${recording.name}"`);
    console.log(`   Recorded ${recording.actions.length} actions`);
    return recording;
  }

  /**
   * Convert a recording into a template
   */
  convertRecordingToTemplate(recordingId: string, templateName: string, category: WorkflowTemplate['category']): WorkflowTemplate | null {
    const recording = this.recordings.find(r => r.id === recordingId);
    if (!recording) {
      console.error(`❌ Recording not found: ${recordingId}`);
      return null;
    }

    if (recording.status !== 'completed') {
      console.error(`❌ Recording must be completed before converting to template`);
      return null;
    }

    // Convert recorded actions to workflow steps
    const steps: WorkflowStep[] = recording.actions.map((action, index) => ({
      id: `step-${index + 1}`,
      name: action.command || action.type,
      type: action.type as WorkflowStep['type'],
      command: action.command,
      parameters: action.parameters,
      continueOnError: false
    }));

    const template = this.createTemplate({
      name: templateName,
      description: recording.description || `Converted from recording: ${recording.name}`,
      category,
      steps,
      variables: {},
      tags: ['recorded'],
      author: 'user'
    });

    console.log(`✅ Converted recording to template: "${templateName}"`);
    return template;
  }

  /**
   * Get all recordings
   */
  getRecordings(): WorkflowRecording[] {
    return this.recordings;
  }

  /**
   * Delete a recording
   */
  deleteRecording(recordingId: string): boolean {
    const recordingIndex = this.recordings.findIndex(r => r.id === recordingId);
    if (recordingIndex === -1) {
      console.error(`❌ Recording not found: ${recordingId}`);
      return false;
    }

    this.recordings.splice(recordingIndex, 1);
    this.saveRecordings();

    console.log(`✅ Recording deleted`);
    return true;
  }

  /**
   * Export template to JSON file
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
   * Import template from JSON file
   */
  importTemplate(inputPath: string): WorkflowTemplate | null {
    try {
      const data = fs.readFileSync(inputPath, 'utf-8');
      const templateData = JSON.parse(data);
      
      // Create new template with imported data
      const template = this.createTemplate({
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        steps: templateData.steps,
        variables: templateData.variables || {},
        tags: templateData.tags || [],
        author: templateData.author
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

  private resolveVariables(text: string, variables: Record<string, string>): string {
    let resolved = text;
    for (const [key, value] of Object.entries(variables)) {
      resolved = resolved.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    }
    return resolved;
  }

  private async executeGitCommand(projectPath: string, command: string): Promise<void> {
    const { execSync } = require('child_process');
    execSync(command, { cwd: projectPath, stdio: 'inherit' });
  }

  private async switchIdentity(projectPath: string, accountId: string): Promise<void> {
    const accounts = this.storageManager.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    this.gitManager.setConfig(projectPath, {
      name: account.gitName,
      email: account.email
    });
  }

  private async validateProject(projectPath: string, params: any): Promise<void> {
    if (!this.gitManager.isGitRepository(projectPath)) {
      throw new Error('Not a git repository');
    }
  }

  private async executeHook(projectPath: string, params: any): Promise<void> {
    // Execute hook logic
    console.log(`  Executing hook: ${params.hookName || 'default'}`);
  }

  private async executeCustomCommand(projectPath: string, command: string): Promise<void> {
    const { execSync } = require('child_process');
    execSync(command, { cwd: projectPath, stdio: 'inherit' });
  }

  private loadTemplates(): void {
    try {
      if (fs.existsSync(this.templatesFile)) {
        const data = fs.readFileSync(this.templatesFile, 'utf-8');
        this.templates = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load workflow templates:', error);
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
      console.error('Failed to save workflow templates:', error);
    }
  }

  private loadRecordings(): void {
    try {
      if (fs.existsSync(this.recordingsFile)) {
        const data = fs.readFileSync(this.recordingsFile, 'utf-8');
        this.recordings = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load workflow recordings:', error);
      this.recordings = [];
    }
  }

  private saveRecordings(): void {
    try {
      const dataDir = path.dirname(this.recordingsFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.recordingsFile, JSON.stringify(this.recordings, null, 2));
    } catch (error) {
      console.error('Failed to save workflow recordings:', error);
    }
  }
}

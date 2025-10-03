import { Command } from 'commander';
import { ICommand } from '../types/CommandTypes';
import { DotCommand } from './DotCommand';
import { AccountCommands } from './AccountCommands';
import { ProjectCommands } from './ProjectCommands';
import { HookCommands } from './HookCommands';
import { GitCommands } from './GitCommands';
import { RepoCommands } from './RepoCommands';
import { IntegrationCommands } from './IntegrationCommands';
import { ContextCommands } from './ContextCommands';
import { PatternCommands } from './PatternCommands';
import { PerfCommands } from './PerfCommands';

// Import managers from core
import {
  GitManager,
  StorageManager,
  ProjectManager,
  ProjectScanner,
  SmartDetector,
  GitHookManager,
  TeamManager,
  SecurityManager,
  ConfigSyncManager,
  PluginManager,
  AdvancedGitManager,
  WorkflowAutomationManager,
  BulkImportManager,
  OAuthManager
} from '@gitswitch/core';

/**
 * Command registry that manages all CLI commands
 */
export class CommandRegistry {
  private commands: ICommand[] = [];
  
  // Managers
  private gitManager!: GitManager;
  private storageManager!: StorageManager;
  private projectManager!: ProjectManager;
  private projectScanner!: ProjectScanner;
  private smartDetector!: SmartDetector;
  private gitHookManager!: GitHookManager;
  private teamManager!: TeamManager;
  private securityManager!: SecurityManager;
  private configSyncManager!: ConfigSyncManager;
  private pluginManager!: PluginManager;
  private advancedGitManager!: AdvancedGitManager;
  private workflowAutomationManager!: WorkflowAutomationManager;
  private bulkImportManager!: BulkImportManager;
  private oauthManager!: OAuthManager;

  constructor() {
    this.initializeManagers();
    this.registerCommands();
  }

  private initializeManagers(): void {
    this.gitManager = new GitManager();
    this.storageManager = new StorageManager();
    this.projectManager = new ProjectManager();
    this.projectScanner = new ProjectScanner(this.gitManager, this.storageManager);
    this.smartDetector = new SmartDetector(this.storageManager);
    this.gitHookManager = new GitHookManager(this.gitManager, this.storageManager, this.smartDetector);
    this.teamManager = new TeamManager(this.storageManager);
    this.securityManager = new SecurityManager(this.storageManager);
    this.configSyncManager = new ConfigSyncManager(this.storageManager, this.teamManager);
    this.pluginManager = new PluginManager(this.storageManager, this.gitManager, this.projectManager);
    this.advancedGitManager = new AdvancedGitManager(this.gitManager, this.securityManager, this.storageManager);
    this.workflowAutomationManager = new WorkflowAutomationManager(
      this.storageManager,
      this.gitManager,
      this.projectManager,
      this.securityManager,
      this.advancedGitManager
    );
    this.bulkImportManager = new BulkImportManager(
      this.storageManager,
      this.projectScanner,
      this.smartDetector,
      this.gitManager
    );
    this.oauthManager = new OAuthManager(this.storageManager);
  }

  private registerCommands(): void {
    // Register all command modules
    this.commands = [
      new DotCommand(this.gitManager, this.storageManager, this.projectManager),
      
      new AccountCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager,
        this.oauthManager
      ),
      
      new ProjectCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager,
        this.projectScanner,
        this.smartDetector,
        this.bulkImportManager
      ),
      
      new HookCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager,
        this.gitHookManager
      ),

      // Phase 3 Commands
      new GitCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager,
        this.advancedGitManager
      ),

      new RepoCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager,
        this.smartDetector
      ),

      new IntegrationCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager
      ),

      new ContextCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager,
        this.smartDetector,
        this.workflowAutomationManager
      ),

      new PatternCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager,
        this.smartDetector
      ),

      new PerfCommands(
        this.gitManager,
        this.storageManager,
        this.projectManager
      )
    ];
  }

  /**
   * Register all commands with the commander program
   */
  registerWithProgram(program: Command): void {
    this.commands.forEach(command => {
      command.register(program);
    });
  }

  /**
   * Get a specific manager instance
   */
  getManager<T>(managerName: keyof CommandRegistry): T {
    return this[managerName] as T;
  }
}
import { Command } from 'commander';
import { GitManager, StorageManager, ProjectManager } from '@gitswitch/core';
import { CLIUtils } from '../../utils/CLIUtils';

/**
 * Base class for all CLI commands providing common functionality
 */
export abstract class BaseCommand {
  protected gitManager: GitManager;
  protected storageManager: StorageManager;
  protected projectManager: ProjectManager;

  constructor(
    gitManager: GitManager,
    storageManager: StorageManager,
    projectManager: ProjectManager
  ) {
    this.gitManager = gitManager;
    this.storageManager = storageManager;
    this.projectManager = projectManager;
  }

  /**
   * Register this command with the commander program
   */
  abstract register(program: Command): void;

  /**
   * Handle errors consistently across all commands
   */
  protected handleError(error: any, context: string): never {
    console.error(`❌ ${context}:`, error.message || error);
    process.exit(1);
  }

  /**
   * Validate that current directory is a git repository
   */
  protected validateGitRepository(path: string = process.cwd()): void {
    if (!this.gitManager.isGitRepository(path)) {
      console.error('❌ Current directory is not a git repository');
      process.exit(1);
    }
  }

  /**
   * Get current project with error handling
   */
  protected getCurrentProject(path: string = process.cwd()) {
    const project = this.projectManager.analyzeProject(path);
    if (!project) {
      console.error('❌ Current directory is not a git repository');
      process.exit(1);
    }
    return project;
  }

  /**
   * Display success message
   */
  protected showSuccess(message: string): void {
    console.log(`✅ ${message}`);
  }

  /**
   * Display info message
   */
  protected showInfo(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Display warning message
   */
  protected showWarning(message: string): void {
    console.log(`⚠️  ${message}`);
  }

  /**
   * Track command execution for recent commands
   */
  protected trackCommand(commandName: string): void {
    CLIUtils.trackCommand(commandName);
  }
}
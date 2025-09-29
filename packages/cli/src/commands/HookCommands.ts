import { Command } from 'commander';
import inquirer from 'inquirer';
import * as path from 'path';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';
import { GitHookManager } from '@gitswitch/core';
import { GitHookInstallConfig } from '@gitswitch/types';

/**
 * Git hooks management commands
 */
export class HookCommands extends BaseCommand implements ICommand {
  private gitHookManager: GitHookManager;

  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any,
    gitHookManager: GitHookManager
  ) {
    super(gitManager, storageManager, projectManager);
    this.gitHookManager = gitHookManager;
  }

  register(program: Command): void {
    const hookCmd = program
      .command('hook')
      .description('Git hooks management');

    this.registerInstallCommand(hookCmd);
    this.registerUninstallCommand(hookCmd);
    this.registerStatusCommand(hookCmd);
    this.registerValidateCommand(hookCmd);
  }

  private registerInstallCommand(hookCmd: Command): void {
    hookCmd
      .command('install')
      .description('Install git hooks for identity validation')
      .action(async () => {
        const projectPath = process.cwd();
        this.validateGitRepository(projectPath);

        const { validationLevel, autoFix } = await inquirer.prompt([
          {
            type: 'list',
            name: 'validationLevel',
            message: 'Choose validation level:',
            choices: [
              { name: 'Strict - Block commits with wrong identity', value: 'strict' },
              { name: 'Warning - Show warning but allow commits', value: 'warning' },
              { name: 'Off - No validation', value: 'off' }
            ]
          },
          {
            type: 'confirm',
            name: 'autoFix',
            message: 'Enable automatic identity fixing?',
            default: true
          }
        ]);

        const config: GitHookInstallConfig = {
          validationLevel: validationLevel as 'strict' | 'warning' | 'off',
          autoFix,
          preCommitEnabled: true
        };

        console.log(`🔧 Installing git hooks...`);
        console.log(`   Validation: ${config.validationLevel}`);
        console.log(`   Auto-fix: ${config.autoFix ? 'enabled' : 'disabled'}`);

        try {
          const success = this.gitHookManager.installHooks(projectPath, config);

          if (success) {
            this.showSuccess('Git hooks installed successfully!');
            this.showInfo('Hooks will now validate git identity before each commit');
          } else {
            console.error('❌ Failed to install git hooks');
            process.exit(1);
          }
        } catch (error) {
          this.handleError(error, 'Failed to install git hooks');
        }
      });
  }

  private registerUninstallCommand(hookCmd: Command): void {
    hookCmd
      .command('uninstall')
      .description('Remove git hooks')
      .action(async () => {
        const projectPath = process.cwd();
        this.validateGitRepository(projectPath);

        const shouldRemove = await CLIUtils.confirmAction(
          'Are you sure you want to remove git hooks?',
          false
        );

        if (shouldRemove) {
          console.log(`🗑️  Removing git hooks...`);

          try {
            const success = this.gitHookManager.removeHooks(projectPath);

            if (success) {
              this.showSuccess('Git hooks removed successfully');
            } else {
              console.error('❌ Failed to remove git hooks');
              process.exit(1);
            }
          } catch (error) {
            this.handleError(error, 'Failed to remove git hooks');
          }
        }
      });
  }

  private registerStatusCommand(hookCmd: Command): void {
    hookCmd
      .command('status')
      .description('Show git hooks status')
      .action(async () => {
        const projectPath = process.cwd();
        this.validateGitRepository(projectPath);

        try {
          const projectName = path.basename(projectPath);
          const installed = this.gitHookManager.areHooksInstalled(projectPath);
          const config = this.gitHookManager.getHookConfig(projectPath);

          console.log(`📁 Project: ${projectName}`);
          console.log(`📍 Path: ${projectPath}`);
          console.log(`🔗 Hooks installed: ${installed ? '✅ Yes' : '❌ No'}`);

          if (config) {
            console.log(`⚙️  Configuration:`);
            console.log(`   Validation level: ${config.validationLevel}`);
            console.log(`   Auto-fix: ${config.autoFix ? 'enabled' : 'disabled'}`);
            console.log(`   Pre-commit: ${config.preCommitEnabled ? 'enabled' : 'disabled'}`);
          }

          if (!installed) {
            const shouldInstall = await CLIUtils.confirmAction(
              'Would you like to install hooks now?',
              true
            );

            if (shouldInstall) {
              await this.installHooks();
            }
          }
        } catch (error) {
          this.handleError(error, 'Failed to get hooks status');
        }
      });
  }

  private registerValidateCommand(hookCmd: Command): void {
    hookCmd
      .command('validate')
      .description('Validate git identity for current project')
      .action(async () => {
        const projectPath = process.cwd();
        this.validateGitRepository(projectPath);

        try {
          const result = this.gitHookManager.validateCommit(projectPath);

          console.log(result.message);

          if (!result.valid && result.suggestedAccount) {
            const shouldSwitch = await CLIUtils.confirmAction(
              `Switch to suggested account: ${result.suggestedAccount}?`,
              true
            );

            if (shouldSwitch) {
              // Find the account by ID or name
              const accounts = this.storageManager.getAccounts();
              const account = accounts.find((a: any) => 
                a.id === result.suggestedAccount || a.name === result.suggestedAccount
              );

              if (account) {
                const success = this.gitManager.setConfig(projectPath, {
                  name: account.gitName || account.name,
                  email: account.email
                });

                if (success) {
                  this.showSuccess(`Switched to ${account.name}`);
                } else {
                  console.error('❌ Failed to switch account');
                }
              } else {
                console.error('❌ Suggested account not found');
              }
            }
          }

        } catch (error) {
          this.handleError(error, 'Validation error');
        }
      });
  }

  private async installHooks(): Promise<void> {
    const projectPath = process.cwd();

    const { validationLevel, autoFix } = await inquirer.prompt([
      {
        type: 'list',
        name: 'validationLevel',
        message: 'Choose validation level:',
        choices: [
          { name: 'Strict - Block commits with wrong identity', value: 'strict' },
          { name: 'Warning - Show warning but allow commits', value: 'warning' },
          { name: 'Off - No validation', value: 'off' }
        ]
      },
      {
        type: 'confirm',
        name: 'autoFix',
        message: 'Enable automatic identity fixing?',
        default: true
      }
    ]);

    const config: GitHookInstallConfig = {
      validationLevel: validationLevel as 'strict' | 'warning' | 'off',
      autoFix,
      preCommitEnabled: true
    };

    console.log(`🔧 Installing git hooks...`);
    console.log(`   Validation: ${config.validationLevel}`);
    console.log(`   Auto-fix: ${config.autoFix ? 'enabled' : 'disabled'}`);

    const success = this.gitHookManager.installHooks(projectPath, config);

    if (success) {
      this.showSuccess('Git hooks installed successfully!');
      this.showInfo('Hooks will now validate git identity before each commit');
    } else {
      console.error('❌ Failed to install git hooks');
    }
  }
}
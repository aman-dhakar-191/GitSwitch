import { Command } from 'commander';
import inquirer from 'inquirer';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';
import { SmartDetector } from '@gitswitch/core';

/**
 * Smart repository management commands (Phase 3 - Q2 2024)
 */
export class RepoCommands extends BaseCommand implements ICommand {
  private smartDetector: SmartDetector;

  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any,
    smartDetector: SmartDetector
  ) {
    super(gitManager, storageManager, projectManager);
    this.smartDetector = smartDetector;
  }

  register(program: Command): void {
    const repoCmd = program
      .command('repo')
      .description('Smart repository management');

    this.registerCloneCommand(repoCmd);
    this.registerInitCommand(repoCmd);
    this.registerStatusCommand(repoCmd);
  }

  private registerCloneCommand(repoCmd: Command): void {
    repoCmd
      .command('clone')
      .description('Clone repository with automatic identity setup')
      .argument('<url>', 'Repository URL')
      .argument('[directory]', 'Directory to clone into')
      .option('--account <email>', 'Use specific account')
      .option('--no-auto-detect', 'Disable automatic account detection')
      .action(async (url, directory, options) => {
        try {
          console.log(`🔍 Analyzing repository URL: ${url}`);

          // Get or detect account
          let accountEmail = options.account;
          
          if (!accountEmail && options.autoDetect !== false) {
            // Use smart detector to suggest account
            const suggestions = await this.smartDetector.suggestAccountForUrl(url);
            
            if (suggestions.length > 0) {
              const topSuggestion = suggestions[0];
              
              const { useDetected } = await inquirer.prompt([
                {
                  type: 'confirm',
                  name: 'useDetected',
                  message: `Use detected account: ${topSuggestion.account.email} (confidence: ${Math.round(topSuggestion.confidence * 100)}%)?`,
                  default: true
                }
              ]);

              if (useDetected) {
                accountEmail = topSuggestion.account.email;
              }
            }
          }

          // If still no account, prompt for selection
          if (!accountEmail) {
            const accounts = this.storageManager.getAccounts();
            
            if (accounts.length === 0) {
              console.log('⚠️  No accounts configured. Please add an account first.');
              console.log('Run: gitswitch accounts add');
              return;
            }

            const { selectedAccount } = await inquirer.prompt([
              {
                type: 'list',
                name: 'selectedAccount',
                message: 'Select account for this repository:',
                choices: accounts.map(acc => ({
                  name: `${acc.name} <${acc.email}>`,
                  value: acc.email
                }))
              }
            ]);

            accountEmail = selectedAccount;
          }

          // Perform clone
          console.log(`\n📥 Cloning repository...`);
          const clonePath = await this.gitManager.cloneRepository(url, directory);

          // Set up identity
          const account = this.storageManager.getAccountByEmail(accountEmail);
          if (account) {
            await this.gitManager.setConfig(clonePath, {
              name: account.name,
              email: account.email
            });

            console.log(`✅ Repository cloned successfully`);
            console.log(`📧 Identity configured: ${account.name} <${account.email}>`);
            console.log(`📁 Location: ${clonePath}`);

            // Track usage for learning
            await this.smartDetector.recordAccountUsage(accountEmail, url);
          }
        } catch (error: any) {
          CLIUtils.showError('Clone failed', error);
        }
      });
  }

  private registerInitCommand(repoCmd: Command): void {
    repoCmd
      .command('init')
      .description('Initialize repository with automatic identity setup')
      .argument('[directory]', 'Directory to initialize', '.')
      .option('--account <email>', 'Use specific account')
      .option('--bare', 'Create a bare repository')
      .action(async (directory: string, options: any) => {
        try {
          const targetPath = require('path').resolve(directory);
          
          console.log(`🔍 Initializing repository in: ${targetPath}`);

          // Get or select account
          let accountEmail = options.account;
          
          if (!accountEmail) {
            const accounts = this.storageManager.getAccounts();
            
            if (accounts.length === 0) {
              console.log('⚠️  No accounts configured. Please add an account first.');
              console.log('Run: gitswitch accounts add');
              return;
            }

            // Try to detect based on path
            const suggestions = await this.smartDetector.suggestAccountForPath(targetPath);
            
            if (suggestions.length > 0 && suggestions[0].confidence > 0.7) {
              const topSuggestion = suggestions[0];
              
              const { useDetected } = await inquirer.prompt([
                {
                  type: 'confirm',
                  name: 'useDetected',
                  message: `Use detected account: ${topSuggestion.account.email}?`,
                  default: true
                }
              ]);

              if (useDetected) {
                accountEmail = topSuggestion.account.email;
              }
            }

            // If still no account, prompt for selection
            if (!accountEmail) {
              const { selectedAccount } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'selectedAccount',
                  message: 'Select account for this repository:',
                  choices: accounts.map(acc => ({
                    name: `${acc.name} <${acc.email}>`,
                    value: acc.email
                  }))
                }
              ]);

              accountEmail = selectedAccount;
            }
          }

          // Initialize repository
          await this.gitManager.initRepository(targetPath, options.bare);

          // Set up identity (not for bare repos)
          if (!options.bare) {
            const account = this.storageManager.getAccountByEmail(accountEmail);
            if (account) {
              await this.gitManager.setConfig(targetPath, {
                name: account.name,
                email: account.email
              });

              console.log(`✅ Repository initialized successfully`);
              console.log(`📧 Identity configured: ${account.name} <${account.email}>`);
              console.log(`📁 Location: ${targetPath}`);

              // Track usage for learning
              await this.smartDetector.recordAccountUsage(accountEmail, targetPath);
            }
          } else {
            console.log(`✅ Bare repository initialized successfully`);
            console.log(`📁 Location: ${targetPath}`);
          }
        } catch (error: any) {
          CLIUtils.showError('Init failed', error);
        }
      });
  }

  private registerStatusCommand(repoCmd: Command): void {
    repoCmd
      .command('status')
      .description('Enhanced git status with identity info')
      .action(async () => {
        try {
          const projectPath = process.cwd();
          this.validateGitRepository(projectPath);

          // Get git status
          const status = await this.gitManager.getStatus(projectPath);
          
          // Get current identity
          const currentConfig = await this.gitManager.getCurrentConfig(projectPath);

          console.log(`\n📊 Repository Status`);
          console.log(`${'='.repeat(50)}`);
          
          if (currentConfig) {
            console.log(`\n📧 Current Identity:`);
            console.log(`   Name:  ${currentConfig.name}`);
            console.log(`   Email: ${currentConfig.email}`);
          } else {
            console.log(`\n⚠️  No git identity configured`);
          }

          // Branch info
          console.log(`\n🌿 Branch: ${status.branch || 'detached HEAD'}`);
          
          if (status.ahead || status.behind) {
            const aheadBehind = [];
            if (status.ahead) aheadBehind.push(`ahead ${status.ahead}`);
            if (status.behind) aheadBehind.push(`behind ${status.behind}`);
            console.log(`   ${aheadBehind.join(', ')}`);
          }

          // File changes
          if (status.files && status.files.length > 0) {
            console.log(`\n📝 Changes:`);
            
            const staged = status.files.filter((f: any) => f.staged);
            const unstaged = status.files.filter((f: any) => !f.staged && !f.untracked);
            const untracked = status.files.filter((f: any) => f.untracked);

            if (staged.length > 0) {
              console.log(`\n   Staged (${staged.length}):`);
              staged.forEach((f: any) => console.log(`      ${f.status} ${f.path}`));
            }

            if (unstaged.length > 0) {
              console.log(`\n   Unstaged (${unstaged.length}):`);
              unstaged.forEach((f: any) => console.log(`      ${f.status} ${f.path}`));
            }

            if (untracked.length > 0) {
              console.log(`\n   Untracked (${untracked.length}):`);
              untracked.forEach((f: any) => console.log(`      ?? ${f.path}`));
            }
          } else {
            console.log(`\n✨ Working tree clean`);
          }

          // Check if identity matches expected
          const remoteUrl = await this.gitManager.getRemoteUrl(projectPath);
          if (remoteUrl && currentConfig) {
            const suggestions = await this.smartDetector.suggestAccountForUrl(remoteUrl);
            if (suggestions.length > 0 && suggestions[0].account.email !== currentConfig.email) {
              console.log(`\n⚠️  Identity Mismatch Warning:`);
              console.log(`   Expected: ${suggestions[0].account.email}`);
              console.log(`   Current:  ${currentConfig.email}`);
              console.log(`   Run: gitswitch accounts switch`);
            }
          }

        } catch (error: any) {
          CLIUtils.showError('Status check failed', error);
        }
      });
  }
}

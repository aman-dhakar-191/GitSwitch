import { Command } from 'commander';
import inquirer from 'inquirer';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';
import { AdvancedGitManager } from '@gitswitch/core';

/**
 * Advanced git operations with identity preservation (Phase 3 - Q2 2024)
 */
export class GitCommands extends BaseCommand implements ICommand {
  private advancedGitManager: AdvancedGitManager;

  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any,
    advancedGitManager: AdvancedGitManager
  ) {
    super(gitManager, storageManager, projectManager);
    this.advancedGitManager = advancedGitManager;
  }

  register(program: Command): void {
    const gitCmd = program
      .command('git')
      .description('Advanced git operations with identity preservation');

    this.registerResetCommand(gitCmd);
    this.registerRevertCommand(gitCmd);
    this.registerCherryPickCommand(gitCmd);
    this.registerSquashCommand(gitCmd);
  }

  private registerResetCommand(gitCmd: Command): void {
    gitCmd
      .command('reset')
      .description('Enhanced reset with identity preservation')
      .argument('[commit]', 'Commit to reset to', 'HEAD')
      .option('--soft', 'Soft reset (keep changes staged)')
      .option('--mixed', 'Mixed reset (keep changes unstaged)', true)
      .option('--hard', 'Hard reset (discard all changes)')
      .action(async (commit, options) => {
        try {
          const projectPath = process.cwd();
          this.validateGitRepository(projectPath);

          // Get current identity
          const currentConfig = await this.gitManager.getCurrentConfig(projectPath);
          
          if (!currentConfig) {
            console.log('⚠️  No git identity configured');
            return;
          }

          // Determine reset mode
          let mode: 'soft' | 'mixed' | 'hard' = 'mixed';
          if (options.soft) mode = 'soft';
          if (options.hard) mode = 'hard';

          // Confirm hard reset
          if (mode === 'hard') {
            const { confirm } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirm',
                message: `⚠️  Hard reset will discard all uncommitted changes. Continue?`,
                default: false
              }
            ]);

            if (!confirm) {
              console.log('Reset cancelled.');
              return;
            }
          }

          // Perform git reset
          const result = await this.advancedGitManager.performGitReset(projectPath, commit, mode);
          
          // Restore identity if it changed
          if (currentConfig) {
            await this.advancedGitManager.preserveIdentity(projectPath, currentConfig);
          }

          console.log(`✅ Reset to ${commit} (${mode}) completed`);
          console.log(`📧 Identity preserved: ${currentConfig.name} <${currentConfig.email}>`);

          if (result.filesChanged) {
            console.log(`\n📊 Changes:`);
            console.log(`   Files affected: ${result.filesChanged}`);
          }
        } catch (error: any) {
          CLIUtils.showError('Git reset failed', error);
        }
      });
  }

  private registerRevertCommand(gitCmd: Command): void {
    gitCmd
      .command('revert')
      .description('Revert commits with identity preservation')
      .argument('<commits...>', 'Commits to revert')
      .option('--no-commit', 'Revert without creating commit')
      .action(async (commits, options) => {
        try {
          const projectPath = process.cwd();
          this.validateGitRepository(projectPath);

          // Get current identity
          const currentConfig = await this.gitManager.getCurrentConfig(projectPath);

          if (!currentConfig) {
            console.log('⚠️  No git identity configured');
            return;
          }

          console.log(`🔄 Reverting ${commits.length} commit(s)...`);

          for (const commit of commits) {
            const result = await this.advancedGitManager.performGitRevert(
              projectPath, 
              commit,
              !options.noCommit
            );

            // Ensure identity is preserved
            if (currentConfig) {
              await this.advancedGitManager.preserveIdentity(projectPath, currentConfig);
            }

            console.log(`✅ Reverted ${commit.substring(0, 7)}`);
            
            if (result.conflicts && result.conflicts.length > 0) {
              console.log(`⚠️  Conflicts detected in:`);
              result.conflicts.forEach((file: string) => console.log(`   - ${file}`));
              console.log(`\nResolve conflicts and run: git revert --continue`);
              break;
            }
          }

          console.log(`\n📧 Identity preserved: ${currentConfig.name} <${currentConfig.email}>`);
        } catch (error: any) {
          CLIUtils.showError('Git revert failed', error);
        }
      });
  }

  private registerCherryPickCommand(gitCmd: Command): void {
    gitCmd
      .command('cherry-pick')
      .description('Cherry-pick commits with identity preservation')
      .argument('<commits...>', 'Commits to cherry-pick')
      .option('--no-commit', 'Cherry-pick without creating commit')
      .option('--continue', 'Continue cherry-pick after resolving conflicts')
      .option('--abort', 'Abort cherry-pick')
      .action(async (commits, options) => {
        try {
          const projectPath = process.cwd();
          this.validateGitRepository(projectPath);

          if (options.abort) {
            await this.advancedGitManager.abortGitOperation(projectPath, 'cherry-pick');
            console.log('✅ Cherry-pick aborted');
            return;
          }

          if (options.continue) {
            const currentConfig = await this.gitManager.getCurrentConfig(projectPath);
            await this.advancedGitManager.continueGitOperation(projectPath, 'cherry-pick');
            if (currentConfig) await this.advancedGitManager.preserveIdentity(projectPath, currentConfig);
            console.log('✅ Cherry-pick continued');
            return;
          }

          // Get current identity
          const currentConfig = await this.gitManager.getCurrentConfig(projectPath);

          if (!currentConfig) {
            console.log('⚠️  No git identity configured');
            return;
          }

          console.log(`🍒 Cherry-picking ${commits.length} commit(s)...`);

          for (const commit of commits) {
            const result = await this.advancedGitManager.performGitCherryPick(
              projectPath,
              commit,
              !options.noCommit
            );

            // Ensure identity is preserved
            if (currentConfig) {
              await this.advancedGitManager.preserveIdentity(projectPath, currentConfig);
            }

            console.log(`✅ Cherry-picked ${commit.substring(0, 7)}`);

            if (result.conflicts && result.conflicts.length > 0) {
              console.log(`⚠️  Conflicts detected in:`);
              result.conflicts.forEach((file: string) => console.log(`   - ${file}`));
              console.log(`\nResolve conflicts and run: gitswitch git cherry-pick --continue`);
              break;
            }
          }

          console.log(`\n📧 Identity preserved: ${currentConfig.name} <${currentConfig.email}>`);
        } catch (error: any) {
          CLIUtils.showError('Git cherry-pick failed', error);
        }
      });
  }

  private registerSquashCommand(gitCmd: Command): void {
    gitCmd
      .command('squash')
      .description('Squash commits with identity preservation')
      .argument('<count>', 'Number of commits to squash', parseInt)
      .option('-m, --message <message>', 'Commit message for squashed commit')
      .action(async (count, options) => {
        try {
          const projectPath = process.cwd();
          this.validateGitRepository(projectPath);

          if (count < 2) {
            console.log('⚠️  Must squash at least 2 commits');
            return;
          }

          // Get current identity
          const currentConfig = await this.gitManager.getCurrentConfig(projectPath);

          if (!currentConfig) {
            console.log('⚠️  No git identity configured');
            return;
          }

          // Get commit message
          let message = options.message;
          if (!message) {
            const { inputMessage } = await inquirer.prompt([
              {
                type: 'input',
                name: 'inputMessage',
                message: 'Enter commit message for squashed commit:',
                validate: (input: string) => input.length > 0 || 'Message is required'
              }
            ]);
            message = inputMessage;
          }

          console.log(`🔨 Squashing last ${count} commits...`);

          const result = await this.advancedGitManager.performGitSquash(
            projectPath,
            count,
            message
          );

          // Ensure identity is preserved
          if (currentConfig) {
            await this.advancedGitManager.preserveIdentity(projectPath, currentConfig);
          }

          console.log(`✅ Squashed ${count} commits into 1`);
          console.log(`📧 Identity preserved: ${currentConfig.name} <${currentConfig.email}>`);
          console.log(`\n📝 New commit: ${result.newCommitHash?.substring(0, 7)}`);
        } catch (error: any) {
          CLIUtils.showError('Git squash failed', error);
        }
      });
  }
}

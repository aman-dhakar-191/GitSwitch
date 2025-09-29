import { Command } from 'commander';
import inquirer from 'inquirer';
import * as path from 'path';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';
import { BlessedUI, BlessedStatusUI } from '../ui/blessed-ui';
import { ProjectScanner, SmartDetector, BulkImportManager } from '@gitswitch/core';

/**
 * Project management commands
 */
export class ProjectCommands extends BaseCommand implements ICommand {
  private projectScanner: ProjectScanner;
  private smartDetector: SmartDetector;
  private bulkImportManager: BulkImportManager;

  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any,
    projectScanner: ProjectScanner,
    smartDetector: SmartDetector,
    bulkImportManager: BulkImportManager
  ) {
    super(gitManager, storageManager, projectManager);
    this.projectScanner = projectScanner;
    this.smartDetector = smartDetector;
    this.bulkImportManager = bulkImportManager;
  }

  register(program: Command): void {
    const projectCmd = program
      .command('project')
      .description('Project management commands');

    this.registerStatusCommand(projectCmd);
    this.registerListCommand(projectCmd);
    this.registerScanCommand(projectCmd);
    this.registerImportCommand(projectCmd);
    this.registerIdentityCommand(projectCmd);
    this.registerSuggestCommand(projectCmd);
    this.registerSwitchCommand(projectCmd);
    this.registerHealthCommand(projectCmd);
    this.registerAnalyzeCommand(projectCmd);
  }

  private registerStatusCommand(projectCmd: Command): void {
    projectCmd
      .command('status')
      .description('Show current git identity status')
      .option('--ui', 'show status with blessed UI interface')
      .action(async (options) => {
        this.trackCommand('gitswitch project status');
        const projectPath = process.cwd();

        try {
          const project = this.getCurrentProject(projectPath);
          const gitConfig = this.projectManager.getCurrentGitConfig(projectPath);

          if (options.ui) {
            const statusUI = new BlessedStatusUI({
              project,
              gitConfig: gitConfig || undefined
            });
            statusUI.render();
          } else {
            console.log(`📁 Project: ${project.name}`);
            console.log(`📍 Path: ${project.path}`);

            if (project.remoteUrl) {
              console.log(`🔗 Remote: ${project.remoteUrl}`);
            }

            if (gitConfig) {
              console.log(`👤 Git Identity:`);
              console.log(`   Name: ${gitConfig.name}`);
              console.log(`   Email: ${gitConfig.email}`);
            } else {
              console.log(`⚠️  No git identity configured`);
            }
          }

        } catch (error) {
          this.handleError(error, 'Failed to get status');
        }
      });
  }

  private registerListCommand(projectCmd: Command): void {
    projectCmd
      .command('list')
      .description('List all managed projects')
      .action(async () => {
        this.trackCommand('gitswitch project list');
        try {
          const projects = this.storageManager.getProjects();

          if (projects.length === 0) {
            console.log('📁 No projects found');
            console.log('💡 Use `gitswitch project scan` to discover git repositories');
            console.log('');
            console.log('Quick scan options:');
            console.log('  gitswitch project scan     # Interactive scan');
            console.log('  gitswitch project import   # Import from common directories');
            return;
          }

          // Interactive project list with filters
          const action = await CLIUtils.selectFromList(
            'What would you like to do?',
            [
              { name: 'View all projects', value: 'view-all' },
              { name: 'Filter projects', value: 'filter' },
              { name: 'Search projects', value: 'search' }
            ]
          );

          let filteredProjects = projects;

          if (action === 'filter') {
            const filterBy = await CLIUtils.selectFromList(
              'Filter projects by:',
              [
                { name: 'Repository type (GitHub, GitLab, etc.)', value: 'type' },
                { name: 'Account/Identity', value: 'account' },
                { name: 'Organization', value: 'organization' },
                { name: 'Recently used', value: 'recent' }
              ]
            );

            // Apply filter logic based on selection
            // Implementation would go here...
            this.showInfo(`Filtering by ${filterBy} - feature coming soon`);
            
          } else if (action === 'search') {
            const searchTerm = await CLIUtils.getTextInput(
              'Enter search term (name, path, or URL):'
            );

            filteredProjects = projects.filter((project: any) =>
              project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              project.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (project.remoteUrl && project.remoteUrl.toLowerCase().includes(searchTerm.toLowerCase()))
            );
          }

          CLIUtils.displayProjects(filteredProjects);

        } catch (error) {
          this.handleError(error, 'Failed to list projects');
        }
      });
  }

  private registerScanCommand(projectCmd: Command): void {
    projectCmd
      .command('scan')
      .description('Scan for git projects in a directory')
      .action(async () => {
        await this.scanProjects();
      });
  }

  private registerImportCommand(projectCmd: Command): void {
    projectCmd
      .command('import')
      .description('Import projects from various sources')
      .action(async () => {
        const importType = await CLIUtils.selectFromList(
          'Choose import method:',
          [
            { name: 'Common directories (~/Documents, ~/Projects, etc.)', value: 'common' },
            { name: 'Bulk import with advanced options', value: 'bulk' },
            { name: 'Custom path', value: 'custom' }
          ]
        );

        switch (importType) {
          case 'common':
            await this.importFromCommon();
            break;
          case 'bulk':
            await this.bulkImportWithOptions();
            break;
          case 'custom':
            await this.importFromCustomPath();
            break;
        }
      });
  }

  private registerIdentityCommand(projectCmd: Command): void {
    projectCmd
      .command('identity')
      .description('Manage git identity for the current project')
      .option('--add', 'Add a new identity (same as account login)')
      .option('--remove', 'Remove identity authentication (same as account logout)')
      .option('--change', 'Change the git identity for this project')
      .action(async (options) => {
        const projectPath = process.cwd();

        // Check if current directory is a git repository
        this.validateGitRepository(projectPath);

        // If no options provided, show current identity and available actions
        if (!options.add && !options.remove && !options.change) {
          const gitConfig = this.projectManager.getCurrentGitConfig(projectPath);
          const project = this.getCurrentProject(projectPath);

          console.log(`📁 Project: ${project?.name || path.basename(projectPath)}`);
          console.log(`📍 Path: ${projectPath}`);

          if (gitConfig) {
            console.log(`👤 Current Identity: ${gitConfig.name} (${gitConfig.email})`);
          } else {
            console.log(`⚠️  No git identity configured`);
          }

          // Ask what the user wants to do
          const action = await CLIUtils.selectFromList(
            'What would you like to do?',
            [
              { name: 'Add new identity (login to provider)', value: 'add' },
              { name: 'Change identity for this project', value: 'change' },
              { name: 'Remove authentication', value: 'remove' },
              { name: 'Cancel', value: 'cancel' }
            ]
          );

          switch (action) {
            case 'add':
              await this.addIdentity();
              break;
            case 'change':
              await this.changeIdentity(projectPath);
              break;
            case 'remove':
              await this.removeIdentity();
              break;
            case 'cancel':
              console.log('🚫 Cancelled');
              break;
          }
        } else {
          // Handle specific options
          if (options.add) {
            await this.addIdentity();
          } else if (options.remove) {
            await this.removeIdentity();
          } else if (options.change) {
            await this.changeIdentity(projectPath);
          }
        }
      });
  }

  private registerSuggestCommand(projectCmd: Command): void {
    projectCmd
      .command('suggest')
      .description('Get account suggestions for current project')
      .action(async () => {
        const projectPath = process.cwd();
        try {
          this.validateGitRepository(projectPath);
          const project = this.getCurrentProject(projectPath);
          
          const suggestions = this.smartDetector.suggestAccounts(project);
          
          if (suggestions.length === 0) {
            console.log('🤔 No account suggestions available');
            console.log('💡 Add more accounts to get better suggestions');
          } else {
            console.log(`🎯 Account suggestions for ${project.name}:\n`);
            suggestions.forEach((suggestion: any, index: number) => {
              console.log(`${index + 1}. ${suggestion.account.name} (${suggestion.account.email})`);
              console.log(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
              console.log(`   Reason: ${suggestion.reason}`);
              console.log('');
            });
          }
        } catch (error) {
          this.handleError(error, 'Failed to get suggestions');
        }
      });
  }

  private registerSwitchCommand(projectCmd: Command): void {
    projectCmd
      .command('switch')
      .description('Switch git identity for current project')
      .option('--to <accountId>', 'Account ID to switch to')
      .action(async (options) => {
        const projectPath = process.cwd();
        try {
          this.validateGitRepository(projectPath);
          
          if (options.to) {
            // Switch to specific account
            const accounts = this.storageManager.getAccounts();
            const account = accounts.find((a: any) => a.id === options.to);
            if (!account) {
              console.error('❌ Account not found');
              return;
            }
            await this.switchToAccount(projectPath, account);
          } else {
            // Interactive account selection
            await this.changeIdentity(projectPath);
          }
        } catch (error) {
          this.handleError(error, 'Failed to switch identity');
        }
      });
  }

  private registerHealthCommand(projectCmd: Command): void {
    projectCmd
      .command('health')
      .description('Check identity consistency')
      .action(async () => {
        const projectPath = process.cwd();
        try {
          this.validateGitRepository(projectPath);
          
          console.log('🏥 Identity Health Check\n');
          
          const project = this.getCurrentProject(projectPath);
          const gitConfig = this.projectManager.getCurrentGitConfig(projectPath);
          
          console.log(`📁 Project: ${project.name}`);
          
          if (gitConfig) {
            console.log(`✅ Git identity configured: ${gitConfig.name} (${gitConfig.email})`);
          } else {
            console.log(`❌ No git identity configured`);
          }
          
          // Additional health checks would go here
          console.log('✅ Health check completed');
          
        } catch (error) {
          this.handleError(error, 'Failed to check identity health');
        }
      });
  }

  private registerAnalyzeCommand(projectCmd: Command): void {
    projectCmd
      .command('analyze')
      .description('Enhanced project analysis')
      .action(async () => {
        const projectPath = process.cwd();
        try {
          this.validateGitRepository(projectPath);
          
          console.log('🔍 Enhanced Project Analysis\n');
          
          const project = this.getCurrentProject(projectPath);
          const gitConfig = this.projectManager.getCurrentGitConfig(projectPath);
          
          console.log(`📁 Project: ${project.name}`);
          console.log(`📍 Path: ${project.path}`);
          console.log(`🔗 Repository Type: ${CLIUtils.getRepositoryType(project.remoteUrl)}`);
          
          if (gitConfig) {
            const accountType = CLIUtils.detectAccountType(gitConfig.email);
            console.log(`👤 Identity: ${gitConfig.name} (${gitConfig.email})`);
            console.log(`🏷️  Account Type: ${accountType}`);
          }
          
          // Get smart suggestions
          const suggestions = this.smartDetector.suggestAccounts(project);
          if (suggestions.length > 0) {
            console.log(`\n🎯 Smart Suggestions:`);
            suggestions.slice(0, 3).forEach((suggestion: any, index: number) => {
              console.log(`  ${index + 1}. ${suggestion.account.name} (${Math.round(suggestion.confidence * 100)}% confidence)`);
            });
          }
          
        } catch (error) {
          this.handleError(error, 'Failed to analyze project');
        }
      });
  }

  // Helper methods
  private async scanProjects(): Promise<void> {
    const { scanPath, depth, shouldImport } = await inquirer.prompt([
      {
        type: 'input',
        name: 'scanPath',
        message: 'Enter path to scan:',
        default: '.'
      },
      {
        type: 'number',
        name: 'depth',
        message: 'Maximum scan depth:',
        default: 3
      },
      {
        type: 'confirm',
        name: 'shouldImport',
        message: 'Automatically import found projects?',
        default: true
      }
    ]);

    try {
      console.log(`🔍 Scanning ${path.resolve(scanPath)} for git projects...`);

      const result = await this.projectScanner.scanDirectory(path.resolve(scanPath), depth);

      console.log(`✅ Scan completed in ${result.duration}ms`);
      console.log(`📁 Found ${result.totalFound} git project(s)`);

      if (result.projects.length === 0) {
        console.log('💡 Try scanning a different directory or increasing scan depth');
        return;
      }

      CLIUtils.displayProjects(result.projects);

      if (shouldImport) {
        console.log(`\n📥 Importing ${result.projects.length} project(s)...`);
        
        let imported = 0;
        for (const project of result.projects) {
          try {
            this.storageManager.upsertProject(project);
            imported++;
          } catch (error) {
            console.log(`⚠️  Skipped ${project.name}: ${error}`);
          }
        }
        
        this.showSuccess(`Imported ${imported} project(s)`);
      }

    } catch (error) {
      this.handleError(error, 'Failed to scan directory');
    }
  }

  private async importFromCommon(): Promise<void> {
    console.log('📁 Scanning common development directories...');
    const commonResults = await this.projectScanner.scanCommonPaths();
    const importedProjects = commonResults.flatMap(result => result.projects);

    if (importedProjects.length === 0) {
      console.log('📋 No projects found in common directories');
      return;
    }

    console.log(`\n📥 Found ${importedProjects.length} project(s) to import...`);

    let imported = 0;
    let skipped = 0;

    for (const project of importedProjects) {
      try {
        this.storageManager.upsertProject(project);
        imported++;
      } catch (error) {
        skipped++;
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`   Imported: ${imported} projects`);
    console.log(`   Skipped: ${skipped} projects (already exist)`);
  }

  private async bulkImportWithOptions(): Promise<void> {
    const { paths, maxDepth, detectAccounts } = await inquirer.prompt([
      {
        type: 'input',
        name: 'paths',
        message: 'Enter paths to scan (comma-separated):'
      },
      {
        type: 'number',
        name: 'maxDepth',
        message: 'Maximum scan depth:',
        default: 4
      },
      {
        type: 'confirm',
        name: 'detectAccounts',
        message: 'Detect and create accounts from git configs?',
        default: true
      }
    ]);

    const scanPaths = paths.split(',').map((p: string) => p.trim());

    const importConfig = {
      sourcePaths: scanPaths,
      scanDepth: maxDepth,
      autoDetectAccounts: detectAccounts,
      createMissingAccounts: detectAccounts,
      applySmartSuggestions: true,
      importPatterns: true,
      excludePatterns: [],
      includePatterns: [],
      dryRun: false
    };

    console.log('📥 Starting bulk import...');

    const result = await this.bulkImportManager.executeImport(importConfig, (step: any) => {
      console.log(`🔄 ${step.message}`);
    });

    console.log('\n🎉 Bulk Import Complete!');
    console.log(`✅ Successfully imported: ${result.projectsImported} projects`);
    console.log(`👤 New accounts created: ${result.accountsCreated}`);
    console.log(`🎯 Patterns generated: ${result.patternsCreated}`);
  }

  private async importFromCustomPath(): Promise<void> {
    const customPath = await CLIUtils.getTextInput('Enter custom path to scan:');
    
    // Reuse scan logic with custom path
    await this.scanProjects();
  }

  private async addIdentity(): Promise<void> {
    console.log('➕ Adding new identity (same as account login)...\n');
    CLIUtils.showComingSoon('Identity addition via OAuth', 'Available now', 'Use `gitswitch account login`');
  }

  private async removeIdentity(): Promise<void> {
    console.log('🗑️  Removing authentication (same as account logout)...\n');
    CLIUtils.showComingSoon('Identity removal', 'Available now', 'Use `gitswitch account logout`');
  }

  private async changeIdentity(projectPath: string): Promise<void> {
    console.log('🔄 Changing git identity for this project...\n');
    
    const accounts = this.storageManager.getAccounts();

    if (accounts.length === 0) {
      console.log('❌ No accounts configured');
      console.log('💡 Run `gitswitch project identity --add` to add an account first');
      return;
    }

    const accountId = await CLIUtils.selectFromList(
      'Select account to use for this project:',
      accounts.map((account: any) => ({
        name: `${account.name} (${account.email})${account.isDefault ? ' - Default' : ''}`,
        value: account.id
      }))
    );

    const selectedAccount = accounts.find((a: any) => a.id === accountId);
    
    if (!selectedAccount) {
      console.error('❌ Account not found');
      return;
    }

    await this.switchToAccount(projectPath, selectedAccount);
  }

  private async switchToAccount(projectPath: string, account: any): Promise<void> {
    try {
      // Use gitManager to set the git config for this project
      const success = this.gitManager.setConfig(projectPath, {
        name: account.gitName || account.name,
        email: account.email
      });

      if (success) {
        this.showSuccess(`Switched to ${account.name} (${account.email})`);
        
        // Update project association
        const project = this.getCurrentProject(projectPath);
        if (project) {
          project.accountId = account.id;
          this.storageManager.upsertProject(project);
        }
        
        console.log(`📁 Project: ${project?.name || path.basename(projectPath)}`);
        console.log(`👤 Active Identity: ${account.name} (${account.email})`);
      } else {
        console.error('❌ Failed to set git config');
      }
    } catch (error) {
      this.handleError(error, 'Error setting git config');
    }
  }
}
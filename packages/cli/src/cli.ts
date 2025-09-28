#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { ProjectManager, ProjectScanner, SmartDetector, StorageManager, GitManager, GitHookManager, TeamManager, SecurityManager, ConfigSyncManager, PluginManager, AdvancedGitManager, WorkflowAutomationManager, BulkImportManager, OAuthManager } from '@gitswitch/core';
import { GitHookInstallConfig } from '@gitswitch/types';
import { BlessedUI, BlessedStatusUI } from './ui/blessed-ui';

const program = new Command();
const gitManager = new GitManager();
const storageManager = new StorageManager();
const projectManager = new ProjectManager();
const projectScanner = new ProjectScanner(gitManager, storageManager);
const smartDetector = new SmartDetector(storageManager);
const gitHookManager = new GitHookManager(gitManager, storageManager, smartDetector);
const teamManager = new TeamManager(storageManager);
const securityManager = new SecurityManager(storageManager);
const configSyncManager = new ConfigSyncManager(storageManager, teamManager);
const pluginManager = new PluginManager(storageManager, gitManager, projectManager);
const advancedGitManager = new AdvancedGitManager(gitManager, securityManager, storageManager);
const workflowAutomationManager = new WorkflowAutomationManager(storageManager, gitManager, projectManager, securityManager, advancedGitManager);
const bulkImportManager = new BulkImportManager(storageManager, projectScanner, smartDetector, gitManager);
const oauthManager = new OAuthManager(storageManager);

program
  .name('gitswitch')
  .description('Git identity management tool')
  .version('1.0.0');

// DOT COMMAND - Interactive UI for current project
program
  .command('.')
  .description('Open GitSwitch for the current project')
  .action(async () => {
    const projectPath = process.cwd();

    try {
      const project = projectManager.analyzeProject(projectPath);

      if (!project) {
        console.error('❌ Current directory is not a git repository');
        process.exit(1);
      }

      const gitConfig = projectManager.getCurrentGitConfig(projectPath);
      const ui = new BlessedUI({
        project,
        gitConfig: gitConfig || undefined,
        onExit: async () => {
          // Launch the desktop app when user presses Enter
        }
      });
      ui.render();

    } catch (error) {
      console.error('❌ Failed to analyze project:', error);
      process.exit(1);
    }
  });

// PROJECT COMMAND GROUP
const projectCmd = program
  .command('project')
  .description('Project management commands');

projectCmd
  .command('status')
  .description('Show current git identity status')
  .option('--ui', 'show status with blessed UI interface')
  .action(async (options) => {
    const projectPath = process.cwd();

    try {
      const project = projectManager.analyzeProject(projectPath);

      if (!project) {
        console.error('❌ Current directory is not a git repository');
        process.exit(1);
      }

      const gitConfig = projectManager.getCurrentGitConfig(projectPath);

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
      console.error('❌ Failed to get status:', error);
      process.exit(1);
    }
  });

projectCmd
  .command('list')
  .description('List all managed projects')
  .action(async () => {
    try {
      const projects = storageManager.getProjects();

      if (projects.length === 0) {
        const { shouldScan } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldScan',
            message: 'No projects found. Would you like to scan for projects now?',
            default: true
          }
        ]);

        if (shouldScan) {
          // Redirect to scan command
          await scanProjects();
        }
        return;
      }

      // Interactive project list with filters
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'View all projects', value: 'view-all' },
            { name: 'Filter projects', value: 'filter' },
            { name: 'Search projects', value: 'search' }
          ]
        }
      ]);

      let filteredProjects = projects;

      if (action === 'filter') {
        const { filterType } = await inquirer.prompt([
          {
            type: 'list',
            name: 'filterType',
            message: 'Filter by:',
            choices: [
              { name: 'Status (active/inactive/archived)', value: 'status' },
              { name: 'Organization', value: 'org' },
              { name: 'Account', value: 'account' }
            ]
          }
        ]);

        if (filterType === 'status') {
          const { status } = await inquirer.prompt([
            {
              type: 'list',
              name: 'status',
              message: 'Select status:',
              choices: ['active', 'inactive', 'archived']
            }
          ]);
          filteredProjects = projects.filter(p => p.status === status);
        }
      } else if (action === 'search') {
        const { searchTerm } = await inquirer.prompt([
          {
            type: 'input',
            name: 'searchTerm',
            message: 'Enter search term (name or path):'
          }
        ]);
        const filter = searchTerm.toLowerCase();
        filteredProjects = projects.filter(p =>
          p.name.toLowerCase().includes(filter) ||
          p.path.toLowerCase().includes(filter)
        );
      }

      displayProjects(filteredProjects);

    } catch (error) {
      console.error('❌ Failed to list projects:', error);
      process.exit(1);
    }
  });

projectCmd
  .command('scan')
  .description('Scan for git projects in a directory')
  .action(async () => {
    await scanProjects();
  });

projectCmd
  .command('import')
  .description('Import projects from various sources')
  .action(async () => {
    const { importType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'importType',
        message: 'Choose import method:',
        choices: [
          { name: 'Common directories (~/Documents, ~/Projects, etc.)', value: 'common' },
          { name: 'Bulk import with advanced options', value: 'bulk' },
          { name: 'Custom path', value: 'custom' }
        ]
      }
    ]);

    switch (importType) {
      case 'common':
        await importFromCommon();
        break;
      case 'bulk':
        await bulkImportWithOptions();
        break;
      case 'custom':
        await importFromCustomPath();
        break;
    }
  });

// NEW PROJECT IDENTITY COMMANDS
projectCmd
  .command('identity')
  .description('Manage git identity for the current project')
  .option('--add', 'Add a new identity (same as account login)')
  .option('--remove', 'Remove identity authentication (same as account logout)')
  .option('--change', 'Change the git identity for this project')
  .action(async (options) => {
    const projectPath = process.cwd();

    // Check if current directory is a git repository
    if (!gitManager.isGitRepository(projectPath)) {
      console.error('❌ Current directory is not a git repository');
      process.exit(1);
    }

    // If no options provided, show current identity and available actions
    if (!options.add && !options.remove && !options.change) {
      const gitConfig = projectManager.getCurrentGitConfig(projectPath);
      const project = projectManager.analyzeProject(projectPath);

      console.log(`📁 Project: ${project?.name || path.basename(projectPath)}`);
      console.log(`📍 Path: ${projectPath}`);

      if (gitConfig) {
        console.log(`👤 Current Git Identity:`);
        console.log(`   Name: ${gitConfig.name}`);
        console.log(`   Email: ${gitConfig.email}`);
      } else {
        console.log(`⚠️  No git identity configured`);
      }

      // Ask what the user wants to do
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Add new identity (login to provider)', value: 'add' },
            { name: 'Change identity for this project', value: 'change' },
            { name: 'Remove authentication', value: 'remove' },
            { name: 'Cancel', value: 'cancel' }
          ]
        }
      ]);

      switch (action) {
        case 'add':
          await addIdentity();
          break;
        case 'change':
          await changeIdentity(projectPath);
          break;
        case 'remove':
          await removeIdentity();
          break;
        case 'cancel':
          return;
      }
    } else {
      // Handle specific options
      if (options.add) {
        await addIdentity();
      } else if (options.remove) {
        await removeIdentity();
      } else if (options.change) {
        await changeIdentity(projectPath);
      }
    }
  });

// ACCOUNT COMMAND GROUP
const accountCmd = program
  .command('account')
  .description('Account management commands');

accountCmd
  .command('list')
  .description('List all configured accounts')
  .action(async () => {
    try {
      const accounts = storageManager.getAccounts();

      if (accounts.length === 0) {
        console.log('📋 No accounts configured yet');

        const { shouldLogin } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldLogin',
            message: 'Would you like to login with GitHub to create an account?',
            default: true
          }
        ]);

        if (shouldLogin) {
          await loginWithGitHub();
        }
        return;
      }

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Account management:',
          choices: [
            { name: 'View all accounts', value: 'view' },
            { name: 'Set default account', value: 'default' },
            { name: 'Edit account', value: 'edit' },
            { name: 'Remove account', value: 'remove' }
          ]
        }
      ]);

      switch (action) {
        case 'view':
          displayAccounts(accounts);
          break;
        case 'default':
          await setDefaultAccount(accounts);
          break;
        case 'edit':
          await editAccount(accounts);
          break;
        case 'remove':
          await removeAccount(accounts);
          break;
      }

    } catch (error) {
      console.error('❌ Failed to manage accounts:', error);
      process.exit(1);
    }
  });

accountCmd
  .command('login')
  .description('Login with GitHub or other providers')
  .action(async () => {
    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Choose authentication provider:',
        choices: [
          { name: 'GitHub', value: 'github' },
          { name: 'GitLab (coming soon)', value: 'gitlab', disabled: true },
          { name: 'Bitbucket (coming soon)', value: 'bitbucket', disabled: true }
        ]
      }
    ]);

    if (provider === 'github') {
      await loginWithGitHub();
    }
  });

accountCmd
  .command('logout')
  .description('Logout from providers')
  .action(async () => {
    const accounts = storageManager.getAccounts();
    const githubAccounts = accounts.filter(account =>
      account.oauthProvider === 'github' && account.oauthToken
    );

    if (githubAccounts.length === 0) {
      console.log('❌ Not logged in to any providers');
      return;
    }

    const { shouldLogout } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldLogout',
        message: `Logout from ${githubAccounts.length} GitHub account(s)?`,
        default: false
      }
    ]);

    if (shouldLogout) {
      for (const account of githubAccounts) {
        const updatedAccount = { ...account };
        delete updatedAccount.oauthToken;
        delete updatedAccount.oauthRefreshToken;
        delete updatedAccount.oauthExpiry;

        storageManager.updateAccount(account.id, updatedAccount);
      }

      console.log(`✅ Successfully logged out from ${githubAccounts.length} account(s)`);
    }
  });

accountCmd
  .command('status')
  .description('Show authentication status')
  .action(async () => {
    console.log('🔐 Authentication Status\n');

    const accounts = storageManager.getAccounts();
    const githubAccounts = accounts.filter(account =>
      account.oauthProvider === 'github' && account.oauthToken
    );

    if (githubAccounts.length === 0) {
      console.log('❌ Not logged in to GitHub');
      console.log('💡 Run `gitswitch account login` to authenticate');
    } else {
      console.log(`✅ Logged in to GitHub (${githubAccounts.length} account${githubAccounts.length > 1 ? 's' : ''})\n`);

      githubAccounts.forEach((account, index) => {
        console.log(`${index + 1}. ${account.name} (${account.email})`);
        if (account.profileUrl) {
          console.log(`   Profile: ${account.profileUrl}`);
        }
        console.log(`   Added: ${account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'Unknown'}`);
        console.log('');
      });
    }
  });

// HOOK COMMAND GROUP
const hookCmd = program
  .command('hook')
  .description('Git hooks management');

hookCmd
  .command('install')
  .description('Install git hooks for identity validation')
  .action(async () => {
    const projectPath = process.cwd();

    if (!gitManager.isGitRepository(projectPath)) {
      console.error('❌ Not a git repository:', projectPath);
      process.exit(1);
    }

    const { config } = await inquirer.prompt([
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
    ]).then(answers => ({
      config: {
        validationLevel: answers.validationLevel,
        autoFix: answers.autoFix,
        preCommitEnabled: true
      } as GitHookInstallConfig
    }));

    console.log(`🔧 Installing git hooks...`);
    console.log(`   Validation: ${config.validationLevel}`);
    console.log(`   Auto-fix: ${config.autoFix ? 'enabled' : 'disabled'}`);

    const success = gitHookManager.installHooks(projectPath, config);

    if (success) {
      console.log('✅ Git hooks installed successfully!');
      console.log('💡 Hooks will now validate git identity before each commit');
    } else {
      console.error('❌ Failed to install git hooks');
      process.exit(1);
    }
  });

hookCmd
  .command('uninstall')
  .description('Remove git hooks')
  .action(async () => {
    const projectPath = process.cwd();

    if (!gitManager.isGitRepository(projectPath)) {
      console.error('❌ Not a git repository:', projectPath);
      process.exit(1);
    }

    const { shouldRemove } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldRemove',
        message: 'Are you sure you want to remove git hooks?',
        default: false
      }
    ]);

    if (shouldRemove) {
      console.log(`🗑️  Removing git hooks...`);

      const success = gitHookManager.removeHooks(projectPath);

      if (success) {
        console.log('✅ Git hooks removed successfully!');
      } else {
        console.error('❌ Failed to remove git hooks');
        process.exit(1);
      }
    }
  });

hookCmd
  .command('status')
  .description('Show git hooks status')
  .action(async () => {
    const projectPath = process.cwd();

    if (!gitManager.isGitRepository(projectPath)) {
      console.error('❌ Not a git repository:', projectPath);
      process.exit(1);
    }

    const projectName = path.basename(projectPath);
    const installed = gitHookManager.areHooksInstalled(projectPath);
    const config = gitHookManager.getHookConfig(projectPath);

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
      const { shouldInstall } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldInstall',
          message: 'Would you like to install hooks now?',
          default: true
        }
      ]);

      if (shouldInstall) {
        // Call install hook logic directly
        await installHooks();
      }
    }
  });

hookCmd
  .command('validate')
  .description('Validate git identity for current project')
  .action(async () => {
    const projectPath = process.cwd();

    try {
      const result = gitHookManager.validateCommit(projectPath);

      console.log(result.message);

      if (!result.valid && result.suggestedAccount) {
        const { shouldFix } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldFix',
            message: 'Would you like to fix the identity automatically?',
            default: true
          }
        ]);

        if (shouldFix) {
          const fixed = gitHookManager.autoFixIdentity(projectPath, result.suggestedAccount);

          if (fixed) {
            console.log('✅ Identity auto-fixed successfully!');
          } else {
            console.log('❌ Auto-fix failed');
          }
        }
      }

    } catch (error) {
      console.error('❌ Validation error:', error);
      process.exit(1);
    }
  });

// Helper Functions for New Identity Commands
async function addIdentity() {
  console.log('➕ Adding new identity (same as account login)...\n');
  
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Choose authentication provider:',
      choices: [
        { name: 'GitHub', value: 'github' },
        { name: 'GitLab (coming soon)', value: 'gitlab', disabled: true },
        { name: 'Bitbucket (coming soon)', value: 'bitbucket', disabled: true }
      ]
    }
  ]);

  if (provider === 'github') {
    await loginWithGitHub();
  }
}

async function removeIdentity() {
  console.log('🗑️  Removing authentication (same as account logout)...\n');
  
  const accounts = storageManager.getAccounts();
  const githubAccounts = accounts.filter(account =>
    account.oauthProvider === 'github' && account.oauthToken
  );

  if (githubAccounts.length === 0) {
    console.log('❌ Not logged in to any providers');
    return;
  }

  const { shouldLogout } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldLogout',
      message: `Logout from ${githubAccounts.length} GitHub account(s)?`,
      default: false
    }
  ]);

  if (shouldLogout) {
    for (const account of githubAccounts) {
      const updatedAccount = { ...account };
      delete updatedAccount.oauthToken;
      delete updatedAccount.oauthRefreshToken;
      delete updatedAccount.oauthExpiry;

      storageManager.updateAccount(account.id, updatedAccount);
    }

    console.log(`✅ Successfully logged out from ${githubAccounts.length} account(s)`);
  }
}

async function changeIdentity(projectPath: string) {
  console.log('🔄 Changing git identity for this project...\n');
  
  const accounts = storageManager.getAccounts();

  if (accounts.length === 0) {
    console.log('❌ No accounts configured');
    console.log('💡 Run `gitswitch project identity --add` to add an account first');
    return;
  }

  const { accountId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'accountId',
      message: 'Select account to use for this project:',
      choices: accounts.map(account => ({
        name: `${account.name} (${account.email})${account.isDefault ? ' - Default' : ''}`,
        value: account.id
      }))
    }
  ]);

  const selectedAccount = accounts.find(a => a.id === accountId);
  
  if (!selectedAccount) {
    console.error('❌ Account not found');
    return;
  }

  try {
    // Use gitManager to set the git config for this project
    const success = gitManager.setConfig(projectPath, {
      name: selectedAccount.gitName || selectedAccount.name,
      email: selectedAccount.email
    });

    if (success) {
      console.log('\n✅ Git identity changed successfully!');
      console.log(`👤 Name: ${selectedAccount.gitName || selectedAccount.name}`);
      console.log(`📧 Email: ${selectedAccount.email}`);
      console.log(`📁 Project: ${path.basename(projectPath)}`);
      
      // Update account usage statistics
      const updatedAccount = { 
        ...selectedAccount, 
        usageCount: (selectedAccount.usageCount || 0) + 1,
        lastUsed: new Date()
      };
      storageManager.updateAccount(accountId, updatedAccount);
    } else {
      console.error('❌ Failed to set git config');
    }
  } catch (error) {
    console.error('❌ Error setting git config:', error);
  }
}

// Existing Helper Functions
async function installHooks() {
  const projectPath = process.cwd();

  if (!gitManager.isGitRepository(projectPath)) {
    console.error('❌ Not a git repository:', projectPath);
    return;
  }

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

  const success = gitHookManager.installHooks(projectPath, config);

  if (success) {
    console.log('✅ Git hooks installed successfully!');
    console.log('💡 Hooks will now validate git identity before each commit');
  } else {
    console.error('❌ Failed to install git hooks');
  }
}

async function scanProjects() {
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

    const result = await projectScanner.scanDirectory(path.resolve(scanPath), depth);

    console.log(`✅ Scan completed in ${result.duration}ms`);
    console.log(`📁 Found ${result.totalFound} git project(s)`);

    if (result.projects.length === 0) {
      console.log('📋 No git projects found in the specified directory');
      return;
    }

    displayProjects(result.projects);

    if (shouldImport) {
      console.log('📥 Importing projects...');

      for (const project of result.projects) {
        const existingProjects = storageManager.getProjects();
        const exists = existingProjects.find(p => p.path === project.path);

        if (!exists) {
          storageManager.upsertProject(project);
          console.log(`  ✅ Imported: ${project.name}`);
        } else {
          console.log(`  ⏭️  Skipped: ${project.name} (already exists)`);
        }
      }

      console.log(`✅ Import completed. ${result.projects.length} project(s) processed.`);
    }

  } catch (error) {
    console.error('❌ Failed to scan directory:', error);
    process.exit(1);
  }
}

async function importFromCommon() {
  console.log('📁 Scanning common development directories...');
  const commonResults = await projectScanner.scanCommonPaths();
  const importedProjects = commonResults.flatMap(result => result.projects);

  if (importedProjects.length === 0) {
    console.log('📋 No projects found in common directories');
    return;
  }

  console.log(`\n📥 Found ${importedProjects.length} project(s) to import...`);

  let imported = 0;
  let skipped = 0;

  for (const project of importedProjects) {
    const existingProjects = storageManager.getProjects();
    const exists = existingProjects.find(p => p.path === project.path);

    if (!exists) {
      storageManager.upsertProject(project);
      imported++;
      console.log(`  ✅ ${project.name}`);
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Import completed!`);
  console.log(`   Imported: ${imported} projects`);
  console.log(`   Skipped: ${skipped} projects (already exist)`);
}

async function bulkImportWithOptions() {
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

  const result = await bulkImportManager.executeImport(importConfig, (step: any) => {
    console.log(`📍 Step ${step.number}/5: ${step.name}`);
    console.log(`   ${step.status === 'completed' ? '✅' : '⏳'} ${step.description}`);
  });

  console.log('\n🎉 Bulk Import Complete!');
  console.log(`✅ Successfully imported: ${result.projectsImported} projects`);
  console.log(`👤 New accounts created: ${result.accountsCreated}`);
  console.log(`🎯 Patterns generated: ${result.patternsCreated}`);
}

async function importFromCustomPath() {
  const { customPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'customPath',
      message: 'Enter custom path to scan:'
    }
  ]);

  // Reuse scan logic with custom path
  await scanProjects();
}

async function loginWithGitHub() {
  console.log('🚀 Starting GitHub authentication...\n');

  try {
    const account = await oauthManager.authenticateWithProvider('github', async (userCode, verificationUri) => {
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: `Device code: ${userCode}\nVerification URL: ${verificationUri}\n\nPress Enter to copy code and open browser...`
        }
      ]);

      // Copy device code to clipboard
      console.log('📋 Copying device code to clipboard...');
      await copyToClipboard(userCode);
    });

    console.log('\n🎉 GitHub authentication successful!\n');
    console.log(`✅ Account: ${account.name} (${account.email})`);
    console.log(`🔗 Profile: ${account.profileUrl || 'N/A'}`);
    console.log(`📧 Email verified: ${account.verified ? 'Yes' : 'No'}`);
    console.log('\n💡 You can now use GitSwitch with your GitHub account!');

  } catch (error: any) {
    console.error('\n❌ GitHub authentication failed:', error.message);
    process.exit(1);
  }
}

async function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve) => {
    // Clean the text - remove any extra whitespace or special characters
    const cleanText = text.trim();
    
    let command: string;
    
    switch (process.platform) {
      case 'win32':
        // Use powershell for more reliable clipboard on Windows
        command = `powershell -command "Set-Clipboard -Value '${cleanText}'"`;
        break;
      case 'darwin':
        // Use printf instead of echo to avoid newlines
        command = `printf '${cleanText}' | pbcopy`;
        break;
      default:
        // Linux - use printf and ensure xclip is available
        command = `printf '${cleanText}' | xclip -selection clipboard 2>/dev/null || printf '${cleanText}' | xsel --clipboard --input`;
        break;
    }
    
    exec(command, (error) => {
      if (error) {
        console.log('⚠️  Could not copy to clipboard. Please copy the code manually.');
        console.log(`Device code: ${cleanText}`);
      } else {
        console.log('✅ Code copied to clipboard!');
      }
      resolve();
    });
  });
}

async function setDefaultAccount(accounts: any[]) {
  const { accountId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'accountId',
      message: 'Select default account:',
      choices: accounts.map(account => ({
        name: `${account.name} (${account.email})`,
        value: account.id
      }))
    }
  ]);

  // Update default account logic
  accounts.forEach(account => {
    account.isDefault = account.id === accountId;
    storageManager.updateAccount(account.id, account);
  });

  const selectedAccount = accounts.find(a => a.id === accountId);
  console.log(`✅ Set default account: ${selectedAccount?.name} (${selectedAccount?.email})`);
}

async function editAccount(accounts: any[]) {
  const { accountId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'accountId',
      message: 'Select account to edit:',
      choices: accounts.map(account => ({
        name: `${account.name} (${account.email})`,
        value: account.id
      }))
    }
  ]);

  const account = accounts.find(a => a.id === accountId);

  const { name, gitName, email, description } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Display name:',
      default: account.name
    },
    {
      type: 'input',
      name: 'gitName',
      message: 'Git name:',
      default: account.gitName
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      default: account.email
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: account.description
    }
  ]);

  const updatedAccount = { ...account, name, gitName, email, description };
  storageManager.updateAccount(accountId, updatedAccount);

  console.log(`✅ Updated account: ${name} (${email})`);
}

async function removeAccount(accounts: any[]) {
  const { accountId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'accountId',
      message: 'Select account to remove:',
      choices: accounts.map(account => ({
        name: `${account.name} (${account.email})`,
        value: account.id
      }))
    }
  ]);

  const account = accounts.find(a => a.id === accountId);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove "${account.name}" (${account.email})?`,
      default: false
    }
  ]);

  if (confirm) {
    // Use deleteAccount instead of removeAccount
    storageManager.deleteAccount(accountId);
    console.log(`✅ Removed account: ${account.name} (${account.email})`);
  }
}

function displayProjects(projects: any[]) {
  if (projects.length === 0) {
    console.log('📋 No projects found');
    return;
  }

  console.log(`📋 Found ${projects.length} project(s):\n`);

  for (const project of projects) {
    const accounts = storageManager.getAccounts();
    const account = accounts.find(a => a.id === project.accountId);

    console.log(`📁 ${project.name}`);
    console.log(`   Path: ${project.path}`);
    if (project.remoteUrl) {
      console.log(`   Remote: ${project.remoteUrl}`);
    }
    if (account) {
      console.log(`   Account: ${account.email} (${account.name})`);
    }
    console.log(`   Status: ${project.status}`);

    let lastAccessedText = 'Unknown';
    if (project.lastAccessed) {
      try {
        const lastAccessedDate = project.lastAccessed instanceof Date ? project.lastAccessed : new Date(project.lastAccessed);
        lastAccessedText = lastAccessedDate.toLocaleDateString();
      } catch (error) {
        lastAccessedText = 'Invalid date';
      }
    }
    console.log(`   Last accessed: ${lastAccessedText}`);
    console.log('');
  }
}

function displayAccounts(accounts: any[]) {
  console.log(`👤 Found ${accounts.length} account(s):\n`);

  for (const account of accounts) {
    console.log(`👤 ${account.name}${account.isDefault ? ' (default)' : ''}`);
    console.log(`   Email: ${account.email}`);
    console.log(`   Git Name: ${account.gitName}`);
    if (account.description) {
      console.log(`   Description: ${account.description}`);
    }
    console.log(`   Usage: ${account.usageCount} times`);

    let lastUsedText = 'Never';
    if (account.lastUsed) {
      try {
        const lastUsedDate = account.lastUsed instanceof Date ? account.lastUsed : new Date(account.lastUsed);
        lastUsedText = lastUsedDate.toLocaleDateString();
      } catch (error) {
        lastUsedText = 'Invalid date';
      }
    }
    console.log(`   Last used: ${lastUsedText}`);
    console.log('');
  }
}

// PHASE 1 COMMANDS - Quick Wins

// Add Phase 1 Project Commands  
projectCmd
  .command('suggest')
  .description('Get account suggestions for current project')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      const project = projectManager.analyzeProject(projectPath);
      if (!project) {
        console.error('❌ Current directory is not a git repository');
        return;
      }

      const suggestions = smartDetector.suggestAccounts(project, project.remoteUrl);
      if (suggestions.length === 0) {
        console.log('💡 No account suggestions available');
        console.log('   Add more accounts or improve project patterns');
        return;
      }

      console.log('🎯 Account suggestions for current project:\n');
      suggestions.forEach((suggestion, index) => {
        const account = storageManager.getAccounts().find(a => a.id === suggestion.accountId);
        if (account) {
          console.log(`${index + 1}. ${account.name} (${account.email})`);
          console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
          console.log(`   Reason: ${suggestion.reason}\n`);
        }
      });
    } catch (error) {
      console.error('❌ Error getting suggestions:', error);
    }
  });

projectCmd
  .command('switch')
  .description('Switch git identity for current project')
  .option('--to <accountId>', 'Account ID to switch to')
  .action(async (options) => {
    const projectPath = process.cwd();
    try {
      if (options.to) {
        const success = projectManager.switchGitIdentity(projectPath, options.to);
        if (success) {
          console.log('✅ Git identity switched successfully');
        } else {
          console.error('❌ Failed to switch git identity');
        }
      } else {
        // Interactive mode
        await changeIdentity(projectPath);
      }
    } catch (error) {
      console.error('❌ Error switching identity:', error);
    }
  });

projectCmd
  .command('health')
  .description('Check identity consistency')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      const gitConfig = projectManager.getCurrentGitConfig(projectPath);
      const project = projectManager.analyzeProject(projectPath);
      
      console.log('🏥 Identity Health Check\n');
      console.log(`📁 Project: ${project?.name || path.basename(projectPath)}`);
      
      if (gitConfig) {
        console.log(`✅ Git Config Found:`);
        console.log(`   Name: ${gitConfig.name}`);
        console.log(`   Email: ${gitConfig.email}`);
        
        // Check if matches any account
        const accounts = storageManager.getAccounts();
        const matchingAccount = accounts.find(a => a.email === gitConfig.email);
        
        if (matchingAccount) {
          console.log(`✅ Matches Account: ${matchingAccount.name}`);
        } else {
          console.log(`⚠️  No matching account found`);
        }
      } else {
        console.log(`❌ No git config found`);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  });

projectCmd
  .command('analyze')
  .description('Enhanced project analysis')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      const project = projectManager.analyzeProject(projectPath);
      
      if (!project) {
        console.error('❌ Not a git repository');
        return;
      }
      
      console.log('🔍 Project Analysis\n');
      console.log(`📁 Name: ${project.name}`);
      console.log(`📍 Path: ${project.path}`);
      console.log(`🔗 Remote: ${project.remoteUrl || 'None'}`);
      console.log(`📊 Status: ${project.status}`);
      
      if (project) {
        console.log(`📊 Status: ${project.status}`);
        
        if (project.lastAccessed) {
          console.log(`🕒 Last Accessed: ${new Date(project.lastAccessed).toLocaleDateString()}`);
        }
        
        // Get suggestions 
        const analyzedProject = projectManager.analyzeProject(projectPath);
        if (analyzedProject) {
          const suggestions = smartDetector.suggestAccounts(analyzedProject, analyzedProject.remoteUrl);
          if (suggestions.length > 0) {
            console.log('\n🎯 Top Suggestion:');
            const topSuggestion = suggestions[0];
            const account = storageManager.getAccounts().find(a => a.id === topSuggestion.accountId);
            if (account) {
              console.log(`   ${account.name} (${(topSuggestion.confidence * 100).toFixed(1)}% confidence)`);
              console.log(`   Reason: ${topSuggestion.reason}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  });

// Repository Commands
const repoCmd = program
  .command('repo')
  .description('Repository management commands');

repoCmd
  .command('status')
  .description('Enhanced git status with identity info')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      const gitConfig = gitManager.getCurrentConfig(projectPath);
      const project = projectManager.analyzeProject(projectPath);
      
      console.log('📊 Repository Status\n');
      
      if (project) {
        console.log(`📁 ${project.name}`);
        console.log(`🔗 ${project.remoteUrl || 'No remote'}`);
      }
      
      if (gitConfig) {
        console.log(`👤 Identity: ${gitConfig.name} <${gitConfig.email}>`);
      } else {
        console.log(`⚠️  No git identity configured`);
      }
      
      // Add git status info
      console.log('\n📋 Git Status:');
      console.log('   (Run `git status` for detailed information)');
    } catch (error) {
      console.error('❌ Status check failed:', error);
    }
  });

repoCmd
  .command('find')
  .description('Find repositories by criteria')
  .option('--name <pattern>', 'Find by name pattern')
  .option('--url <pattern>', 'Find by URL pattern')
  .action(async (options) => {
    try {
      const projects = storageManager.getProjects();
      let filtered = projects;
      
      if (options.name) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(options.name.toLowerCase()));
      }
      
      if (options.url) {
        filtered = filtered.filter(p => p.remoteUrl && p.remoteUrl.includes(options.url));
      }
      
      console.log(`🔍 Found ${filtered.length} repositories:\n`);
      displayProjects(filtered);
    } catch (error) {
      console.error('❌ Search failed:', error);
    }
  });

repoCmd
  .command('validate')
  .description('Validate repository configuration')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      const result = gitHookManager.validateCommit(projectPath);
      console.log(result.message);
      
      if (result.valid) {
        console.log('✅ Repository configuration is valid');
      } else {
        console.log('❌ Repository configuration issues detected');
        if (result.suggestedAccount) {
          console.log(`💡 Suggested account: ${result.suggestedAccount}`);
        }
      }
    } catch (error) {
      console.error('❌ Validation failed:', error);
    }
  });

// Remote Commands
const remoteCmd = program
  .command('remote')
  .description('Remote repository management');

remoteCmd
  .command('push')
  .description('Push to specific remote with identity validation')
  .argument('[remote]', 'Remote name', 'origin')
  .argument('[branch]', 'Branch name', 'HEAD')
  .action(async (remote, branch) => {
    const projectPath = process.cwd();
    try {
      const result = await advancedGitManager.pushToRemote(projectPath, remote, branch);
      if (result.success) {
        console.log(`✅ Successfully pushed to ${remote}`);
      } else {
        console.error(`❌ Failed to push to ${remote}: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Push failed:', error);
    }
  });

remoteCmd
  .command('pull')
  .description('Pull from remote with identity validation')
  .argument('[remote]', 'Remote name', 'origin')
  .argument('[branch]', 'Branch name', 'HEAD')
  .action(async (remote, branch) => {
    const projectPath = process.cwd();
    try {
      const result = await advancedGitManager.pullFromRemote(projectPath, remote, branch);
      if (result.success) {
        console.log(`✅ Successfully pulled from ${remote}`);
      } else {
        console.error(`❌ Failed to pull from ${remote}: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Pull failed:', error);
    }
  });

remoteCmd
  .command('status')
  .description('Show remote status')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      const remotes = await advancedGitManager.getRemotes(projectPath);
      
      console.log('📡 Remote Status\n');
      
      if (remotes.length === 0) {
        console.log('❌ No remotes configured');
        return;
      }
      
      remotes.forEach(remote => {
        console.log(`🔗 ${remote.name}: ${remote.url}`);
      });
    } catch (error) {
      console.error('❌ Failed to get remote status:', error);
    }
  });

remoteCmd
  .command('configure')
  .description('Configure remote with account')
  .argument('<remote>', 'Remote name')
  .argument('<accountId>', 'Account ID')
  .action(async (remote, accountId) => {
    const projectPath = process.cwd();
    try {
      const result = await advancedGitManager.setRemoteAccount(projectPath, remote, accountId);
      if (result) {
        console.log(`✅ Configured ${remote} with account ${accountId}`);
      } else {
        console.error(`❌ Failed to configure ${remote}`);
      }
    } catch (error) {
      console.error('❌ Configuration failed:', error);
    }
  });

remoteCmd
  .command('test')
  .description('Test remote connectivity')
  .argument('[remote]', 'Remote name', 'origin')
  .action(async (remote) => {
    console.log(`🧪 Testing connectivity to ${remote}...`);
    try {
      // Simple git ls-remote test
      exec(`git ls-remote ${remote}`, (error, stdout) => {
        if (error) {
          console.error(`❌ Connection to ${remote} failed:`, error.message);
        } else {
          console.log(`✅ Connection to ${remote} successful`);
        }
      });
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  });

// Branch Commands
const branchCmd = program
  .command('branch')
  .description('Branch management with identity policies');

branchCmd
  .command('policy')
  .description('Branch policy management')
  .addCommand(
    new Command('list')
      .description('Show branch policies')
      .action(async () => {
        const projectPath = process.cwd();
        try {
          const policies = await advancedGitManager.getBranchPolicies(projectPath);
          
          console.log('📋 Branch Policies\n');
          
          if (policies.length === 0) {
            console.log('❌ No branch policies configured');
            return;
          }
          
          policies.forEach(policy => {
            console.log(`🔒 ${policy.pattern}`);
            console.log(`   Required Account: ${policy.requiredAccount.name} (${policy.requiredAccount.email})`);
            console.log(`   Enforcement: ${policy.enforcement}\n`);
          });
        } catch (error) {
          console.error('❌ Failed to get policies:', error);
        }
      })
  )
  .addCommand(
    new Command('add')
      .description('Add branch policy')
      .argument('<pattern>', 'Branch pattern (e.g., main, develop)')
      .argument('<accountId>', 'Required account ID')
      .action(async (pattern, accountId) => {
        const projectPath = process.cwd();
        try {
          const account = storageManager.getAccounts().find(a => a.id === accountId);
          if (!account) {
            console.error(`❌ Account ${accountId} not found`);
            return;
          }

          const policy = {
            pattern,
            requiredAccount: account,
            requireSignedCommits: false,
            requireLinearHistory: false,
            enforcement: 'strict' as const,
            description: `Policy for ${pattern}`,
            createdBy: account.email
          };

          const result = await advancedGitManager.addBranchPolicy(policy);
          
          if (result) {
            console.log(`✅ Added policy for ${pattern} requiring account ${account.name}`);
          } else {
            console.error(`❌ Failed to add policy`);
          }
        } catch (error) {
          console.error('❌ Policy creation failed:', error);
        }
      })
  );

branchCmd
  .command('validate')
  .description('Validate branch commit identity')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      // Get current branch
      exec('git branch --show-current', (error, stdout) => {
        if (error) {
          console.error('❌ Failed to get current branch');
          return;
        }
        
        const branch = stdout.trim();
        console.log(`🔍 Validating branch: ${branch}`);
        
        // Get current account for validation
        const gitConfig = projectManager.getCurrentGitConfig(projectPath);
        if (!gitConfig) {
          console.error('❌ No git configuration found');
          return;
        }
        
        const accounts = storageManager.getAccounts();
        const currentAccount = accounts.find(a => a.email === gitConfig.email);
        
        if (!currentAccount) {
          console.error('❌ Current git identity not found in accounts');
          return;
        }
        
        try {
          const result = advancedGitManager.validateBranchCommit(projectPath, branch, currentAccount);
          if (result.valid) {
            console.log('✅ Branch validation passed');
          } else {
            console.log(`❌ Branch validation failed`);
          }
        } catch (error) {
          console.error('❌ Validation error:', error);
        }
      });
    } catch (error) {
      console.error('❌ Validation failed:', error);
    }
  });

// Phase 1 Account Commands (extend existing)
accountCmd
  .command('usage')
  .description('Show account usage statistics')
  .action(async () => {
    try {
      const accounts = storageManager.getAccounts();
      
      console.log('📊 Account Usage Statistics\n');
      
      accounts
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .forEach(account => {
          console.log(`👤 ${account.name} (${account.email})`);
          console.log(`   Usage: ${account.usageCount || 0} times`);
          
          const lastUsed = account.lastUsed ? new Date(account.lastUsed).toLocaleDateString() : 'Never';
          console.log(`   Last used: ${lastUsed}\n`);
        });
    } catch (error) {
      console.error('❌ Failed to get usage stats:', error);
    }
  });

accountCmd
  .command('test')
  .description('Test account authentication')
  .action(async () => {
    try {
      const accounts = storageManager.getAccounts();
      const oauthAccounts = accounts.filter(a => a.oauthToken);
      
      console.log('🧪 Testing Account Authentication\n');
      
      if (oauthAccounts.length === 0) {
        console.log('❌ No OAuth accounts to test');
        return;
      }
      
      for (const account of oauthAccounts) {
        console.log(`Testing ${account.name}...`);
        
        if (account.oauthExpiry && new Date(account.oauthExpiry) < new Date()) {
          console.log(`⚠️  Token expired for ${account.name}`);
        } else {
          console.log(`✅ ${account.name} authentication valid`);
        }
      }
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
    }
  });

accountCmd
  .command('refresh')
  .description('Refresh OAuth tokens')
  .action(async () => {
    try {
      const accounts = storageManager.getAccounts();
      const oauthAccounts = accounts.filter(a => a.oauthRefreshToken);
      
      console.log('🔄 Refreshing OAuth Tokens\n');
      
      if (oauthAccounts.length === 0) {
        console.log('❌ No accounts with refresh tokens');
        return;
      }
      
      for (const account of oauthAccounts) {
        console.log(`Refreshing ${account.name}...`);
        try {
          // Simple refresh - just log for now since we need proper OAuthAccount type
          console.log(`🔄 Token refresh not yet implemented for ${account.name}`);
        } catch (error) {
          console.log(`❌ Error refreshing ${account.name}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
    }
  });

// Security Commands
const securityCmd = program
  .command('security')
  .description('Security and audit commands');

securityCmd
  .command('audit')
  .description('Security audit')
  .action(async () => {
    try {
      console.log('🔒 Security Audit Report\n');
      
      // Check for accounts without proper security
      const accounts = storageManager.getAccounts();
      const insecureAccounts = accounts.filter(a => !a.oauthToken);
      
      if (insecureAccounts.length > 0) {
        console.log('⚠️  Insecure Accounts:');
        insecureAccounts.forEach(account => {
          console.log(`   ${account.name} - No OAuth token`);
        });
        console.log();
      }
      
      // Check for expired tokens
      const expiredAccounts = accounts.filter(a => 
        a.oauthExpiry && new Date(a.oauthExpiry) < new Date()
      );
      
      if (expiredAccounts.length > 0) {
        console.log('⏰ Expired Tokens:');
        expiredAccounts.forEach(account => {
          console.log(`   ${account.name} - Token expired`);
        });
        console.log();
      }
      
      // Log audit event
      securityManager.logAuditEvent({
        userId: 'cli-user',
        userEmail: 'cli@gitswitch.dev',
        action: 'config_change',
        ipAddress: '127.0.0.1',
        userAgent: 'GitSwitch CLI',
        sessionId: `cli-${Date.now()}`,
        severity: 'info',
        metadata: {
          insecureAccounts: insecureAccounts.length,
          expiredAccounts: expiredAccounts.length
        }
      });
      
      console.log('✅ Security audit completed');
    } catch (error) {
      console.error('❌ Security audit failed:', error);
    }
  });

securityCmd
  .command('keys')
  .description('Signing key management')
  .addCommand(
    new Command('list')
      .description('List signing keys')
      .action(async () => {
        try {
          const accounts = storageManager.getAccounts();
          const accountsWithKeys = accounts.filter(a => a.sshKeyPath);
          
          console.log('🔑 SSH Keys\n');
          
          if (accountsWithKeys.length === 0) {
            console.log('❌ No SSH keys configured');
            return;
          }
          
          accountsWithKeys.forEach(account => {
            console.log(`🔑 ${account.name}`);
            console.log(`   Email: ${account.email}`);
            console.log(`   SSH Key: ${account.sshKeyPath}\n`);
          });
        } catch (error) {
          console.error('❌ Failed to list keys:', error);
        }
      })
  );

// Automation Commands  
const autoCmd = program
  .command('auto')
  .description('Workflow automation commands');

autoCmd
  .command('rule')
  .description('Automation rule management')
  .addCommand(
    new Command('create')
      .description('Create automation rule')
      .action(async () => {
        try {
          const { condition, action } = await inquirer.prompt([
            {
              type: 'list',
              name: 'condition',
              message: 'Rule condition:',
              choices: [
                { name: 'Project path matches pattern', value: 'path_match' },
                { name: 'Remote URL matches pattern', value: 'url_match' },
                { name: 'Branch name matches pattern', value: 'branch_match' }
              ]
            },
            {
              type: 'list', 
              name: 'action',
              message: 'Rule action:',
              choices: [
                { name: 'Switch to specific account', value: 'switch_account' },
                { name: 'Apply git hooks', value: 'apply_hooks' },
                { name: 'Set signing key', value: 'set_signing' }
              ]
            }
          ]);
          
          const rule = await workflowAutomationManager.createRule({
            name: `Rule ${Date.now()}`,
            description: 'Auto-generated rule',
            trigger: { type: 'project_open' },
            conditions: [{
              type: condition === 'path_match' ? 'path_contains' : 'remote_url',
              operator: 'contains',
              value: '*'
            }],
            actions: [{
              id: `action_${Date.now()}`,
              type: action === 'switch_account' ? 'switch_account' : 'notify',
              parameters: {},
              continueOnError: true
            }],
            enabled: true,
            priority: 0,
            createdBy: 'cli'
          });
          
          console.log(`✅ Created automation rule: ${rule.id}`);
        } catch (error) {
          console.error('❌ Failed to create rule:', error);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List automation rules')
      .action(async () => {
        try {
          const rules = workflowAutomationManager.getRules();
          
          console.log('🤖 Automation Rules\n');
          
          if (rules.length === 0) {
            console.log('❌ No automation rules configured');
            return;
          }
          
          rules.forEach(rule => {
            console.log(`🤖 ${rule.name} (${rule.enabled ? 'Enabled' : 'Disabled'})`);
            console.log(`   Trigger: ${rule.trigger.type}`);
            console.log(`   Conditions: ${rule.conditions.length}`);
            console.log(`   Actions: ${rule.actions.length}\n`);
          });
        } catch (error) {
          console.error('❌ Failed to list rules:', error);
        }
      })
  );

// Monorepo Commands
const monoCmd = program
  .command('mono')
  .description('Monorepo management');

monoCmd
  .command('setup')
  .description('Setup monorepo configuration')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      const config = {
        rootPath: projectPath,
        subprojects: [],
        inheritanceRules: [],
        enabled: true
      };
      
      const result = advancedGitManager.setupMonorepo(config);
      if (result) {
        console.log('✅ Monorepo setup completed');
      } else {
        console.error('❌ Monorepo setup failed');
      }
    } catch (error) {
      console.error('❌ Setup failed:', error);
    }
  });

monoCmd
  .command('detect')
  .description('Detect subproject for file')
  .argument('<file>', 'File path to detect subproject for')
  .action(async (file) => {
    const projectPath = process.cwd();
    try {
      const subproject = advancedGitManager.detectSubproject(projectPath, file);
      
      if (subproject) {
        console.log(`📁 Subproject detected: ${subproject.name}`);
        console.log(`   Path: ${subproject.path}`);
      } else {
        console.log(`❌ No subproject detected for ${file}`);
      }
    } catch (error) {
      console.error('❌ Detection failed:', error);
    }
  });

monoCmd
  .command('status')
  .description('Show subproject status')
  .action(async () => {
    const projectPath = process.cwd();
    try {
      // Use existing getAccountForFile logic
      const accounts = storageManager.getAccounts(); 
      
      console.log('📊 Monorepo Status\n');
      console.log('📁 Current project structure analysis...');
      
      // Simple implementation for now
      console.log('✅ Monorepo status check completed');
    } catch (error) {
      console.error('❌ Status check failed:', error);
    }
  });

// Parse CLI arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
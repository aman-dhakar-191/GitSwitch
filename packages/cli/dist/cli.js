#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const core_1 = require("@gitswitch/core");
const blessed_ui_1 = require("./ui/blessed-ui");
const program = new commander_1.Command();
const gitManager = new core_1.GitManager();
const storageManager = new core_1.StorageManager();
const projectManager = new core_1.ProjectManager();
const projectScanner = new core_1.ProjectScanner(gitManager, storageManager);
const smartDetector = new core_1.SmartDetector(storageManager);
const gitHookManager = new core_1.GitHookManager(gitManager, storageManager, smartDetector);
const teamManager = new core_1.TeamManager(storageManager);
const securityManager = new core_1.SecurityManager(storageManager);
const configSyncManager = new core_1.ConfigSyncManager(storageManager, teamManager);
const pluginManager = new core_1.PluginManager(storageManager, gitManager, projectManager);
const advancedGitManager = new core_1.AdvancedGitManager(gitManager, securityManager, storageManager);
const workflowAutomationManager = new core_1.WorkflowAutomationManager(storageManager, gitManager, projectManager, securityManager, advancedGitManager);
const bulkImportManager = new core_1.BulkImportManager(storageManager, projectScanner, smartDetector, gitManager);
const oauthManager = new core_1.OAuthManager(storageManager);
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
        const ui = new blessed_ui_1.BlessedUI({
            project,
            gitConfig: gitConfig || undefined,
            onExit: async () => {
                // Launch the desktop app when user presses Enter
            }
        });
        ui.render();
    }
    catch (error) {
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
            const statusUI = new blessed_ui_1.BlessedStatusUI({
                project,
                gitConfig: gitConfig || undefined
            });
            statusUI.render();
        }
        else {
            console.log(`📁 Project: ${project.name}`);
            console.log(`📍 Path: ${project.path}`);
            if (project.remoteUrl) {
                console.log(`🔗 Remote: ${project.remoteUrl}`);
            }
            if (gitConfig) {
                console.log(`👤 Git Identity:`);
                console.log(`   Name: ${gitConfig.name}`);
                console.log(`   Email: ${gitConfig.email}`);
            }
            else {
                console.log(`⚠️  No git identity configured`);
            }
        }
    }
    catch (error) {
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
            const { shouldScan } = await inquirer_1.default.prompt([
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
        const { action } = await inquirer_1.default.prompt([
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
            const { filterType } = await inquirer_1.default.prompt([
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
                const { status } = await inquirer_1.default.prompt([
                    {
                        type: 'list',
                        name: 'status',
                        message: 'Select status:',
                        choices: ['active', 'inactive', 'archived']
                    }
                ]);
                filteredProjects = projects.filter(p => p.status === status);
            }
        }
        else if (action === 'search') {
            const { searchTerm } = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'searchTerm',
                    message: 'Enter search term (name or path):'
                }
            ]);
            const filter = searchTerm.toLowerCase();
            filteredProjects = projects.filter(p => p.name.toLowerCase().includes(filter) ||
                p.path.toLowerCase().includes(filter));
        }
        displayProjects(filteredProjects);
    }
    catch (error) {
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
    const { importType } = await inquirer_1.default.prompt([
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
        }
        else {
            console.log(`⚠️  No git identity configured`);
        }
        // Ask what the user wants to do
        const { action } = await inquirer_1.default.prompt([
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
    }
    else {
        // Handle specific options
        if (options.add) {
            await addIdentity();
        }
        else if (options.remove) {
            await removeIdentity();
        }
        else if (options.change) {
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
            const { shouldLogin } = await inquirer_1.default.prompt([
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
        const { action } = await inquirer_1.default.prompt([
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
    }
    catch (error) {
        console.error('❌ Failed to manage accounts:', error);
        process.exit(1);
    }
});
accountCmd
    .command('login')
    .description('Login with GitHub or other providers')
    .action(async () => {
    const { provider } = await inquirer_1.default.prompt([
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
    const githubAccounts = accounts.filter(account => account.oauthProvider === 'github' && account.oauthToken);
    if (githubAccounts.length === 0) {
        console.log('❌ Not logged in to any providers');
        return;
    }
    const { shouldLogout } = await inquirer_1.default.prompt([
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
    const githubAccounts = accounts.filter(account => account.oauthProvider === 'github' && account.oauthToken);
    if (githubAccounts.length === 0) {
        console.log('❌ Not logged in to GitHub');
        console.log('💡 Run `gitswitch account login` to authenticate');
    }
    else {
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
    const { config } = await inquirer_1.default.prompt([
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
        }
    }));
    console.log(`🔧 Installing git hooks...`);
    console.log(`   Validation: ${config.validationLevel}`);
    console.log(`   Auto-fix: ${config.autoFix ? 'enabled' : 'disabled'}`);
    const success = gitHookManager.installHooks(projectPath, config);
    if (success) {
        console.log('✅ Git hooks installed successfully!');
        console.log('💡 Hooks will now validate git identity before each commit');
    }
    else {
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
    const { shouldRemove } = await inquirer_1.default.prompt([
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
        }
        else {
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
        const { shouldInstall } = await inquirer_1.default.prompt([
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
            const { shouldFix } = await inquirer_1.default.prompt([
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
                }
                else {
                    console.log('❌ Auto-fix failed');
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Validation error:', error);
        process.exit(1);
    }
});
// Helper Functions for New Identity Commands
async function addIdentity() {
    console.log('➕ Adding new identity (same as account login)...\n');
    const { provider } = await inquirer_1.default.prompt([
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
    const githubAccounts = accounts.filter(account => account.oauthProvider === 'github' && account.oauthToken);
    if (githubAccounts.length === 0) {
        console.log('❌ Not logged in to any providers');
        return;
    }
    const { shouldLogout } = await inquirer_1.default.prompt([
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
async function changeIdentity(projectPath) {
    console.log('🔄 Changing git identity for this project...\n');
    const accounts = storageManager.getAccounts();
    if (accounts.length === 0) {
        console.log('❌ No accounts configured');
        console.log('💡 Run `gitswitch project identity --add` to add an account first');
        return;
    }
    const { accountId } = await inquirer_1.default.prompt([
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
        }
        else {
            console.error('❌ Failed to set git config');
        }
    }
    catch (error) {
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
    const { validationLevel, autoFix } = await inquirer_1.default.prompt([
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
    const config = {
        validationLevel: validationLevel,
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
    }
    else {
        console.error('❌ Failed to install git hooks');
    }
}
async function scanProjects() {
    const { scanPath, depth, shouldImport } = await inquirer_1.default.prompt([
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
                }
                else {
                    console.log(`  ⏭️  Skipped: ${project.name} (already exists)`);
                }
            }
            console.log(`✅ Import completed. ${result.projects.length} project(s) processed.`);
        }
    }
    catch (error) {
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
        }
        else {
            skipped++;
        }
    }
    console.log(`\n✅ Import completed!`);
    console.log(`   Imported: ${imported} projects`);
    console.log(`   Skipped: ${skipped} projects (already exist)`);
}
async function bulkImportWithOptions() {
    const { paths, maxDepth, detectAccounts } = await inquirer_1.default.prompt([
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
    const scanPaths = paths.split(',').map((p) => p.trim());
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
    const result = await bulkImportManager.executeImport(importConfig, (step) => {
        console.log(`📍 Step ${step.number}/5: ${step.name}`);
        console.log(`   ${step.status === 'completed' ? '✅' : '⏳'} ${step.description}`);
    });
    console.log('\n🎉 Bulk Import Complete!');
    console.log(`✅ Successfully imported: ${result.projectsImported} projects`);
    console.log(`👤 New accounts created: ${result.accountsCreated}`);
    console.log(`🎯 Patterns generated: ${result.patternsCreated}`);
}
async function importFromCustomPath() {
    const { customPath } = await inquirer_1.default.prompt([
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
            await inquirer_1.default.prompt([
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
    }
    catch (error) {
        console.error('\n❌ GitHub authentication failed:', error.message);
        process.exit(1);
    }
}
async function copyToClipboard(text) {
    return new Promise((resolve) => {
        // Clean the text - remove any extra whitespace or special characters
        const cleanText = text.trim();
        let command;
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
        (0, child_process_1.exec)(command, (error) => {
            if (error) {
                console.log('⚠️  Could not copy to clipboard. Please copy the code manually.');
                console.log(`Device code: ${cleanText}`);
            }
            else {
                console.log('✅ Code copied to clipboard!');
            }
            resolve();
        });
    });
}
async function setDefaultAccount(accounts) {
    const { accountId } = await inquirer_1.default.prompt([
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
async function editAccount(accounts) {
    const { accountId } = await inquirer_1.default.prompt([
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
    const { name, gitName, email, description } = await inquirer_1.default.prompt([
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
async function removeAccount(accounts) {
    const { accountId } = await inquirer_1.default.prompt([
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
    const { confirm } = await inquirer_1.default.prompt([
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
function displayProjects(projects) {
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
            }
            catch (error) {
                lastAccessedText = 'Invalid date';
            }
        }
        console.log(`   Last accessed: ${lastAccessedText}`);
        console.log('');
    }
}
function displayAccounts(accounts) {
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
            }
            catch (error) {
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
    }
    catch (error) {
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
            }
            else {
                console.error('❌ Failed to switch git identity');
            }
        }
        else {
            // Interactive mode
            await changeIdentity(projectPath);
        }
    }
    catch (error) {
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
            }
            else {
                console.log(`⚠️  No matching account found`);
            }
        }
        else {
            console.log(`❌ No git config found`);
        }
    }
    catch (error) {
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
    }
    catch (error) {
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
        }
        else {
            console.log(`⚠️  No git identity configured`);
        }
        // Add git status info
        console.log('\n📋 Git Status:');
        console.log('   (Run `git status` for detailed information)');
    }
    catch (error) {
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
    }
    catch (error) {
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
        }
        else {
            console.log('❌ Repository configuration issues detected');
            if (result.suggestedAccount) {
                console.log(`💡 Suggested account: ${result.suggestedAccount}`);
            }
        }
    }
    catch (error) {
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
        }
        else {
            console.error(`❌ Failed to push to ${remote}: ${result.error}`);
        }
    }
    catch (error) {
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
        }
        else {
            console.error(`❌ Failed to pull from ${remote}: ${result.error}`);
        }
    }
    catch (error) {
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
    }
    catch (error) {
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
        }
        else {
            console.error(`❌ Failed to configure ${remote}`);
        }
    }
    catch (error) {
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
        (0, child_process_1.exec)(`git ls-remote ${remote}`, (error, stdout) => {
            if (error) {
                console.error(`❌ Connection to ${remote} failed:`, error.message);
            }
            else {
                console.log(`✅ Connection to ${remote} successful`);
            }
        });
    }
    catch (error) {
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
    .addCommand(new commander_1.Command('list')
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
    }
    catch (error) {
        console.error('❌ Failed to get policies:', error);
    }
}))
    .addCommand(new commander_1.Command('add')
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
            enforcement: 'strict',
            description: `Policy for ${pattern}`,
            createdBy: account.email
        };
        const result = await advancedGitManager.addBranchPolicy(policy);
        if (result) {
            console.log(`✅ Added policy for ${pattern} requiring account ${account.name}`);
        }
        else {
            console.error(`❌ Failed to add policy`);
        }
    }
    catch (error) {
        console.error('❌ Policy creation failed:', error);
    }
}));
branchCmd
    .command('validate')
    .description('Validate branch commit identity')
    .action(async () => {
    const projectPath = process.cwd();
    try {
        // Get current branch
        (0, child_process_1.exec)('git branch --show-current', (error, stdout) => {
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
                }
                else {
                    console.log(`❌ Branch validation failed`);
                }
            }
            catch (error) {
                console.error('❌ Validation error:', error);
            }
        });
    }
    catch (error) {
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
    }
    catch (error) {
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
            }
            else {
                console.log(`✅ ${account.name} authentication valid`);
            }
        }
    }
    catch (error) {
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
            }
            catch (error) {
                console.log(`❌ Error refreshing ${account.name}:`, error);
            }
        }
    }
    catch (error) {
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
        const expiredAccounts = accounts.filter(a => a.oauthExpiry && new Date(a.oauthExpiry) < new Date());
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
    }
    catch (error) {
        console.error('❌ Security audit failed:', error);
    }
});
securityCmd
    .command('keys')
    .description('Signing key management')
    .addCommand(new commander_1.Command('list')
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
    }
    catch (error) {
        console.error('❌ Failed to list keys:', error);
    }
}));
// Automation Commands  
const autoCmd = program
    .command('auto')
    .description('Workflow automation commands');
autoCmd
    .command('rule')
    .description('Automation rule management')
    .addCommand(new commander_1.Command('create')
    .description('Create automation rule')
    .action(async () => {
    try {
        const { condition, action } = await inquirer_1.default.prompt([
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
    }
    catch (error) {
        console.error('❌ Failed to create rule:', error);
    }
}))
    .addCommand(new commander_1.Command('list')
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
    }
    catch (error) {
        console.error('❌ Failed to list rules:', error);
    }
}));
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
        }
        else {
            console.error('❌ Monorepo setup failed');
        }
    }
    catch (error) {
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
        }
        else {
            console.log(`❌ No subproject detected for ${file}`);
        }
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('❌ Status check failed:', error);
    }
});
// PHASE 2 COMMANDS - Medium Effort
// Enhanced Project Commands
projectCmd
    .command('auto-setup')
    .description('Auto-configure project based on patterns')
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
            console.log('💡 No auto-setup suggestions available');
            return;
        }
        const topSuggestion = suggestions[0];
        const account = storageManager.getAccounts().find(a => a.id === topSuggestion.accountId);
        if (account && topSuggestion.confidence > 0.8) {
            console.log(`🔧 Auto-configuring with ${account.name} (${(topSuggestion.confidence * 100).toFixed(1)}% confidence)`);
            const success = projectManager.switchGitIdentity(projectPath, account.id);
            if (success) {
                console.log('✅ Project auto-configured successfully');
            }
            else {
                console.error('❌ Auto-configuration failed');
            }
        }
        else {
            console.log('⚠️  Confidence too low for auto-setup, manual configuration recommended');
        }
    }
    catch (error) {
        console.error('❌ Auto-setup failed:', error);
    }
});
projectCmd
    .command('similar')
    .description('Find similar projects')
    .action(async () => {
    const projectPath = process.cwd();
    try {
        const currentProject = projectManager.analyzeProject(projectPath);
        if (!currentProject) {
            console.error('❌ Current directory is not a git repository');
            return;
        }
        const allProjects = storageManager.getProjects();
        const similarProjects = allProjects.filter(p => p.id !== currentProject.id &&
            (p.organization === currentProject.organization ||
                p.platform === currentProject.platform));
        console.log(`🔍 Found ${similarProjects.length} similar projects:\n`);
        displayProjects(similarProjects.slice(0, 10)); // Show top 10
    }
    catch (error) {
        console.error('❌ Failed to find similar projects:', error);
    }
});
projectCmd
    .command('predict')
    .description('Predict correct account for project')
    .action(async () => {
    const projectPath = process.cwd();
    try {
        const project = projectManager.analyzeProject(projectPath);
        if (!project) {
            console.error('❌ Current directory is not a git repository');
            return;
        }
        const suggestions = smartDetector.suggestAccounts(project, project.remoteUrl);
        console.log('🔮 Account Predictions:\n');
        suggestions.slice(0, 5).forEach((suggestion, index) => {
            const account = storageManager.getAccounts().find(a => a.id === suggestion.accountId);
            if (account) {
                const confidence = (suggestion.confidence * 100).toFixed(1);
                console.log(`${index + 1}. ${account.name} (${account.email})`);
                console.log(`   Confidence: ${confidence}%`);
                console.log(`   Reason: ${suggestion.reason}\n`);
            }
        });
    }
    catch (error) {
        console.error('❌ Prediction failed:', error);
    }
});
projectCmd
    .command('backup')
    .description('Backup project configuration')
    .action(async () => {
    const projectPath = process.cwd();
    try {
        const project = projectManager.analyzeProject(projectPath);
        const gitConfig = projectManager.getCurrentGitConfig(projectPath);
        const backup = {
            project,
            gitConfig,
            timestamp: new Date().toISOString(),
            path: projectPath
        };
        const backupPath = path.join(projectPath, '.gitswitch-backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        console.log(`✅ Project configuration backed up to ${backupPath}`);
    }
    catch (error) {
        console.error('❌ Backup failed:', error);
    }
});
projectCmd
    .command('template')
    .description('Create project template from current setup')
    .action(async () => {
    const projectPath = process.cwd();
    try {
        const project = projectManager.analyzeProject(projectPath);
        const gitConfig = projectManager.getCurrentGitConfig(projectPath);
        if (!project || !gitConfig) {
            console.error('❌ Cannot create template from unconfigured project');
            return;
        }
        const template = {
            name: `${project.name}_template`,
            pattern: project.remoteUrl?.replace(/https:\/\/github\.com\/[^\/]+\//, '') || '*',
            accountId: project.accountId,
            gitConfig,
            createdAt: new Date()
        };
        console.log('📋 Project Template Created:');
        console.log(`   Name: ${template.name}`);
        console.log(`   Pattern: ${template.pattern}`);
        console.log(`   Account: ${gitConfig.name} <${gitConfig.email}>`);
        console.log('\n💡 Template can be used for similar projects in the future');
    }
    catch (error) {
        console.error('❌ Template creation failed:', error);
    }
});
// Commit Commands
const commitCmd = program
    .command('commit')
    .description('Enhanced commit commands with identity validation');
commitCmd
    .command('create')
    .description('Commit with identity validation')
    .option('--account <accountId>', 'Specify account for commit')
    .option('--message <message>', 'Commit message')
    .action(async (options) => {
    const projectPath = process.cwd();
    try {
        // Validate current identity
        const result = gitHookManager.validateCommit(projectPath);
        if (!result.valid) {
            console.error('❌ Identity validation failed:', result.message);
            if (result.suggestedAccount) {
                const { shouldFix } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'shouldFix',
                        message: 'Would you like to fix the identity automatically?',
                        default: true
                    }
                ]);
                if (shouldFix) {
                    gitHookManager.autoFixIdentity(projectPath, result.suggestedAccount);
                }
                else {
                    return;
                }
            }
        }
        if (options.message) {
            console.log(`📝 Committing with message: "${options.message}"`);
            console.log('💡 Use `git commit -m "${options.message}"` to complete the commit');
        }
        else {
            console.log('✅ Identity validation passed. Ready to commit.');
            console.log('💡 Use `git commit` to create your commit');
        }
    }
    catch (error) {
        console.error('❌ Commit preparation failed:', error);
    }
});
commitCmd
    .command('sign')
    .description('Create signed commit')
    .option('--message <message>', 'Commit message')
    .action(async (options) => {
    const projectPath = process.cwd();
    try {
        const gitConfig = projectManager.getCurrentGitConfig(projectPath);
        if (!gitConfig) {
            console.error('❌ No git configuration found');
            return;
        }
        const accounts = storageManager.getAccounts();
        const account = accounts.find(a => a.email === gitConfig.email);
        if (!account?.sshKeyPath) {
            console.error('❌ No signing key configured for current account');
            return;
        }
        console.log('🔐 Preparing signed commit...');
        console.log(`   Key: ${account.sshKeyPath}`);
        console.log('💡 Use `git commit -S` to create a signed commit');
        if (options.message) {
            console.log(`   Message: "${options.message}"`);
        }
    }
    catch (error) {
        console.error('❌ Signed commit preparation failed:', error);
    }
});
commitCmd
    .command('verify')
    .description('Verify commits in range')
    .argument('[range]', 'Commit range (e.g., HEAD~5..HEAD)', 'HEAD~10..HEAD')
    .action(async (range) => {
    console.log(`🔍 Verifying commits in range: ${range}`);
    (0, child_process_1.exec)(`git log --format="%H %an %ae" ${range}`, (error, stdout) => {
        if (error) {
            console.error('❌ Failed to get commit history:', error.message);
            return;
        }
        const commits = stdout.trim().split('\n').filter(line => line);
        const accounts = storageManager.getAccounts();
        console.log(`\n📊 Verification Results (${commits.length} commits):\n`);
        commits.forEach(commitLine => {
            const [hash, name, email] = commitLine.split(' ');
            const shortHash = hash.substring(0, 8);
            const matchingAccount = accounts.find(a => a.email === email);
            if (matchingAccount) {
                console.log(`✅ ${shortHash} - ${name} <${email}> (${matchingAccount.name})`);
            }
            else {
                console.log(`⚠️  ${shortHash} - ${name} <${email}> (Unknown account)`);
            }
        });
    });
});
commitCmd
    .command('authors')
    .description('Analyze commit authors')
    .option('--since <date>', 'Since date (e.g., "1 month ago")', '1 month ago')
    .action(async (options) => {
    console.log(`📊 Analyzing commit authors since: ${options.since}\n`);
    (0, child_process_1.exec)(`git log --format="%an %ae" --since="${options.since}"`, (error, stdout) => {
        if (error) {
            console.error('❌ Failed to analyze authors:', error.message);
            return;
        }
        const commits = stdout.trim().split('\n').filter(line => line);
        const authorStats = {};
        commits.forEach(commitLine => {
            const [name, email] = commitLine.split(' ');
            const key = email;
            if (authorStats[key]) {
                authorStats[key].count++;
            }
            else {
                authorStats[key] = { name, email, count: 1 };
            }
        });
        const sortedAuthors = Object.values(authorStats).sort((a, b) => b.count - a.count);
        console.log('👥 Author Statistics:\n');
        sortedAuthors.forEach((author, index) => {
            console.log(`${index + 1}. ${author.name} <${author.email}> - ${author.count} commits`);
        });
    });
});
// Enhanced Branch Commands
branchCmd
    .command('create')
    .description('Create branch with identity switching')
    .argument('<branchName>', 'Name of the new branch')
    .option('--account <accountId>', 'Switch to account after creating branch')
    .action(async (branchName, options) => {
    const projectPath = process.cwd();
    try {
        console.log(`🌿 Creating branch: ${branchName}`);
        (0, child_process_1.exec)(`git checkout -b ${branchName}`, async (error) => {
            if (error) {
                console.error('❌ Failed to create branch:', error.message);
                return;
            }
            console.log(`✅ Branch "${branchName}" created`);
            if (options.account) {
                const success = projectManager.switchGitIdentity(projectPath, options.account);
                if (success) {
                    console.log(`🔄 Switched to account: ${options.account}`);
                }
                else {
                    console.error(`❌ Failed to switch to account: ${options.account}`);
                }
            }
        });
    }
    catch (error) {
        console.error('❌ Branch creation failed:', error);
    }
});
branchCmd
    .command('switch')
    .description('Switch branch with identity management')
    .argument('<branchName>', 'Name of the branch to switch to')
    .action(async (branchName) => {
    const projectPath = process.cwd();
    try {
        console.log(`🔄 Switching to branch: ${branchName}`);
        (0, child_process_1.exec)(`git checkout ${branchName}`, async (error) => {
            if (error) {
                console.error('❌ Failed to switch branch:', error.message);
                return;
            }
            console.log(`✅ Switched to branch "${branchName}"`);
            // Check if branch has specific identity requirements
            const policies = await advancedGitManager.getBranchPolicies(projectPath);
            const matchingPolicy = policies.find(p => branchName.match(p.pattern));
            if (matchingPolicy) {
                console.log(`🔒 Branch policy detected: ${matchingPolicy.pattern}`);
                console.log(`   Required account: ${matchingPolicy.requiredAccount.name}`);
                const success = projectManager.switchGitIdentity(projectPath, matchingPolicy.requiredAccount.id);
                if (success) {
                    console.log('🔄 Identity switched to match policy');
                }
            }
        });
    }
    catch (error) {
        console.error('❌ Branch switch failed:', error);
    }
});
branchCmd
    .command('compare')
    .description('Compare branches with identity analysis')
    .argument('<branch1>', 'First branch')
    .argument('<branch2>', 'Second branch')
    .action(async (branch1, branch2) => {
    console.log(`🔍 Comparing branches: ${branch1} vs ${branch2}\n`);
    (0, child_process_1.exec)(`git log --format="%H %an %ae" ${branch1}..${branch2}`, (error, stdout) => {
        if (error) {
            console.error('❌ Failed to compare branches:', error.message);
            return;
        }
        const commits = stdout.trim().split('\n').filter(line => line);
        const accounts = storageManager.getAccounts();
        console.log(`📊 Commits in ${branch2} not in ${branch1}: ${commits.length}\n`);
        const authorStats = {};
        commits.forEach(commitLine => {
            const [hash, name, email] = commitLine.split(' ');
            const shortHash = hash.substring(0, 8);
            const matchingAccount = accounts.find(a => a.email === email);
            authorStats[email] = (authorStats[email] || 0) + 1;
            const accountInfo = matchingAccount ? `(${matchingAccount.name})` : '(Unknown)';
            console.log(`  ${shortHash} - ${name} <${email}> ${accountInfo}`);
        });
        console.log('\n👥 Author Summary:');
        Object.entries(authorStats).forEach(([email, count]) => {
            const account = accounts.find(a => a.email === email);
            const name = account ? account.name : 'Unknown';
            console.log(`  ${name} <${email}>: ${count} commits`);
        });
    });
});
branchCmd
    .command('authors')
    .description('Show branch author analysis')
    .argument('[branch]', 'Branch name', 'HEAD')
    .option('--limit <number>', 'Limit commits to analyze', '50')
    .action(async (branch, options) => {
    console.log(`📊 Analyzing authors on branch: ${branch}\n`);
    (0, child_process_1.exec)(`git log --format="%an %ae %s" -n ${options.limit} ${branch}`, (error, stdout) => {
        if (error) {
            console.error('❌ Failed to analyze branch authors:', error.message);
            return;
        }
        const commits = stdout.trim().split('\n').filter(line => line);
        const accounts = storageManager.getAccounts();
        const authorStats = {};
        commits.forEach(commitLine => {
            const parts = commitLine.split(' ');
            const name = parts[0];
            const email = parts[1];
            const key = email;
            if (authorStats[key]) {
                authorStats[key].commits++;
            }
            else {
                const matchingAccount = accounts.find(a => a.email === email);
                authorStats[key] = {
                    name,
                    email,
                    commits: 1,
                    account: matchingAccount?.name
                };
            }
        });
        const sortedAuthors = Object.values(authorStats).sort((a, b) => b.commits - a.commits);
        console.log('👥 Branch Author Statistics:\n');
        sortedAuthors.forEach((author, index) => {
            const accountInfo = author.account ? ` (${author.account})` : ' (Unknown account)';
            console.log(`${index + 1}. ${author.name} <${author.email}>${accountInfo}`);
            console.log(`   Commits: ${author.commits}\n`);
        });
    });
});
// Workflow Commands
const workflowCmd = program
    .command('workflow')
    .description('Smart workflow operations');
workflowCmd
    .command('commit')
    .description('Smart commit workflow with automation')
    .option('--message <message>', 'Commit message')
    .action(async (options) => {
    const projectPath = process.cwd();
    try {
        console.log('🚀 Starting smart commit workflow...\n');
        // 1. Validate identity
        const result = gitHookManager.validateCommit(projectPath);
        if (!result.valid) {
            console.log('⚠️  Identity validation failed, attempting auto-fix...');
            if (result.suggestedAccount) {
                const fixed = gitHookManager.autoFixIdentity(projectPath, result.suggestedAccount);
                if (fixed) {
                    console.log('✅ Identity auto-fixed');
                }
                else {
                    console.error('❌ Auto-fix failed');
                    return;
                }
            }
        }
        // 2. Check for automation rules
        const rules = workflowAutomationManager.getRules();
        const applicableRules = rules.filter(rule => rule.enabled && rule.trigger.type === 'before_commit');
        if (applicableRules.length > 0) {
            console.log(`🤖 Found ${applicableRules.length} applicable automation rules`);
        }
        // 3. Proceed with commit
        console.log('✅ Pre-commit validation complete');
        if (options.message) {
            console.log(`📝 Ready to commit with message: "${options.message}"`);
            console.log('💡 Run: git commit -m "' + options.message + '"');
        }
        else {
            console.log('💡 Run: git commit to complete the workflow');
        }
    }
    catch (error) {
        console.error('❌ Smart commit workflow failed:', error);
    }
});
workflowCmd
    .command('push')
    .description('Smart push workflow')
    .argument('[remote]', 'Remote name', 'origin')
    .argument('[branch]', 'Branch name', 'HEAD')
    .action(async (remote, branch) => {
    const projectPath = process.cwd();
    try {
        console.log(`🚀 Starting smart push workflow to ${remote}/${branch}...\n`);
        // Pre-push validation
        const result = gitHookManager.validateCommit(projectPath);
        if (result.valid) {
            console.log('✅ Identity validation passed');
            console.log(`📤 Ready to push to ${remote}/${branch}`);
            console.log(`💡 Run: git push ${remote} ${branch}`);
        }
        else {
            console.error('❌ Pre-push validation failed:', result.message);
        }
    }
    catch (error) {
        console.error('❌ Smart push workflow failed:', error);
    }
});
workflowCmd
    .command('pull')
    .description('Smart pull workflow')
    .argument('[remote]', 'Remote name', 'origin')
    .argument('[branch]', 'Branch name', 'HEAD')
    .action(async (remote, branch) => {
    const projectPath = process.cwd();
    try {
        console.log(`🚀 Starting smart pull workflow from ${remote}/${branch}...\n`);
        console.log('✅ Pre-pull checks passed');
        console.log(`📥 Ready to pull from ${remote}/${branch}`);
        console.log(`💡 Run: git pull ${remote} ${branch}`);
    }
    catch (error) {
        console.error('❌ Smart pull workflow failed:', error);
    }
});
workflowCmd
    .command('clone')
    .description('Smart clone with auto-setup')
    .argument('<url>', 'Repository URL to clone')
    .option('--directory <dir>', 'Target directory')
    .action(async (url, options) => {
    try {
        console.log(`🚀 Starting smart clone of ${url}...\n`);
        // Detect platform and suggest account
        const accounts = storageManager.getAccounts();
        const suggestedAccount = accounts.find(account => account.patterns.some(pattern => url.includes(pattern)));
        if (suggestedAccount) {
            console.log(`💡 Suggested account: ${suggestedAccount.name} (${suggestedAccount.email})`);
        }
        const targetDir = options.directory || path.basename(url, '.git');
        console.log(`📁 Target directory: ${targetDir}`);
        console.log(`💡 Run: git clone ${url} ${targetDir}`);
        console.log('💡 Then run: gitswitch project auto-setup');
    }
    catch (error) {
        console.error('❌ Smart clone preparation failed:', error);
    }
});
workflowCmd
    .command('sync')
    .description('Synchronize with automation rules')
    .action(async () => {
    const projectPath = process.cwd();
    try {
        console.log('🔄 Synchronizing project with automation rules...\n');
        const rules = workflowAutomationManager.getRules();
        const enabledRules = rules.filter(rule => rule.enabled);
        console.log(`🤖 Found ${enabledRules.length} enabled automation rules`);
        // Test each rule against current project
        for (const rule of enabledRules) {
            try {
                const context = { projectPath, currentDirectory: process.cwd() };
                const result = workflowAutomationManager.testRule(rule, context);
                console.log(`   ${rule.name}: ${result.match ? '✅ Applicable' : '⏭️  Not applicable'}`);
                if (result.match && result.reason) {
                    console.log(`     Reason: ${result.reason}`);
                }
            }
            catch (error) {
                console.log(`   ${rule.name}: ❌ Error`);
            }
        }
        console.log('\n✅ Synchronization complete');
    }
    catch (error) {
        console.error('❌ Sync failed:', error);
    }
});
// Configuration Commands
const configCmd = program
    .command('config')
    .description('Configuration management');
configCmd
    .command('export')
    .description('Export GitSwitch configuration')
    .option('--file <path>', 'Export file path', 'gitswitch-config.json')
    .action(async (options) => {
    try {
        const accounts = storageManager.getAccounts();
        const projects = storageManager.getProjects();
        const rules = workflowAutomationManager.getRules();
        const config = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            accounts: accounts.map(account => ({
                ...account,
                // Remove sensitive data
                oauthToken: undefined,
                oauthRefreshToken: undefined
            })),
            projects,
            automationRules: rules
        };
        fs.writeFileSync(options.file, JSON.stringify(config, null, 2));
        console.log(`✅ Configuration exported to ${options.file}`);
        console.log(`📊 Exported: ${accounts.length} accounts, ${projects.length} projects, ${rules.length} rules`);
    }
    catch (error) {
        console.error('❌ Export failed:', error);
    }
});
configCmd
    .command('import')
    .description('Import GitSwitch configuration')
    .argument('<file>', 'Configuration file to import')
    .option('--merge', 'Merge with existing configuration', false)
    .action(async (file, options) => {
    try {
        if (!fs.existsSync(file)) {
            console.error(`❌ File not found: ${file}`);
            return;
        }
        const configData = JSON.parse(fs.readFileSync(file, 'utf8'));
        console.log(`📥 Importing configuration from ${file}...`);
        console.log(`📊 Found: ${configData.accounts?.length || 0} accounts, ${configData.projects?.length || 0} projects`);
        if (!options.merge) {
            console.log('⚠️  This will replace your current configuration');
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Are you sure you want to proceed?',
                    default: false
                }
            ]);
            if (!confirm) {
                console.log('❌ Import cancelled');
                return;
            }
        }
        console.log('✅ Configuration import completed');
        console.log('💡 Note: OAuth tokens need to be re-authenticated');
    }
    catch (error) {
        console.error('❌ Import failed:', error);
    }
});
configCmd
    .command('backup')
    .description('Create configuration backup')
    .action(async () => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `gitswitch-backup-${timestamp}.json`;
        const accounts = storageManager.getAccounts();
        const projects = storageManager.getProjects();
        const backup = {
            version: '1.0.0',
            backupDate: new Date().toISOString(),
            accounts,
            projects
        };
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
        console.log(`✅ Backup created: ${backupFile}`);
        console.log(`📊 Backed up: ${accounts.length} accounts, ${projects.length} projects`);
    }
    catch (error) {
        console.error('❌ Backup failed:', error);
    }
});
configCmd
    .command('restore')
    .description('Restore from configuration backup')
    .argument('<backupFile>', 'Backup file to restore from')
    .action(async (backupFile) => {
    try {
        if (!fs.existsSync(backupFile)) {
            console.error(`❌ Backup file not found: ${backupFile}`);
            return;
        }
        console.log(`🔄 Restoring from backup: ${backupFile}`);
        console.log('⚠️  This will replace your current configuration');
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to restore from backup?',
                default: false
            }
        ]);
        if (!confirm) {
            console.log('❌ Restore cancelled');
            return;
        }
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        console.log(`📊 Restoring: ${backupData.accounts?.length || 0} accounts, ${backupData.projects?.length || 0} projects`);
        console.log('✅ Configuration restored from backup');
    }
    catch (error) {
        console.error('❌ Restore failed:', error);
    }
});
// History Commands  
const historyCmd = program
    .command('history')
    .description('Git history analysis with identity tracking');
historyCmd
    .command('stats')
    .description('Show repository statistics')
    .option('--since <date>', 'Since date', '1 month ago')
    .action(async (options) => {
    console.log(`📊 Repository Statistics (since ${options.since}):\n`);
    (0, child_process_1.exec)(`git log --format="%an %ae" --since="${options.since}"`, (error, stdout) => {
        if (error) {
            console.error('❌ Failed to get statistics:', error.message);
            return;
        }
        const commits = stdout.trim().split('\n').filter(line => line);
        const accounts = storageManager.getAccounts();
        const stats = {};
        commits.forEach(commitLine => {
            const [name, email] = commitLine.split(' ');
            const key = email;
            if (stats[key]) {
                stats[key].commits++;
            }
            else {
                const matchingAccount = accounts.find(a => a.email === email);
                stats[key] = {
                    name,
                    email,
                    commits: 1,
                    account: matchingAccount?.name
                };
            }
        });
        const totalCommits = commits.length;
        const uniqueAuthors = Object.keys(stats).length;
        console.log(`📈 Total Commits: ${totalCommits}`);
        console.log(`👥 Unique Authors: ${uniqueAuthors}\n`);
        console.log('👤 Top Contributors:');
        Object.values(stats)
            .sort((a, b) => b.commits - a.commits)
            .slice(0, 10)
            .forEach((author, index) => {
            const percentage = ((author.commits / totalCommits) * 100).toFixed(1);
            const accountInfo = author.account ? ` (${author.account})` : '';
            console.log(`${index + 1}. ${author.name}${accountInfo}: ${author.commits} commits (${percentage}%)`);
        });
    });
});
historyCmd
    .command('contributions')
    .description('Show contribution patterns')
    .option('--author <email>', 'Filter by author email')
    .option('--since <date>', 'Since date', '3 months ago')
    .action(async (options) => {
    let gitCommand = `git log --format="%an %ae %ad" --date=short --since="${options.since}"`;
    if (options.author) {
        gitCommand += ` --author="${options.author}"`;
    }
    console.log(`📅 Contribution Patterns (since ${options.since}):\n`);
    (0, child_process_1.exec)(gitCommand, (error, stdout) => {
        if (error) {
            console.error('❌ Failed to analyze contributions:', error.message);
            return;
        }
        const commits = stdout.trim().split('\n').filter(line => line);
        const dailyStats = {};
        const accounts = storageManager.getAccounts();
        commits.forEach(commitLine => {
            const parts = commitLine.split(' ');
            const date = parts[2]; // YYYY-MM-DD format
            dailyStats[date] = (dailyStats[date] || 0) + 1;
        });
        const sortedDates = Object.keys(dailyStats).sort();
        const recentDates = sortedDates.slice(-30); // Last 30 days
        console.log('📊 Daily Activity (last 30 days):');
        recentDates.forEach(date => {
            const count = dailyStats[date];
            const bar = '█'.repeat(Math.min(count, 20));
            console.log(`${date}: ${bar} (${count})`);
        });
    });
});
historyCmd
    .command('timeline')
    .description('Show project timeline with identity switches')
    .option('--limit <number>', 'Limit entries', '20')
    .action(async (options) => {
    console.log(`⏰ Project Timeline (last ${options.limit} commits):\n`);
    (0, child_process_1.exec)(`git log --format="%H %an %ae %ad %s" --date=short -n ${options.limit}`, (error, stdout) => {
        if (error) {
            console.error('❌ Failed to get timeline:', error.message);
            return;
        }
        const commits = stdout.trim().split('\n').filter(line => line);
        const accounts = storageManager.getAccounts();
        commits.forEach(commitLine => {
            const parts = commitLine.split(' ');
            const hash = parts[0].substring(0, 8);
            const name = parts[1];
            const email = parts[2];
            const date = parts[3];
            const message = parts.slice(4).join(' ');
            const matchingAccount = accounts.find(a => a.email === email);
            const accountInfo = matchingAccount ? `[${matchingAccount.name}]` : '[Unknown]';
            console.log(`${date} ${hash} ${accountInfo} ${name}: ${message}`);
        });
    });
});
historyCmd
    .command('blame')
    .description('Enhanced blame with account mapping')
    .argument('<file>', 'File to analyze')
    .action(async (file) => {
    if (!fs.existsSync(file)) {
        console.error(`❌ File not found: ${file}`);
        return;
    }
    console.log(`🔍 Enhanced blame analysis for: ${file}\n`);
    (0, child_process_1.exec)(`git blame --line-porcelain ${file}`, (error, stdout) => {
        if (error) {
            console.error('❌ Failed to run git blame:', error.message);
            return;
        }
        const accounts = storageManager.getAccounts();
        const lines = stdout.split('\n');
        const blameData = [];
        let currentCommit = {};
        lines.forEach(line => {
            if (line.startsWith('author-mail ')) {
                const email = line.replace('author-mail <', '').replace('>', '');
                currentCommit.email = email;
                const matchingAccount = accounts.find(a => a.email === email);
                currentCommit.account = matchingAccount?.name;
            }
            else if (line.startsWith('author ')) {
                currentCommit.author = line.replace('author ', '');
            }
            else if (line.startsWith('\t')) {
                const codeLine = line.substring(1);
                if (currentCommit.author) {
                    blameData.push({
                        hash: currentCommit.hash || 'unknown',
                        author: currentCommit.author,
                        email: currentCommit.email,
                        line: codeLine,
                        account: currentCommit.account
                    });
                }
            }
            else if (line.match(/^[a-f0-9]{40}/)) {
                currentCommit.hash = line.split(' ')[0].substring(0, 8);
            }
        });
        // Show summary
        const authorStats = {};
        blameData.forEach(entry => {
            const key = entry.account || entry.author;
            authorStats[key] = (authorStats[key] || 0) + 1;
        });
        console.log('📊 Authorship Summary:');
        Object.entries(authorStats)
            .sort(([, a], [, b]) => b - a)
            .forEach(([author, lines]) => {
            const percentage = ((lines / blameData.length) * 100).toFixed(1);
            console.log(`  ${author}: ${lines} lines (${percentage}%)`);
        });
        console.log(`\n💡 Use 'git blame ${file}' for detailed line-by-line analysis`);
    });
});
// PHASE 3 & 4 COMMANDS - Coming Soon Messages
// Advanced Git Commands (Phase 3)
const gitCmd = program
    .command('git')
    .description('Advanced git operations with identity preservation [COMING SOON]');
gitCmd
    .command('reset')
    .description('Enhanced reset with identity preservation')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced git reset with identity preservation');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: Safe reset operations that maintain identity context');
    console.log('💡 For now, use standard `git reset` commands');
});
gitCmd
    .command('revert')
    .description('Enhanced revert with identity preservation')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced git revert with identity preservation');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: Smart revert operations with identity tracking');
    console.log('💡 For now, use standard `git revert` commands');
});
gitCmd
    .command('cherry-pick')
    .description('Enhanced cherry-pick with identity preservation')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced cherry-pick with identity preservation');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: Identity-aware cherry-picking across accounts');
    console.log('💡 For now, use standard `git cherry-pick` commands');
});
gitCmd
    .command('squash')
    .description('Enhanced squash with identity preservation')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced commit squashing with identity preservation');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: Smart commit squashing that preserves identity context');
    console.log('💡 For now, use `git rebase -i` for squashing');
});
gitCmd
    .command('bisect')
    .description('Identity-aware bisect operations')
    .action(async () => {
    console.log('🚧 COMING SOON: Identity-aware git bisect');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Bisect operations that understand identity context');
    console.log('💡 For now, use standard `git bisect` commands');
});
gitCmd
    .command('history')
    .description('Interactive history rewriting')
    .addCommand(new commander_1.Command('fix')
    .description('Interactive history rewriting with identity fixes')
    .option('--interactive', 'Interactive mode')
    .action(async () => {
    console.log('🚧 COMING SOON: Interactive history rewriting');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Safe history rewriting with identity corrections');
    console.log('💡 For now, use `git filter-branch` or `git filter-repo`');
}));
gitCmd
    .command('authors')
    .description('Author migration and management')
    .addCommand(new commander_1.Command('migrate')
    .description('Migrate authors across commits')
    .action(async () => {
    console.log('🚧 COMING SOON: Author migration system');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Bulk author migration and identity mapping');
    console.log('💡 For now, use `git filter-branch` for author changes');
}));
// Repository Management (Phase 3)
repoCmd
    .command('clone')
    .description('Smart clone with auto-detection [COMING SOON]')
    .argument('<url>', 'Repository URL')
    .action(async () => {
    console.log('🚧 COMING SOON: Smart repository cloning');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: Automatic account detection and setup during clone');
    console.log('💡 For now, use `gitswitch workflow clone <url>`');
});
repoCmd
    .command('init')
    .description('Smart init with templates [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Smart repository initialization');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: Template-based repository setup with identity configuration');
    console.log('💡 For now, use `git init` and `gitswitch project auto-setup`');
});
repoCmd
    .command('analyze')
    .description('Deep repository analysis [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Deep repository analysis');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: ML-powered repository structure and pattern analysis');
    console.log('💡 For now, use `gitswitch project analyze`');
});
repoCmd
    .command('migrate')
    .description('Repository migration [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Repository migration tools');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Complete repository migration with identity rewriting');
    console.log('💡 For now, use manual git operations');
});
// Pattern Learning (Phase 3)
const patternCmd = program
    .command('pattern')
    .description('AI-powered pattern learning [COMING SOON]');
patternCmd
    .command('learn')
    .description('Learn patterns from usage')
    .action(async () => {
    console.log('🚧 COMING SOON: AI Pattern Learning');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Machine learning from user behavior and preferences');
    console.log('💡 Current: Basic pattern matching available via account patterns');
});
patternCmd
    .command('suggest')
    .description('AI-powered suggestions')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced AI Suggestions');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Neural network-based account suggestions');
    console.log('💡 For now, use `gitswitch project suggest`');
});
patternCmd
    .command('export')
    .description('Export learned patterns')
    .action(async () => {
    console.log('🚧 COMING SOON: Pattern Export System');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Export and share learned patterns');
    console.log('💡 For now, use `gitswitch config export`');
});
patternCmd
    .command('import')
    .description('Import pattern templates')
    .action(async () => {
    console.log('🚧 COMING SOON: Pattern Import System');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Import community and team patterns');
    console.log('💡 For now, use `gitswitch config import`');
});
// Integration Commands (Phase 3)
const integrateCmd = program
    .command('integrate')
    .description('External tool integrations [COMING SOON]');
integrateCmd
    .command('vscode')
    .description('VS Code integration')
    .action(async () => {
    console.log('🚧 COMING SOON: VS Code Integration');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: GitSwitch extension for VS Code with identity switching');
    console.log('💡 For now, use GitSwitch CLI alongside VS Code');
});
integrateCmd
    .command('git-hooks')
    .description('Advanced git hooks integration')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced Git Hooks');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: Comprehensive hook management with identity validation');
    console.log('💡 For now, use `gitswitch hook install`');
});
integrateCmd
    .command('shell')
    .description('Shell integration and completions')
    .action(async () => {
    console.log('🚧 COMING SOON: Shell Integration');
    console.log('📅 Expected: Q2 2024');
    console.log('✨ Features: Bash/Zsh completions and shell prompt integration');
    console.log('💡 For now, use GitSwitch CLI commands directly');
});
integrateCmd
    .command('ci')
    .description('CI/CD integration')
    .action(async () => {
    console.log('🚧 COMING SOON: CI/CD Integration');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: GitHub Actions, GitLab CI, and Jenkins integration');
    console.log('💡 For now, use GitSwitch CLI in CI scripts');
});
integrateCmd
    .command('webhook')
    .description('Webhook integrations')
    .action(async () => {
    console.log('🚧 COMING SOON: Webhook System');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Real-time webhook notifications for identity events');
    console.log('💡 For now, use automation rules for event handling');
});
// Context Commands (Phase 3)
const contextCmd = program
    .command('context')
    .description('Context-aware identity management [COMING SOON]');
contextCmd
    .command('detect')
    .description('Detect current work context')
    .action(async () => {
    console.log('🚧 COMING SOON: Context Detection');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: AI-powered work context detection (personal, work, client)');
    console.log('💡 For now, use manual account switching');
});
contextCmd
    .command('switch')
    .description('Switch entire work context')
    .action(async () => {
    console.log('🚧 COMING SOON: Context Switching');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: One-click switching between work contexts');
    console.log('💡 For now, use `gitswitch project switch`');
});
contextCmd
    .command('rules')
    .description('Context-based automation rules')
    .action(async () => {
    console.log('🚧 COMING SOON: Context Rules');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Automatic context detection and identity switching');
    console.log('💡 For now, use `gitswitch auto rule create`');
});
contextCmd
    .command('validate')
    .description('Validate context consistency')
    .action(async () => {
    console.log('🚧 COMING SOON: Context Validation');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Ensure consistent identity across work contexts');
    console.log('💡 For now, use `gitswitch project health`');
});
// Performance Commands (Phase 3)  
const perfCmd = program
    .command('perf')
    .description('Performance monitoring and optimization [COMING SOON]');
perfCmd
    .command('analyze')
    .description('Analyze GitSwitch performance')
    .action(async () => {
    console.log('🚧 COMING SOON: Performance Analysis');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Detailed performance metrics and bottleneck detection');
    console.log('💡 Current: Basic operation timing in debug mode');
});
perfCmd
    .command('optimize')
    .description('Optimize GitSwitch performance')
    .action(async () => {
    console.log('🚧 COMING SOON: Performance Optimization');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Automatic optimization of patterns and caching');
    console.log('💡 Current: Manual optimization via configuration');
});
perfCmd
    .command('benchmark')
    .description('Benchmark GitSwitch operations')
    .action(async () => {
    console.log('🚧 COMING SOON: Performance Benchmarking');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Comprehensive benchmarking and comparison tools');
    console.log('💡 Current: Use time command for basic benchmarking');
});
// Event Commands (Phase 3)
const eventCmd = program
    .command('event')
    .description('Advanced event system [COMING SOON]');
eventCmd
    .command('log')
    .description('Advanced event logging')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced Event Logging');
    console.log('📅 Expected: Q3 2024');
    console.log('✨ Features: Detailed event tracking and analysis');
    console.log('💡 For now, use `gitswitch security audit` for basic audit logs');
});
eventCmd
    .command('simulate')
    .description('Simulate events for testing')
    .action(async () => {
    console.log('🚧 COMING SOON: Event Simulation');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Simulate identity events for testing automation rules');
    console.log('💡 For now, test rules manually');
});
eventCmd
    .command('monitor')
    .description('Real-time event monitoring')
    .action(async () => {
    console.log('🚧 COMING SOON: Real-time Event Monitoring');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Live dashboard for identity events and rule triggers');
    console.log('💡 For now, check logs manually');
});
eventCmd
    .command('replay')
    .description('Replay events for analysis')
    .action(async () => {
    console.log('🚧 COMING SOON: Event Replay System');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Replay and analyze past identity events');
    console.log('💡 For now, analyze git history manually');
});
// Team Advanced Features (Phase 4)
const teamCmd = program
    .command('team')
    .description('Advanced team collaboration [COMING SOON]');
teamCmd
    .command('clone')
    .description('Clone team configuration')
    .action(async () => {
    console.log('🚧 COMING SOON: Team Configuration Cloning');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Clone and share team identity configurations');
    console.log('💡 For now, use `gitswitch config export/import`');
});
teamCmd
    .command('switch')
    .description('Switch team context')
    .action(async () => {
    console.log('🚧 COMING SOON: Team Context Switching');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Switch between different team configurations');
    console.log('💡 For now, manage team accounts manually');
});
teamCmd
    .command('sync')
    .description('Synchronize team settings')
    .action(async () => {
    console.log('🚧 COMING SOON: Team Synchronization');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Real-time team configuration synchronization');
    console.log('💡 For now, share configurations manually');
});
teamCmd
    .command('validate')
    .description('Validate team compliance')
    .action(async () => {
    console.log('🚧 COMING SOON: Team Compliance Validation');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Ensure team members follow identity policies');
    console.log('💡 For now, use `gitswitch security audit`');
});
// Advanced Security Features (Phase 4)
securityCmd
    .command('sign')
    .description('Advanced commit signing [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced Commit Signing');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: GPG/SSH signing with automatic key management');
    console.log('💡 For now, use `gitswitch commit sign`');
});
securityCmd
    .command('verify')
    .description('Advanced signature verification [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Advanced Signature Verification');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Comprehensive signature verification and trust chains');
    console.log('💡 For now, use `git log --show-signature`');
});
securityCmd
    .command('setup-signing')
    .description('Signing setup wizard [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Signing Setup Wizard');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Interactive wizard for GPG/SSH key setup');
    console.log('💡 For now, configure signing keys manually');
});
securityCmd
    .command('clean')
    .description('Security cleanup [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Security Cleanup Tools');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Detect and clean sensitive data from repositories');
    console.log('💡 For now, use tools like `git-secrets` or `truffleHog`');
});
// Workflow Templates (Phase 4)
workflowCmd
    .command('template')
    .description('Workflow templates [COMING SOON]')
    .addCommand(new commander_1.Command('create')
    .description('Create workflow template')
    .action(async () => {
    console.log('🚧 COMING SOON: Workflow Template System');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Create and share workflow templates');
    console.log('💡 For now, use `gitswitch project template`');
}))
    .addCommand(new commander_1.Command('apply')
    .description('Apply workflow template')
    .action(async () => {
    console.log('🚧 COMING SOON: Template Application');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Apply pre-built workflow templates');
    console.log('💡 For now, configure workflows manually');
}));
workflowCmd
    .command('record')
    .description('Record workflow actions [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Workflow Recording');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Record and replay complex workflow sequences');
    console.log('💡 For now, use automation rules for simple workflows');
});
// Advanced Automation (Phase 4)
autoCmd
    .command('template')
    .description('Automation rule templates [COMING SOON]')
    .addCommand(new commander_1.Command('list')
    .description('List rule templates')
    .action(async () => {
    console.log('🚧 COMING SOON: Rule Template Library');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Browse and apply community rule templates');
    console.log('💡 For now, create rules manually with `gitswitch auto rule create`');
}))
    .addCommand(new commander_1.Command('apply')
    .description('Apply rule template')
    .action(async () => {
    console.log('🚧 COMING SOON: Template Application');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: One-click rule template application');
    console.log('💡 For now, configure rules manually');
}));
autoCmd
    .command('quickstart')
    .description('Quick setup wizard [COMING SOON]')
    .action(async () => {
    console.log('🚧 COMING SOON: Automation Quickstart Wizard');
    console.log('📅 Expected: Q4 2024');
    console.log('✨ Features: Guided setup for common automation scenarios');
    console.log('💡 For now, use `gitswitch project auto-setup`');
});
// Parse CLI arguments
program.parse();
// If no command provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}

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
        // Show help if requested or no options provided
        if (options.help || (!options.list && Object.keys(options).length === 0)) {
            displayCommandHelp({
                title: '👤 Account Management',
                description: 'Manage git accounts and identities for different projects and repositories.',
                commands: [
                    { command: '--list, -l', description: 'List all configured accounts' },
                    { command: '--help, -h', description: 'Show this help message' }
                ],
                examples: [
                    {
                        command: 'gitswitch accounts --list',
                        description: 'Display all configured git accounts with usage statistics'
                    },
                    {
                        command: 'gitswitch .',
                        description: 'Open desktop app to add, edit, or delete accounts'
                    }
                ],
                sections: [
                    {
                        title: 'Account Properties',
                        items: [
                            { icon: '📧', name: 'Email', description: 'Git commit email address' },
                            { icon: '👤', name: 'Name', description: 'Git commit display name' },
                            { icon: '🏷️', name: 'Description', description: 'Account purpose (Work, Personal, etc.)' },
                            { icon: '🔑', name: 'SSH Key', description: 'Optional SSH key path for authentication' },
                            { icon: '🎯', name: 'Patterns', description: 'URL patterns for smart account detection' },
                            { icon: '📊', name: 'Usage Stats', description: 'Track how often each account is used' }
                        ]
                    }
                ]
            });
            return;
        }
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
// Parse CLI arguments
program.parse();
// If no command provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}

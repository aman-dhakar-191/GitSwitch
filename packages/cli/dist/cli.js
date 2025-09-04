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
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const core_1 = require("@gitswitch/core");
const program = new commander_1.Command();
const gitManager = new core_1.GitManager();
const storageManager = new core_1.StorageManager();
const projectManager = new core_1.ProjectManager();
const projectScanner = new core_1.ProjectScanner(gitManager, storageManager);
const smartDetector = new core_1.SmartDetector(storageManager);
const gitHookManager = new core_1.GitHookManager(gitManager, storageManager, smartDetector);
program
    .name('gitswitch')
    .description('Git identity management tool')
    .version('1.0.0');
program
    .command('.')
    .description('Open GitSwitch for the current project')
    .action(async () => {
    const projectPath = process.cwd();
    try {
        // Analyze the current project
        const project = projectManager.analyzeProject(projectPath);
        if (!project) {
            console.error('❌ Current directory is not a git repository');
            process.exit(1);
        }
        console.log(`📁 Opening GitSwitch for project: ${project.name}`);
        console.log(`📍 Path: ${project.path}`);
        if (project.remoteUrl) {
            console.log(`🔗 Remote: ${project.remoteUrl}`);
        }
        // Launch the desktop app with project context
        await launchDesktopApp(project.path);
    }
    catch (error) {
        console.error('❌ Failed to analyze project:', error);
        process.exit(1);
    }
});
program
    .command('status')
    .description('Show current git identity status')
    .action(() => {
    const projectPath = process.cwd();
    try {
        const project = projectManager.analyzeProject(projectPath);
        if (!project) {
            console.error('❌ Current directory is not a git repository');
            process.exit(1);
        }
        const gitConfig = projectManager.getCurrentGitConfig(projectPath);
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
    catch (error) {
        console.error('❌ Failed to get status:', error);
        process.exit(1);
    }
});
program
    .command('list')
    .description('List all managed projects')
    .option('-f, --filter <pattern>', 'filter projects by name or path')
    .option('-s, --status <status>', 'filter by status (active|inactive|archived)')
    .action(async (options) => {
    try {
        const projects = storageManager.getProjects();
        let filteredProjects = projects;
        // Apply filters
        if (options.filter) {
            const filter = options.filter.toLowerCase();
            filteredProjects = projects.filter(p => p.name.toLowerCase().includes(filter) ||
                p.path.toLowerCase().includes(filter));
        }
        if (options.status) {
            filteredProjects = filteredProjects.filter(p => p.status === options.status);
        }
        if (filteredProjects.length === 0) {
            console.log('📋 No projects found matching criteria');
            return;
        }
        console.log(`📋 Found ${filteredProjects.length} project(s):\n`);
        for (const project of filteredProjects) {
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
            console.log(`   Last accessed: ${project.lastAccessed.toLocaleDateString()}`);
            console.log('');
        }
    }
    catch (error) {
        console.error('❌ Failed to list projects:', error);
        process.exit(1);
    }
});
program
    .command('scan')
    .description('Scan for git projects in a directory')
    .argument('[path]', 'path to scan (defaults to current directory)', '.')
    .option('-d, --depth <number>', 'maximum scan depth', '3')
    .option('-i, --import', 'automatically import found projects')
    .action(async (scanPath, options) => {
    try {
        console.log(`🔍 Scanning ${path.resolve(scanPath)} for git projects...`);
        const depth = parseInt(options.depth);
        const result = await projectScanner.scanDirectory(path.resolve(scanPath), depth);
        console.log(`✅ Scan completed in ${result.duration}ms`);
        console.log(`📁 Found ${result.totalFound} git project(s)`);
        if (result.errors.length > 0) {
            console.log(`⚠️  ${result.errors.length} error(s) encountered`);
        }
        if (result.projects.length === 0) {
            console.log('📋 No git projects found in the specified directory');
            return;
        }
        console.log('\nFound projects:');
        for (const project of result.projects) {
            console.log(`  📁 ${project.name}`);
            console.log(`     Path: ${project.path}`);
            if (project.remoteUrl) {
                console.log(`     Remote: ${project.remoteUrl}`);
            }
            if (project.organization) {
                console.log(`     Organization: ${project.organization}`);
            }
            console.log('');
        }
        if (options.import) {
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
        else {
            console.log('\n💡 Use --import flag to automatically add these projects to GitSwitch');
        }
    }
    catch (error) {
        console.error('❌ Failed to scan directory:', error);
        process.exit(1);
    }
});
program
    .command('accounts')
    .description('Manage git accounts')
    .option('-l, --list', 'list all accounts')
    .action(async (options) => {
    try {
        const accounts = storageManager.getAccounts();
        if (accounts.length === 0) {
            console.log('📋 No accounts configured yet');
            console.log('💡 Use the desktop app to add your first account: gitswitch .');
            return;
        }
        console.log(`👤 Found ${accounts.length} account(s):\n`);
        for (const account of accounts) {
            console.log(`👤 ${account.name}${account.isDefault ? ' (default)' : ''}`);
            console.log(`   Email: ${account.email}`);
            console.log(`   Git Name: ${account.gitName}`);
            if (account.description) {
                console.log(`   Description: ${account.description}`);
            }
            console.log(`   Usage: ${account.usageCount} times`);
            console.log(`   Last used: ${account.lastUsed ? account.lastUsed.toLocaleDateString() : 'Never'}`);
            console.log('');
        }
    }
    catch (error) {
        console.error('❌ Failed to manage accounts:', error);
        process.exit(1);
    }
});
program
    .command('import')
    .description('Import projects from common development tools')
    .option('--common', 'scan common development directories (default)')
    .action(async (options) => {
    try {
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
    catch (error) {
        console.error('❌ Failed to import projects:', error);
        process.exit(1);
    }
});
program
    .command('hooks')
    .description('Manage git hooks for identity validation')
    .argument('[path]', 'project path (defaults to current directory)', '.')
    .option('-i, --install', 'install git hooks')
    .option('-r, --remove', 'remove git hooks')
    .option('-s, --status', 'show hook status')
    .option('--validation <level>', 'validation level: strict, warning, off', 'strict')
    .option('--auto-fix', 'enable automatic identity fixing')
    .action(async (projectPath, options) => {
    try {
        const resolvedPath = path.resolve(projectPath);
        if (!gitManager.isGitRepository(resolvedPath)) {
            console.error('❌ Not a git repository:', resolvedPath);
            process.exit(1);
        }
        const projectName = path.basename(resolvedPath);
        if (options.status) {
            // Show hook status
            const installed = gitHookManager.areHooksInstalled(resolvedPath);
            const config = gitHookManager.getHookConfig(resolvedPath);
            console.log(`📁 Project: ${projectName}`);
            console.log(`📍 Path: ${resolvedPath}`);
            console.log(`🔗 Hooks installed: ${installed ? '✅ Yes' : '❌ No'}`);
            if (config) {
                console.log(`⚙️  Configuration:`);
                console.log(`   Validation level: ${config.validationLevel}`);
                console.log(`   Auto-fix: ${config.autoFix ? 'enabled' : 'disabled'}`);
                console.log(`   Pre-commit: ${config.preCommitEnabled ? 'enabled' : 'disabled'}`);
            }
            return;
        }
        if (options.install) {
            // Install hooks
            const config = {
                validationLevel: options.validation,
                autoFix: Boolean(options.autoFix),
                preCommitEnabled: true
            };
            console.log(`🔧 Installing git hooks for ${projectName}...`);
            console.log(`   Validation: ${config.validationLevel}`);
            console.log(`   Auto-fix: ${config.autoFix ? 'enabled' : 'disabled'}`);
            const success = gitHookManager.installHooks(resolvedPath, config);
            if (success) {
                console.log('✅ Git hooks installed successfully!');
                console.log('💡 Hooks will now validate git identity before each commit');
            }
            else {
                console.error('❌ Failed to install git hooks');
                process.exit(1);
            }
            return;
        }
        if (options.remove) {
            // Remove hooks
            console.log(`🗑️  Removing git hooks from ${projectName}...`);
            const success = gitHookManager.removeHooks(resolvedPath);
            if (success) {
                console.log('✅ Git hooks removed successfully!');
            }
            else {
                console.error('❌ Failed to remove git hooks');
                process.exit(1);
            }
            return;
        }
        // Default: show status
        const installed = gitHookManager.areHooksInstalled(resolvedPath);
        console.log(`📁 Project: ${projectName}`);
        console.log(`🔗 Hooks: ${installed ? '✅ Installed' : '❌ Not installed'}`);
        console.log('\n💡 Use --install to install hooks or --help for more options');
    }
    catch (error) {
        console.error('❌ Failed to manage git hooks:', error);
        process.exit(1);
    }
});
program
    .command('validate-commit')
    .description('Validate git identity for commit (used by pre-commit hook)')
    .argument('<path>', 'project path to validate')
    .action(async (projectPath) => {
    try {
        const resolvedPath = path.resolve(projectPath);
        const result = gitHookManager.validateCommit(resolvedPath);
        console.log(result.message);
        if (!result.valid) {
            // Try auto-fix if suggested account is available
            if (result.suggestedAccount) {
                const hookConfig = gitHookManager.getHookConfig(resolvedPath);
                if (hookConfig?.autoFix) {
                    console.log('\n🔧 Attempting auto-fix...');
                    const fixed = gitHookManager.autoFixIdentity(resolvedPath, result.suggestedAccount);
                    if (fixed) {
                        console.log('✅ Identity auto-fixed successfully!');
                        process.exit(0);
                    }
                    else {
                        console.log('❌ Auto-fix failed');
                    }
                }
            }
            process.exit(1);
        }
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Validation error:', error);
        process.exit(1);
    }
});
/**
 * Launch the desktop application with the specified project path
 */
async function launchDesktopApp(projectPath) {
    return new Promise((resolve, reject) => {
        console.log('🚀 Launching GitSwitch desktop app...');
        console.log('📝 This will open the desktop interface for managing git identities');
        try {
            // Get the path to the desktop app main file
            const desktopAppPath = path.resolve(__dirname, '../../desktop/dist/main.js');
            // Check if the desktop app exists
            if (!fs.existsSync(desktopAppPath)) {
                throw new Error('Desktop app not found. Please run: npm run build');
            }
            // Use a simple approach - change to desktop directory and run npx electron
            const { exec } = require('child_process');
            const desktopDir = path.resolve(__dirname, '../../desktop');
            const command = `cd "${desktopDir}" && npx electron dist/main.js --project "${projectPath}"`;
            // Launch the desktop app asynchronously
            const child = exec(command, (error, stdout, stderr) => {
                if (error && !error.killed) {
                    console.error('Error output:', stderr);
                }
            });
            // Detach the child process so it runs independently
            if (child) {
                child.unref();
            }
            setTimeout(() => {
                console.log('✅ Desktop app launched successfully');
                resolve();
            }, 2000);
        }
        catch (error) {
            console.error('❌ Failed to launch desktop app:', error.message);
            console.log('💡 Try running: npm run build:desktop-main');
            reject(error);
        }
    });
}
// Parse CLI arguments
program.parse();
// If no command provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}

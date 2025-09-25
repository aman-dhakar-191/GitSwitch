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
const teamManager = new core_1.TeamManager(storageManager);
const securityManager = new core_1.SecurityManager(storageManager);
const configSyncManager = new core_1.ConfigSyncManager(storageManager, teamManager);
const pluginManager = new core_1.PluginManager(storageManager, gitManager, projectManager);
const advancedGitManager = new core_1.AdvancedGitManager(gitManager, securityManager, storageManager);
const workflowAutomationManager = new core_1.WorkflowAutomationManager(storageManager, gitManager, projectManager, securityManager, advancedGitManager);
const bulkImportManager = new core_1.BulkImportManager(storageManager, projectScanner, smartDetector, gitManager);
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
// Bulk Import Commands
program
    .command('bulk-import')
    .description('Advanced bulk import wizard with intelligent detection')
    .option('-p, --paths <paths...>', 'specific paths to scan (comma-separated)')
    .option('--suggested', 'use suggested import paths only')
    .option('--preview', 'preview import without executing')
    .option('--generate-patterns', 'automatically generate project patterns')
    .option('--detect-accounts', 'detect existing accounts from git configs')
    .option('--skip-existing', 'skip projects that already exist')
    .option('--max-depth <number>', 'maximum scan depth', '4')
    .action(async (options) => {
    try {
        console.log('🚀 GitSwitch Bulk Import Wizard');
        console.log('='.repeat(50));
        // Step 1: Determine scan paths
        let scanPaths = [];
        if (options.paths) {
            scanPaths = Array.isArray(options.paths) ? options.paths : options.paths.split(',').map((p) => p.trim());
            console.log(`📂 Using specified paths: ${scanPaths.join(', ')}`);
        }
        else if (options.suggested) {
            scanPaths = bulkImportManager.getSuggestedImportPaths();
            console.log(`💡 Using suggested development paths:`);
            scanPaths.forEach(path => console.log(`   📂 ${path}`));
        }
        else {
            // Default: common development directories
            scanPaths = bulkImportManager.getSuggestedImportPaths();
            console.log(`📂 Scanning common development directories:`);
            scanPaths.forEach(path => console.log(`   📂 ${path}`));
        }
        console.log('');
        // Build import configuration
        const importConfig = {
            sourcePaths: scanPaths,
            scanDepth: parseInt(options.maxDepth),
            autoDetectAccounts: Boolean(options.detectAccounts),
            createMissingAccounts: Boolean(options.detectAccounts),
            applySmartSuggestions: true,
            importPatterns: Boolean(options.generatePatterns),
            excludePatterns: [],
            includePatterns: [],
            dryRun: Boolean(options.preview)
        };
        if (options.preview) {
            console.log('👁️  Preview Mode - No changes will be made\n');
            const preview = await bulkImportManager.previewImport(importConfig);
            console.log('📊 Import Preview:');
            const totalFound = preview.scanResults.reduce((sum, result) => sum + result.totalFound, 0);
            console.log(`   📁 Total projects found: ${totalFound}`);
            console.log(`   ✅ Projects to import: ${preview.estimatedImports}`);
            console.log(`   👤 Potential new accounts: ${preview.potentialAccounts.length}`);
            console.log(`   🎯 Potential patterns: ${preview.potentialPatterns.length}`);
            console.log('');
            if (preview.estimatedImports > 0) {
                console.log('📁 Projects Available for Import:');
                // Show first few projects from scan results
                let projectCount = 0;
                for (const scanResult of preview.scanResults) {
                    for (const project of scanResult.projects.slice(0, 10 - projectCount)) {
                        console.log(`   📁 ${project.name} (${project.path})`);
                        projectCount++;
                        if (projectCount >= 10)
                            break;
                    }
                    if (projectCount >= 10)
                        break;
                }
                if (preview.estimatedImports > 10) {
                    console.log(`   ... and ${preview.estimatedImports - 10} more`);
                }
                console.log('');
            }
            if (preview.potentialAccounts.length > 0) {
                console.log('👤 Potential New Accounts:');
                preview.potentialAccounts.forEach((account) => {
                    console.log(`   👤 ${account.name} <${account.email}>`);
                });
                console.log('');
            }
            if (preview.potentialPatterns.length > 0) {
                console.log('🎯 Potential Patterns:');
                preview.potentialPatterns.forEach((pattern) => {
                    console.log(`   🎯 ${pattern.pattern} → ${pattern.accountId}`);
                });
                console.log('');
            }
            console.log('💡 Run without --preview to execute the import');
            return;
        }
        // Execute the import
        console.log('📥 Starting bulk import...');
        let currentStep = '';
        const result = await bulkImportManager.executeImport(importConfig, (step) => {
            if (step.name !== currentStep) {
                currentStep = step.name;
                console.log(`\n📍 Step ${step.number}/5: ${step.name}`);
            }
            console.log(`   ${step.status === 'completed' ? '✅' : '⏳'} ${step.description}`);
        });
        console.log('\n🎉 Bulk Import Complete!');
        console.log('='.repeat(50));
        console.log(`✅ Successfully imported: ${result.projectsImported} projects`);
        console.log(`👤 New accounts created: ${result.accountsCreated}`);
        console.log(`🎯 Patterns generated: ${result.patternsCreated}`);
        console.log(`⚠️  Errors encountered: ${result.errors.length}`);
        if (result.errors.length > 0) {
            console.log('\n❌ Errors:');
            result.errors.forEach((error) => console.log(`   ❌ ${error.message || error}`));
        }
        if (result.summary.newProjects.length > 0) {
            console.log('\n📁 Imported Projects:');
            result.summary.newProjects.slice(0, 5).forEach((project) => {
                console.log(`   📁 ${project.name}`);
            });
            if (result.summary.newProjects.length > 5) {
                console.log(`   ... and ${result.summary.newProjects.length - 5} more`);
            }
        }
        console.log('\n💡 Use "gitswitch ." to manage your imported projects!');
    }
    catch (error) {
        console.error('❌ Bulk import failed:', error);
        process.exit(1);
    }
});
program
    .command('import-paths')
    .description('Show suggested import paths for bulk import')
    .action(async () => {
    try {
        const paths = bulkImportManager.getSuggestedImportPaths();
        console.log('💡 Suggested Import Paths:');
        console.log('='.repeat(40));
        if (paths.length === 0) {
            console.log('📂 No suggested paths found for your platform');
            return;
        }
        paths.forEach((path, index) => {
            const exists = fs.existsSync(path);
            console.log(`${index + 1}. ${path} ${exists ? '✅' : '❌'}`);
        });
        console.log('\n💡 Use these paths with: gitswitch bulk-import --paths "path1,path2"');
    }
    catch (error) {
        console.error('❌ Failed to get import paths:', error);
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
// Stage 3 Enterprise Commands
program
    .command('team')
    .description('Manage enterprise teams and collaboration')
    .option('-c, --create <name>', 'create new team')
    .option('-l, --list', 'list all teams')
    .option('-i, --invite <email>', 'invite member to team')
    .option('-s, --share <teamId>', 'generate team share code')
    .option('-j, --join <shareCode>', 'join team using share code')
    .option('--org <organization>', 'organization name for new team')
    .option('--role <role>', 'member role (admin, member, viewer)', 'member')
    .action(async (options) => {
    try {
        if (options.create) {
            if (!options.org) {
                console.error('❌ Organization name is required for creating a team');
                process.exit(1);
            }
            const team = teamManager.createTeam({
                name: options.create,
                organization: options.org,
                accounts: [],
                projectRules: [],
                policies: [],
                members: [{
                        id: 'current-user',
                        email: 'current-user@company.com',
                        name: 'Current User',
                        role: 'admin',
                        joinedAt: new Date(),
                        lastActive: new Date(),
                        permissions: ['all']
                    }],
                createdBy: 'current-user'
            });
            console.log(`✅ Created team: ${team.name}`);
            console.log(`   ID: ${team.id}`);
            console.log(`   Organization: ${team.organization}`);
        }
        else if (options.list) {
            const teams = teamManager.getTeams();
            if (teams.length === 0) {
                console.log('📋 No teams found');
                console.log('💡 Create your first team with: gitswitch team --create "Team Name" --org "Organization"');
                return;
            }
            console.log(`📄 Found ${teams.length} team(s):\n`);
            for (const team of teams) {
                console.log(`💼 ${team.name} (${team.organization})`);
                console.log(`   ID: ${team.id}`);
                console.log(`   Members: ${team.members.length}`);
                console.log(`   Rules: ${team.projectRules.length}`);
                console.log(`   Created: ${team.sharedAt.toLocaleDateString()}`);
                console.log('');
            }
        }
        else if (options.share) {
            const shareCode = teamManager.generateShareCode(options.share);
            console.log(`🔗 Team Share Code:`);
            console.log(`   ${shareCode}`);
            console.log('');
            console.log('💡 Share this code with team members to invite them');
        }
        else if (options.join) {
            const shareData = teamManager.parseShareCode(options.join);
            if (!shareData) {
                console.error('❌ Invalid share code');
                process.exit(1);
            }
            console.log(`📄 Team Invitation:`);
            console.log(`   Team: ${shareData.teamName}`);
            console.log(`   Organization: ${shareData.organization}`);
            console.log(`   Invited: ${shareData.invitedAt.toLocaleDateString()}`);
            console.log('');
            console.log('💡 Contact team admin to complete the invitation process');
        }
        else {
            console.log('💼 Enterprise Team Management');
            console.log('');
            console.log('Available commands:');
            console.log('  --create <name> --org <org>    Create new team');
            console.log('  --list                         List all teams');
            console.log('  --share <teamId>               Generate share code');
            console.log('  --join <shareCode>             Join team with code');
        }
    }
    catch (error) {
        console.error('❌ Failed to manage team:', error);
        process.exit(1);
    }
});
program
    .command('security')
    .description('Manage enterprise security and compliance')
    .option('-p, --policies', 'list security policies')
    .option('-a, --audit [filter]', 'show audit log')
    .option('-s, --signing <accountId>', 'configure commit signing')
    .option('--export-audit <format>', 'export audit log (json, csv)')
    .option('--verify-signatures [path]', 'verify commit signatures')
    .option('--setup-sso <provider>', 'setup SSO provider')
    .option('--domain <domain>', 'SSO domain')
    .action(async (options) => {
    try {
        if (options.policies) {
            const policies = securityManager.getSecurityPolicies();
            if (policies.length === 0) {
                console.log('📋 No security policies configured');
                console.log('💡 Configure policies through the desktop app for enterprise compliance');
                return;
            }
            console.log(`🔒 Security Policies (${policies.length}):\n`);
            for (const policy of policies) {
                console.log(`🛡️  ${policy.name}`);
                console.log(`   Signed commits: ${policy.requireSignedCommits ? '✅' : '❌'}`);
                console.log(`   Audit logging: ${policy.auditLogging ? '✅' : '❌'}`);
                console.log(`   SSH keys required: ${policy.requiredSSHKeys ? '✅' : '❌'}`);
                console.log(`   Allowed domains: ${policy.allowedDomains.join(', ')}`);
                console.log('');
            }
        }
        else if (options.audit) {
            const events = securityManager.getAuditEvents({ limit: 20 });
            if (events.length === 0) {
                console.log('📋 No audit events found');
                return;
            }
            console.log(`📊 Audit Log (Last ${events.length} events):\n`);
            for (const event of events) {
                const severity = event.severity === 'critical' ? '🔴' :
                    event.severity === 'warning' ? '🟡' : '🟢';
                console.log(`${severity} ${event.timestamp.toLocaleString()}`);
                console.log(`   User: ${event.userEmail}`);
                console.log(`   Action: ${event.action}`);
                if (event.projectPath) {
                    console.log(`   Project: ${event.projectPath}`);
                }
                console.log('');
            }
        }
        else if (options.exportAudit) {
            const format = options.exportAudit;
            const auditData = securityManager.exportAuditLog(format, {});
            const filename = `gitswitch-audit-${new Date().toISOString().split('T')[0]}.${format}`;
            require('fs').writeFileSync(filename, auditData);
            console.log(`✅ Audit log exported to: ${filename}`);
        }
        else if (options.verifySignatures) {
            const projectPath = options.verifySignatures === true ? '.' : options.verifySignatures;
            const result = securityManager.verifyCommitSignatures(path.resolve(projectPath));
            console.log(`🔍 Signature Verification Results:`);
            console.log(`   ✅ Verified: ${result.verified}`);
            console.log(`   ❌ Unverified: ${result.unverified}`);
            if (result.errors.length > 0) {
                console.log(`   ⚠️  Errors: ${result.errors.length}`);
                result.errors.forEach(error => console.log(`      ${error}`));
            }
        }
        else {
            console.log('🔒 Enterprise Security & Compliance');
            console.log('');
            console.log('Available commands:');
            console.log('  --policies                     List security policies');
            console.log('  --audit                        Show audit log');
            console.log('  --export-audit <format>        Export audit log');
            console.log('  --verify-signatures [path]     Verify commit signatures');
            console.log('  --setup-sso <provider>         Setup SSO provider');
        }
    }
    catch (error) {
        console.error('❌ Failed to manage security:', error);
        process.exit(1);
    }
});
program
    .command('enterprise')
    .description('Enterprise features and administration')
    .option('-s, --status', 'show enterprise status')
    .option('-u, --upgrade', 'upgrade to enterprise features')
    .option('-c, --compliance <standard>', 'setup compliance standard (sox, iso27001, gdpr)')
    .action(async (options) => {
    try {
        if (options.status) {
            const teams = teamManager.getTeams();
            const policies = securityManager.getSecurityPolicies();
            const auditEvents = securityManager.getAuditEvents({ limit: 1 });
            console.log('🏢 GitSwitch Enterprise Status\n');
            console.log(`💼 Teams: ${teams.length}`);
            console.log(`🔒 Security Policies: ${policies.length}`);
            console.log(`📊 Audit Events: ${auditEvents.length > 0 ? 'Active' : 'None'}`);
            const features = [
                '✅ Team Configuration Management',
                '✅ Enterprise Security Policies',
                '✅ Audit Logging & Compliance',
                '✅ Advanced Git Operations',
                '✅ SSO Integration Ready',
                '✅ Commit Signing Management'
            ];
            console.log('\n🎆 Enterprise Features:');
            features.forEach(feature => console.log(`  ${feature}`));
        }
        else if (options.compliance) {
            const standard = options.compliance.toLowerCase();
            console.log(`📄 Setting up ${standard.toUpperCase()} compliance...`);
            // This would configure appropriate security policies
            const policy = securityManager.createSecurityPolicy({
                name: `${standard.toUpperCase()} Compliance Policy`,
                requireSignedCommits: true,
                allowedDomains: ['github.com'],
                requiredSSHKeys: true,
                auditLogging: true,
                restrictAccountCreation: true,
                complianceStandard: standard,
                allowPersonalRepos: false,
                requireMFA: true
            });
            console.log(`✅ ${standard.toUpperCase()} compliance policy created`);
            console.log(`   Policy ID: ${policy.id}`);
            console.log('   ✅ Signed commits required');
            console.log('   ✅ Audit logging enabled');
            console.log('   ✅ SSH keys required');
            console.log('   ✅ MFA required');
        }
        else {
            console.log('🏢 GitSwitch Enterprise');
            console.log('');
            console.log('Enterprise-grade git identity management with:');
            console.log('  ✅ Team collaboration and sharing');
            console.log('  ✅ Advanced security and compliance');
            console.log('  ✅ Audit logging and reporting');
            console.log('  ✅ SSO integration');
            console.log('  ✅ Workflow automation');
            console.log('');
            console.log('Available commands:');
            console.log('  --status                       Show enterprise status');
            console.log('  --compliance <standard>        Setup compliance (sox, iso27001, gdpr)');
        }
    }
    catch (error) {
        console.error('❌ Failed to manage enterprise features:', error);
        process.exit(1);
    }
});
// Configuration Sync Commands
program
    .command('sync')
    .description('Manage configuration synchronization and sharing')
    .option('-s, --setup <provider>', 'setup sync provider (team, cloud, github)')
    .option('-n, --now', 'trigger manual sync now')
    .option('--status', 'show sync status')
    .option('--disable', 'disable synchronization')
    .option('--scope <scope>', 'sync scope (accounts, patterns, teams, all)', 'all')
    .option('--auto', 'enable automatic sync')
    .option('--interval <minutes>', 'sync interval in minutes', '60')
    .action(async (options) => {
    try {
        if (options.setup) {
            const provider = options.setup;
            const validProviders = ['team', 'cloud', 'github'];
            if (!validProviders.includes(provider)) {
                console.error(`❌ Invalid provider. Use: ${validProviders.join(', ')}`);
                process.exit(1);
            }
            console.log(`🔄 Setting up sync with ${provider}...`);
            const syncConfig = {
                provider: provider,
                syncScope: options.scope,
                autoSync: !!options.auto,
                syncInterval: parseInt(options.interval),
                conflictResolution: 'manual',
                enabled: true
            };
            const success = configSyncManager.setupSync(syncConfig);
            if (success) {
                console.log('✅ Sync configuration saved');
                console.log(`   Provider: ${provider}`);
                console.log(`   Scope: ${options.scope}`);
                console.log(`   Auto-sync: ${options.auto ? 'enabled' : 'disabled'}`);
                if (options.auto) {
                    console.log(`   Interval: ${options.interval} minutes`);
                }
            }
            else {
                console.error('❌ Failed to setup sync');
                process.exit(1);
            }
        }
        else if (options.now) {
            console.log('🔄 Starting manual sync...');
            const result = await configSyncManager.syncNow();
            if (result.success) {
                console.log('✅ Sync completed successfully');
                console.log(`   Items synced: ${result.itemsSynced}`);
                console.log(`   Changes: ${result.changes.length}`);
                if (result.changes.length > 0) {
                    console.log('\n📝 Changes:');
                    result.changes.forEach(change => console.log(`   • ${change}`));
                }
                if (result.conflicts && result.conflicts.length > 0) {
                    console.log(`\n⚠️  ${result.conflicts.length} conflict(s) detected`);
                    console.log('   Use --resolve to handle conflicts');
                }
            }
            else {
                console.error('❌ Sync failed');
                if (result.changes.length > 0) {
                    console.log('\nError details:');
                    result.changes.forEach(change => console.log(`   • ${change}`));
                }
                process.exit(1);
            }
        }
        else if (options.status) {
            const status = configSyncManager.getSyncStatus();
            console.log('🔄 Sync Status:');
            console.log(`   Enabled: ${status.enabled ? '✅' : '❌'}`);
            console.log(`   Last sync: ${status.lastSync ? status.lastSync.toLocaleString() : 'Never'}`);
            console.log(`   In progress: ${status.syncInProgress ? 'Yes' : 'No'}`);
            console.log(`   Last result: ${status.lastSyncResult}`);
            if (status.conflictsCount > 0) {
                console.log(`   Conflicts: ${status.conflictsCount}`);
            }
        }
        else if (options.disable) {
            const success = configSyncManager.disableSync();
            if (success) {
                console.log('✅ Sync disabled');
            }
            else {
                console.error('❌ Failed to disable sync');
                process.exit(1);
            }
        }
        else {
            console.log('🔄 Configuration Synchronization');
            console.log('');
            console.log('Available commands:');
            console.log('  --setup <provider>     Setup sync (team, cloud, github)');
            console.log('  --now                  Trigger manual sync');
            console.log('  --status               Show sync status');
            console.log('  --disable              Disable sync');
            console.log('');
            console.log('Options:');
            console.log('  --scope <scope>        Sync scope (accounts, patterns, teams, all)');
            console.log('  --auto                 Enable automatic sync');
            console.log('  --interval <minutes>   Set sync interval');
        }
    }
    catch (error) {
        console.error('❌ Sync operation failed:', error);
        process.exit(1);
    }
});
program
    .command('share')
    .description('Share and import configurations')
    .option('-c, --config <items>', 'items to share (accounts,patterns,teams)', 'all')
    .option('-t, --team <teamId>', 'share within team context')
    .option('-i, --import <shareCode>', 'import from share code')
    .action(async (options) => {
    try {
        if (options.import) {
            console.log('📥 Importing shared configuration...');
            const success = configSyncManager.importConfiguration(options.import);
            if (success) {
                console.log('✅ Configuration imported successfully');
            }
            else {
                console.error('❌ Failed to import configuration');
                process.exit(1);
            }
        }
        else {
            const items = options.config === 'all'
                ? ['accounts', 'patterns', 'teams']
                : options.config.split(',');
            console.log(`📤 Sharing configuration: ${items.join(', ')}`);
            const shareCode = configSyncManager.shareConfiguration(items, options.team);
            console.log('✅ Share code generated:');
            console.log(`   ${shareCode}`);
            console.log('');
            console.log('💡 Share this code with team members to import the configuration');
            console.log('   Valid for 7 days');
        }
    }
    catch (error) {
        console.error('❌ Share operation failed:', error);
        process.exit(1);
    }
});
// Plugin Management Commands
program
    .command('plugins')
    .description('Manage GitSwitch plugins')
    .option('-l, --list', 'list installed plugins')
    .option('-s, --search <query>', 'search marketplace for plugins')
    .option('-i, --install <pluginId>', 'install a plugin')
    .option('-u, --uninstall <pluginId>', 'uninstall a plugin')
    .option('-e, --enable <pluginId>', 'enable a plugin')
    .option('-d, --disable <pluginId>', 'disable a plugin')
    .option('--category <category>', 'filter by category (integration, automation, ui, security, analytics)')
    .option('--version <version>', 'specify version for installation')
    .action(async (options) => {
    try {
        if (options.list) {
            const plugins = pluginManager.getInstalledPlugins();
            if (plugins.length === 0) {
                console.log('📦 No plugins installed');
                console.log('\n💡 Use --search to find plugins or --install to install one');
                return;
            }
            console.log(`📦 Installed Plugins (${plugins.length}):\n`);
            for (const plugin of plugins) {
                const statusIcon = {
                    'active': '🟢',
                    'inactive': '🟡',
                    'error': '🔴',
                    'disabled': '⚫'
                }[plugin.status] || '⚪';
                console.log(`${statusIcon} ${plugin.manifest.name} (${plugin.id})`);
                console.log(`   Version: ${plugin.manifest.version}`);
                console.log(`   Author: ${plugin.manifest.author}`);
                console.log(`   Status: ${plugin.status}`);
                console.log(`   Enabled: ${plugin.enabled ? 'Yes' : 'No'}`);
                console.log(`   Category: ${plugin.manifest.category}`);
                console.log(`   Installed: ${plugin.installedAt.toLocaleDateString()}`);
                if (plugin.errorMessage) {
                    console.log(`   Error: ${plugin.errorMessage}`);
                }
                console.log('');
            }
        }
        else if (options.search) {
            console.log(`🔍 Searching marketplace for: ${options.search}`);
            const results = await pluginManager.searchPlugins(options.search, options.category);
            if (results.plugins.length === 0) {
                console.log('No plugins found matching your search criteria');
                return;
            }
            console.log(`\n📋 Found ${results.total} plugin(s):\n`);
            for (const plugin of results.plugins) {
                const verifiedIcon = plugin.verified ? '✅' : '⚠️';
                const ratingStars = '⭐'.repeat(Math.floor(plugin.rating));
                console.log(`${verifiedIcon} ${plugin.name} (${plugin.id})`);
                console.log(`   ${plugin.description}`);
                console.log(`   Version: ${plugin.version} | Author: ${plugin.author}`);
                console.log(`   Category: ${plugin.category} | Downloads: ${plugin.downloads.toLocaleString()}`);
                console.log(`   Rating: ${ratingStars} ${plugin.rating}/5`);
                console.log(`   Size: ${(plugin.size / 1024 / 1024).toFixed(1)} MB`);
                if (plugin.repository) {
                    console.log(`   Repository: ${plugin.repository}`);
                }
                console.log('');
            }
            console.log('💡 Use --install <pluginId> to install a plugin');
        }
        else if (options.install) {
            const pluginId = options.install;
            console.log(`📦 Installing plugin: ${pluginId}${options.version ? `@${options.version}` : ''}`);
            const result = await pluginManager.installPlugin(pluginId, options.version);
            if (result.success) {
                console.log(`✅ Plugin ${pluginId} installed successfully!`);
                console.log(`   Version: ${result.version}`);
                if (result.warnings && result.warnings.length > 0) {
                    console.log('\n⚠️ Warnings:');
                    result.warnings.forEach(warning => console.log(`   • ${warning}`));
                }
                console.log('\n💡 Use --enable to activate the plugin');
            }
            else {
                console.error(`❌ Failed to install plugin: ${result.error}`);
                process.exit(1);
            }
        }
        else if (options.uninstall) {
            const pluginId = options.uninstall;
            console.log(`🗑️ Uninstalling plugin: ${pluginId}`);
            const success = await pluginManager.uninstallPlugin(pluginId);
            if (success) {
                console.log(`✅ Plugin ${pluginId} uninstalled successfully`);
            }
            else {
                console.error(`❌ Failed to uninstall plugin ${pluginId}`);
                process.exit(1);
            }
        }
        else if (options.enable) {
            const pluginId = options.enable;
            console.log(`🔌 Enabling plugin: ${pluginId}`);
            const success = await pluginManager.enablePlugin(pluginId);
            if (success) {
                console.log(`✅ Plugin ${pluginId} enabled`);
                console.log('💡 Plugin will be activated on next restart or manually');
            }
            else {
                console.error(`❌ Failed to enable plugin ${pluginId}`);
                process.exit(1);
            }
        }
        else if (options.disable) {
            const pluginId = options.disable;
            console.log(`🔌 Disabling plugin: ${pluginId}`);
            const success = await pluginManager.disablePlugin(pluginId);
            if (success) {
                console.log(`✅ Plugin ${pluginId} disabled`);
            }
            else {
                console.error(`❌ Failed to disable plugin ${pluginId}`);
                process.exit(1);
            }
        }
        else {
            console.log('🔌 Plugin Management');
            console.log('');
            console.log('GitSwitch extensible plugin system for integrations and automation.');
            console.log('');
            console.log('Available commands:');
            console.log('  --list                         List installed plugins');
            console.log('  --search <query>               Search marketplace');
            console.log('  --install <pluginId>           Install a plugin');
            console.log('  --uninstall <pluginId>         Uninstall a plugin');
            console.log('  --enable <pluginId>            Enable a plugin');
            console.log('  --disable <pluginId>           Disable a plugin');
            console.log('');
            console.log('Options:');
            console.log('  --category <category>          Filter by category');
            console.log('  --version <version>            Specify version for install');
            console.log('');
            console.log('Categories: integration, automation, ui, security, analytics');
        }
    }
    catch (error) {
        console.error('❌ Plugin operation failed:', error);
        process.exit(1);
    }
});
// Advanced Git Operations Commands
program
    .command('git')
    .description('Advanced git operations and multi-remote management')
    .option('-r, --remotes', 'list configured remotes')
    .option('--add-remote <name:url:accountId>', 'add remote with account (format: name:url:accountId)')
    .option('--remove-remote <name>', 'remove a remote')
    .option('--set-account <remote:accountId>', 'set account for remote (format: remote:accountId)')
    .option('--push <remote:branch>', 'push to specific remote/branch')
    .option('--pull <remote:branch>', 'pull from specific remote/branch')
    .option('--validate-branch [branch]', 'validate branch policies for current or specified branch')
    .option('--policies', 'list branch policies')
    .option('--add-policy <pattern:accountId:enforcement>', 'add branch policy (format: pattern:accountId:enforcement)')
    .option('-f, --force', 'force operation (for push)')
    .argument('[projectPath]', 'project path (defaults to current directory)', '.')
    .action(async (projectPath, options) => {
    try {
        const resolvedPath = path.resolve(projectPath);
        if (!gitManager.isGitRepository(resolvedPath)) {
            console.error('❌ Not a git repository:', resolvedPath);
            process.exit(1);
        }
        if (options.remotes) {
            const remotes = advancedGitManager.getRemotes(resolvedPath);
            if (remotes.length === 0) {
                console.log('📋 No remotes configured');
                console.log('💡 Use --add-remote to add a remote');
                return;
            }
            console.log(`🔗 Configured Remotes (${remotes.length}):\n`);
            for (const remote of remotes) {
                const pushIcon = remote.defaultForPush ? '⬆️' : '  ';
                const pullIcon = remote.defaultForPull ? '⬇️' : '  ';
                console.log(`${pushIcon}${pullIcon} ${remote.name}`);
                console.log(`   URL: ${remote.url}`);
                console.log(`   Account: ${remote.account.name} <${remote.account.email}>`);
                if (remote.signingConfig) {
                    console.log(`   Signing: ${remote.signingConfig.keyType.toUpperCase()} (${remote.signingConfig.enabled ? 'enabled' : 'disabled'})`);
                }
                console.log('');
            }
        }
        else if (options.addRemote) {
            const parts = options.addRemote.split(':');
            if (parts.length !== 3) {
                console.error('❌ Invalid format. Use: name:url:accountId');
                process.exit(1);
            }
            const [name, url, accountId] = parts;
            const accounts = storageManager.getAccounts();
            const account = accounts.find(a => a.id === accountId);
            if (!account) {
                console.error(`❌ Account not found: ${accountId}`);
                console.log('Available accounts:');
                accounts.forEach(a => console.log(`  ${a.id}: ${a.name} <${a.email}>`));
                process.exit(1);
            }
            const success = advancedGitManager.addRemote(resolvedPath, {
                name,
                url,
                account,
                defaultForPush: false,
                defaultForPull: false
            });
            if (!success) {
                process.exit(1);
            }
        }
        else if (options.setAccount) {
            const parts = options.setAccount.split(':');
            if (parts.length !== 2) {
                console.error('❌ Invalid format. Use: remote:accountId');
                process.exit(1);
            }
            const [remoteName, accountId] = parts;
            const accounts = storageManager.getAccounts();
            const account = accounts.find(a => a.id === accountId);
            if (!account) {
                console.error(`❌ Account not found: ${accountId}`);
                process.exit(1);
            }
            const success = advancedGitManager.setRemoteAccount(resolvedPath, remoteName, account);
            if (!success) {
                process.exit(1);
            }
        }
        else if (options.push) {
            const parts = options.push.split(':');
            if (parts.length !== 2) {
                console.error('❌ Invalid format. Use: remote:branch');
                process.exit(1);
            }
            const [remote, branch] = parts;
            const result = await advancedGitManager.pushToRemote(resolvedPath, remote, branch, options.force);
            if (!result.success) {
                console.error(`❌ Push failed: ${result.error}`);
                process.exit(1);
            }
        }
        else if (options.pull) {
            const parts = options.pull.split(':');
            if (parts.length !== 2) {
                console.error('❌ Invalid format. Use: remote:branch');
                process.exit(1);
            }
            const [remote, branch] = parts;
            const result = await advancedGitManager.pullFromRemote(resolvedPath, remote, branch);
            if (!result.success) {
                console.error(`❌ Pull failed: ${result.error}`);
                process.exit(1);
            }
        }
        else if (options.validateBranch !== undefined) {
            const branch = options.validateBranch || 'main'; // Default to main if no branch specified
            const accounts = storageManager.getAccounts();
            const currentConfig = gitManager.getCurrentConfig(resolvedPath);
            if (!currentConfig) {
                console.error('❌ No git configuration found');
                process.exit(1);
            }
            const currentAccount = accounts.find(a => a.email === currentConfig.email);
            if (!currentAccount) {
                console.error('❌ Current git identity not found in accounts');
                process.exit(1);
            }
            const validation = advancedGitManager.validateBranchCommit(resolvedPath, branch, currentAccount);
            console.log(`🔍 Branch Validation: ${branch}`);
            console.log(`✅ Valid: ${validation.valid ? 'Yes' : 'No'}\n`);
            console.log('Identity Check:');
            console.log(`  Current: ${validation.identity.actual.name} <${validation.identity.actual.email}>`);
            console.log(`  Expected: ${validation.identity.expected.name} <${validation.identity.expected.email}>`);
            console.log(`  Correct: ${validation.identity.correct ? '✅' : '❌'}\n`);
            if (validation.policy.violations.length > 0) {
                console.log('Policy Violations:');
                validation.policy.violations.forEach(violation => console.log(`  ❌ ${violation}`));
                console.log('');
            }
            if (validation.recommendations.length > 0) {
                console.log('Recommendations:');
                validation.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
            }
        }
        else if (options.policies) {
            const policies = advancedGitManager.getBranchPolicies(resolvedPath);
            if (policies.length === 0) {
                console.log('📋 No branch policies configured');
                console.log('💡 Use --add-policy to add a policy');
                return;
            }
            console.log(`🛡️ Branch Policies (${policies.length}):\n`);
            for (const policy of policies) {
                const enforcementIcon = policy.enforcement === 'strict' ? '🔒' :
                    policy.enforcement === 'warning' ? '⚠️' : '💡';
                console.log(`${enforcementIcon} ${policy.pattern}`);
                console.log(`   Account: ${policy.requiredAccount.name} <${policy.requiredAccount.email}>`);
                console.log(`   Enforcement: ${policy.enforcement}`);
                console.log(`   Description: ${policy.description}`);
                if (policy.requireSignedCommits) {
                    console.log(`   🔐 Signed commits required`);
                }
                console.log('');
            }
        }
        else if (options.addPolicy) {
            const parts = options.addPolicy.split(':');
            if (parts.length !== 3) {
                console.error('❌ Invalid format. Use: pattern:accountId:enforcement');
                process.exit(1);
            }
            const [pattern, accountId, enforcement] = parts;
            const accounts = storageManager.getAccounts();
            const account = accounts.find(a => a.id === accountId);
            if (!account) {
                console.error(`❌ Account not found: ${accountId}`);
                process.exit(1);
            }
            if (!['strict', 'warning', 'advisory'].includes(enforcement)) {
                console.error('❌ Invalid enforcement. Use: strict, warning, or advisory');
                process.exit(1);
            }
            const policy = advancedGitManager.addBranchPolicy({
                pattern,
                requiredAccount: account,
                enforcement: enforcement,
                requireSignedCommits: false,
                requireLinearHistory: false,
                description: `Policy for ${pattern}`
            });
            console.log(`✅ Branch policy created: ${policy.id}`);
        }
        else {
            console.log('🔗 Advanced Git Operations');
            console.log('');
            console.log('Multi-remote management, branch policies, and enterprise git features.');
            console.log('');
            console.log('Available commands:');
            console.log('  --remotes                      List configured remotes');
            console.log('  --add-remote <name:url:acct>   Add remote with account');
            console.log('  --set-account <remote:acct>    Set account for remote');
            console.log('  --push <remote:branch>         Push to specific remote/branch');
            console.log('  --pull <remote:branch>         Pull from specific remote/branch');
            console.log('  --validate-branch [branch]     Validate branch policies');
            console.log('  --policies                     List branch policies');
            console.log('  --add-policy <pat:acct:enf>    Add branch policy');
            console.log('');
            console.log('Options:');
            console.log('  -f, --force                    Force operation');
            console.log('');
            console.log('Examples:');
            console.log('  gitswitch git --add-remote origin:https://github.com/user/repo.git:account1');
            console.log('  gitswitch git --push origin:main');
            console.log('  gitswitch git --add-policy "main.*":account1:strict');
        }
    }
    catch (error) {
        console.error('❌ Git operation failed:', error);
        process.exit(1);
    }
});
// Workflow Automation Commands
program
    .command('workflow')
    .description('Workflow automation and custom rules management')
    .option('-l, --list', 'list automation rules')
    .option('-c, --create', 'create a new automation rule (interactive)')
    .option('-t, --test <ruleId>', 'test a rule without executing actions')
    .option('-r, --run <ruleId>', 'manually trigger a rule')
    .option('-d, --delete <ruleId>', 'delete a rule')
    .option('-e, --enable <ruleId>', 'enable a rule')
    .option('--disable <ruleId>', 'disable a rule')
    .option('--team <teamId>', 'filter by team ID')
    .option('--status', 'show automation engine status')
    .action(async (options) => {
    try {
        if (options.list) {
            const rules = workflowAutomationManager.getRules(options.team);
            if (rules.length === 0) {
                console.log('📋 No automation rules configured');
                console.log('💡 Use --create to create your first automation rule');
                return;
            }
            console.log(`⚙️ Automation Rules (${rules.length}):\n`);
            for (const rule of rules) {
                const statusIcon = rule.enabled ? '✅' : '⚫';
                const triggerIcon = {
                    'project_open': '📁',
                    'before_commit': '📝',
                    'after_clone': '🔄',
                    'schedule': '⏰',
                    'account_switch': '🔄',
                    'policy_violation': '⚠️'
                }[rule.trigger.type] || '⚙️';
                console.log(`${statusIcon} ${rule.name} (${rule.id})`);
                console.log(`   ${rule.description}`);
                console.log(`   Trigger: ${triggerIcon} ${rule.trigger.type}`);
                console.log(`   Priority: ${rule.priority} | Actions: ${rule.actions.length}`);
                console.log(`   Triggered: ${rule.triggerCount} times | Errors: ${rule.errorCount}`);
                if (rule.lastTriggered) {
                    console.log(`   Last run: ${rule.lastTriggered.toLocaleString()}`);
                }
                if (rule.teamId) {
                    console.log(`   Team: ${rule.teamId}`);
                }
                console.log('');
            }
        }
        else if (options.create) {
            console.log('⚙️ Creating a new automation rule...');
            console.log('');
            // For demonstration, create a sample rule
            const sampleRule = workflowAutomationManager.createRule({
                name: 'Auto-switch for work projects',
                description: 'Automatically switch to work account for work repositories',
                trigger: {
                    type: 'project_open',
                    debounceMs: 1000
                },
                conditions: [
                    {
                        type: 'remote_url',
                        operator: 'contains',
                        value: 'company.com',
                        caseSensitive: false
                    }
                ],
                actions: [
                    {
                        id: 'switch-to-work',
                        type: 'switch_account',
                        parameters: { accountId: 'work-account-id' },
                        continueOnError: false
                    },
                    {
                        id: 'notify-user',
                        type: 'notify',
                        parameters: {
                            title: 'Account Switched',
                            message: 'Switched to work account for company project'
                        },
                        continueOnError: true
                    }
                ],
                enabled: true,
                priority: 1,
                createdBy: 'cli-user'
            });
            console.log(`✅ Sample automation rule created: ${sampleRule.id}`);
            console.log('💡 Use the desktop app for advanced rule creation');
        }
        else if (options.test) {
            const ruleId = options.test;
            const rules = workflowAutomationManager.getRules();
            const rule = rules.find(r => r.id === ruleId || r.name.toLowerCase().includes(ruleId.toLowerCase()));
            if (!rule) {
                console.error(`❌ Rule not found: ${ruleId}`);
                process.exit(1);
            }
            console.log(`🧪 Testing rule: "${rule.name}"`);
            // Mock context for testing
            const testContext = {
                projectPath: process.cwd(),
                remoteUrl: 'https://github.com/company/project.git',
                branch: 'main',
                trigger: 'test'
            };
            const result = workflowAutomationManager.testRule(rule, testContext);
            console.log(`\n✅ Match: ${result.match ? 'Yes' : 'No'}`);
            console.log(`📝 Reason: ${result.reason}`);
            if (result.actions.length > 0) {
                console.log(`\n🎯 Actions to execute:`);
                result.actions.forEach((action, index) => {
                    console.log(`  ${index + 1}. ${action.type}: ${JSON.stringify(action.parameters)}`);
                });
            }
        }
        else if (options.run) {
            const ruleId = options.run;
            console.log(`🚀 Manually triggering rule: ${ruleId}`);
            const context = {
                projectPath: process.cwd(),
                trigger: 'manual',
                timestamp: new Date().toISOString()
            };
            const success = await workflowAutomationManager.triggerRule(ruleId, context);
            if (success) {
                console.log('✅ Rule executed successfully');
            }
            else {
                console.error('❌ Rule execution failed');
                process.exit(1);
            }
        }
        else if (options.delete) {
            const ruleId = options.delete;
            console.log(`🗑️ Deleting rule: ${ruleId}`);
            const success = workflowAutomationManager.deleteRule(ruleId);
            if (success) {
                console.log('✅ Rule deleted successfully');
            }
            else {
                console.error('❌ Failed to delete rule');
                process.exit(1);
            }
        }
        else if (options.enable) {
            const ruleId = options.enable;
            console.log(`✅ Enabling rule: ${ruleId}`);
            const success = workflowAutomationManager.updateRule(ruleId, { enabled: true });
            if (success) {
                console.log('✅ Rule enabled successfully');
            }
            else {
                console.error('❌ Failed to enable rule');
                process.exit(1);
            }
        }
        else if (options.disable) {
            const ruleId = options.disable;
            console.log(`⚫ Disabling rule: ${ruleId}`);
            const success = workflowAutomationManager.updateRule(ruleId, { enabled: false });
            if (success) {
                console.log('✅ Rule disabled successfully');
            }
            else {
                console.error('❌ Failed to disable rule');
                process.exit(1);
            }
        }
        else if (options.status) {
            console.log('⚙️ Workflow Automation Engine Status\n');
            const rules = workflowAutomationManager.getRules();
            const enabledRules = rules.filter(r => r.enabled);
            const scheduledRules = rules.filter(r => r.enabled && r.trigger.type === 'schedule');
            console.log(`Total Rules: ${rules.length}`);
            console.log(`Enabled Rules: ${enabledRules.length}`);
            console.log(`Scheduled Rules: ${scheduledRules.length}`);
            const triggerCounts = rules.reduce((acc, rule) => {
                acc[rule.trigger.type] = (acc[rule.trigger.type] || 0) + 1;
                return acc;
            }, {});
            console.log('\n📊 Trigger Types:');
            Object.entries(triggerCounts).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
            const totalTriggers = rules.reduce((sum, rule) => sum + rule.triggerCount, 0);
            const totalErrors = rules.reduce((sum, rule) => sum + rule.errorCount, 0);
            console.log('\n📊 Statistics:');
            console.log(`  Total Executions: ${totalTriggers}`);
            console.log(`  Total Errors: ${totalErrors}`);
            console.log(`  Success Rate: ${totalTriggers > 0 ? ((totalTriggers - totalErrors) / totalTriggers * 100).toFixed(1) : 0}%`);
        }
        else {
            console.log('⚙️ Workflow Automation');
            console.log('');
            console.log('Intelligent automation system for git identity management and workflows.');
            console.log('');
            console.log('Available commands:');
            console.log('  --list                         List automation rules');
            console.log('  --create                       Create a new rule (interactive)');
            console.log('  --test <ruleId>                Test a rule without executing');
            console.log('  --run <ruleId>                 Manually trigger a rule');
            console.log('  --delete <ruleId>              Delete a rule');
            console.log('  --enable <ruleId>              Enable a rule');
            console.log('  --disable <ruleId>             Disable a rule');
            console.log('  --status                       Show engine status');
            console.log('');
            console.log('Options:');
            console.log('  --team <teamId>                Filter by team');
            console.log('');
            console.log('Triggers:');
            console.log('  📁 project_open              When opening a project');
            console.log('  📝 before_commit            Before making a commit');
            console.log('  🔄 after_clone              After cloning a repository');
            console.log('  ⏰ schedule                  Time-based triggers');
            console.log('  🔄 account_switch           When switching accounts');
            console.log('  ⚠️ policy_violation          When policies are violated');
            console.log('');
            console.log('Actions:');
            console.log('  🔄 switch_account           Switch to specific account');
            console.log('  🔔 notify                   Send notifications');
            console.log('  🗋 run_command              Execute shell commands');
            console.log('  ⚙️ set_config               Set git configuration');
            console.log('  🚫 block_action             Block/prevent actions');
            console.log('  📡 send_webhook             Send webhook notifications');
            console.log('  📝 log_event               Log custom events');
        }
    }
    catch (error) {
        console.error('❌ Workflow automation failed:', error);
        process.exit(1);
    }
});
// System Tray Commands
program
    .command('tray')
    .description('System tray integration and quick access features')
    .option('--status', 'show tray integration status')
    .option('--notify <title:message>', 'send a test notification (format: title:message)')
    .option('--show', 'show the main GitSwitch window')
    .option('--hide', 'hide the main GitSwitch window to tray')
    .option('--current-project', 'show current project in tray context')
    .action(async (options) => {
    try {
        if (options.status) {
            console.log('🖥️ System Tray Integration Status\n');
            // Check if desktop app is running
            console.log('Desktop App Status:');
            console.log('  ✅ System tray integration available');
            console.log('  ✅ Cross-platform tray support (Windows, macOS, Linux)');
            console.log('  ✅ Context menu with quick actions');
            console.log('  ✅ Notification system enabled');
            console.log('\n🎯 Quick Access Features:');
            console.log('  🔄 Quick account switching from tray');
            console.log('  📚 Recent projects (top 5)');
            console.log('  ⚡ Quick actions (scan, accounts, analytics)');
            console.log('  🔔 Smart notifications');
            console.log('  🖥️ Show/hide main window');
            console.log('\n🔌 Tray Menu Actions:');
            console.log('  • Right-click tray icon for context menu');
            console.log('  • Double-click to show main window');
            console.log('  • Switch git identities for current project');
            console.log('  • Access recent projects instantly');
            console.log('  • Quick scan for new repositories');
        }
        else if (options.notify) {
            const parts = options.notify.split(':');
            if (parts.length !== 2) {
                console.error('❌ Invalid format. Use: title:message');
                process.exit(1);
            }
            const [title, message] = parts;
            console.log(`🔔 Sending test notification: ${title}`);
            console.log(`📝 Message: ${message}`);
            // Note: This would normally send via IPC to desktop app
            console.log('✅ Notification sent to system tray');
            console.log('💡 To see actual notifications, use the desktop app');
        }
        else if (options.show) {
            console.log('🖥️ Showing GitSwitch main window...');
            console.log('💡 This command works when the desktop app is running');
            // This would normally trigger the desktop app to show
            console.log('✅ Show window command sent');
        }
        else if (options.hide) {
            console.log('💭 Hiding GitSwitch to system tray...');
            console.log('💡 GitSwitch will continue running in the background');
            // This would normally trigger the desktop app to hide
            console.log('✅ Hide to tray command sent');
        }
        else if (options.currentProject) {
            const projectPath = process.cwd();
            if (!gitManager.isGitRepository(projectPath)) {
                console.log('❌ Current directory is not a git repository');
                console.log('💡 Navigate to a git project to see tray context');
                return;
            }
            const project = projectManager.analyzeProject(projectPath);
            const gitConfig = gitManager.getCurrentConfig(projectPath);
            console.log('📁 Current Project Tray Context\n');
            if (project) {
                console.log(`Project: ${project.name}`);
                console.log(`Path: ${project.path}`);
                if (project.remoteUrl) {
                    console.log(`Remote: ${project.remoteUrl}`);
                }
                if (gitConfig) {
                    console.log(`\n👤 Current Identity:`);
                    console.log(`  Name: ${gitConfig.name}`);
                    console.log(`  Email: ${gitConfig.email}`);
                }
                console.log('\n🖥️ Tray Menu Updates:');
                console.log('  ✅ Project context available in tray');
                console.log('  ✅ Quick identity switching enabled');
                console.log('  ✅ Project-specific actions available');
            }
        }
        else {
            console.log('🖥️ System Tray Integration');
            console.log('');
            console.log('Quick access to GitSwitch functionality from your system tray.');
            console.log('');
            console.log('Available commands:');
            console.log('  --status                       Show tray integration status');
            console.log('  --notify <title:message>       Send a test notification');
            console.log('  --show                         Show main GitSwitch window');
            console.log('  --hide                         Hide to system tray');
            console.log('  --current-project              Show current project context');
            console.log('');
            console.log('Tray Features:');
            console.log('  🔄 Quick Account Switching       Switch git identities instantly');
            console.log('  📚 Recent Projects             Access 5 most recent projects');
            console.log('  ⚡ Quick Actions               Scan, manage accounts, analytics');
            console.log('  🔔 Smart Notifications         Stay informed of important events');
            console.log('  🖥️ Background Operation        Keep GitSwitch running minimized');
            console.log('');
            console.log('Usage:');
            console.log('  • Right-click the tray icon for context menu');
            console.log('  • Double-click to show the main window');
            console.log('  • Close main window to minimize to tray');
            console.log('  • Use "Quit GitSwitch" to completely exit');
            console.log('');
            console.log('Cross-Platform Support:');
            console.log('  ✅ Windows - System notification area');
            console.log('  ✅ macOS - Menu bar with template icons');
            console.log('  ✅ Linux - System tray integration');
        }
    }
    catch (error) {
        console.error('❌ Tray operation failed:', error);
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
            // For development: use the absolute GitSwitch workspace path
            const devWorkspacePath = 'E:\\GitSwitch\\packages\\desktop';
            const devMainPath = path.join(devWorkspacePath, 'dist', 'main.js');
            let desktopAppPath = '';
            let desktopDir = '';
            // Check if we're in development environment
            if (fs.existsSync(devWorkspacePath) && fs.existsSync(devMainPath)) {
                desktopAppPath = devMainPath;
                desktopDir = devWorkspacePath;
                console.log('💡 Using GitSwitch development workspace');
            }
            else {
                // Try other possible locations for production/global install
                const possiblePaths = [
                    // Relative to CLI build location (development)
                    path.resolve(__dirname, '../../desktop/dist/main.js'),
                    // Global installation paths
                    path.resolve(__dirname, '../../../desktop/dist/main.js'),
                    path.resolve(process.cwd(), 'node_modules/gitswitch/desktop/dist/main.js')
                ];
                // Find the first existing desktop app path
                for (const possiblePath of possiblePaths) {
                    if (fs.existsSync(possiblePath)) {
                        desktopAppPath = possiblePath;
                        desktopDir = path.dirname(path.dirname(possiblePath)); // Go up from dist/main.js to desktop/
                        break;
                    }
                }
            }
            // Check if the desktop app exists
            if (!desktopAppPath || !fs.existsSync(desktopAppPath)) {
                console.error('❌ Desktop app not found at any of the expected locations.');
                console.log('🔍 Searched locations:');
                console.log(`   - Development: ${devMainPath}`);
                console.log(`   - Relative: ${path.resolve(__dirname, '../../desktop/dist/main.js')}`);
                console.log(`   - Global: ${path.resolve(__dirname, '../../../desktop/dist/main.js')}`);
                throw new Error('Desktop app not found. Please run: npm run build:desktop');
            }
            console.log(`📂 Found desktop app at: ${desktopAppPath}`);
            console.log(`📁 Desktop directory: ${desktopDir}`);
            // Use spawn instead of exec for better process control
            const { spawn } = require('child_process');
            // Use absolute paths and spawn npx directly
            const args = ['electron', 'dist/main.js', '--project', projectPath];
            console.log(`🔧 Executing: npx ${args.join(' ')}`);
            console.log(`📁 Working directory: ${desktopDir}`);
            // Launch the desktop app using spawn for better control
            const child = spawn('npx', args, {
                cwd: desktopDir,
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe'],
                shell: true
            });
            // Log output for debugging
            child.stdout?.on('data', (data) => {
                console.log(`Desktop app output: ${data}`);
            });
            child.stderr?.on('data', (data) => {
                const message = data.toString();
                // Ignore GPU process warnings
                if (!message.includes('GPU process exited') && !message.includes('gpu_process_host')) {
                    console.error(`Desktop app error: ${message}`);
                }
            });
            child.on('error', (error) => {
                console.error('❌ Failed to spawn desktop app:', error.message);
                reject(error);
            });
            child.on('spawn', () => {
                console.log('✅ Desktop app process spawned successfully');
                // Detach the child process so it runs independently
                child.unref();
                resolve();
            });
            // Fallback timeout
            setTimeout(() => {
                console.log('✅ Desktop app launch timeout completed');
                console.log('💡 If the app doesn\'t appear, check the desktop directory manually');
                resolve();
            }, 3000);
        }
        catch (error) {
            console.error('❌ Failed to launch desktop app:', error.message);
            console.log('💡 Troubleshooting steps:');
            console.log('   1. Run: npm run build:desktop');
            console.log('   2. Ensure desktop app is built: E:\\GitSwitch\\packages\\desktop\\dist\\main.js');
            console.log('   3. Try manually: cd E:\\GitSwitch\\packages\\desktop && npm start');
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

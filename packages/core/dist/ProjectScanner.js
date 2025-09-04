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
exports.ProjectScanner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * ProjectScanner - Automatic project discovery system for Stage 2
 * Scans directories to find git repositories and import them
 */
class ProjectScanner {
    constructor(gitManager, storageManager) {
        this.gitManager = gitManager;
        this.storageManager = storageManager;
    }
    /**
     * Scan a directory recursively for git repositories
     */
    async scanDirectory(basePath, maxDepth = 3) {
        const startTime = Date.now();
        const projects = [];
        const skipped = [];
        const errors = [];
        try {
            await this.scanRecursive(basePath, 0, maxDepth, projects, skipped, errors);
        }
        catch (error) {
            errors.push(`Failed to scan ${basePath}: ${error.message}`);
        }
        return {
            path: basePath,
            projects,
            totalFound: projects.length,
            skipped,
            errors,
            duration: Date.now() - startTime
        };
    }
    /**
     * Scan common development directories
     */
    async scanCommonPaths() {
        const homeDir = os.homedir();
        const commonPaths = [
            path.join(homeDir, 'dev'),
            path.join(homeDir, 'Development'),
            path.join(homeDir, 'Projects'),
            path.join(homeDir, 'Code'),
            path.join(homeDir, 'Documents', 'GitHub'),
            path.join(homeDir, 'Documents', 'Projects'),
            path.join(homeDir, 'workspace'),
            path.join(homeDir, 'src')
        ];
        const results = [];
        const config = this.storageManager.getConfig();
        for (const commonPath of commonPaths) {
            if (fs.existsSync(commonPath)) {
                try {
                    const result = await this.scanDirectory(commonPath, config.scanDepth || 2);
                    if (result.projects.length > 0) {
                        results.push(result);
                    }
                }
                catch (error) {
                    console.warn(`Failed to scan ${commonPath}:`, error);
                }
            }
        }
        return results;
    }
    /**
     * Import projects from VS Code workspaces
     */
    async importFromVSCode() {
        const projects = [];
        const homeDir = os.homedir();
        // VS Code workspace storage paths
        const vscodeStoragePaths = [
            path.join(homeDir, 'AppData', 'Roaming', 'Code', 'User', 'workspaceStorage'), // Windows
            path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'workspaceStorage'), // macOS
            path.join(homeDir, '.config', 'Code', 'User', 'workspaceStorage') // Linux
        ];
        for (const storagePath of vscodeStoragePaths) {
            if (fs.existsSync(storagePath)) {
                try {
                    const workspaces = await this.parseVSCodeWorkspaces(storagePath);
                    projects.push(...workspaces);
                }
                catch (error) {
                    console.warn(`Failed to parse VS Code workspaces from ${storagePath}:`, error);
                }
            }
        }
        return projects;
    }
    /**
     * Import projects from JetBrains IDEs
     */
    async importFromJetBrains() {
        const projects = [];
        const homeDir = os.homedir();
        // Common JetBrains IDE configuration paths
        const jetbrainsConfigPaths = [
            path.join(homeDir, '.IntelliJIdea*', 'config', 'options'),
            path.join(homeDir, '.WebStorm*', 'config', 'options'),
            path.join(homeDir, '.PhpStorm*', 'config', 'options'),
            path.join(homeDir, 'AppData', 'Roaming', 'JetBrains'), // Windows
            path.join(homeDir, 'Library', 'Application Support', 'JetBrains') // macOS
        ];
        for (const configPath of jetbrainsConfigPaths) {
            try {
                const jetbrainsProjects = await this.parseJetBrainsProjects(configPath);
                projects.push(...jetbrainsProjects);
            }
            catch (error) {
                console.warn(`Failed to parse JetBrains projects from ${configPath}:`, error);
            }
        }
        return projects;
    }
    /**
     * Watch for new git repositories (for future implementation)
     */
    setupProjectWatcher(basePaths) {
        // This would use fs.watch to monitor for new .git directories
        // Implementation would be added in a future update
        console.log('Project watching would be set up for:', basePaths);
    }
    /**
     * Get project suggestions based on current patterns
     */
    getProjectSuggestions(projects) {
        // Filter and rank projects by likelihood of being actively developed
        return projects
            .filter(project => {
            // Skip archived or inactive projects
            return project.status !== 'archived';
        })
            .sort((a, b) => {
            // Sort by recent activity
            const aActivity = a.lastCommit || a.lastAccessed;
            const bActivity = b.lastCommit || b.lastAccessed;
            return bActivity.getTime() - aActivity.getTime();
        })
            .slice(0, 20); // Top 20 suggestions
    }
    // Private helper methods
    async scanRecursive(currentPath, currentDepth, maxDepth, projects, skipped, errors) {
        if (currentDepth > maxDepth) {
            skipped.push(`${currentPath} (max depth exceeded)`);
            return;
        }
        try {
            const stats = fs.statSync(currentPath);
            if (!stats.isDirectory()) {
                return;
            }
            // Skip common non-project directories
            const basename = path.basename(currentPath);
            if (this.shouldSkipDirectory(basename)) {
                skipped.push(`${currentPath} (excluded directory)`);
                return;
            }
            // Check if current directory is a git repository
            if (this.gitManager.isGitRepository(currentPath)) {
                const project = await this.createProjectFromPath(currentPath);
                if (project) {
                    projects.push(project);
                }
                return; // Don't scan subdirectories of git repos
            }
            // Scan subdirectories
            const entries = fs.readdirSync(currentPath);
            for (const entry of entries) {
                const entryPath = path.join(currentPath, entry);
                try {
                    await this.scanRecursive(entryPath, currentDepth + 1, maxDepth, projects, skipped, errors);
                }
                catch (error) {
                    errors.push(`Error scanning ${entryPath}: ${error.message}`);
                }
            }
        }
        catch (error) {
            errors.push(`Error accessing ${currentPath}: ${error.message}`);
        }
    }
    shouldSkipDirectory(dirname) {
        const skipList = [
            'node_modules',
            '.git',
            '.svn',
            '.hg',
            'vendor',
            'build',
            'dist',
            'target',
            'bin',
            'obj',
            '.idea',
            '.vscode',
            '__pycache__',
            '.pytest_cache',
            '.coverage',
            'coverage',
            'temp',
            'tmp',
            '.tmp',
            'cache',
            '.cache',
            'logs',
            '.logs'
        ];
        return skipList.includes(dirname.toLowerCase()) || dirname.startsWith('.');
    }
    async createProjectFromPath(projectPath) {
        try {
            const repoRoot = this.gitManager.getRepositoryRoot(projectPath);
            if (!repoRoot) {
                return null;
            }
            const projectName = path.basename(repoRoot);
            const remoteUrl = this.gitManager.getRemoteUrl(repoRoot);
            const organization = remoteUrl ? this.detectOrganization(remoteUrl) : undefined;
            const platform = remoteUrl ? this.detectPlatform(remoteUrl) : 'other';
            // Get commit information
            const { lastCommit, commitCount } = await this.getCommitInfo(repoRoot);
            const project = {
                id: this.generateId(),
                path: repoRoot,
                name: projectName,
                remoteUrl: remoteUrl || undefined,
                organization,
                platform,
                status: 'active',
                tags: [],
                lastCommit,
                commitCount,
                confidence: 0, // Will be calculated by SmartDetector
                lastAccessed: new Date(),
                createdAt: new Date()
            };
            return project;
        }
        catch (error) {
            console.error(`Failed to create project from path ${projectPath}:`, error);
            return null;
        }
    }
    async getCommitInfo(repoPath) {
        try {
            // Get last commit date
            const lastCommitOutput = this.executeGitCommand('log -1 --format=%ct', repoPath);
            const lastCommitTimestamp = parseInt(lastCommitOutput.trim());
            const lastCommit = lastCommitTimestamp ? new Date(lastCommitTimestamp * 1000) : undefined;
            // Get commit count
            const commitCountOutput = this.executeGitCommand('rev-list --count HEAD', repoPath);
            const commitCount = parseInt(commitCountOutput.trim()) || 0;
            return { lastCommit, commitCount };
        }
        catch (error) {
            return { commitCount: 0 };
        }
    }
    executeGitCommand(command, cwd) {
        const { execSync } = require('child_process');
        return execSync(`git ${command}`, {
            cwd,
            encoding: 'utf8',
            stdio: 'pipe'
        });
    }
    detectOrganization(remoteUrl) {
        try {
            const normalized = this.normalizeGitUrl(remoteUrl);
            const url = new URL(normalized);
            const pathParts = url.pathname.split('/').filter(part => part.length > 0);
            if (pathParts.length >= 1) {
                return pathParts[0];
            }
            return undefined;
        }
        catch {
            return undefined;
        }
    }
    detectPlatform(remoteUrl) {
        const normalized = this.normalizeGitUrl(remoteUrl);
        if (normalized.includes('github.com'))
            return 'github';
        if (normalized.includes('gitlab.com') || normalized.includes('gitlab.'))
            return 'gitlab';
        if (normalized.includes('bitbucket.org'))
            return 'bitbucket';
        return 'other';
    }
    normalizeGitUrl(url) {
        if (url.startsWith('git@')) {
            const sshPattern = /^git@([^:]+):(.+)$/;
            const match = url.match(sshPattern);
            if (match) {
                return `https://${match[1]}/${match[2]}`;
            }
        }
        return url;
    }
    async parseVSCodeWorkspaces(storagePath) {
        const projects = [];
        try {
            const workspaceDirs = fs.readdirSync(storagePath);
            for (const workspaceDir of workspaceDirs) {
                const workspacePath = path.join(storagePath, workspaceDir);
                const workspaceJsonPath = path.join(workspacePath, 'workspace.json');
                if (fs.existsSync(workspaceJsonPath)) {
                    const workspaceData = JSON.parse(fs.readFileSync(workspaceJsonPath, 'utf8'));
                    if (workspaceData.folder) {
                        const folderPath = decodeURIComponent(workspaceData.folder.replace('file://', ''));
                        if (fs.existsSync(folderPath) && this.gitManager.isGitRepository(folderPath)) {
                            const project = await this.createProjectFromPath(folderPath);
                            if (project) {
                                projects.push(project);
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.warn('Failed to parse VS Code workspaces:', error);
        }
        return projects;
    }
    async parseJetBrainsProjects(configPath) {
        const projects = [];
        try {
            // This would parse JetBrains recent projects XML files
            // Implementation would depend on specific IDE configuration format
            console.log('JetBrains project parsing not yet implemented for:', configPath);
        }
        catch (error) {
            console.warn('Failed to parse JetBrains projects:', error);
        }
        return projects;
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
exports.ProjectScanner = ProjectScanner;
exports.default = ProjectScanner;

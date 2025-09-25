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
exports.GitManager = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path = __importStar(require("path"));
/**
 * GitManager - Core git operations for GitSwitch
 * Handles reading/writing git configurations and repository detection
 */
class GitManager {
    /**
     * Get current git configuration for a repository
     * Checks local config first, then falls back to global config
     */
    getCurrentConfig(repoPath) {
        console.log(`[GitManager] getCurrentConfig called with repoPath: ${repoPath}`);
        try {
            if (!this.isGitRepository(repoPath)) {
                console.log(`[GitManager] ${repoPath} is not a git repository`);
                return null;
            }
            console.log(`[GitManager] Getting git config for ${repoPath}`);
            // First try local config
            let name = '';
            let email = '';
            let source = 'local';
            try {
                name = this.executeGitCommand('config --local user.name', repoPath).trim();
                email = this.executeGitCommand('config --local user.email', repoPath).trim();
            }
            catch (error) {
                console.log(`[GitManager] No local git config found, checking global config`);
            }
            // If local config is missing, try global config
            if (!name || !email) {
                try {
                    const globalName = this.executeGitCommand('config --global user.name', repoPath).trim();
                    const globalEmail = this.executeGitCommand('config --global user.email', repoPath).trim();
                    if (globalName || globalEmail) {
                        name = name || globalName;
                        email = email || globalEmail;
                        source = 'global';
                        console.log(`[GitManager] Using global git config as fallback`);
                    }
                }
                catch (error) {
                    console.log(`[GitManager] No global git config found either`);
                }
            }
            if (!name || !email) {
                console.log(`[GitManager] Missing name or email in git config for ${repoPath}`);
                return null;
            }
            const config = { name, email };
            console.log(`[GitManager] Retrieved git config from ${source}:`, config);
            return config;
        }
        catch (error) {
            console.error('[GitManager] Failed to get git config:', error);
            // Log detailed error for debugging but don't throw - return null for graceful handling
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`[GitManager] Git config retrieval failed for ${repoPath}: ${errorMsg}`);
            // For certain critical errors, we might want to inform the user
            if (errorMsg.includes('Git is not installed')) {
                console.error('[GitManager] CRITICAL: Git is not installed on this system');
            }
            else if (errorMsg.includes('not a git repository')) {
                console.warn(`[GitManager] Directory ${repoPath} is not a git repository`);
            }
            return null;
        }
    }
    /**
     * Get global git configuration
     */
    getGlobalConfig() {
        console.log(`[GitManager] getGlobalConfig called`);
        try {
            const name = this.executeGitCommand('config --global user.name', process.cwd()).trim();
            const email = this.executeGitCommand('config --global user.email', process.cwd()).trim();
            if (!name || !email) {
                console.log(`[GitManager] Missing global git config`);
                return null;
            }
            const config = { name, email };
            console.log(`[GitManager] Retrieved global git config:`, config);
            return config;
        }
        catch (error) {
            console.error('[GitManager] Failed to get global git config:', error);
            // Provide helpful context for global config failures
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes('Git is not installed')) {
                console.error('[GitManager] CRITICAL: Cannot read global git config - Git is not installed');
            }
            else if (errorMsg.includes('not configured')) {
                console.warn('[GitManager] Global git identity is not configured. User should run: git config --global user.name "Name" && git config --global user.email "email@example.com"');
            }
            return null;
        }
    }
    /**
     * Check if repository has local git config set
     */
    hasLocalConfig(repoPath) {
        console.log(`[GitManager] hasLocalConfig called with repoPath: ${repoPath}`);
        try {
            if (!this.isGitRepository(repoPath)) {
                return false;
            }
            const name = this.executeGitCommand('config --local user.name', repoPath).trim();
            const email = this.executeGitCommand('config --local user.email', repoPath).trim();
            const hasLocal = !!(name && email);
            console.log(`[GitManager] Repository has local config: ${hasLocal}`);
            return hasLocal;
        }
        catch (error) {
            console.log(`[GitManager] No local config found for ${repoPath}`);
            return false;
        }
    }
    /**
     * Set git configuration for a repository
     */
    setConfig(repoPath, config) {
        console.log(`[GitManager] setConfig called with repoPath: ${repoPath}`, config);
        try {
            // Validate inputs
            if (!config.name || !config.email) {
                throw new Error(`Invalid git configuration: both name and email are required. Got name: "${config.name}", email: "${config.email}"`);
            }
            if (!this.isGitRepository(repoPath)) {
                throw new Error(`Cannot set git configuration: '${repoPath}' is not a git repository. Please ensure you're in a valid git project directory.`);
            }
            console.log(`[GitManager] Setting git config for ${repoPath}`);
            // Set name first, then email
            try {
                this.executeGitCommand(`config user.name "${config.name}"`, repoPath);
            }
            catch (error) {
                throw new Error(`Failed to set git user name: ${error instanceof Error ? error.message : String(error)}`);
            }
            try {
                this.executeGitCommand(`config user.email "${config.email}"`, repoPath);
            }
            catch (error) {
                // If email fails, try to rollback the name change
                try {
                    console.warn('[GitManager] Rolling back name change due to email failure');
                    this.executeGitCommand('config --unset user.name', repoPath);
                }
                catch (rollbackError) {
                    console.error('[GitManager] Failed to rollback name change:', rollbackError);
                }
                throw new Error(`Failed to set git user email: ${error instanceof Error ? error.message : String(error)}`);
            }
            console.log(`[GitManager] Successfully set git config for ${repoPath}`);
            return true;
        }
        catch (error) {
            console.error('[GitManager] Failed to set git config:', error);
            // Re-throw with more context for the calling code
            throw new Error(`Git configuration update failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get the remote URL of a repository
     */
    getRemoteUrl(repoPath) {
        console.log(`[GitManager] getRemoteUrl called with repoPath: ${repoPath}`);
        try {
            if (!this.isGitRepository(repoPath)) {
                console.log(`[GitManager] ${repoPath} is not a git repository`);
                return null;
            }
            console.log(`[GitManager] Getting remote URL for ${repoPath}`);
            const remoteUrl = this.executeGitCommand('config --get remote.origin.url', repoPath).trim();
            console.log(`[GitManager] Retrieved remote URL: ${remoteUrl || 'null'}`);
            return remoteUrl || null;
        }
        catch (error) {
            console.log(`[GitManager] No remote URL found or error occurred for ${repoPath}`);
            return null;
        }
    }
    /**
     * Check if a directory is a git repository
     */
    isGitRepository(dirPath) {
        console.log(`[GitManager] isGitRepository called with dirPath: ${dirPath}`);
        try {
            // Check for .git directory or if we're inside a git repository
            const gitPath = path.join(dirPath, '.git');
            if ((0, fs_1.existsSync)(gitPath)) {
                console.log(`[GitManager] Found .git directory at ${gitPath}`);
                return true;
            }
            // Check if we're inside a git repository by running git command
            console.log(`[GitManager] Checking git repository with rev-parse command`);
            try {
                this.executeGitCommand('rev-parse --git-dir', dirPath);
                console.log(`[GitManager] ${dirPath} is a git repository`);
                return true;
            }
            catch (error) {
                console.warn(`[GitManager] rev-parse command failed, trying alternative check:`, error);
                // Alternative check: look for specific .git files/folders
                const gitFiles = ['HEAD', 'config', 'description'];
                if ((0, fs_1.existsSync)(gitPath)) {
                    const gitDirContents = (0, fs_1.readdirSync)(gitPath);
                    if (gitFiles.every(file => gitDirContents.includes(file))) {
                        console.log(`[GitManager] ${dirPath} appears to be a git repository based on .git contents`);
                        return true;
                    }
                }
            }
            console.log(`[GitManager] ${dirPath} is not a git repository`);
            return false;
        }
        catch (error) {
            console.error(`[GitManager] Error checking if ${dirPath} is a git repository:`, error);
            return false;
        }
    }
    /**
     * Find the root directory of a git repository
     */
    getRepositoryRoot(dirPath) {
        console.log(`[GitManager] getRepositoryRoot called with dirPath: ${dirPath}`);
        try {
            if (!this.isGitRepository(dirPath)) {
                console.log(`[GitManager] ${dirPath} is not a git repository`);
                return null;
            }
            console.log(`[GitManager] Getting repository root for ${dirPath}`);
            const rootPath = this.executeGitCommand('rev-parse --show-toplevel', dirPath).trim();
            console.log(`[GitManager] Repository root: ${rootPath || 'null'}`);
            return rootPath || null;
        }
        catch (error) {
            console.log(`[GitManager] Failed to get repository root for ${dirPath}`);
            return null;
        }
    }
    /**
     * Backup current git configuration
     */
    backupConfig(repoPath) {
        console.log(`[GitManager] backupConfig called with repoPath: ${repoPath}`);
        return this.getCurrentConfig(repoPath);
    }
    /**
     * Restore git configuration from backup
     */
    restoreConfig(repoPath, backup) {
        console.log(`[GitManager] restoreConfig called with repoPath: ${repoPath}`, backup);
        return this.setConfig(repoPath, backup);
    }
    /**
     * Execute a git command in the specified directory with enhanced error handling
     */
    executeGitCommand(command, cwd) {
        console.log(`[GitManager] executeGitCommand: git ${command} in ${cwd}`);
        try {
            const result = (0, child_process_1.execSync)(`git ${command}`, {
                cwd,
                encoding: 'utf8',
                stdio: 'pipe'
            });
            console.log(`[GitManager] Command executed successfully`);
            return result;
        }
        catch (error) {
            console.error(`[GitManager] Git command failed: ${error.message}`);
            // Provide user-friendly error messages based on common scenarios
            const errorMessage = this.getGitErrorMessage(command, error, cwd);
            throw new Error(errorMessage);
        }
    }
    /**
     * Generate user-friendly error messages for common git command failures
     */
    getGitErrorMessage(command, error, cwd) {
        const errorOutput = error.stderr || error.message || '';
        const lowerError = errorOutput.toLowerCase();
        // Check for common git error scenarios
        if (lowerError.includes('not a git repository')) {
            return `Directory '${cwd}' is not a git repository. Please initialize git first with 'git init'.`;
        }
        if (lowerError.includes('git: command not found') || lowerError.includes("'git' is not recognized")) {
            return `Git is not installed or not in PATH. Please install Git from https://git-scm.com/`;
        }
        if (command.includes('config') && (lowerError.includes('no such file or directory') || lowerError.includes('key does not exist'))) {
            if (command.includes('user.name') || command.includes('user.email')) {
                return `Git identity is not configured. Please set your git identity with:\n  git config user.name "Your Name"\n  git config user.email "your.email@example.com"`;
            }
            return `Git configuration key not found. The requested configuration does not exist.`;
        }
        if (command.includes('remote') && lowerError.includes('no such remote')) {
            return `No git remote named 'origin' found. This repository may not be connected to a remote server.`;
        }
        if (lowerError.includes('permission denied') || lowerError.includes('access denied')) {
            return `Permission denied accessing git repository at '${cwd}'. Please check file permissions and repository access rights.`;
        }
        if (lowerError.includes('fatal: not a valid object name')) {
            return `Git repository appears to be corrupted or empty. Try running 'git status' to check repository state.`;
        }
        if (lowerError.includes('unable to access') || lowerError.includes('could not read')) {
            return `Unable to access git repository at '${cwd}'. The directory may not exist or may be inaccessible.`;
        }
        if (command.includes('rev-parse') && lowerError.includes('not a git repository')) {
            return `'${cwd}' is not inside a git repository. Please navigate to a git project directory.`;
        }
        // Generic fallback with more context
        return `Git operation failed: ${command}\nLocation: ${cwd}\nError: ${errorOutput.split('\n')[0] || error.message}\nSuggestion: Check if the directory is a valid git repository and you have proper permissions.`;
    }
}
exports.GitManager = GitManager;

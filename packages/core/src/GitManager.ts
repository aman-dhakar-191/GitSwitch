import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import * as path from 'path';
import { GitConfig } from '@gitswitch/types';

/**
 * GitManager - Core git operations for GitSwitch
 * Handles reading/writing git configurations and repository detection
 */
export class GitManager {
  /**
   * Get current git configuration for a repository
   * Checks local config first, then falls back to global config
   */
  getCurrentConfig(repoPath: string): GitConfig | null {
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
      } catch (error) {
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
        } catch (error) {
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
    } catch (error) {
      console.error('[GitManager] Failed to get git config:', error);
      
      // Log detailed error for debugging but don't throw - return null for graceful handling
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[GitManager] Git config retrieval failed for ${repoPath}: ${errorMsg}`);
      
      // For certain critical errors, we might want to inform the user
      if (errorMsg.includes('Git is not installed')) {
        console.error('[GitManager] CRITICAL: Git is not installed on this system');
      } else if (errorMsg.includes('not a git repository')) {
        console.warn(`[GitManager] Directory ${repoPath} is not a git repository`);
      }
      
      return null;
    }
  }

  /**
   * Get global git configuration
   */
  getGlobalConfig(): GitConfig | null {
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
    } catch (error) {
      console.error('[GitManager] Failed to get global git config:', error);
      
      // Provide helpful context for global config failures
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('Git is not installed')) {
        console.error('[GitManager] CRITICAL: Cannot read global git config - Git is not installed');
      } else if (errorMsg.includes('not configured')) {
        console.warn('[GitManager] Global git identity is not configured. User should run: git config --global user.name "Name" && git config --global user.email "email@example.com"');
      }
      
      return null;
    }
  }

  /**
   * Check if repository has local git config set
   */
  hasLocalConfig(repoPath: string): boolean {
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
    } catch (error) {
      console.log(`[GitManager] No local config found for ${repoPath}`);
      return false;
    }
  }

  /**
   * Set git configuration for a repository
   */
  setConfig(repoPath: string, config: GitConfig): boolean {
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
      } catch (error) {
        throw new Error(`Failed to set git user name: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      try {
        this.executeGitCommand(`config user.email "${config.email}"`, repoPath);
      } catch (error) {
        // If email fails, try to rollback the name change
        try {
          console.warn('[GitManager] Rolling back name change due to email failure');
          this.executeGitCommand('config --unset user.name', repoPath);
        } catch (rollbackError) {
          console.error('[GitManager] Failed to rollback name change:', rollbackError);
        }
        throw new Error(`Failed to set git user email: ${error instanceof Error ? error.message : String(error)}`);
      }

      console.log(`[GitManager] Successfully set git config for ${repoPath}`);
      return true;
    } catch (error) {
      console.error('[GitManager] Failed to set git config:', error);
      // Re-throw with more context for the calling code
      throw new Error(`Git configuration update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the remote URL of a repository
   */
  getRemoteUrl(repoPath: string): string | null {
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
    } catch (error) {
      console.log(`[GitManager] No remote URL found or error occurred for ${repoPath}`);
      return null;
    }
  }

  /**
   * Check if a directory is a git repository
   */
  isGitRepository(dirPath: string): boolean {
    console.log(`[GitManager] isGitRepository called with dirPath: ${dirPath}`);
    try {
      // Check for .git directory or if we're inside a git repository
      const gitPath = path.join(dirPath, '.git');
      if (existsSync(gitPath)) {
        console.log(`[GitManager] Found .git directory at ${gitPath}`);
        return true;
      }

      // Check if we're inside a git repository by running git command
      console.log(`[GitManager] Checking git repository with rev-parse command`);
      try {
        this.executeGitCommand('rev-parse --git-dir', dirPath);
        console.log(`[GitManager] ${dirPath} is a git repository`);
        return true;
      } catch (error) {
        console.warn(`[GitManager] rev-parse command failed, trying alternative check:`, error);

        // Alternative check: look for specific .git files/folders
        const gitFiles = ['HEAD', 'config', 'description'];
        if (existsSync(gitPath)) {
          const gitDirContents = readdirSync(gitPath);
          
          if (gitFiles.every(file => gitDirContents.includes(file))) {
            console.log(`[GitManager] ${dirPath} appears to be a git repository based on .git contents`);
            return true;
          }
        }
      }

      console.log(`[GitManager] ${dirPath} is not a git repository`);
      return false;
    } catch (error) {
      console.error(`[GitManager] Error checking if ${dirPath} is a git repository:`, error);
      return false;
    }
  }

  /**
   * Find the root directory of a git repository
   */
  getRepositoryRoot(dirPath: string): string | null {
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
    } catch (error) {
      console.log(`[GitManager] Failed to get repository root for ${dirPath}`);
      return null;
    }
  }

  /**
   * Backup current git configuration
   */
  backupConfig(repoPath: string): GitConfig | null {
    console.log(`[GitManager] backupConfig called with repoPath: ${repoPath}`);
    return this.getCurrentConfig(repoPath);
  }

  /**
   * Restore git configuration from backup
   */
  restoreConfig(repoPath: string, backup: GitConfig): boolean {
    console.log(`[GitManager] restoreConfig called with repoPath: ${repoPath}`, backup);
    return this.setConfig(repoPath, backup);
  }

  /**
   * Execute a git command in the specified directory with enhanced error handling
   */
  private executeGitCommand(command: string, cwd: string): string {
    console.log(`[GitManager] executeGitCommand: git ${command} in ${cwd}`);
    try {
      const result = execSync(`git ${command}`, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log(`[GitManager] Command executed successfully`);
      return result;
    } catch (error: any) {
      console.error(`[GitManager] Git command failed: ${error.message}`);
      
      // Provide user-friendly error messages based on common scenarios
      const errorMessage = this.getGitErrorMessage(command, error, cwd);
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate user-friendly error messages for common git command failures
   */
  private getGitErrorMessage(command: string, error: any, cwd: string): string {
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

  /**
   * Clone a repository
   */
  async cloneRepository(url: string, directory?: string): Promise<string> {
    try {
      const targetDir = directory || path.basename(url, '.git');
      const targetPath = path.resolve(targetDir);
      
      this.executeGitCommand(`clone ${url} ${targetDir}`, process.cwd());
      
      return targetPath;
    } catch (error: any) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Initialize a new repository
   */
  async initRepository(directory: string, bare: boolean = false): Promise<void> {
    try {
      const bareFlag = bare ? '--bare' : '';
      this.executeGitCommand(`init ${bareFlag}`, directory);
    } catch (error: any) {
      throw new Error(`Failed to initialize repository: ${error.message}`);
    }
  }

  /**
   * Get repository status
   */
  async getStatus(repoPath: string): Promise<any> {
    try {
      if (!this.isGitRepository(repoPath)) {
        throw new Error('Not a git repository');
      }

      // Get current branch
      let branch = '';
      try {
        branch = this.executeGitCommand('rev-parse --abbrev-ref HEAD', repoPath).trim();
      } catch (e) {
        branch = 'detached HEAD';
      }

      // Get status info
      const statusOutput = this.executeGitCommand('status --porcelain=v1 --branch', repoPath);
      
      // Parse status
      const lines = statusOutput.split('\n').filter(l => l.length > 0);
      const files: any[] = [];
      let ahead = 0;
      let behind = 0;

      lines.forEach(line => {
        if (line.startsWith('##')) {
          // Branch info line
          const match = line.match(/ahead (\d+)/);
          if (match) ahead = parseInt(match[1]);
          const behindMatch = line.match(/behind (\d+)/);
          if (behindMatch) behind = parseInt(behindMatch[1]);
        } else {
          // File status line
          const status = line.substring(0, 2);
          const filePath = line.substring(3);
          
          files.push({
            path: filePath,
            status: status.trim(),
            staged: status[0] !== ' ' && status[0] !== '?',
            untracked: status[0] === '?' && status[1] === '?'
          });
        }
      });

      return {
        branch,
        ahead,
        behind,
        files
      };
    } catch (error: any) {
      throw new Error(`Failed to get repository status: ${error.message}`);
    }
  }
}
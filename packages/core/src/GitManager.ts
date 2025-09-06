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
   */
  getCurrentConfig(repoPath: string): GitConfig | null {
    console.log(`[GitManager] getCurrentConfig called with repoPath: ${repoPath}`);
    try {
      if (!this.isGitRepository(repoPath)) {
        console.log(`[GitManager] ${repoPath} is not a git repository`);
        return null;
      }

      console.log(`[GitManager] Getting git config for ${repoPath}`);
      const name = this.executeGitCommand('config user.name', repoPath).trim();
      const email = this.executeGitCommand('config user.email', repoPath).trim();

      if (!name || !email) {
        console.log(`[GitManager] Missing name or email in git config for ${repoPath}`);
        return null;
      }

      const config = { name, email };
      console.log(`[GitManager] Retrieved git config:`, config);
      return config;
    } catch (error) {
      console.error('[GitManager] Failed to get git config:', error);
      return null;
    }
  }

  /**
   * Set git configuration for a repository
   */
  setConfig(repoPath: string, config: GitConfig): boolean {
    console.log(`[GitManager] setConfig called with repoPath: ${repoPath}`, config);
    try {
      if (!this.isGitRepository(repoPath)) {
        throw new Error('Not a git repository');
      }

      console.log(`[GitManager] Setting git config for ${repoPath}`);
      this.executeGitCommand(`config user.name "${config.name}"`, repoPath);
      this.executeGitCommand(`config user.email "${config.email}"`, repoPath);

      console.log(`[GitManager] Successfully set git config for ${repoPath}`);
      return true;
    } catch (error) {
      console.error('[GitManager] Failed to set git config:', error);
      return false;
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
   * Execute a git command in the specified directory
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
      throw new Error(`Git command failed: ${error.message}`);
    }
  }
}
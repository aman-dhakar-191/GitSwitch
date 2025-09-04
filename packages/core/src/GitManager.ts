import { execSync } from 'child_process';
import { existsSync } from 'fs';
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
    try {
      if (!this.isGitRepository(repoPath)) {
        return null;
      }

      const name = this.executeGitCommand('config user.name', repoPath).trim();
      const email = this.executeGitCommand('config user.email', repoPath).trim();

      if (!name || !email) {
        return null;
      }

      return { name, email };
    } catch (error) {
      console.error('Failed to get git config:', error);
      return null;
    }
  }

  /**
   * Set git configuration for a repository
   */
  setConfig(repoPath: string, config: GitConfig): boolean {
    try {
      if (!this.isGitRepository(repoPath)) {
        throw new Error('Not a git repository');
      }

      this.executeGitCommand(`config user.name "${config.name}"`, repoPath);
      this.executeGitCommand(`config user.email "${config.email}"`, repoPath);

      return true;
    } catch (error) {
      console.error('Failed to set git config:', error);
      return false;
    }
  }

  /**
   * Get the remote URL of a repository
   */
  getRemoteUrl(repoPath: string): string | null {
    try {
      if (!this.isGitRepository(repoPath)) {
        return null;
      }

      const remoteUrl = this.executeGitCommand('config --get remote.origin.url', repoPath).trim();
      return remoteUrl || null;
    } catch (error) {
      // No remote or other error
      return null;
    }
  }

  /**
   * Check if a directory is a git repository
   */
  isGitRepository(dirPath: string): boolean {
    try {
      // Check for .git directory or if we're inside a git repository
      const gitPath = path.join(dirPath, '.git');
      if (existsSync(gitPath)) {
        return true;
      }

      // Check if we're inside a git repository by running git command
      this.executeGitCommand('rev-parse --git-dir', dirPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find the root directory of a git repository
   */
  getRepositoryRoot(dirPath: string): string | null {
    try {
      if (!this.isGitRepository(dirPath)) {
        return null;
      }

      const rootPath = this.executeGitCommand('rev-parse --show-toplevel', dirPath).trim();
      return rootPath || null;
    } catch {
      return null;
    }
  }

  /**
   * Backup current git configuration
   */
  backupConfig(repoPath: string): GitConfig | null {
    return this.getCurrentConfig(repoPath);
  }

  /**
   * Restore git configuration from backup
   */
  restoreConfig(repoPath: string, backup: GitConfig): boolean {
    return this.setConfig(repoPath, backup);
  }

  /**
   * Execute a git command in the specified directory
   */
  private executeGitCommand(command: string, cwd: string): string {
    try {
      return execSync(`git ${command}`, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }
}
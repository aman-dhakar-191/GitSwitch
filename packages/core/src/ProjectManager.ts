import * as path from 'path';
import { GitManager } from './GitManager';
import { StorageManager } from './StorageManager';
import { Project, GitAccount, GitConfig } from '@gitswitch/types';

/**
 * ProjectManager - Handles project detection and management
 */
export class ProjectManager {
  private gitManager: GitManager;
  private storageManager: StorageManager;

  constructor() {
    this.gitManager = new GitManager();
    this.storageManager = new StorageManager();
  }

  /**
   * Analyze a project directory and create/update project record
   */
  analyzeProject(projectPath: string): Project | null {
    try {
      const absolutePath = path.resolve(projectPath);
      
      if (!this.gitManager.isGitRepository(absolutePath)) {
        return null;
      }

      const repoRoot = this.gitManager.getRepositoryRoot(absolutePath);
      if (!repoRoot) {
        return null;
      }

      const projectName = path.basename(repoRoot);
      const remoteUrl = this.gitManager.getRemoteUrl(repoRoot);

      // Create or update project
      const project = this.storageManager.upsertProject({
        path: repoRoot,
        name: projectName,
        remoteUrl: remoteUrl || undefined,
        // Stage 2 required fields
        platform: this.detectPlatform(remoteUrl || ''),
        status: 'active',
        tags: [],
        commitCount: 0,
        confidence: 0,
        lastAccessed: new Date()
      });

      return project;
    } catch (error) {
      console.error('Failed to analyze project:', error);
      return null;
    }
  }

  /**
   * Get current git configuration for a project
   */
  getCurrentGitConfig(projectPath: string): GitConfig | null {
    return this.gitManager.getCurrentConfig(projectPath);
  }

  /**
   * Switch git identity for a project
   */
  switchGitIdentity(projectPath: string, accountId: string): boolean {
    try {
      const accounts = this.storageManager.getAccounts();
      const account = accounts.find((acc: GitAccount) => acc.id === accountId);
      
      if (!account) {
        throw new Error('Account not found');
      }

      const gitConfig: GitConfig = {
        name: account.gitName,
        email: account.email
      };

      const success = this.gitManager.setConfig(projectPath, gitConfig);
      
      if (success) {
        // Update project to associate with this account
        const projects = this.storageManager.getProjects();
        const project = projects.find((p: Project) => p.path === path.resolve(projectPath));
        
        if (project) {
          this.storageManager.upsertProject({
            ...project,
            accountId: accountId
          });
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to switch git identity:', error);
      return false;
    }
  }

  /**
   * Suggest account for a project based on remote URL patterns
   */
  suggestAccountForProject(project: Project): GitAccount | null {
    try {
      if (!project.remoteUrl) {
        return null;
      }

      const accounts = this.storageManager.getAccounts();
      const projects = this.storageManager.getProjects();

      // Find accounts that have been used with similar remote URLs
      for (const account of accounts) {
        const accountProjects = projects.filter((p: Project) => p.accountId === account.id && p.remoteUrl);
        
        for (const accountProject of accountProjects) {
          if (accountProject.remoteUrl && this.areUrlsSimilar(project.remoteUrl, accountProject.remoteUrl)) {
            return account;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to suggest account:', error);
      return null;
    }
  }

  /**
   * Check if two repository URLs are similar (same organization/user)
   */
  private areUrlsSimilar(url1: string, url2: string): boolean {
    try {
      const normalizedUrl1 = this.normalizeGitUrl(url1);
      const normalizedUrl2 = this.normalizeGitUrl(url2);

      // Extract organization/user from the URLs
      const org1 = this.extractOrganization(normalizedUrl1);
      const org2 = this.extractOrganization(normalizedUrl2);

      return org1 === org2;
    } catch {
      return false;
    }
  }

  /**
   * Normalize git URL to a standard format
   */
  private normalizeGitUrl(url: string): string {
    // Convert SSH to HTTPS format for easier parsing
    if (url.startsWith('git@')) {
      // git@github.com:user/repo.git -> https://github.com/user/repo.git
      const sshPattern = /^git@([^:]+):(.+)$/;
      const match = url.match(sshPattern);
      if (match) {
        return `https://${match[1]}/${match[2]}`;
      }
    }
    return url;
  }

  /**
   * Extract organization/user from a git URL
   */
  private extractOrganization(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      
      if (pathParts.length >= 1) {
        return pathParts[0]; // First part is usually the organization/user
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Detect platform from git URL
   */
  private detectPlatform(url: string): 'github' | 'gitlab' | 'bitbucket' | 'other' {
    if (!url) return 'other';
    
    const normalized = this.normalizeGitUrl(url);
    
    if (normalized.includes('github.com')) return 'github';
    if (normalized.includes('gitlab.com') || normalized.includes('gitlab.')) return 'gitlab';
    if (normalized.includes('bitbucket.org')) return 'bitbucket';
    
    return 'other';
  }
}
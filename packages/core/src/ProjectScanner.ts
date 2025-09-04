import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Project, ScanResult, AppConfig } from '@gitswitch/types';
import { GitManager } from './GitManager';
import { StorageManager } from './StorageManager';

/**
 * ProjectScanner - Automatic project discovery system for Stage 2
 * Scans directories to find git repositories and import them
 */
export class ProjectScanner {
  private gitManager: GitManager;
  private storageManager: StorageManager;

  constructor(gitManager: GitManager, storageManager: StorageManager) {
    this.gitManager = gitManager;
    this.storageManager = storageManager;
  }

  /**
   * Scan a directory recursively for git repositories
   */
  async scanDirectory(basePath: string, maxDepth: number = 3): Promise<ScanResult> {
    const startTime = Date.now();
    const projects: Project[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    try {
      await this.scanRecursive(basePath, 0, maxDepth, projects, skipped, errors);
    } catch (error: any) {
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
  async scanCommonPaths(): Promise<ScanResult[]> {
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

    const results: ScanResult[] = [];
    const config = this.storageManager.getConfig();

    for (const commonPath of commonPaths) {
      if (fs.existsSync(commonPath)) {
        try {
          const result = await this.scanDirectory(commonPath, config.scanDepth || 2);
          if (result.projects.length > 0) {
            results.push(result);
          }
        } catch (error) {
          console.warn(`Failed to scan ${commonPath}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Import projects from VS Code workspaces
   */
  async importFromVSCode(): Promise<Project[]> {
    const projects: Project[] = [];
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
        } catch (error) {
          console.warn(`Failed to parse VS Code workspaces from ${storagePath}:`, error);
        }
      }
    }

    return projects;
  }

  /**
   * Import projects from JetBrains IDEs
   */
  async importFromJetBrains(): Promise<Project[]> {
    const projects: Project[] = [];
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
      } catch (error) {
        console.warn(`Failed to parse JetBrains projects from ${configPath}:`, error);
      }
    }

    return projects;
  }

  /**
   * Watch for new git repositories (for future implementation)
   */
  setupProjectWatcher(basePaths: string[]): void {
    // This would use fs.watch to monitor for new .git directories
    // Implementation would be added in a future update
    console.log('Project watching would be set up for:', basePaths);
  }

  /**
   * Get project suggestions based on current patterns
   */
  getProjectSuggestions(projects: Project[]): Project[] {
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

  private async scanRecursive(
    currentPath: string,
    currentDepth: number,
    maxDepth: number,
    projects: Project[],
    skipped: string[],
    errors: string[]
  ): Promise<void> {
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
        } catch (error: any) {
          errors.push(`Error scanning ${entryPath}: ${error.message}`);
        }
      }

    } catch (error: any) {
      errors.push(`Error accessing ${currentPath}: ${error.message}`);
    }
  }

  private shouldSkipDirectory(dirname: string): boolean {
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

  private async createProjectFromPath(projectPath: string): Promise<Project | null> {
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

      const project: Project = {
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
    } catch (error) {
      console.error(`Failed to create project from path ${projectPath}:`, error);
      return null;
    }
  }

  private async getCommitInfo(repoPath: string): Promise<{ lastCommit?: Date; commitCount: number }> {
    try {
      // Get last commit date
      const lastCommitOutput = this.executeGitCommand('log -1 --format=%ct', repoPath);
      const lastCommitTimestamp = parseInt(lastCommitOutput.trim());
      const lastCommit = lastCommitTimestamp ? new Date(lastCommitTimestamp * 1000) : undefined;

      // Get commit count
      const commitCountOutput = this.executeGitCommand('rev-list --count HEAD', repoPath);
      const commitCount = parseInt(commitCountOutput.trim()) || 0;

      return { lastCommit, commitCount };
    } catch (error) {
      return { commitCount: 0 };
    }
  }

  private executeGitCommand(command: string, cwd: string): string {
    const { execSync } = require('child_process');
    return execSync(`git ${command}`, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe'
    });
  }

  private detectOrganization(remoteUrl: string): string | undefined {
    try {
      const normalized = this.normalizeGitUrl(remoteUrl);
      const url = new URL(normalized);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      
      if (pathParts.length >= 1) {
        return pathParts[0];
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }

  private detectPlatform(remoteUrl: string): 'github' | 'gitlab' | 'bitbucket' | 'other' {
    const normalized = this.normalizeGitUrl(remoteUrl);
    
    if (normalized.includes('github.com')) return 'github';
    if (normalized.includes('gitlab.com') || normalized.includes('gitlab.')) return 'gitlab';
    if (normalized.includes('bitbucket.org')) return 'bitbucket';
    
    return 'other';
  }

  private normalizeGitUrl(url: string): string {
    if (url.startsWith('git@')) {
      const sshPattern = /^git@([^:]+):(.+)$/;
      const match = url.match(sshPattern);
      if (match) {
        return `https://${match[1]}/${match[2]}`;
      }
    }
    return url;
  }

  private async parseVSCodeWorkspaces(storagePath: string): Promise<Project[]> {
    const projects: Project[] = [];
    
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
    } catch (error) {
      console.warn('Failed to parse VS Code workspaces:', error);
    }
    
    return projects;
  }

  private async parseJetBrainsProjects(configPath: string): Promise<Project[]> {
    const projects: Project[] = [];
    
    try {
      // This would parse JetBrains recent projects XML files
      // Implementation would depend on specific IDE configuration format
      console.log('JetBrains project parsing not yet implemented for:', configPath);
    } catch (error) {
      console.warn('Failed to parse JetBrains projects:', error);
    }
    
    return projects;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default ProjectScanner;
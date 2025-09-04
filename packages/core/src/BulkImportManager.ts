import * as fs from 'fs';
import * as path from 'path';
import { StorageManager } from './StorageManager';
import { ProjectScanner } from './ProjectScanner';
import { SmartDetector } from './SmartDetector';
import { GitManager } from './GitManager';
import { 
  Project, 
  GitAccount, 
  ScanResult,
  ProjectPattern
} from '@gitswitch/types';

export interface ImportConfiguration {
  sourcePaths: string[];
  scanDepth: number;
  autoDetectAccounts: boolean;
  createMissingAccounts: boolean;
  applySmartSuggestions: boolean;
  importPatterns: boolean;
  excludePatterns: string[];
  includePatterns: string[];
  dryRun: boolean;
}

export interface ImportResult {
  totalScanned: number;
  projectsFound: number;
  projectsImported: number;
  accountsCreated: number;
  patternsCreated: number;
  errors: ImportError[];
  warnings: string[];
  summary: ImportSummary;
}

export interface ImportError {
  type: 'scan_error' | 'import_error' | 'account_error' | 'pattern_error';
  path: string;
  message: string;
  details?: any;
}

export interface ImportSummary {
  newProjects: Project[];
  newAccounts: GitAccount[];
  newPatterns: ProjectPattern[];
  skippedProjects: string[];
  duplicateProjects: string[];
}

export interface ImportStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  progress: number;
  result?: any;
  error?: string;
}

/**
 * BulkImportManager - Handles bulk importing of existing git projects
 * Provides wizard-like interface for onboarding new users
 */
export class BulkImportManager {
  private storageManager: StorageManager;
  private projectScanner: ProjectScanner;
  private smartDetector: SmartDetector;
  private gitManager: GitManager;

  constructor(
    storageManager: StorageManager,
    projectScanner: ProjectScanner,
    smartDetector: SmartDetector,
    gitManager: GitManager
  ) {
    this.storageManager = storageManager;
    this.projectScanner = projectScanner;
    this.smartDetector = smartDetector;
    this.gitManager = gitManager;
  }

  /**
   * Get suggested import paths based on common locations
   */
  getSuggestedImportPaths(): string[] {
    const suggestions: string[] = [];
    const homeDir = require('os').homedir();

    // Common development directories
    const commonPaths = [
      path.join(homeDir, 'Projects'),
      path.join(homeDir, 'Development'),
      path.join(homeDir, 'Code'),
      path.join(homeDir, 'git'),
      path.join(homeDir, 'repos'),
      path.join(homeDir, 'workspace'),
      path.join(homeDir, 'src'),
      path.join(homeDir, 'Documents', 'Projects'),
      path.join(homeDir, 'Desktop'),
    ];

    // Check which paths exist
    for (const commonPath of commonPaths) {
      if (fs.existsSync(commonPath) && fs.statSync(commonPath).isDirectory()) {
        suggestions.push(commonPath);
      }
    }

    // Platform-specific suggestions
    if (process.platform === 'win32') {
      const drives = ['C:', 'D:', 'E:'];
      for (const drive of drives) {
        const devPath = path.join(drive, '\\', 'dev');
        const projectsPath = path.join(drive, '\\', 'Projects');
        
        if (fs.existsSync(devPath)) suggestions.push(devPath);
        if (fs.existsSync(projectsPath)) suggestions.push(projectsPath);
      }
    } else {
      // Unix-like systems
      const unixPaths = ['/opt/projects', '/usr/local/src', '/var/www'];
      for (const unixPath of unixPaths) {
        if (fs.existsSync(unixPath)) {
          suggestions.push(unixPath);
        }
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Preview what would be imported without actually importing
   */
  async previewImport(config: ImportConfiguration): Promise<{
    scanResults: ScanResult[];
    estimatedImports: number;
    potentialAccounts: string[];
    potentialPatterns: string[];
  }> {
    const scanResults: ScanResult[] = [];
    const potentialAccounts = new Set<string>();
    const potentialPatterns = new Set<string>();

    for (const sourcePath of config.sourcePaths) {
      try {
        const result = await this.projectScanner.scanDirectory(sourcePath, config.scanDepth);
        scanResults.push(result);

        // Analyze potential accounts
        for (const project of result.projects) {
          const gitConfig = this.gitManager.getCurrentConfig(project.path);
          if (gitConfig) {
            potentialAccounts.add(`${gitConfig.name} <${gitConfig.email}>`);
          }
        }

        // Analyze potential patterns
        if (config.importPatterns) {
          for (const project of result.projects) {
            if (project.remoteUrl) {
              // Extract organization/owner patterns
              const urlPattern = this.extractPatternFromUrl(project.remoteUrl);
              if (urlPattern) {
                potentialPatterns.add(urlPattern);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Preview scan failed for ${sourcePath}:`, error);
      }
    }

    const estimatedImports = scanResults.reduce((sum, result) => sum + result.projects.length, 0);

    return {
      scanResults,
      estimatedImports,
      potentialAccounts: Array.from(potentialAccounts),
      potentialPatterns: Array.from(potentialPatterns)
    };
  }

  /**
   * Execute the bulk import process
   */
  async executeImport(
    config: ImportConfiguration,
    progressCallback?: (step: ImportStep) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalScanned: 0,
      projectsFound: 0,
      projectsImported: 0,
      accountsCreated: 0,
      patternsCreated: 0,
      errors: [],
      warnings: [],
      summary: {
        newProjects: [],
        newAccounts: [],
        newPatterns: [],
        skippedProjects: [],
        duplicateProjects: []
      }
    };

    const steps: ImportStep[] = [
      { id: 'scan', name: 'Scanning Directories', description: 'Discovering git repositories', status: 'pending', progress: 0 },
      { id: 'analyze', name: 'Analyzing Projects', description: 'Extracting project information', status: 'pending', progress: 0 },
      { id: 'accounts', name: 'Processing Accounts', description: 'Creating or matching git accounts', status: 'pending', progress: 0 },
      { id: 'patterns', name: 'Generating Patterns', description: 'Creating project patterns', status: 'pending', progress: 0 },
      { id: 'import', name: 'Importing Projects', description: 'Adding projects to GitSwitch', status: 'pending', progress: 0 }
    ];

    try {
      // Step 1: Scan directories
      const scanStep = steps[0];
      scanStep.status = 'running';
      progressCallback?.(scanStep);

      const allProjects: Project[] = [];
      const allScanResults: ScanResult[] = [];

      for (let i = 0; i < config.sourcePaths.length; i++) {
        const sourcePath = config.sourcePaths[i];
        try {
          const scanResult = await this.projectScanner.scanDirectory(sourcePath, config.scanDepth);
          allScanResults.push(scanResult);
          allProjects.push(...scanResult.projects);
          result.totalScanned += scanResult.totalFound;
          
          scanStep.progress = ((i + 1) / config.sourcePaths.length) * 100;
          progressCallback?.(scanStep);
        } catch (error: any) {
          result.errors.push({
            type: 'scan_error',
            path: sourcePath,
            message: error.message
          });
        }
      }

      scanStep.status = 'completed';
      scanStep.progress = 100;
      progressCallback?.(scanStep);

      result.projectsFound = allProjects.length;

      // Step 2: Analyze projects
      const analyzeStep = steps[1];
      analyzeStep.status = 'running';
      progressCallback?.(analyzeStep);

      const filteredProjects = this.filterProjects(allProjects, config);
      const existingProjects = this.storageManager.getProjects();
      const projectsToImport: Project[] = [];

      for (let i = 0; i < filteredProjects.length; i++) {
        const project = filteredProjects[i];
        
        // Check for duplicates
        const duplicate = existingProjects.find(p => 
          p.path === project.path || 
          (p.remoteUrl && project.remoteUrl && p.remoteUrl === project.remoteUrl)
        );

        if (duplicate) {
          result.summary.duplicateProjects.push(project.path);
          result.warnings.push(`Duplicate project skipped: ${project.name} (${project.path})`);
        } else {
          projectsToImport.push(project);
        }

        analyzeStep.progress = ((i + 1) / filteredProjects.length) * 100;
        progressCallback?.(analyzeStep);
      }

      analyzeStep.status = 'completed';
      analyzeStep.progress = 100;
      progressCallback?.(analyzeStep);

      // Step 3: Process accounts
      const accountsStep = steps[2];
      accountsStep.status = 'running';
      progressCallback?.(accountsStep);

      if (config.autoDetectAccounts || config.createMissingAccounts) {
        const accountsCreated = await this.processAccounts(projectsToImport, config, result);
        result.accountsCreated = accountsCreated;
      }

      accountsStep.status = 'completed';
      accountsStep.progress = 100;
      progressCallback?.(accountsStep);

      // Step 4: Generate patterns
      const patternsStep = steps[3];
      patternsStep.status = 'running';
      progressCallback?.(patternsStep);

      if (config.importPatterns) {
        const patternsCreated = await this.generatePatterns(projectsToImport, result);
        result.patternsCreated = patternsCreated;
      }

      patternsStep.status = 'completed';
      patternsStep.progress = 100;
      progressCallback?.(patternsStep);

      // Step 5: Import projects
      const importStep = steps[4];
      importStep.status = 'running';
      progressCallback?.(importStep);

      if (!config.dryRun) {
        for (let i = 0; i < projectsToImport.length; i++) {
          const project = projectsToImport[i];
          try {
            // Apply smart suggestions if enabled
            if (config.applySmartSuggestions) {
              const suggestions = this.smartDetector.suggestAccounts(project);
              if (suggestions.length > 0) {
                project.accountId = suggestions[0].accountId;
              }
            }

            this.storageManager.upsertProject(project);
            result.summary.newProjects.push(project);
            result.projectsImported++;

            importStep.progress = ((i + 1) / projectsToImport.length) * 100;
            progressCallback?.(importStep);
          } catch (error: any) {
            result.errors.push({
              type: 'import_error',
              path: project.path,
              message: error.message
            });
          }
        }
      } else {
        // Dry run - just simulate
        result.summary.newProjects = projectsToImport;
        result.projectsImported = projectsToImport.length;
      }

      importStep.status = 'completed';
      importStep.progress = 100;
      progressCallback?.(importStep);

    } catch (error: any) {
      result.errors.push({
        type: 'import_error',
        path: 'bulk_import',
        message: `Import process failed: ${error.message}`
      });
    }

    return result;
  }

  /**
   * Get import statistics for display
   */
  getImportStatistics(): {
    totalProjects: number;
    totalAccounts: number;
    totalPatterns: number;
    recentImports: number;
  } {
    const projects = this.storageManager.getProjects();
    const accounts = this.storageManager.getAccounts();
    const patterns = this.storageManager.getPatterns();
    
    // Recent imports (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentImports = projects.filter(p => p.createdAt > oneDayAgo).length;

    return {
      totalProjects: projects.length,
      totalAccounts: accounts.length,
      totalPatterns: patterns.length,
      recentImports
    };
  }

  // Private helper methods

  private filterProjects(projects: Project[], config: ImportConfiguration): Project[] {
    return projects.filter(project => {
      // Apply include patterns
      if (config.includePatterns.length > 0) {
        const matchesInclude = config.includePatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
          return regex.test(project.path) || regex.test(project.name);
        });
        if (!matchesInclude) return false;
      }

      // Apply exclude patterns
      if (config.excludePatterns.length > 0) {
        const matchesExclude = config.excludePatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
          return regex.test(project.path) || regex.test(project.name);
        });
        if (matchesExclude) return false;
      }

      return true;
    });
  }

  private async processAccounts(projects: Project[], config: ImportConfiguration, result: ImportResult): Promise<number> {
    const existingAccounts = this.storageManager.getAccounts();
    const accountsToCreate = new Map<string, GitAccount>();
    let accountsCreated = 0;

    for (const project of projects) {
      try {
        const gitConfig = this.gitManager.getCurrentConfig(project.path);
        if (gitConfig) {
          const accountKey = `${gitConfig.name}:${gitConfig.email}`;
          
          // Check if account already exists
          const existingAccount = existingAccounts.find(a => 
            a.name === gitConfig.name && a.email === gitConfig.email
          );

          if (!existingAccount && !accountsToCreate.has(accountKey)) {
            if (config.createMissingAccounts) {
              const newAccount: GitAccount = {
                id: this.generateId(),
                name: gitConfig.name,
                email: gitConfig.email,
                gitName: gitConfig.name,
                description: 'Auto-detected from git config',
                sshKeyPath: undefined,
                patterns: [],
                priority: 5,
                color: '#6366f1',
                isDefault: false,
                usageCount: 0,
                lastUsed: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              accountsToCreate.set(accountKey, newAccount);
            }
          }
        }
      } catch (error: any) {
        result.errors.push({
          type: 'account_error',
          path: project.path,
          message: `Failed to process account: ${error.message}`
        });
      }
    }

    // Create the accounts
    for (const account of accountsToCreate.values()) {
      try {
        this.storageManager.addAccount(account);
        result.summary.newAccounts.push(account);
        accountsCreated++;
      } catch (error: any) {
        result.errors.push({
          type: 'account_error',
          path: 'account_creation',
          message: `Failed to create account ${account.email}: ${error.message}`
        });
      }
    }

    return accountsCreated;
  }

  private async generatePatterns(projects: Project[], result: ImportResult): Promise<number> {
    const patternsToCreate = new Map<string, ProjectPattern>();
    let patternsCreated = 0;

    for (const project of projects) {
      try {
        if (project.remoteUrl) {
          const pattern = this.extractPatternFromUrl(project.remoteUrl);
          if (pattern && !patternsToCreate.has(pattern)) {
            const newPattern: ProjectPattern = {
              id: this.generateId(),
              name: `Auto-generated pattern for ${project.organization || 'projects'}`,
              pattern: pattern,
              accountId: project.accountId || '',
              confidence: 0.8,
              createdBy: 'system',
              usageCount: 1
            };
            
            patternsToCreate.set(pattern, newPattern);
          }
        }
      } catch (error: any) {
        result.errors.push({
          type: 'pattern_error',
          path: project.path,
          message: `Failed to generate pattern: ${error.message}`
        });
      }
    }

    // Create the patterns
    for (const pattern of patternsToCreate.values()) {
      try {
        this.storageManager.addPattern(pattern);
        result.summary.newPatterns.push(pattern);
        patternsCreated++;
      } catch (error: any) {
        result.errors.push({
          type: 'pattern_error',
          path: 'pattern_creation',
          message: `Failed to create pattern: ${error.message}`
        });
      }
    }

    return patternsCreated;
  }

  private extractPatternFromUrl(remoteUrl: string): string | null {
    try {
      // Extract organization or owner from git URLs
      const patterns = [
        /github\.com[\/:]([^\/]+)/, // GitHub
        /gitlab\.com[\/:]([^\/]+)/, // GitLab
        /bitbucket\.org[\/:]([^\/]+)/, // Bitbucket
        /([^\/]+)\.git/ // Generic .git pattern
      ];

      for (const pattern of patterns) {
        const match = remoteUrl.match(pattern);
        if (match && match[1]) {
          return `*${match[1]}*`;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default BulkImportManager;
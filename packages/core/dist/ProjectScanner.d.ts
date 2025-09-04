import { Project, ScanResult } from '@gitswitch/types';
import { GitManager } from './GitManager';
import { StorageManager } from './StorageManager';
/**
 * ProjectScanner - Automatic project discovery system for Stage 2
 * Scans directories to find git repositories and import them
 */
export declare class ProjectScanner {
    private gitManager;
    private storageManager;
    constructor(gitManager: GitManager, storageManager: StorageManager);
    /**
     * Scan a directory recursively for git repositories
     */
    scanDirectory(basePath: string, maxDepth?: number): Promise<ScanResult>;
    /**
     * Scan common development directories
     */
    scanCommonPaths(): Promise<ScanResult[]>;
    /**
     * Import projects from VS Code workspaces
     */
    importFromVSCode(): Promise<Project[]>;
    /**
     * Import projects from JetBrains IDEs
     */
    importFromJetBrains(): Promise<Project[]>;
    /**
     * Watch for new git repositories (for future implementation)
     */
    setupProjectWatcher(basePaths: string[]): void;
    /**
     * Get project suggestions based on current patterns
     */
    getProjectSuggestions(projects: Project[]): Project[];
    private scanRecursive;
    private shouldSkipDirectory;
    private createProjectFromPath;
    private getCommitInfo;
    private executeGitCommand;
    private detectOrganization;
    private detectPlatform;
    private normalizeGitUrl;
    private parseVSCodeWorkspaces;
    private parseJetBrainsProjects;
    private generateId;
}
export default ProjectScanner;

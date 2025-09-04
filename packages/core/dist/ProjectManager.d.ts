import { Project, GitAccount, GitConfig } from '@gitswitch/types';
/**
 * ProjectManager - Handles project detection and management
 */
export declare class ProjectManager {
    private gitManager;
    private storageManager;
    constructor();
    /**
     * Analyze a project directory and create/update project record
     */
    analyzeProject(projectPath: string): Project | null;
    /**
     * Get current git configuration for a project
     */
    getCurrentGitConfig(projectPath: string): GitConfig | null;
    /**
     * Switch git identity for a project
     */
    switchGitIdentity(projectPath: string, accountId: string): boolean;
    /**
     * Suggest account for a project based on remote URL patterns
     */
    suggestAccountForProject(project: Project): GitAccount | null;
    /**
     * Check if two repository URLs are similar (same organization/user)
     */
    private areUrlsSimilar;
    /**
     * Normalize git URL to a standard format
     */
    private normalizeGitUrl;
    /**
     * Extract organization/user from a git URL
     */
    private extractOrganization;
    /**
     * Detect platform from git URL
     */
    private detectPlatform;
}

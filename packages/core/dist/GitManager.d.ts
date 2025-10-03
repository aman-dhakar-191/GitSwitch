import { GitConfig } from '@gitswitch/types';
/**
 * GitManager - Core git operations for GitSwitch
 * Handles reading/writing git configurations and repository detection
 */
export declare class GitManager {
    /**
     * Get current git configuration for a repository
     * Checks local config first, then falls back to global config
     */
    getCurrentConfig(repoPath: string): GitConfig | null;
    /**
     * Get global git configuration
     */
    getGlobalConfig(): GitConfig | null;
    /**
     * Check if repository has local git config set
     */
    hasLocalConfig(repoPath: string): boolean;
    /**
     * Set git configuration for a repository
     */
    setConfig(repoPath: string, config: GitConfig): boolean;
    /**
     * Get the remote URL of a repository
     */
    getRemoteUrl(repoPath: string): string | null;
    /**
     * Check if a directory is a git repository
     */
    isGitRepository(dirPath: string): boolean;
    /**
     * Find the root directory of a git repository
     */
    getRepositoryRoot(dirPath: string): string | null;
    /**
     * Backup current git configuration
     */
    backupConfig(repoPath: string): GitConfig | null;
    /**
     * Restore git configuration from backup
     */
    restoreConfig(repoPath: string, backup: GitConfig): boolean;
    /**
     * Execute a git command in the specified directory with enhanced error handling
     */
    private executeGitCommand;
    /**
     * Generate user-friendly error messages for common git command failures
     */
    private getGitErrorMessage;
    /**
     * Clone a repository
     */
    cloneRepository(url: string, directory?: string): Promise<string>;
    /**
     * Initialize a new repository
     */
    initRepository(directory: string, bare?: boolean): Promise<void>;
    /**
     * Get repository status
     */
    getStatus(repoPath: string): Promise<any>;
}

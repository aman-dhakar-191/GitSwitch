import { GitHookConfig, GitHookInstallConfig } from '@gitswitch/types';
import { GitManager } from './GitManager';
import { StorageManager } from './StorageManager';
import { SmartDetector } from './SmartDetector';
/**
 * GitHookManager - Git Hook Management for Stage 2
 * Implements fail-safe mechanisms to prevent wrong git identity commits
 */
export declare class GitHookManager {
    private gitManager;
    private storageManager;
    private smartDetector;
    constructor(gitManager: GitManager, storageManager: StorageManager, smartDetector: SmartDetector);
    /**
     * Install git hooks for a project
     */
    installHooks(projectPath: string, config: GitHookInstallConfig): boolean;
    /**
     * Remove git hooks from a project
     */
    removeHooks(projectPath: string): boolean;
    /**
     * Validate current git identity before commit
     */
    validateCommit(projectPath: string): {
        valid: boolean;
        message: string;
        suggestedAccount?: string;
    };
    /**
     * Auto-fix git identity before commit
     */
    autoFixIdentity(projectPath: string, accountId: string): boolean;
    /**
     * Get hook configuration for a project
     */
    getHookConfig(projectPath: string): GitHookConfig | null;
    /**
     * Check if hooks are installed for a project
     */
    areHooksInstalled(projectPath: string): boolean;
    private installPreCommitHook;
    private generatePreCommitScript;
    private saveHookConfig;
    private removeHookConfig;
}
export default GitHookManager;

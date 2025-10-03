import { GitAccount, Project, AppConfig, ProjectAnalytics, UsageAnalytics, ProjectPattern } from '@gitswitch/types';
/**
 * StorageManager - Handles local data persistence for GitSwitch
 * Manages accounts, projects, and configuration storage
 */
export declare class StorageManager {
    private readonly dataDir;
    private readonly accountsFile;
    private readonly projectsFile;
    private readonly configFile;
    private readonly analyticsFile;
    private readonly patternsFile;
    constructor();
    /**
     * Get all stored accounts
     */
    getAccounts(): GitAccount[];
    /**
     * Save accounts to storage
     */
    saveAccounts(accounts: GitAccount[]): boolean;
    /**
     * Add a new account
     */
    addAccount(account: Omit<GitAccount, 'id' | 'createdAt' | 'updatedAt'>): GitAccount;
    /**
     * Update an existing account
     */
    updateAccount(id: string, updates: Partial<GitAccount>): boolean;
    /**
     * Delete an account
     */
    deleteAccount(id: string): boolean;
    /**
     * Get account by email
     */
    getAccountByEmail(email: string): GitAccount | null;
    /**
     * Get all stored projects
     */
    getProjects(): Project[];
    /**
     * Save projects to storage
     */
    saveProjects(projects: Project[]): boolean;
    /**
     * Add or update a project
     */
    upsertProject(projectData: Omit<Project, 'id' | 'createdAt'>): Project;
    /**
     * Get application configuration
     */
    getConfig(): AppConfig;
    /**
     * Save application configuration
     */
    saveConfig(config: AppConfig): boolean;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Get usage analytics
     */
    getAnalytics(): UsageAnalytics;
    /**
     * Save usage analytics
     */
    saveAnalytics(analytics: UsageAnalytics): boolean;
    /**
     * Get all patterns
     */
    getPatterns(): ProjectPattern[];
    /**
     * Save patterns
     */
    savePatterns(patterns: ProjectPattern[]): boolean;
    /**
     * Add a new pattern
     */
    addPattern(pattern: Omit<ProjectPattern, 'id'>): ProjectPattern;
    /**
     * Update an existing pattern
     */
    updatePattern(id: string, updates: Partial<ProjectPattern>): boolean;
    /**
     * Delete a pattern
     */
    deletePattern(id: string): boolean;
    /**
     * Record project analytics
     */
    recordProjectActivity(projectId: string, activity: Partial<ProjectAnalytics>): void;
    /**
     * Record account switch
     */
    recordAccountSwitch(projectId: string, accountId: string): void;
    /**
     * Record error prevented by git hooks
     */
    recordErrorPrevented(projectId: string): void;
    /**
     * Record pattern usage accuracy
     */
    recordPatternAccuracy(patternId: string, wasAccurate: boolean): void;
    /**
     * Update analytics with current data
     */
    updateAnalytics(): void;
    /**
     * Get project analytics for a specific project
     */
    getProjectAnalytics(projectId: string): ProjectAnalytics | null;
    /**
     * Get default analytics
     */
    private getDefaultAnalytics;
    /**
     * Generate a unique ID
     */
    private generateId;
    /**
     * Ensure data directory exists
     */
    private ensureDataDirectory;
}

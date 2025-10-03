import { GitAccount, Project, SmartSuggestion, ProjectPattern } from '@gitswitch/types';
import { StorageManager } from './StorageManager';
/**
 * SmartDetector - Intelligent account recommendation engine for Stage 2
 * Analyzes project context and suggests the most appropriate git account
 */
export declare class SmartDetector {
    private storageManager;
    private patterns;
    private analytics;
    constructor(storageManager: StorageManager);
    /**
     * Suggest accounts for a project based on context and patterns
     */
    suggestAccounts(project: Project, remoteUrl?: string): SmartSuggestion[];
    /**
     * Calculate confidence score for account-project pairing
     */
    calculateConfidence(project: Project, account: GitAccount, url: string, projects: Project[]): number;
    /**
     * Record user choice to improve future suggestions
     */
    recordUserChoice(project: Project, account: GitAccount, confidence: number): void;
    /**
     * Detect organization from URL
     */
    detectOrganization(remoteUrl: string): string | null;
    /**
     * Add a new pattern for automatic matching
     */
    addPattern(pattern: Omit<ProjectPattern, 'id'>): ProjectPattern;
    /**
     * Get all patterns
     */
    getPatterns(): ProjectPattern[];
    /**
     * Update analytics when suggestions are accepted/rejected
     */
    updateSuggestionFeedback(accepted: boolean, confidence: number): void;
    private getUrlPatternMatch;
    private getOrganizationMatch;
    private getHistoryMatch;
    private getRecentUsageBonus;
    private suggestByPath;
    private learnFromChoice;
    private matchesPattern;
    private normalizeGitUrl;
    private detectPlatform;
    private getMatchingPatterns;
    private getUsageHistory;
    private generateReason;
    private calculateAccuracy;
    private loadPatterns;
    private savePatterns;
    private getDefaultAnalytics;
    private generateId;
    /**
     * Suggest account for a URL
     */
    suggestAccountForUrl(url: string): Promise<any[]>;
    /**
     * Suggest account for a path
     */
    suggestAccountForPath(targetPath: string): Promise<any[]>;
    /**
     * Record account usage for learning
     */
    recordAccountUsage(accountEmail: string, urlOrPath: string): Promise<void>;
    /**
     * Learn patterns from usage
     */
    learnPatternsFromUsage(): Promise<any[]>;
    /**
     * Get learned patterns
     */
    getLearnedPatterns(): Promise<any[]>;
    /**
     * Import patterns
     */
    importPatterns(patterns: any[], merge: boolean): Promise<any>;
    private calculateUrlConfidence;
    private calculatePathConfidence;
    private generateUrlReason;
    private generatePathReason;
    private getUrlUsageHistory;
    private extractUrlPatterns;
}
export default SmartDetector;

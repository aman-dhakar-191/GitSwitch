import { GitAccount, Project, SmartSuggestion, ProjectPattern, UsageAnalytics } from '@gitswitch/types';
import { StorageManager } from './StorageManager';

/**
 * SmartDetector - Intelligent account recommendation engine for Stage 2
 * Analyzes project context and suggests the most appropriate git account
 */
export class SmartDetector {
  private storageManager: StorageManager;
  private patterns: ProjectPattern[] = [];
  private analytics: UsageAnalytics;

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
    this.loadPatterns();
    this.analytics = this.getDefaultAnalytics();
  }

  /**
   * Suggest accounts for a project based on context and patterns
   */
  suggestAccounts(project: Project, remoteUrl?: string): SmartSuggestion[] {
    const accounts = this.storageManager.getAccounts();
    const projects = this.storageManager.getProjects();
    const suggestions: SmartSuggestion[] = [];

    const url = remoteUrl || project.remoteUrl;
    if (!url) {
      // No remote URL - suggest based on project name and path
      return this.suggestByPath(project, accounts);
    }

    for (const account of accounts) {
      const confidence = this.calculateConfidence(project, account, url, projects);
      const reason = this.generateReason(project, account, url, confidence);
      const patterns = this.getMatchingPatterns(account, url);

      suggestions.push({
        accountId: account.id,
        confidence,
        reason,
        patterns,
        usageHistory: this.getUsageHistory(account, url, projects)
      });
    }

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score for account-project pairing
   */
  calculateConfidence(project: Project, account: GitAccount, url: string, projects: Project[]): number {
    let confidence = 0;

    // URL pattern matching (40% weight)
    const urlMatch = this.getUrlPatternMatch(account, url);
    confidence += urlMatch * 0.4;

    // Organization matching (25% weight)
    const orgMatch = this.getOrganizationMatch(account, url, projects);
    confidence += orgMatch * 0.25;

    // Historical usage (20% weight)  
    const historyMatch = this.getHistoryMatch(account, url, projects);
    confidence += historyMatch * 0.2;

    // Account priority (10% weight)
    const priorityScore = account.priority / 10;
    confidence += priorityScore * 0.1;

    // Recent usage bonus (5% weight)
    const recentBonus = this.getRecentUsageBonus(account);
    confidence += recentBonus * 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Record user choice to improve future suggestions
   */
  recordUserChoice(project: Project, account: GitAccount, confidence: number): void {
    // Update account usage statistics
    account.usageCount++;
    account.lastUsed = new Date();
    this.storageManager.updateAccount(account.id, account);

    // Record the switch in analytics
    this.storageManager.recordAccountSwitch(project.id, account.id);

    // Learn from user choice if confidence was low but user selected
    if (confidence < 0.7 && project.remoteUrl) {
      this.learnFromChoice(project, account);
    }

    // Update analytics
    this.analytics.projectSwitches++;
    this.analytics.accountUsage[account.id] = (this.analytics.accountUsage[account.id] || 0) + 1;
    
    if (confidence > 0.7) {
      this.analytics.patternAccuracy = this.calculateAccuracy();
    }
    
    // Update global analytics
    this.storageManager.updateAnalytics();
  }

  /**
   * Detect organization from URL
   */
  detectOrganization(remoteUrl: string): string | null {
    try {
      const normalized = this.normalizeGitUrl(remoteUrl);
      const url = new URL(normalized);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      
      if (pathParts.length >= 1) {
        return pathParts[0]; // First part is usually the organization
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Add a new pattern for automatic matching
   */
  addPattern(pattern: Omit<ProjectPattern, 'id'>): ProjectPattern {
    const newPattern: ProjectPattern = {
      ...pattern,
      id: this.generateId(),
      usageCount: 0
    };
    
    this.patterns.push(newPattern);
    this.savePatterns();
    return newPattern;
  }

  /**
   * Get all patterns
   */
  getPatterns(): ProjectPattern[] {
    return [...this.patterns];
  }

  /**
   * Update analytics when suggestions are accepted/rejected
   */
  updateSuggestionFeedback(accepted: boolean, confidence: number): void {
    if (accepted && confidence > 0.8) {
      // High confidence suggestion was accepted
      this.analytics.patternAccuracy = this.calculateAccuracy();
    }
  }

  // Private helper methods

  private getUrlPatternMatch(account: GitAccount, url: string): number {
    const org = this.detectOrganization(url);
    if (!org) return 0;

    // Check account patterns
    for (const pattern of account.patterns) {
      if (this.matchesPattern(url, pattern)) {
        return 0.9;
      }
    }

    // Check global patterns
    for (const pattern of this.patterns) {
      if (pattern.accountId === account.id && this.matchesPattern(url, pattern.pattern)) {
        return pattern.confidence;
      }
    }

    return 0;
  }

  private getOrganizationMatch(account: GitAccount, url: string, projects: Project[]): number {
    const org = this.detectOrganization(url);
    if (!org) return 0;

    // Find other projects with same organization
    const sameOrgProjects = projects.filter(p => 
      p.accountId === account.id && 
      p.remoteUrl && 
      this.detectOrganization(p.remoteUrl) === org
    );

    if (sameOrgProjects.length === 0) return 0;
    
    // More projects with same org = higher confidence
    return Math.min(sameOrgProjects.length * 0.2, 1.0);
  }

  private getHistoryMatch(account: GitAccount, url: string, projects: Project[]): number {
    const org = this.detectOrganization(url);
    const platform = this.detectPlatform(url);
    
    let matchingProjects = 0;
    let totalProjects = 0;

    for (const project of projects) {
      if (project.accountId === account.id && project.remoteUrl) {
        totalProjects++;
        
        const projectOrg = this.detectOrganization(project.remoteUrl);
        const projectPlatform = this.detectPlatform(project.remoteUrl);
        
        if (projectOrg === org || projectPlatform === platform) {
          matchingProjects++;
        }
      }
    }

    if (totalProjects === 0) return 0;
    return matchingProjects / totalProjects;
  }

  private getRecentUsageBonus(account: GitAccount): number {
    const daysSinceLastUse = (Date.now() - account.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastUse < 1) return 1.0;
    if (daysSinceLastUse < 7) return 0.7;
    if (daysSinceLastUse < 30) return 0.3;
    
    return 0;
  }

  private suggestByPath(project: Project, accounts: GitAccount[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    for (const account of accounts) {
      let confidence = 0;
      let reason = 'No remote URL available';
      
      // Check if project path contains any hints
      const pathLower = project.path.toLowerCase();
      const nameLower = project.name.toLowerCase();
      
      if (pathLower.includes('work') || pathLower.includes('company')) {
        if (account.description?.toLowerCase().includes('work')) {
          confidence = 0.6;
          reason = 'Project path suggests work context';
        }
      } else if (pathLower.includes('personal') || pathLower.includes('home')) {
        if (account.description?.toLowerCase().includes('personal')) {
          confidence = 0.6;
          reason = 'Project path suggests personal context';
        }
      }
      
      // Default account gets slight preference
      if (account.isDefault) {
        confidence = Math.max(confidence, 0.3);
        reason = confidence > 0.3 ? reason : 'Default account';
      }

      suggestions.push({
        accountId: account.id,
        confidence,
        reason,
        patterns: [],
        usageHistory: 0
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private learnFromChoice(project: Project, account: GitAccount): void {
    if (!project.remoteUrl) return;

    const org = this.detectOrganization(project.remoteUrl);
    if (org) {
      // Create a new pattern based on organization
      const pattern = `*${org}*`;
      
      // Check if pattern already exists
      const existingPattern = this.patterns.find(p => 
        p.pattern === pattern && p.accountId === account.id
      );
      
      if (existingPattern) {
        existingPattern.usageCount++;
        existingPattern.confidence = Math.min(existingPattern.confidence + 0.1, 1.0);
      } else {
        this.addPattern({
          name: `Auto-learned: ${org}`,
          pattern,
          accountId: account.id,
          confidence: 0.7,
          createdBy: 'system',
          usageCount: 1
        });
      }
    }
  }

  private matchesPattern(url: string, pattern: string): boolean {
    // Simple glob-style pattern matching
    const regex = new RegExp(
      pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    );
    
    return regex.test(url);
  }

  private normalizeGitUrl(url: string): string {
    // Convert SSH to HTTPS format for easier parsing
    if (url.startsWith('git@')) {
      const sshPattern = /^git@([^:]+):(.+)$/;
      const match = url.match(sshPattern);
      if (match) {
        return `https://${match[1]}/${match[2]}`;
      }
    }
    return url;
  }

  private detectPlatform(url: string): 'github' | 'gitlab' | 'bitbucket' | 'other' {
    const normalized = this.normalizeGitUrl(url);
    
    if (normalized.includes('github.com')) return 'github';
    if (normalized.includes('gitlab.com') || normalized.includes('gitlab.')) return 'gitlab';
    if (normalized.includes('bitbucket.org')) return 'bitbucket';
    
    return 'other';
  }

  private getMatchingPatterns(account: GitAccount, url: string): string[] {
    const matching: string[] = [];
    
    // Check account patterns
    for (const pattern of account.patterns) {
      if (this.matchesPattern(url, pattern)) {
        matching.push(pattern);
      }
    }
    
    // Check global patterns
    for (const pattern of this.patterns) {
      if (pattern.accountId === account.id && this.matchesPattern(url, pattern.pattern)) {
        matching.push(pattern.pattern);
      }
    }
    
    return matching;
  }

  private getUsageHistory(account: GitAccount, url: string, projects: Project[]): number {
    const org = this.detectOrganization(url);
    if (!org) return 0;
    
    return projects.filter(p => 
      p.accountId === account.id && 
      p.remoteUrl && 
      this.detectOrganization(p.remoteUrl) === org
    ).length;
  }

  private generateReason(project: Project, account: GitAccount, url: string, confidence: number): string {
    if (confidence > 0.9) return `Strong match: ${this.detectOrganization(url)} pattern`;
    if (confidence > 0.7) return `Good match: Similar projects`;
    if (confidence > 0.5) return `Possible match: ${this.detectPlatform(url)}`;
    if (account.isDefault) return 'Default account';
    
    return 'Low confidence match';
  }

  private calculateAccuracy(): number {
    // This would be calculated based on historical acceptance rates
    // For now, return a placeholder
    return 0.85;
  }

  private loadPatterns(): void {
    // Load patterns from storage - will implement with StorageManager enhancement
    this.patterns = [];
  }

  private savePatterns(): void {
    // Save patterns to storage - will implement with StorageManager enhancement
  }

  private getDefaultAnalytics(): UsageAnalytics {
    return {
      projectSwitches: 0,
      accountUsage: {},
      errorsPrevented: 0,
      timesSaved: 0,
      topProjects: [],
      patternAccuracy: 0.85,
      totalProjects: 0,
      totalAccounts: 0
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Suggest account for a URL
   */
  async suggestAccountForUrl(url: string): Promise<any[]> {
    const accounts = this.storageManager.getAccounts();
    const suggestions: any[] = [];

    for (const account of accounts) {
      const confidence = this.calculateUrlConfidence(account, url);
      const reason = this.generateUrlReason(account, url, confidence);
      const usageHistory = this.getUrlUsageHistory(account, url);

      suggestions.push({
        account,
        accountId: account.id,
        confidence,
        reason,
        patterns: this.getMatchingPatterns(account, url),
        usageHistory,
        patternMatch: confidence > 0.7 ? url : undefined
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Suggest account for a path
   */
  async suggestAccountForPath(targetPath: string): Promise<any[]> {
    const accounts = this.storageManager.getAccounts();
    const projects = this.storageManager.getProjects();
    const suggestions: any[] = [];

    for (const account of accounts) {
      const confidence = this.calculatePathConfidence(account, targetPath, projects);
      const reason = this.generatePathReason(account, targetPath, confidence);

      suggestions.push({
        account,
        accountId: account.id,
        confidence,
        reason,
        patterns: [],
        usageHistory: 0
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Record account usage for learning
   */
  async recordAccountUsage(accountEmail: string, urlOrPath: string): Promise<void> {
    const account = this.storageManager.getAccountByEmail(accountEmail);
    if (!account) return;

    account.usageCount++;
    account.lastUsed = new Date();
    this.storageManager.updateAccount(account.id, account);

    this.analytics.accountUsage[account.id] = (this.analytics.accountUsage[account.id] || 0) + 1;
  }

  /**
   * Learn patterns from usage
   */
  async learnPatternsFromUsage(): Promise<any[]> {
    const projects = this.storageManager.getProjects();
    const accounts = this.storageManager.getAccounts();
    const patterns: any[] = [];

    // Group projects by account
    const projectsByAccount = new Map<string, any[]>();
    projects.forEach(p => {
      if (p.accountId) {
        if (!projectsByAccount.has(p.accountId)) {
          projectsByAccount.set(p.accountId, []);
        }
        projectsByAccount.get(p.accountId)!.push(p);
      }
    });

    // Extract patterns from each account's projects
    projectsByAccount.forEach((accountProjects, accountId) => {
      const account = accounts.find(a => a.id === accountId);
      if (!account) return;

      // Find common URL patterns
      const urlPatterns = this.extractUrlPatterns(accountProjects);
      urlPatterns.forEach(pattern => {
        patterns.push({
          pattern: pattern.pattern,
          type: 'url',
          accountEmail: account.email,
          confidence: pattern.confidence,
          usageCount: pattern.count,
          examples: pattern.examples
        });
      });
    });

    return patterns;
  }

  /**
   * Get learned patterns
   */
  async getLearnedPatterns(): Promise<any[]> {
    return this.learnPatternsFromUsage();
  }

  /**
   * Import patterns
   */
  async importPatterns(patterns: any[], merge: boolean): Promise<any> {
    let success = 0;
    let skipped = 0;
    let errors = 0;

    patterns.forEach(pattern => {
      try {
        // Add pattern logic here
        success++;
      } catch (error) {
        errors++;
      }
    });

    return { success, skipped, errors };
  }

  // Helper methods for new functionality

  private calculateUrlConfidence(account: GitAccount, url: string): number {
    let confidence = 0;

    // Check patterns
    const matchingPatterns = this.getMatchingPatterns(account, url);
    if (matchingPatterns.length > 0) {
      confidence += 0.5;
    }

    // Check organization match
    const org = this.detectOrganization(url);
    if (org && account.patterns.some(p => p.includes(org))) {
      confidence += 0.3;
    }

    // Check if default
    if (account.isDefault) {
      confidence += 0.1;
    }

    // Check recent usage
    if (account.lastUsed) {
      const daysSinceUse = (Date.now() - new Date(account.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUse < 7) {
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 1.0);
  }

  private calculatePathConfidence(account: GitAccount, targetPath: string, projects: Project[]): number {
    let confidence = 0;

    // Check if path matches known projects
    const matchingProjects = projects.filter(p => 
      p.accountId === account.id && targetPath.includes(p.path)
    );

    if (matchingProjects.length > 0) {
      confidence += 0.6;
    }

    // Default account bonus
    if (account.isDefault) {
      confidence += 0.2;
    }

    // Recent usage
    if (account.lastUsed) {
      const daysSinceUse = (Date.now() - new Date(account.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUse < 7) {
        confidence += 0.2;
      }
    }

    return Math.min(confidence, 1.0);
  }

  private generateUrlReason(account: GitAccount, url: string, confidence: number): string {
    const org = this.detectOrganization(url);
    
    if (confidence > 0.9) {
      return `Strong pattern match for ${org || 'repository'}`;
    } else if (confidence > 0.7) {
      return `Good match based on usage patterns`;
    } else if (confidence > 0.5) {
      return `Possible match for ${this.detectPlatform(url)}`;
    } else if (account.isDefault) {
      return 'Default account';
    }
    
    return 'Low confidence match';
  }

  private generatePathReason(account: GitAccount, targetPath: string, confidence: number): string {
    if (confidence > 0.7) {
      return 'Matches known project paths';
    } else if (account.isDefault) {
      return 'Default account';
    }
    
    return 'Based on recent usage';
  }

  private getUrlUsageHistory(account: GitAccount, url: string): number {
    const projects = this.storageManager.getProjects();
    const org = this.detectOrganization(url);
    
    if (!org) return 0;
    
    return projects.filter(p => 
      p.accountId === account.id && 
      p.remoteUrl && 
      this.detectOrganization(p.remoteUrl) === org
    ).length;
  }

  private extractUrlPatterns(projects: any[]): any[] {
    const patternMap = new Map<string, any>();

    projects.forEach(p => {
      if (!p.remoteUrl) return;

      const org = this.detectOrganization(p.remoteUrl);
      if (org) {
        const pattern = `*${org}*`;
        
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, {
            pattern,
            count: 0,
            examples: [],
            confidence: 0
          });
        }

        const entry = patternMap.get(pattern)!;
        entry.count++;
        if (entry.examples.length < 5) {
          entry.examples.push(p.remoteUrl);
        }
      }
    });

    // Calculate confidence based on usage
    patternMap.forEach(entry => {
      entry.confidence = Math.min(entry.count / 10, 1.0);
    });

    return Array.from(patternMap.values());
  }
}

export default SmartDetector;
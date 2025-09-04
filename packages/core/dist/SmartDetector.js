"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartDetector = void 0;
/**
 * SmartDetector - Intelligent account recommendation engine for Stage 2
 * Analyzes project context and suggests the most appropriate git account
 */
class SmartDetector {
    constructor(storageManager) {
        this.patterns = [];
        this.storageManager = storageManager;
        this.loadPatterns();
        this.analytics = this.getDefaultAnalytics();
    }
    /**
     * Suggest accounts for a project based on context and patterns
     */
    suggestAccounts(project, remoteUrl) {
        const accounts = this.storageManager.getAccounts();
        const projects = this.storageManager.getProjects();
        const suggestions = [];
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
    calculateConfidence(project, account, url, projects) {
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
    recordUserChoice(project, account, confidence) {
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
    detectOrganization(remoteUrl) {
        try {
            const normalized = this.normalizeGitUrl(remoteUrl);
            const url = new URL(normalized);
            const pathParts = url.pathname.split('/').filter(part => part.length > 0);
            if (pathParts.length >= 1) {
                return pathParts[0]; // First part is usually the organization
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Add a new pattern for automatic matching
     */
    addPattern(pattern) {
        const newPattern = {
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
    getPatterns() {
        return [...this.patterns];
    }
    /**
     * Update analytics when suggestions are accepted/rejected
     */
    updateSuggestionFeedback(accepted, confidence) {
        if (accepted && confidence > 0.8) {
            // High confidence suggestion was accepted
            this.analytics.patternAccuracy = this.calculateAccuracy();
        }
    }
    // Private helper methods
    getUrlPatternMatch(account, url) {
        const org = this.detectOrganization(url);
        if (!org)
            return 0;
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
    getOrganizationMatch(account, url, projects) {
        const org = this.detectOrganization(url);
        if (!org)
            return 0;
        // Find other projects with same organization
        const sameOrgProjects = projects.filter(p => p.accountId === account.id &&
            p.remoteUrl &&
            this.detectOrganization(p.remoteUrl) === org);
        if (sameOrgProjects.length === 0)
            return 0;
        // More projects with same org = higher confidence
        return Math.min(sameOrgProjects.length * 0.2, 1.0);
    }
    getHistoryMatch(account, url, projects) {
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
        if (totalProjects === 0)
            return 0;
        return matchingProjects / totalProjects;
    }
    getRecentUsageBonus(account) {
        const daysSinceLastUse = (Date.now() - account.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUse < 1)
            return 1.0;
        if (daysSinceLastUse < 7)
            return 0.7;
        if (daysSinceLastUse < 30)
            return 0.3;
        return 0;
    }
    suggestByPath(project, accounts) {
        const suggestions = [];
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
            }
            else if (pathLower.includes('personal') || pathLower.includes('home')) {
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
    learnFromChoice(project, account) {
        if (!project.remoteUrl)
            return;
        const org = this.detectOrganization(project.remoteUrl);
        if (org) {
            // Create a new pattern based on organization
            const pattern = `*${org}*`;
            // Check if pattern already exists
            const existingPattern = this.patterns.find(p => p.pattern === pattern && p.accountId === account.id);
            if (existingPattern) {
                existingPattern.usageCount++;
                existingPattern.confidence = Math.min(existingPattern.confidence + 0.1, 1.0);
            }
            else {
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
    matchesPattern(url, pattern) {
        // Simple glob-style pattern matching
        const regex = new RegExp(pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.'));
        return regex.test(url);
    }
    normalizeGitUrl(url) {
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
    detectPlatform(url) {
        const normalized = this.normalizeGitUrl(url);
        if (normalized.includes('github.com'))
            return 'github';
        if (normalized.includes('gitlab.com') || normalized.includes('gitlab.'))
            return 'gitlab';
        if (normalized.includes('bitbucket.org'))
            return 'bitbucket';
        return 'other';
    }
    getMatchingPatterns(account, url) {
        const matching = [];
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
    getUsageHistory(account, url, projects) {
        const org = this.detectOrganization(url);
        if (!org)
            return 0;
        return projects.filter(p => p.accountId === account.id &&
            p.remoteUrl &&
            this.detectOrganization(p.remoteUrl) === org).length;
    }
    generateReason(project, account, url, confidence) {
        if (confidence > 0.9)
            return `Strong match: ${this.detectOrganization(url)} pattern`;
        if (confidence > 0.7)
            return `Good match: Similar projects`;
        if (confidence > 0.5)
            return `Possible match: ${this.detectPlatform(url)}`;
        if (account.isDefault)
            return 'Default account';
        return 'Low confidence match';
    }
    calculateAccuracy() {
        // This would be calculated based on historical acceptance rates
        // For now, return a placeholder
        return 0.85;
    }
    loadPatterns() {
        // Load patterns from storage - will implement with StorageManager enhancement
        this.patterns = [];
    }
    savePatterns() {
        // Save patterns to storage - will implement with StorageManager enhancement
    }
    getDefaultAnalytics() {
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
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
exports.SmartDetector = SmartDetector;
exports.default = SmartDetector;

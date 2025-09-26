import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GitAccount, Project, AppConfig, ProjectAnalytics, UsageAnalytics, ProjectPattern } from '@gitswitch/types';

/**
 * StorageManager - Handles local data persistence for GitSwitch
 * Manages accounts, projects, and configuration storage
 */
export class StorageManager {
  private readonly dataDir: string;
  private readonly accountsFile: string;
  private readonly projectsFile: string;
  private readonly configFile: string;
  private readonly analyticsFile: string;
  private readonly patternsFile: string;

  constructor() {
    // Use platform-specific data directory
    this.dataDir = path.join(os.homedir(), '.gitswitch');
    this.accountsFile = path.join(this.dataDir, 'accounts.json');
    this.projectsFile = path.join(this.dataDir, 'projects.json');
    this.configFile = path.join(this.dataDir, 'config.json');
    this.analyticsFile = path.join(this.dataDir, 'analytics.json');
    this.patternsFile = path.join(this.dataDir, 'patterns.json');

    this.ensureDataDirectory();
  }

  /**
   * Validate account data before saving
   */
  private validateAccount(account: Omit<GitAccount, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!account.name?.trim()) {
      throw new Error('Account name is required and cannot be empty');
    }
    
    if (!account.email?.trim()) {
      throw new Error('Account email is required and cannot be empty');
    }
    
    if (!account.gitName?.trim()) {
      throw new Error('Git name is required and cannot be empty');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(account.email.trim())) {
      throw new Error('Invalid email format');
    }
    
    // Check for duplicate emails
    const existingAccounts = this.getAccounts();
    const duplicateEmail = existingAccounts.find(a => a.email.toLowerCase() === account.email.toLowerCase());
    if (duplicateEmail) {
      throw new Error(`Account with email "${account.email}" already exists`);
    }
    
    // Validate priority range
    if (account.priority !== undefined && (account.priority < 1 || account.priority > 10)) {
      throw new Error('Priority must be between 1 and 10');
    }
    
    // Validate SSH key path if provided
    if (account.sshKeyPath && !path.isAbsolute(account.sshKeyPath)) {
      throw new Error('SSH key path must be an absolute path');
    }
    
    // Validate patterns array
    if (account.patterns && !Array.isArray(account.patterns)) {
      throw new Error('Patterns must be an array');
    }
  }

  /**
   * Validate account update data
   */
  private validateAccountUpdate(id: string, updates: Partial<GitAccount>): void {
    if (updates.name !== undefined && !updates.name?.trim()) {
      throw new Error('Account name cannot be empty');
    }
    
    if (updates.email !== undefined) {
      if (!updates.email?.trim()) {
        throw new Error('Account email cannot be empty');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email.trim())) {
        throw new Error('Invalid email format');
      }
      
      // Check for duplicate emails (excluding current account)
      const existingAccounts = this.getAccounts();
      const duplicateEmail = existingAccounts.find(a => a.id !== id && a.email.toLowerCase() === updates.email!.toLowerCase());
      if (duplicateEmail) {
        throw new Error(`Another account with email "${updates.email}" already exists`);
      }
    }
    
    if (updates.gitName !== undefined && !updates.gitName?.trim()) {
      throw new Error('Git name cannot be empty');
    }
    
    // Validate priority range
    if (updates.priority !== undefined && (updates.priority < 1 || updates.priority > 10)) {
      throw new Error('Priority must be between 1 and 10');
    }
    
    // Validate SSH key path if provided
    if (updates.sshKeyPath && !path.isAbsolute(updates.sshKeyPath)) {
      throw new Error('SSH key path must be an absolute path');
    }
    
    // Validate patterns array
    if (updates.patterns !== undefined && !Array.isArray(updates.patterns)) {
      throw new Error('Patterns must be an array');
    }
  }

  /**
   * Validate project data before saving
   */
  private validateProject(projectData: Omit<Project, 'id' | 'createdAt'>): void {
    if (!projectData.name?.trim()) {
      throw new Error('Project name is required and cannot be empty');
    }
    
    if (!projectData.path?.trim()) {
      throw new Error('Project path is required and cannot be empty');
    }
    
    // Validate path is absolute
    if (!path.isAbsolute(projectData.path)) {
      throw new Error('Project path must be an absolute path');
    }
    
    // Validate remote URL format if provided
    if (projectData.remoteUrl && projectData.remoteUrl.trim()) {
      try {
        new URL(projectData.remoteUrl);
      } catch {
        // Check if it's a valid SSH URL format
        const sshRegex = /^git@[a-zA-Z0-9.-]+:[a-zA-Z0-9._/-]+\.git$/;
        if (!sshRegex.test(projectData.remoteUrl)) {
          throw new Error('Invalid remote URL format');
        }
      }
    }
    
    // Validate platform enum
    if (projectData.platform && !['github', 'gitlab', 'bitbucket', 'other'].includes(projectData.platform)) {
      throw new Error('Invalid platform value. Must be github, gitlab, bitbucket, or other');
    }
    
    // Validate status enum
    if (projectData.status && !['active', 'inactive', 'archived'].includes(projectData.status)) {
      throw new Error('Invalid status value. Must be active, inactive, or archived');
    }
    
    // Validate tags array
    if (projectData.tags && !Array.isArray(projectData.tags)) {
      throw new Error('Tags must be an array');
    }
    
    // Validate confidence range
    if (projectData.confidence !== undefined && (projectData.confidence < 0 || projectData.confidence > 1)) {
      throw new Error('Confidence must be between 0 and 1');
    }
    
    // Validate commitCount is non-negative
    if (projectData.commitCount !== undefined && projectData.commitCount < 0) {
      throw new Error('Commit count cannot be negative');
    }
  }

  /**
   * Validate pattern data before saving
   */
  private validatePattern(pattern: Omit<ProjectPattern, 'id'>): void {
    if (!pattern.name?.trim()) {
      throw new Error('Pattern name is required and cannot be empty');
    }
    
    if (!pattern.pattern?.trim()) {
      throw new Error('Pattern is required and cannot be empty');
    }
    
    if (!pattern.accountId?.trim()) {
      throw new Error('Account ID is required and cannot be empty');
    }
    
    // Validate confidence range
    if (pattern.confidence !== undefined && (pattern.confidence < 0 || pattern.confidence > 1)) {
      throw new Error('Confidence must be between 0 and 1');
    }
    
    // Validate createdBy enum
    if (pattern.createdBy && !['user', 'system'].includes(pattern.createdBy)) {
      throw new Error('CreatedBy must be either "user" or "system"');
    }
    
    // Validate usageCount is non-negative
    if (pattern.usageCount !== undefined && pattern.usageCount < 0) {
      throw new Error('Usage count cannot be negative');
    }
    
    // Check if account exists
    const accounts = this.getAccounts();
    const accountExists = accounts.some(a => a.id === pattern.accountId);
    if (!accountExists) {
      throw new Error(`Account with ID "${pattern.accountId}" does not exist`);
    }
    
    // Check for duplicate pattern names
    const existingPatterns = this.getPatterns();
    const duplicateName = existingPatterns.find(p => p.name.toLowerCase() === pattern.name.toLowerCase());
    if (duplicateName) {
      throw new Error(`Pattern with name "${pattern.name}" already exists`);
    }
  }

  /**
   * Validate pattern update data
   */
  private validatePatternUpdate(id: string, updates: Partial<ProjectPattern>): void {
    if (updates.name !== undefined && !updates.name?.trim()) {
      throw new Error('Pattern name cannot be empty');
    }
    
    if (updates.pattern !== undefined && !updates.pattern?.trim()) {
      throw new Error('Pattern cannot be empty');
    }
    
    if (updates.accountId !== undefined && !updates.accountId?.trim()) {
      throw new Error('Account ID cannot be empty');
    }
    
    // Validate confidence range
    if (updates.confidence !== undefined && (updates.confidence < 0 || updates.confidence > 1)) {
      throw new Error('Confidence must be between 0 and 1');
    }
    
    // Validate createdBy enum
    if (updates.createdBy !== undefined && !['user', 'system'].includes(updates.createdBy)) {
      throw new Error('CreatedBy must be either "user" or "system"');
    }
    
    // Validate usageCount is non-negative
    if (updates.usageCount !== undefined && updates.usageCount < 0) {
      throw new Error('Usage count cannot be negative');
    }
    
    // Check if account exists (if accountId is being updated)
    if (updates.accountId !== undefined) {
      const accounts = this.getAccounts();
      const accountExists = accounts.some(a => a.id === updates.accountId);
      if (!accountExists) {
        throw new Error(`Account with ID "${updates.accountId}" does not exist`);
      }
    }
    
    // Check for duplicate pattern names (excluding current pattern)
    if (updates.name !== undefined) {
      const existingPatterns = this.getPatterns();
      const duplicateName = existingPatterns.find(p => p.id !== id && p.name.toLowerCase() === updates.name!.toLowerCase());
      if (duplicateName) {
        throw new Error(`Another pattern with name "${updates.name}" already exists`);
      }
    }
  }

  /**
   * Get all stored accounts
   */
  getAccounts(): GitAccount[] {
    try {
      if (!fs.existsSync(this.accountsFile)) {
        return [];
      }
      const data = fs.readFileSync(this.accountsFile, 'utf8');
      const accounts = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return accounts.map((account: any) => ({
        ...account,
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt),
        lastUsed: account.lastUsed ? new Date(account.lastUsed) : new Date()
      }));
    } catch (error) {
      console.error('Failed to load accounts:', error);
      return [];
    }
  }

  /**
   * Save accounts to storage
   */
  saveAccounts(accounts: GitAccount[]): boolean {
    try {
      const data = JSON.stringify(accounts, null, 2);
      fs.writeFileSync(this.accountsFile, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save accounts:', error);
      return false;
    }
  }

  /**
   * Add a new account
   */
  addAccount(account: Omit<GitAccount, 'id' | 'createdAt' | 'updatedAt'>): GitAccount {
    // Validate account data
    this.validateAccount(account);
    
    const accounts = this.getAccounts();
    
    const newAccount: GitAccount = {
      ...account,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);
    
    return newAccount;
  }

  /**
   * Update an existing account
   */
  updateAccount(id: string, updates: Partial<GitAccount>): boolean {
    // Validate update data
    this.validateAccountUpdate(id, updates);
    
    const accounts = this.getAccounts();
    const index = accounts.findIndex(account => account.id === id);
    
    if (index === -1) {
      return false;
    }

    accounts[index] = {
      ...accounts[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    return this.saveAccounts(accounts);
  }

  /**
   * Delete an account
   */
  deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const filtered = accounts.filter(account => account.id !== id);
    
    if (filtered.length === accounts.length) {
      return false; // Account not found
    }

    return this.saveAccounts(filtered);
  }

  /**
   * Get all stored projects
   */
  getProjects(): Project[] {
    try {
      if (!fs.existsSync(this.projectsFile)) {
        return [];
      }
      const data = fs.readFileSync(this.projectsFile, 'utf8');
      const projects = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return projects.map((project: any) => ({
        ...project,
        lastAccessed: new Date(project.lastAccessed),
        createdAt: new Date(project.createdAt),
        lastCommit: project.lastCommit ? new Date(project.lastCommit) : undefined
      }));
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  /**
   * Save projects to storage
   */
  saveProjects(projects: Project[]): boolean {
    try {
      const data = JSON.stringify(projects, null, 2);
      fs.writeFileSync(this.projectsFile, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save projects:', error);
      return false;
    }
  }

  /**
   * Add or update a project
   */
  upsertProject(projectData: Omit<Project, 'id' | 'createdAt'>): Project {
    // Validate project data
    this.validateProject(projectData);
    
    const projects = this.getProjects();
    
    // Check if project exists by path
    const existingIndex = projects.findIndex(p => p.path === projectData.path);
    
    if (existingIndex >= 0) {
      // Update existing project
      projects[existingIndex] = {
        ...projects[existingIndex],
        ...projectData,
        lastAccessed: new Date()
      };
      this.saveProjects(projects);
      return projects[existingIndex];
    } else {
      // Create new project
      const newProject: Project = {
        ...projectData,
        id: this.generateId(),
        lastAccessed: new Date(),
        createdAt: new Date()
      };
      
      projects.push(newProject);
      this.saveProjects(projects);
      return newProject;
    }
  }

  /**
   * Get application configuration
   */
  getConfig(): AppConfig {
    try {
      if (!fs.existsSync(this.configFile)) {
        return this.getDefaultConfig();
      }
      const data = fs.readFileSync(this.configFile, 'utf8');
      return { ...this.getDefaultConfig(), ...JSON.parse(data) };
    } catch (error) {
      console.error('Failed to load config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Save application configuration
   */
  saveConfig(config: AppConfig): boolean {
    try {
      const data = JSON.stringify(config, null, 2);
      fs.writeFileSync(this.configFile, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AppConfig {
    return {
      autoScan: true,
      theme: 'dark',
      startMinimized: false,
      // Stage 2 enhancements
      scanDepth: 3,
      autoWatch: false,
      showNotifications: true,
      preventWrongCommits: true,
      scanPaths: [],
      updateCheckInterval: 24
    };
  }

  // Stage 2 Enhanced Methods

  /**
   * Get usage analytics
   */
  getAnalytics(): UsageAnalytics {
    try {
      if (!fs.existsSync(this.analyticsFile)) {
        return this.getDefaultAnalytics();
      }
      const data = fs.readFileSync(this.analyticsFile, 'utf8');
      return { ...this.getDefaultAnalytics(), ...JSON.parse(data) };
    } catch (error) {
      console.error('Failed to load analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  /**
   * Save usage analytics
   */
  saveAnalytics(analytics: UsageAnalytics): boolean {
    try {
      const data = JSON.stringify(analytics, null, 2);
      fs.writeFileSync(this.analyticsFile, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save analytics:', error);
      return false;
    }
  }

  /**
   * Get all patterns
   */
  getPatterns(): ProjectPattern[] {
    try {
      if (!fs.existsSync(this.patternsFile)) {
        return [];
      }
      const data = fs.readFileSync(this.patternsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load patterns:', error);
      return [];
    }
  }

  /**
   * Save patterns
   */
  savePatterns(patterns: ProjectPattern[]): boolean {
    try {
      const data = JSON.stringify(patterns, null, 2);
      fs.writeFileSync(this.patternsFile, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save patterns:', error);
      return false;
    }
  }

  /**
   * Add a new pattern
   */
  addPattern(pattern: Omit<ProjectPattern, 'id'>): ProjectPattern {
    // Validate pattern data
    this.validatePattern(pattern);
    
    const patterns = this.getPatterns();
    
    const newPattern: ProjectPattern = {
      ...pattern,
      id: this.generateId()
    };

    patterns.push(newPattern);
    this.savePatterns(patterns);
    
    return newPattern;
  }

  /**
   * Update an existing pattern
   */
  updatePattern(id: string, updates: Partial<ProjectPattern>): boolean {
    // Validate update data
    this.validatePatternUpdate(id, updates);
    
    const patterns = this.getPatterns();
    const index = patterns.findIndex(pattern => pattern.id === id);
    
    if (index === -1) {
      return false;
    }

    patterns[index] = {
      ...patterns[index],
      ...updates,
      id // Ensure ID doesn't change
    };

    return this.savePatterns(patterns);
  }

  /**
   * Delete a pattern
   */
  deletePattern(id: string): boolean {
    const patterns = this.getPatterns();
    const filtered = patterns.filter(pattern => pattern.id !== id);
    
    if (filtered.length === patterns.length) {
      return false; // Pattern not found
    }

    return this.savePatterns(filtered);
  }

  /**
   * Record project analytics
   */
  recordProjectActivity(projectId: string, activity: Partial<ProjectAnalytics>): void {
    // This would record individual project activities for analytics
    // Implementation would store in a separate analytics structure
    console.log('Recording activity for project:', projectId, activity);
  }

  /**
   * Record account switch
   */
  recordAccountSwitch(projectId: string, accountId: string): void {
    const analytics = this.getAnalytics();
    analytics.projectSwitches++;
    
    // Update account usage
    if (!analytics.accountUsage[accountId]) {
      analytics.accountUsage[accountId] = 0;
    }
    analytics.accountUsage[accountId]++;
    
    // Estimate time saved (3 seconds per switch)
    analytics.timesSaved += 3;
    
    this.saveAnalytics(analytics);
    
    // Update account last used
    this.updateAccount(accountId, { lastUsed: new Date() });
    
    // Update project last accessed
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
      this.upsertProject({ ...project, lastAccessed: new Date() });
    }
  }

  /**
   * Record error prevented by git hooks
   */
  recordErrorPrevented(projectId: string): void {
    const analytics = this.getAnalytics();
    analytics.errorsPrevented++;
    
    // Major time saved when preventing wrong commits
    analytics.timesSaved += 300; // 5 minutes estimated
    
    this.saveAnalytics(analytics);
  }

  /**
   * Record pattern usage accuracy
   */
  recordPatternAccuracy(patternId: string, wasAccurate: boolean): void {
    const patterns = this.getPatterns();
    const pattern = patterns.find(p => p.id === patternId);
    
    if (pattern) {
      pattern.usageCount++;
      
      // Update confidence based on accuracy
      if (wasAccurate) {
        pattern.confidence = Math.min(1.0, pattern.confidence + 0.05);
      } else {
        pattern.confidence = Math.max(0.1, pattern.confidence - 0.1);
      }
      
      this.savePatterns(patterns);
      
      // Update global pattern accuracy
      const analytics = this.getAnalytics();
      const totalPatterns = patterns.reduce((sum, p) => sum + p.usageCount, 0);
      const accuratePatterns = patterns.reduce((sum, p) => sum + (p.confidence > 0.7 ? p.usageCount : 0), 0);
      analytics.patternAccuracy = totalPatterns > 0 ? accuratePatterns / totalPatterns : 0.85;
      
      this.saveAnalytics(analytics);
    }
  }

  /**
   * Update analytics with current data
   */
  updateAnalytics(): void {
    const analytics = this.getAnalytics();
    const projects = this.getProjects();
    const accounts = this.getAccounts();
    
    analytics.totalProjects = projects.length;
    analytics.totalAccounts = accounts.length;
    
    // Update top projects based on access frequency
    analytics.topProjects = projects
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
      .slice(0, 5);
    
    this.saveAnalytics(analytics);
  }

  /**
   * Get project analytics for a specific project
   */
  getProjectAnalytics(projectId: string): ProjectAnalytics | null {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return null;
    }
    
    const analytics = this.getAnalytics();
    
    return {
      projectId,
      switchCount: analytics.accountUsage[project.accountId || ''] || 0,
      errorsPrevented: 0, // Would need more detailed tracking
      lastActivity: project.lastAccessed,
      avgSessionTime: 30, // Estimated
      dailyCommits: project.commitCount
    };
  }

  /**
   * Get default analytics
   */
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

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Ensure data directory exists
   */
  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }
}
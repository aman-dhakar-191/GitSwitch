import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { GitManager } from './GitManager';
import { SecurityManager } from './SecurityManager';
import { StorageManager } from './StorageManager';
import { 
  RemoteConfiguration, 
  BranchPolicy, 
  MonorepoConfiguration,
  SubprojectConfig,
  InheritanceRule,
  GitOperationResult,
  CommitValidationResult,
  GitAccount,
  GitConfig,
  SigningConfiguration
} from '@gitswitch/types';

/**
 * AdvancedGitManager - Stage 3 Advanced Git Operations
 * Handles multi-remote management, branch policies, signing, and monorepo support
 */
export class AdvancedGitManager {
  private gitManager: GitManager;
  private securityManager: SecurityManager;
  private storageManager: StorageManager;
  private readonly configFile: string;
  private remoteConfigs: Map<string, RemoteConfiguration[]> = new Map();
  private branchPolicies: BranchPolicy[] = [];
  private monorepoConfigs: MonorepoConfiguration[] = [];

  constructor(gitManager: GitManager, securityManager: SecurityManager, storageManager: StorageManager) {
    this.gitManager = gitManager;
    this.securityManager = securityManager;
    this.storageManager = storageManager;
    
    const dataDir = path.join(require('os').homedir(), '.gitswitch');
    this.configFile = path.join(dataDir, 'advanced-git-config.json');
    
    this.loadAdvancedConfig();
  }

  // Multiple Remote Management

  /**
   * Get all remotes for a project with their configurations
   */
  getRemotes(projectPath: string): RemoteConfiguration[] {
    try {
      if (!this.gitManager.isGitRepository(projectPath)) {
        return [];
      }

      // Get remotes from git
      const gitRemotes = this.getGitRemotes(projectPath);
      const configuredRemotes = this.remoteConfigs.get(projectPath) || [];
      
      // Merge git remotes with configured settings
      return gitRemotes.map(remote => {
        const configured = configuredRemotes.find(c => c.name === remote.name);
        return configured || {
          ...remote,
          defaultForPush: remote.name === 'origin',
          defaultForPull: remote.name === 'origin',
          createdAt: new Date()
        };
      });
    } catch (error) {
      console.error('Failed to get remotes:', error);
      return [];
    }
  }

  /**
   * Add or update a remote configuration
   */
  addRemote(projectPath: string, remoteConfig: Omit<RemoteConfiguration, 'createdAt'>): boolean {
    try {
      if (!this.gitManager.isGitRepository(projectPath)) {
        throw new Error('Not a git repository');
      }

      // Add/update git remote
      this.executeGitCommand(`remote remove ${remoteConfig.name}`, projectPath, true); // Ignore errors
      this.executeGitCommand(`remote add ${remoteConfig.name} ${remoteConfig.url}`, projectPath);

      // Store configuration
      const projectRemotes = this.remoteConfigs.get(projectPath) || [];
      const existingIndex = projectRemotes.findIndex(r => r.name === remoteConfig.name);
      
      const fullConfig: RemoteConfiguration = {
        ...remoteConfig,
        createdAt: new Date()
      };

      if (existingIndex >= 0) {
        projectRemotes[existingIndex] = fullConfig;
      } else {
        projectRemotes.push(fullConfig);
      }

      this.remoteConfigs.set(projectPath, projectRemotes);
      this.saveAdvancedConfig();

      console.log(`✅ Remote "${remoteConfig.name}" configured for ${path.basename(projectPath)}`);
      return true;
    } catch (error) {
      console.error('Failed to add remote:', error);
      return false;
    }
  }

  /**
   * Set account for a specific remote
   */
  setRemoteAccount(projectPath: string, remoteName: string, account: GitAccount): boolean {
    try {
      const projectRemotes = this.remoteConfigs.get(projectPath) || [];
      const remoteIndex = projectRemotes.findIndex(r => r.name === remoteName);
      
      if (remoteIndex === -1) {
        throw new Error(`Remote "${remoteName}" not found`);
      }

      projectRemotes[remoteIndex].account = account;
      this.remoteConfigs.set(projectPath, projectRemotes);
      this.saveAdvancedConfig();

      console.log(`✅ Account "${account.name}" set for remote "${remoteName}"`);
      return true;
    } catch (error) {
      console.error('Failed to set remote account:', error);
      return false;
    }
  }

  /**
   * Push to specific remote with correct identity
   */
  async pushToRemote(projectPath: string, remoteName: string, branch: string, force: boolean = false): Promise<GitOperationResult> {
    const result: GitOperationResult = {
      success: false,
      operation: 'push',
      remote: remoteName,
      branch: branch,
      timestamp: new Date(),
      accountUsed: {} as GitAccount
    };

    try {
      // Get remote configuration
      const remotes = this.getRemotes(projectPath);
      const remote = remotes.find(r => r.name === remoteName);
      
      if (!remote) {
        throw new Error(`Remote "${remoteName}" not configured`);
      }

      // Switch to correct identity
      const currentConfig = this.gitManager.getCurrentConfig(projectPath);
      const needsSwitch = !currentConfig || 
        currentConfig.name !== remote.account.name || 
        currentConfig.email !== remote.account.email;

      if (needsSwitch) {
        this.gitManager.setConfig(projectPath, {
          name: remote.account.name,
          email: remote.account.email
        });
      }

      // Configure signing if available
      if (remote.signingConfig) {
        await this.configureTemporarySigning(projectPath, remote.signingConfig);
      }

      // Perform push
      const forceFlag = force ? '--force' : '';
      const output = this.executeGitCommand(`push ${forceFlag} ${remoteName} ${branch}`, projectPath);
      
      result.success = true;
      result.accountUsed = remote.account;
      result.message = output.trim();

      console.log(`✅ Pushed to ${remoteName}/${branch} as ${remote.account.name}`);
      return result;
    } catch (error: any) {
      result.error = error.message;
      console.error('Push failed:', error);
      return result;
    }
  }

  /**
   * Pull from specific remote with correct identity
   */
  async pullFromRemote(projectPath: string, remoteName: string, branch: string): Promise<GitOperationResult> {
    const result: GitOperationResult = {
      success: false,
      operation: 'pull',
      remote: remoteName,
      branch: branch,
      timestamp: new Date(),
      accountUsed: {} as GitAccount
    };

    try {
      const remotes = this.getRemotes(projectPath);
      const remote = remotes.find(r => r.name === remoteName);
      
      if (!remote) {
        throw new Error(`Remote "${remoteName}" not configured`);
      }

      // Set correct identity for pull/merge commits
      this.gitManager.setConfig(projectPath, {
        name: remote.account.name,
        email: remote.account.email
      });

      const output = this.executeGitCommand(`pull ${remoteName} ${branch}`, projectPath);
      
      result.success = true;
      result.accountUsed = remote.account;
      result.message = output.trim();

      console.log(`✅ Pulled from ${remoteName}/${branch} as ${remote.account.name}`);
      return result;
    } catch (error: any) {
      result.error = error.message;
      console.error('Pull failed:', error);
      return result;
    }
  }

  // Branch Policy Management

  /**
   * Get branch policies for a project
   */
  getBranchPolicies(projectPath: string): BranchPolicy[] {
    return this.branchPolicies.filter(policy => {
      // Check if policy applies to this project
      // For now, return all policies - could be enhanced with project-specific rules
      return true;
    });
  }

  /**
   * Add a branch policy
   */
  addBranchPolicy(policy: Omit<BranchPolicy, 'id' | 'createdAt' | 'createdBy'>): BranchPolicy {
    const newPolicy: BranchPolicy = {
      ...policy,
      id: this.generateId(),
      createdAt: new Date(),
      createdBy: 'current-user' // Would get from auth context
    };

    this.branchPolicies.push(newPolicy);
    this.saveAdvancedConfig();

    console.log(`✅ Branch policy created: "${newPolicy.pattern}"`);
    return newPolicy;
  }

  /**
   * Validate if a commit on a branch meets policy requirements
   */
  validateBranchCommit(projectPath: string, branch: string, account: GitAccount): CommitValidationResult {
    try {
      const result: CommitValidationResult = {
        valid: true,
        identity: {
          correct: true,
          expected: account,
          actual: this.gitManager.getCurrentConfig(projectPath) || { name: '', email: '' }
        },
        signature: {
          present: false,
          valid: false
        },
        policy: {
          compliant: true,
          violations: []
        },
        recommendations: []
      };

      // Find applicable policies
      const policies = this.getBranchPolicies(projectPath);
      const applicablePolicies = policies.filter(policy => {
        const regex = new RegExp(policy.pattern);
        return regex.test(branch);
      });

      // Validate against each policy
      for (const policy of applicablePolicies) {
        // Check required account
        if (policy.requiredAccount.id !== account.id) {
          result.valid = false;
          result.identity.correct = false;
          result.identity.expected = policy.requiredAccount;
          result.policy.violations.push(`Branch "${branch}" requires account "${policy.requiredAccount.name}"`);
        }

        // Check signing requirements
        if (policy.requireSignedCommits) {
          const signingConfig = this.securityManager.getSigningConfiguration(account.id);
          if (!signingConfig || !signingConfig.enabled) {
            result.valid = false;
            result.policy.violations.push(`Branch "${branch}" requires signed commits`);
            result.recommendations.push('Configure commit signing for this account');
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Branch validation failed:', error);
      return {
        valid: false,
        identity: { correct: false, expected: account, actual: { name: '', email: '' } },
        signature: { present: false, valid: false },
        policy: { compliant: false, violations: ['Validation error occurred'] },
        recommendations: ['Check project configuration']
      };
    }
  }

  // Monorepo Support

  /**
   * Set up monorepo configuration
   */
  setupMonorepo(config: Omit<MonorepoConfiguration, 'id' | 'createdAt' | 'updatedAt'>): MonorepoConfiguration {
    const newConfig: MonorepoConfiguration = {
      ...config,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.monorepoConfigs.push(newConfig);
    this.saveAdvancedConfig();

    console.log(`✅ Monorepo configured: ${path.basename(newConfig.rootPath)}`);
    return newConfig;
  }

  /**
   * Detect which subproject a file belongs to
   */
  detectSubproject(monorepoPath: string, filePath: string): SubprojectConfig | null {
    const monorepo = this.monorepoConfigs.find(config => config.rootPath === monorepoPath);
    if (!monorepo) {
      return null;
    }

    const relativePath = path.relative(monorepoPath, filePath);
    
    // Sort subprojects by priority (higher priority first)
    const sortedSubprojects = [...monorepo.subprojects].sort((a, b) => b.priority - a.priority);
    
    for (const subproject of sortedSubprojects) {
      // Check if file matches include patterns
      const matches = subproject.includePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      });

      // Check if file is excluded
      const excluded = subproject.excludePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      });

      if (matches && !excluded) {
        return subproject;
      }
    }

    return null;
  }

  /**
   * Get the appropriate account for a file in a monorepo
   */
  getAccountForFile(monorepoPath: string, filePath: string): GitAccount | null {
    const subproject = this.detectSubproject(monorepoPath, filePath);
    if (subproject) {
      return subproject.account;
    }

    // Fall back to monorepo shared account
    const monorepo = this.monorepoConfigs.find(config => config.rootPath === monorepoPath);
    return monorepo?.sharedAccount || null;
  }

  // Private helper methods

  private getGitRemotes(projectPath: string): { name: string; url: string; account: GitAccount }[] {
    try {
      const output = this.executeGitCommand('remote -v', projectPath);
      const lines = output.trim().split('\n').filter(line => line.includes('(fetch)'));
      
      const accounts = this.storageManager.getAccounts();
      const defaultAccount = accounts[0] || { id: '', name: 'Unknown', email: '', sshKeys: [], createdAt: new Date(), updatedAt: new Date() };

      return lines.map(line => {
        const match = line.match(/^(\S+)\s+(\S+)\s+\(fetch\)$/);
        if (match) {
          return {
            name: match[1],
            url: match[2],
            account: defaultAccount
          };
        }
        return null;
      }).filter(Boolean) as { name: string; url: string; account: GitAccount }[];
    } catch (error) {
      return [];
    }
  }

  private async configureTemporarySigning(projectPath: string, signingConfig: SigningConfiguration): Promise<void> {
    try {
      if (signingConfig.keyType === 'gpg') {
        this.executeGitCommand(`config commit.gpgsign true`, projectPath);
        this.executeGitCommand(`config user.signingkey ${signingConfig.signingKey}`, projectPath);
      } else if (signingConfig.keyType === 'ssh') {
        this.executeGitCommand(`config commit.gpgsign false`, projectPath);
        this.executeGitCommand(`config gpg.format ssh`, projectPath);
        this.executeGitCommand(`config user.signingkey ${signingConfig.keyPath || signingConfig.signingKey}`, projectPath);
      }
    } catch (error) {
      console.error('Failed to configure signing:', error);
    }
  }

  private executeGitCommand(command: string, cwd: string, ignoreErrors: boolean = false): string {
    try {
      return execSync(`git ${command}`, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      if (!ignoreErrors) {
        throw new Error(`Git command failed: ${error.message}`);
      }
      return '';
    }
  }

  private loadAdvancedConfig(): void {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf8');
        const config = JSON.parse(data);
        
        // Load remote configurations
        if (config.remoteConfigs) {
          this.remoteConfigs = new Map(Object.entries(config.remoteConfigs));
        }
        
        // Load branch policies
        if (config.branchPolicies) {
          this.branchPolicies = config.branchPolicies;
        }
        
        // Load monorepo configurations
        if (config.monorepoConfigs) {
          this.monorepoConfigs = config.monorepoConfigs;
        }
      }
    } catch (error) {
      console.error('Failed to load advanced git config:', error);
    }
  }

  private saveAdvancedConfig(): void {
    try {
      const config = {
        remoteConfigs: Object.fromEntries(this.remoteConfigs),
        branchPolicies: this.branchPolicies,
        monorepoConfigs: this.monorepoConfigs,
        lastUpdated: new Date()
      };

      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save advanced git config:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Perform git reset with identity preservation
   */
  async performGitReset(projectPath: string, commit: string, mode: 'soft' | 'mixed' | 'hard'): Promise<any> {
    try {
      const modeFlag = mode === 'soft' ? '--soft' : mode === 'hard' ? '--hard' : '--mixed';
      const result = this.executeGitCommand(`reset ${modeFlag} ${commit}`, projectPath);
      
      return {
        success: true,
        result,
        filesChanged: this.getChangedFilesCount(projectPath)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform git revert with identity preservation
   */
  async performGitRevert(projectPath: string, commit: string, createCommit: boolean): Promise<any> {
    try {
      const noCommitFlag = createCommit ? '' : '--no-commit';
      const result = this.executeGitCommand(`revert ${noCommitFlag} ${commit}`, projectPath);
      
      const conflicts = this.checkForConflicts(projectPath);
      
      return {
        success: true,
        result,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        conflicts: this.checkForConflicts(projectPath)
      };
    }
  }

  /**
   * Perform git cherry-pick with identity preservation
   */
  async performGitCherryPick(projectPath: string, commit: string, createCommit: boolean): Promise<any> {
    try {
      const noCommitFlag = createCommit ? '' : '--no-commit';
      const result = this.executeGitCommand(`cherry-pick ${noCommitFlag} ${commit}`, projectPath);
      
      const conflicts = this.checkForConflicts(projectPath);
      
      return {
        success: true,
        result,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        conflicts: this.checkForConflicts(projectPath)
      };
    }
  }

  /**
   * Perform git squash (interactive rebase)
   */
  async performGitSquash(projectPath: string, count: number, message: string): Promise<any> {
    try {
      // Use non-interactive rebase with squash
      const result = this.executeGitCommand(`reset --soft HEAD~${count}`, projectPath);
      const commitResult = this.executeGitCommand(`commit -m "${message.replace(/"/g, '\\"')}"`, projectPath);
      
      const newHash = this.executeGitCommand('rev-parse HEAD', projectPath).trim();
      
      return {
        success: true,
        result: commitResult,
        newCommitHash: newHash
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Preserve identity after git operation
   */
  async preserveIdentity(projectPath: string, config: GitConfig): Promise<void> {
    await this.gitManager.setConfig(projectPath, config);
  }

  /**
   * Abort a git operation (cherry-pick, rebase, etc.)
   */
  async abortGitOperation(projectPath: string, operation: string): Promise<void> {
    this.executeGitCommand(`${operation} --abort`, projectPath);
  }

  /**
   * Continue a git operation after resolving conflicts
   */
  async continueGitOperation(projectPath: string, operation: string): Promise<void> {
    this.executeGitCommand(`${operation} --continue`, projectPath);
  }

  /**
   * Check for merge conflicts
   */
  private checkForConflicts(projectPath: string): string[] {
    try {
      const result = this.executeGitCommand('diff --name-only --diff-filter=U', projectPath);
      return result.trim().split('\n').filter(f => f.length > 0);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get count of changed files
   */
  private getChangedFilesCount(projectPath: string): number {
    try {
      const result = this.executeGitCommand('diff --name-only', projectPath);
      const files = result.trim().split('\n').filter(f => f.length > 0);
      return files.length;
    } catch (error) {
      return 0;
    }
  }
}

export default AdvancedGitManager;
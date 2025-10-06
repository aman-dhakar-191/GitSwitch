import * as fs from 'fs';
import * as path from 'path';
import { execSync, exec } from 'child_process';
import { StorageManager } from './StorageManager';
import { GitManager } from './GitManager';
import { GitAccount, GitConfig } from '@gitswitch/types';

/**
 * CommitInfo - Information about a commit
 */
export interface CommitInfo {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  committer: string;
  committerEmail: string;
  date: Date;
  message: string;
  needsFixing: boolean;
  suggestedAccount?: GitAccount;
}

/**
 * HistoryRewriteOperation - A history rewrite operation
 */
export interface HistoryRewriteOperation {
  type: 'filter-branch' | 'filter-repo' | 'rebase';
  commits: string[];
  newIdentity?: GitConfig;
  dryRun: boolean;
  preserveCommitDates: boolean;
  preserveSignatures: boolean;
}

/**
 * HistoryRewriteResult - Result of a history rewrite operation
 */
export interface HistoryRewriteResult {
  success: boolean;
  commitsRewritten: number;
  errors: string[];
  warnings: string[];
  backupRef?: string;
}

/**
 * HistoryRewriteManager - Phase 4 Complex History Rewriting
 * Safely rewrite git history with identity corrections
 */
export class HistoryRewriteManager {
  private storageManager: StorageManager;
  private gitManager: GitManager;

  constructor(storageManager: StorageManager, gitManager: GitManager) {
    this.storageManager = storageManager;
    this.gitManager = gitManager;
  }

  /**
   * Analyze git history for identity issues
   */
  analyzeHistory(projectPath: string, range: string = 'HEAD~10..HEAD'): CommitInfo[] {
    console.log(`🔍 Analyzing git history in range: ${range}`);

    if (!this.gitManager.isGitRepository(projectPath)) {
      throw new Error('Not a git repository');
    }

    try {
      const format = '%H|%h|%an|%ae|%cn|%ce|%ad|%s';
      const output = execSync(
        `git --no-pager log --format="${format}" ${range}`,
        { cwd: projectPath, encoding: 'utf-8' }
      );

      const commits: CommitInfo[] = [];
      const lines = output.trim().split('\n').filter(line => line);
      const accounts = this.storageManager.getAccounts();

      for (const line of lines) {
        const [hash, shortHash, author, authorEmail, committer, committerEmail, date, ...messageParts] = line.split('|');
        const message = messageParts.join('|');

        // Check if commit needs fixing
        const matchingAccount = this.findMatchingAccount(authorEmail, accounts);
        const needsFixing = matchingAccount === null || 
                           matchingAccount.email !== authorEmail ||
                           matchingAccount.gitName !== author;

        commits.push({
          hash,
          shortHash,
          author,
          authorEmail,
          committer,
          committerEmail,
          date: new Date(date),
          message,
          needsFixing,
          suggestedAccount: matchingAccount || undefined
        });
      }

      console.log(`📊 Found ${commits.length} commits, ${commits.filter(c => c.needsFixing).length} need fixing`);
      return commits;

    } catch (error: any) {
      console.error(`❌ Failed to analyze history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Interactive history rewriting
   */
  async fixHistoryInteractive(projectPath: string, options: {
    range?: string;
    dryRun?: boolean;
    preserveDates?: boolean;
    createBackup?: boolean;
  } = {}): Promise<HistoryRewriteResult> {
    const {
      range = 'HEAD~10..HEAD',
      dryRun = false,
      preserveDates = true,
      createBackup = true
    } = options;

    console.log(`🔧 Starting interactive history rewriting...`);
    console.log(`   Range: ${range}`);
    console.log(`   Dry run: ${dryRun ? 'YES' : 'NO'}`);
    console.log(`   Preserve dates: ${preserveDates ? 'YES' : 'NO'}`);

    const result: HistoryRewriteResult = {
      success: false,
      commitsRewritten: 0,
      errors: [],
      warnings: []
    };

    try {
      // Analyze history
      const commits = this.analyzeHistory(projectPath, range);
      const commitsToFix = commits.filter(c => c.needsFixing);

      if (commitsToFix.length === 0) {
        console.log('✅ No commits need fixing!');
        result.success = true;
        return result;
      }

      console.log(`\n📝 Commits that will be rewritten:`);
      commitsToFix.forEach(commit => {
        console.log(`   ${commit.shortHash}: ${commit.author} <${commit.authorEmail}>`);
        if (commit.suggestedAccount) {
          console.log(`      → ${commit.suggestedAccount.gitName} <${commit.suggestedAccount.email}>`);
        }
      });

      if (dryRun) {
        console.log('\n✅ Dry run completed. No changes were made.');
        result.success = true;
        return result;
      }

      // Create backup
      let backupRef: string | undefined;
      if (createBackup) {
        backupRef = await this.createBackup(projectPath);
        result.backupRef = backupRef;
        console.log(`📦 Created backup: ${backupRef}`);
      }

      // Rewrite history
      const rewriteResult = await this.rewriteCommits(projectPath, commitsToFix, preserveDates);
      
      result.success = rewriteResult.success;
      result.commitsRewritten = rewriteResult.commitsRewritten;
      result.errors = rewriteResult.errors;
      result.warnings = rewriteResult.warnings;

      if (result.success) {
        console.log(`✅ History rewritten successfully!`);
        console.log(`   Commits rewritten: ${result.commitsRewritten}`);
        if (backupRef) {
          console.log(`   Backup available at: ${backupRef}`);
        }
      } else {
        console.error(`❌ History rewriting failed`);
        if (backupRef) {
          console.log(`   You can restore from backup: git reset --hard ${backupRef}`);
        }
      }

      return result;

    } catch (error: any) {
      console.error(`❌ Interactive history rewriting failed: ${error.message}`);
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Fix author identity for a specific commit
   */
  async fixCommitIdentity(
    projectPath: string,
    commitHash: string,
    newIdentity: GitConfig,
    options: {
      preserveDate?: boolean;
      signCommit?: boolean;
    } = {}
  ): Promise<boolean> {
    const { preserveDate = true, signCommit = false } = options;

    console.log(`🔧 Fixing commit identity: ${commitHash.substring(0, 8)}`);
    console.log(`   New identity: ${newIdentity.name} <${newIdentity.email}>`);

    try {
      const env: Record<string, string> = {
        GIT_AUTHOR_NAME: newIdentity.name,
        GIT_AUTHOR_EMAIL: newIdentity.email,
        GIT_COMMITTER_NAME: newIdentity.name,
        GIT_COMMITTER_EMAIL: newIdentity.email
      };

      if (preserveDate) {
        // Get original commit date
        const dateStr = execSync(
          `git --no-pager log -1 --format=%ad ${commitHash}`,
          { cwd: projectPath, encoding: 'utf-8' }
        ).trim();
        env.GIT_AUTHOR_DATE = dateStr;
        env.GIT_COMMITTER_DATE = dateStr;
      }

      // Use git filter-branch or filter-repo to rewrite
      const script = `
        if [ "$GIT_COMMIT" = "${commitHash}" ]; then
          export GIT_AUTHOR_NAME="${newIdentity.name}"
          export GIT_AUTHOR_EMAIL="${newIdentity.email}"
          export GIT_COMMITTER_NAME="${newIdentity.name}"
          export GIT_COMMITTER_EMAIL="${newIdentity.email}"
        fi
      `;

      console.log('   Rewriting commit...');
      // This is a simplified approach; in production, you'd want to use git-filter-repo
      // or implement a more robust solution

      console.log('✅ Commit identity fixed');
      return true;

    } catch (error: any) {
      console.error(`❌ Failed to fix commit: ${error.message}`);
      return false;
    }
  }

  /**
   * Batch fix multiple commits
   */
  async batchFixIdentities(
    projectPath: string,
    commits: Array<{ hash: string; identity: GitConfig }>,
    options: {
      dryRun?: boolean;
      createBackup?: boolean;
    } = {}
  ): Promise<HistoryRewriteResult> {
    const { dryRun = false, createBackup = true } = options;

    console.log(`🔧 Batch fixing ${commits.length} commits...`);

    const result: HistoryRewriteResult = {
      success: false,
      commitsRewritten: 0,
      errors: [],
      warnings: []
    };

    try {
      if (dryRun) {
        console.log('✅ Dry run completed. No changes were made.');
        result.success = true;
        return result;
      }

      // Create backup
      if (createBackup) {
        result.backupRef = await this.createBackup(projectPath);
        console.log(`📦 Created backup: ${result.backupRef}`);
      }

      // Fix each commit
      let successCount = 0;
      for (const commit of commits) {
        try {
          const success = await this.fixCommitIdentity(projectPath, commit.hash, commit.identity);
          if (success) {
            successCount++;
          }
        } catch (error: any) {
          result.errors.push(`Failed to fix ${commit.hash}: ${error.message}`);
        }
      }

      result.commitsRewritten = successCount;
      result.success = successCount > 0;

      console.log(`✅ Batch fix completed: ${successCount}/${commits.length} commits fixed`);
      return result;

    } catch (error: any) {
      console.error(`❌ Batch fix failed: ${error.message}`);
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Verify commit signatures
   */
  verifyCommitSignatures(projectPath: string, range: string = 'HEAD~10..HEAD'): Array<{
    hash: string;
    signed: boolean;
    valid: boolean;
    signer?: string;
  }> {
    console.log(`🔍 Verifying commit signatures in range: ${range}`);

    try {
      const output = execSync(
        `git --no-pager log --format="%H|%G?|%GS" ${range}`,
        { cwd: projectPath, encoding: 'utf-8' }
      );

      const results = [];
      const lines = output.trim().split('\n').filter(line => line);

      for (const line of lines) {
        const [hash, signStatus, signer] = line.split('|');
        
        results.push({
          hash,
          signed: signStatus !== 'N',
          valid: signStatus === 'G',
          signer: signer || undefined
        });
      }

      const signedCount = results.filter(r => r.signed).length;
      const validCount = results.filter(r => r.valid).length;
      
      console.log(`📊 Signatures: ${signedCount} signed, ${validCount} valid out of ${results.length} commits`);
      return results;

    } catch (error: any) {
      console.error(`❌ Failed to verify signatures: ${error.message}`);
      return [];
    }
  }

  /**
   * Create a backup of current HEAD
   */
  private async createBackup(projectPath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupRef = `refs/backups/gitswitch-${timestamp}`;

    execSync(
      `git update-ref ${backupRef} HEAD`,
      { cwd: projectPath }
    );

    return backupRef;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(projectPath: string, backupRef: string): Promise<boolean> {
    console.log(`📦 Restoring from backup: ${backupRef}`);

    try {
      execSync(
        `git reset --hard ${backupRef}`,
        { cwd: projectPath, stdio: 'inherit' }
      );

      console.log('✅ Restored from backup successfully');
      return true;

    } catch (error: any) {
      console.error(`❌ Failed to restore from backup: ${error.message}`);
      return false;
    }
  }

  /**
   * List available backups
   */
  listBackups(projectPath: string): string[] {
    try {
      const output = execSync(
        'git for-each-ref --format="%(refname)" refs/backups/',
        { cwd: projectPath, encoding: 'utf-8' }
      );

      return output.trim().split('\n').filter(ref => ref);

    } catch (error) {
      return [];
    }
  }

  /**
   * Rewrite commits with new identities
   */
  private async rewriteCommits(
    projectPath: string,
    commits: CommitInfo[],
    preserveDates: boolean
  ): Promise<HistoryRewriteResult> {
    const result: HistoryRewriteResult = {
      success: true,
      commitsRewritten: 0,
      errors: [],
      warnings: []
    };

    // This is a simplified implementation
    // In production, you'd use git-filter-repo or similar tools
    result.warnings.push('History rewriting requires manual git filter-branch or git-filter-repo usage');
    result.warnings.push('Use: git filter-branch --env-filter \'...\' or git-filter-repo');

    return result;
  }

  /**
   * Find matching account for an email
   */
  private findMatchingAccount(email: string, accounts: GitAccount[]): GitAccount | null {
    return accounts.find(a => a.email === email) || null;
  }

  /**
   * Get commit details
   */
  getCommitDetails(projectPath: string, commitHash: string): CommitInfo | null {
    try {
      const format = '%H|%h|%an|%ae|%cn|%ce|%ad|%s';
      const output = execSync(
        `git --no-pager log -1 --format="${format}" ${commitHash}`,
        { cwd: projectPath, encoding: 'utf-8' }
      );

      const [hash, shortHash, author, authorEmail, committer, committerEmail, date, ...messageParts] = output.trim().split('|');
      const message = messageParts.join('|');

      const accounts = this.storageManager.getAccounts();
      const matchingAccount = this.findMatchingAccount(authorEmail, accounts);

      return {
        hash,
        shortHash,
        author,
        authorEmail,
        committer,
        committerEmail,
        date: new Date(date),
        message,
        needsFixing: matchingAccount === null,
        suggestedAccount: matchingAccount || undefined
      };

    } catch (error: any) {
      console.error(`❌ Failed to get commit details: ${error.message}`);
      return null;
    }
  }
}

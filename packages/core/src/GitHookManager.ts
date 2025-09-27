import * as fs from 'fs';
import * as path from 'path';
import { GitHookConfig, GitHookInstallConfig } from '@gitswitch/types';
import { GitManager } from './GitManager';
import { StorageManager } from './StorageManager';
import { SmartDetector } from './SmartDetector';

/**
 * GitHookManager - Git Hook Management for Stage 2
 * Implements fail-safe mechanisms to prevent wrong git identity commits
 */
export class GitHookManager {
  private gitManager: GitManager;
  private storageManager: StorageManager;
  private smartDetector: SmartDetector;

  constructor(gitManager: GitManager, storageManager: StorageManager, smartDetector: SmartDetector) {
    this.gitManager = gitManager;
    this.storageManager = storageManager;
    this.smartDetector = smartDetector;
  }

  /**
   * Install git hooks for a project
   */
  installHooks(projectPath: string, config: GitHookInstallConfig): boolean {
    try {
      if (!this.gitManager.isGitRepository(projectPath)) {
        throw new Error('Not a git repository');
      }

      const hooksDir = path.join(projectPath, '.git', 'hooks');
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }

      // Install pre-commit hook
      if (config.preCommitEnabled) {
        this.installPreCommitHook(hooksDir, config);
      }

      // Save hook configuration
      this.saveHookConfig(projectPath, config);
      
      console.log(`✅ Git hooks installed for ${path.basename(projectPath)}`);
      return true;
    } catch (error: any) {
      console.error('Failed to install git hooks:', error.message);
      return false;
    }
  }

  /**
   * Remove git hooks from a project
   */
  removeHooks(projectPath: string): boolean {
    try {
      const hooksDir = path.join(projectPath, '.git', 'hooks');
      const preCommitPath = path.join(hooksDir, 'pre-commit');
      
      if (fs.existsSync(preCommitPath)) {
        const content = fs.readFileSync(preCommitPath, 'utf8');
        
        // Only remove if it's our hook
        if (content.includes('# GitSwitch pre-commit hook')) {
          fs.unlinkSync(preCommitPath);
          console.log(`✅ GitSwitch hooks removed from ${path.basename(projectPath)}`);
        } else {
          console.log(`⚠️  Pre-commit hook exists but is not managed by GitSwitch`);
          return false;
        }
      }

      // Remove hook configuration
      this.removeHookConfig(projectPath);
      return true;
    } catch (error: any) {
      console.error('Failed to remove git hooks:', error.message);
      return false;
    }
  }

  /**
   * Validate current git identity before commit
   */
  validateCommit(projectPath: string): { valid: boolean; message: string; suggestedAccount?: string } {
    try {
      const currentConfig = this.gitManager.getCurrentConfig(projectPath);
      if (!currentConfig) {
        return {
          valid: false,
          message: 'No git identity configured'
        };
      }

      const projects = this.storageManager.getProjects();
      const project = projects.find(p => p.path === path.resolve(projectPath));
      
      if (!project) {
        return {
          valid: true,
          message: 'Project not managed by GitSwitch - allowing commit'
        };
      }

      // Get smart suggestions for this project
      const suggestions = this.smartDetector.suggestAccounts(project);
      
      if (suggestions.length === 0) {
        return {
          valid: true,
          message: 'No account suggestions available - allowing commit'
        };
      }

      const topSuggestion = suggestions[0];
      const accounts = this.storageManager.getAccounts();
      const suggestedAccount = accounts.find(acc => acc.id === topSuggestion.accountId);
      
      if (!suggestedAccount) {
        return {
          valid: true,
          message: 'Suggested account not found - allowing commit'
        };
      }

      // Check if current identity matches suggested account
      const matches = currentConfig.email === suggestedAccount.email && 
                     currentConfig.name === suggestedAccount.gitName;

      if (matches) {
        return {
          valid: true,
          message: `✅ Correct identity: ${currentConfig.email}`
        };
      }

      // Identity mismatch - check confidence level
      if (topSuggestion.confidence > 0.7) {
        // Record error prevented
        this.storageManager.recordErrorPrevented(project.id);
        
        return {
          valid: false,
          message: `❌ Wrong git identity detected!\\n` +
                   `Current: ${currentConfig.name} <${currentConfig.email}>\\n` +
                   `Suggested: ${suggestedAccount.gitName} <${suggestedAccount.email}>\\n` +
                   `Confidence: ${Math.round(topSuggestion.confidence * 100)}%\\n` +
                   `Reason: ${topSuggestion.reason}`,
          suggestedAccount: suggestedAccount.id
        };
      }

      return {
        valid: true,
        message: `⚠️  Possible identity mismatch (low confidence) - allowing commit\\n` +
                 `Current: ${currentConfig.email}\\n` +
                 `Suggested: ${suggestedAccount.email}`
      };

    } catch (error: any) {
      console.error('Validation error:', error.message);
      return {
        valid: true,
        message: 'Validation error - allowing commit to prevent blocking'
      };
    }
  }

  /**
   * Auto-fix git identity before commit
   */
  autoFixIdentity(projectPath: string, accountId: string): boolean {
    try {
      const accounts = this.storageManager.getAccounts();
      const account = accounts.find(acc => acc.id === accountId);
      
      if (!account) {
        return false;
      }

      const success = this.gitManager.setConfig(projectPath, {
        name: account.gitName,
        email: account.email
      });

      if (success) {
        console.log(`✅ Auto-fixed git identity to ${account.email}`);
        
        // Record the usage for learning
        const projects = this.storageManager.getProjects();
        const project = projects.find(p => p.path === path.resolve(projectPath));
        if (project) {
          this.smartDetector.recordUserChoice(project, account, 1.0);
        }
      }

      return success;
    } catch (error: any) {
      console.error('Auto-fix failed:', error.message);
      return false;
    }
  }

  /**
   * Get hook configuration for a project
   */
  getHookConfig(projectPath: string): GitHookConfig | null {
    try {
      const configPath = path.join(projectPath, '.git', 'gitswitch-hooks.json');
      if (!fs.existsSync(configPath)) {
        return null;
      }
      
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if hooks are installed for a project
   */
  areHooksInstalled(projectPath: string): boolean {
    const preCommitPath = path.join(projectPath, '.git', 'hooks', 'pre-commit');
    
    if (!fs.existsSync(preCommitPath)) {
      return false;
    }

    const content = fs.readFileSync(preCommitPath, 'utf8');
    return content.includes('# GitSwitch pre-commit hook');
  }

  // Private helper methods

  private installPreCommitHook(hooksDir: string, config: GitHookInstallConfig): void {
    const preCommitPath = path.join(hooksDir, 'pre-commit');
    
    // Check if hook already exists
    if (fs.existsSync(preCommitPath)) {
      const existingContent = fs.readFileSync(preCommitPath, 'utf8');
      
      if (existingContent.includes('# GitSwitch pre-commit hook')) {
        // Update existing GitSwitch hook
        fs.writeFileSync(preCommitPath, this.generatePreCommitScript(config), { mode: 0o755 });
        return;
      } else {
        // Backup existing hook
        const backupPath = `${preCommitPath}.gitswitch-backup`;
        fs.copyFileSync(preCommitPath, backupPath);
        console.log(`📁 Existing pre-commit hook backed up to: ${backupPath}`);
      }
    }

    // Create new pre-commit hook
    fs.writeFileSync(preCommitPath, this.generatePreCommitScript(config), { mode: 0o755 });
  }

  private generatePreCommitScript(config: GitHookInstallConfig): string {
    const isWindows = process.platform === 'win32';
    const nodeCmd = isWindows ? 'node.exe' : 'node';
    
    return `#!/bin/sh
# GitSwitch pre-commit hook
# Generated automatically - do not edit manually

echo "🔍 GitSwitch: Validating git identity..."

# Find GitSwitch CLI
GITSWITCH_CLI=""

# Try to find GitSwitch in common locations
if [ -f "$(which gitswitch)" ]; then
  GITSWITCH_CLI="gitswitch"
elif [ -f "$HOME/.local/bin/gitswitch" ]; then
  GITSWITCH_CLI="$HOME/.local/bin/gitswitch"
elif [ -f "/usr/local/bin/gitswitch" ]; then
  GITSWITCH_CLI="/usr/local/bin/gitswitch"
else
  # Try to find in development environment
  REPO_ROOT=$(git rev-parse --show-toplevel)
  if [ -f "$REPO_ROOT/packages/cli/dist/cli.js" ]; then
    GITSWITCH_CLI="${nodeCmd} $REPO_ROOT/packages/cli/dist/cli.js"
  fi
fi

if [ -z "$GITSWITCH_CLI" ]; then
  echo "⚠️  GitSwitch CLI not found - skipping validation"
  exit 0
fi

# Run validation
VALIDATION_LEVEL="${config.validationLevel}"
AUTO_FIX=${config.autoFix ? 'true' : 'false'}

if [ "$VALIDATION_LEVEL" = "off" ]; then
  echo "✅ GitSwitch validation disabled"
  exit 0
fi

# Execute validation
VALIDATION_RESULT=$($GITSWITCH_CLI validate-commit "$(pwd)" 2>&1)
VALIDATION_EXIT_CODE=$?

if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
  echo "✅ Git identity validation passed"
  exit 0
elif [ $VALIDATION_EXIT_CODE -eq 1 ]; then
  echo "$VALIDATION_RESULT"
  
  if [ "$VALIDATION_LEVEL" = "strict" ]; then
    echo "❌ Commit blocked due to identity mismatch"
    echo "💡 Fix with: gitswitch accounts (manage accounts) or gitswitch status (check current identity)"
    exit 1
  elif [ "$VALIDATION_LEVEL" = "warning" ]; then
    echo "⚠️  Warning: Possible identity mismatch - commit allowed"
    exit 0
  fi
else
  echo "⚠️  Validation error - allowing commit to prevent blocking"
  exit 0
fi
`;
  }

  private saveHookConfig(projectPath: string, config: GitHookInstallConfig): void {
    const hookConfig: GitHookConfig = {
      projectPath,
      hooksInstalled: true,
      preCommitEnabled: config.preCommitEnabled,
      validationLevel: config.validationLevel,
      autoFix: config.autoFix
    };
    const configPath = path.join(projectPath, '.git', 'gitswitch-hooks.json');
    fs.writeFileSync(configPath, JSON.stringify(hookConfig, null, 2));
  }

  private removeHookConfig(projectPath: string): void {
    const configPath = path.join(projectPath, '.git', 'gitswitch-hooks.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
}

export default GitHookManager;
import inquirer from 'inquirer';

/**
 * Utility functions for common CLI operations
 */
export class CLIUtils {
  /**
   * Copy text to clipboard cross-platform
   */
  static async copyToClipboard(text: string): Promise<void> {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const isMac = process.platform === 'darwin';
      const isLinux = process.platform === 'linux';

      try {
        let clipboardCmd: string;
        
        if (isWindows) {
          clipboardCmd = `echo "${text}" | clip`;
        } else if (isMac) {
          clipboardCmd = `echo "${text}" | pbcopy`;
        } else if (isLinux) {
          clipboardCmd = `echo "${text}" | xclip -selection clipboard`;
        } else {
          console.log('⚠️  Clipboard not supported on this platform');
          console.log(`💡 Manual copy: ${text}`);
          resolve();
          return;
        }

        const { exec } = require('child_process');
        exec(clipboardCmd, (error: any) => {
          if (error) {
            console.log('⚠️  Failed to copy to clipboard');
            console.log(`💡 Manual copy: ${text}`);
          } else {
            console.log('📋 Copied to clipboard!');
          }
          resolve();
        });
      } catch (error) {
        console.log('⚠️  Failed to copy to clipboard');
        console.log(`💡 Manual copy: ${text}`);
        resolve();
      }
    });
  }

  /**
   * Create a separator for inquirer choices
   */
  static createSeparator(text?: string): inquirer.Separator {
    return new inquirer.Separator(text || '────────────────────────────────────────');
  }

  /**
   * Format account display name for inquirer choices
   */
  static formatAccountChoice(account: any): { name: string; value: string } {
    const authStatus = account.oauthToken ? '🔐' : '🔓';
    const defaultStatus = account.isDefault ? ' - Default' : '';
    return {
      name: `${authStatus} ${account.name} (${account.email})${defaultStatus}`,
      value: account.id
    };
  }

  /**
   * Format project display information
   */
  static formatProjectInfo(project: any): string {
    let info = `📁 ${project.name}\n`;
    info += `📍 ${project.path}\n`;
    
    if (project.remoteUrl) {
      info += `🔗 ${project.remoteUrl}\n`;
    }
    
    if (project.organization) {
      info += `🏢 ${project.organization}\n`;
    }

    return info;
  }

  /**
   * Get repository type from remote URL
   */
  static getRepositoryType(remoteUrl?: string): string {
    if (!remoteUrl) return 'Git';
    
    if (remoteUrl.includes('github.com')) return 'GitHub';
    if (remoteUrl.includes('gitlab.com')) return 'GitLab';
    if (remoteUrl.includes('bitbucket.org')) return 'Bitbucket';
    
    return 'Git';
  }

  /**
   * Detect account type from email
   */
  static detectAccountType(email: string): 'Personal' | 'Work/Organization' {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const emailLower = email.toLowerCase();
    
    return personalDomains.some(domain => emailLower.includes(domain)) 
      ? 'Personal' 
      : 'Work/Organization';
  }

  /**
   * Display projects in a formatted list
   */
  static displayProjects(projects: any[]): void {
    if (projects.length === 0) {
      console.log('📋 No projects found');
      return;
    }

    console.log(`📋 Found ${projects.length} project(s):\n`);

    for (const project of projects) {
      console.log(`📁 ${project.name}`);
      console.log(`   📍 Path: ${project.path}`);
      
      if (project.remoteUrl) {
        const repoType = CLIUtils.getRepositoryType(project.remoteUrl);
        console.log(`   🔗 Remote: ${project.remoteUrl} (${repoType})`);
      }
      
      if (project.organization) {
        console.log(`   🏢 Organization: ${project.organization}`);
      }
      
      if (project.accountId) {
        console.log(`   👤 Account: ${project.accountId}`);
      }
      
      if (project.lastUsed) {
        console.log(`   🕒 Last used: ${new Date(project.lastUsed).toLocaleDateString()}`);
      }
      
      console.log(''); // Empty line between projects
    }
  }

  /**
   * Display accounts in a formatted list
   */
  static displayAccounts(accounts: any[]): void {
    console.log(`👤 Found ${accounts.length} account(s):\n`);

    for (const account of accounts) {
      const authStatus = account.oauthToken ? '🔐 Authenticated' : '🔓 Not authenticated';
      const defaultStatus = account.isDefault ? ' (Default)' : '';
      const accountType = CLIUtils.detectAccountType(account.email);
      
      console.log(`👤 ${account.name}${defaultStatus}`);
      console.log(`   📧 Email: ${account.email}`);
      console.log(`   🏷️  Type: ${accountType}`);
      console.log(`   ${authStatus}`);
      
      if (account.description) {
        console.log(`   📝 Description: ${account.description}`);
      }
      
      if (account.oauthProvider) {
        console.log(`   🔗 Provider: ${account.oauthProvider}`);
      }
      
      console.log(''); // Empty line between accounts
    }
  }

  /**
   * Show coming soon message for unimplemented features
   */
  static showComingSoon(feature: string, expectedDate: string, currentAlternative?: string): void {
    console.log(`🚧 COMING SOON: ${feature}`);
    console.log(`📅 Expected: ${expectedDate}`);
    
    if (currentAlternative) {
      console.log(`💡 For now, use: ${currentAlternative}`);
    }
  }

  /**
   * Confirm action with user
   */
  static async confirmAction(message: string, defaultValue: boolean = false): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue
      }
    ]);
    
    return confirmed;
  }

  /**
   * Select from list of options
   */
  static async selectFromList<T>(
    message: string,
    choices: Array<{ name: string; value: T }>,
    pageSize: number = 10
  ): Promise<T> {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices,
        pageSize
      }
    ]);
    
    return selected;
  }

  /**
   * Get text input from user
   */
  static async getTextInput(
    message: string,
    defaultValue?: string,
    validate?: (input: string) => boolean | string
  ): Promise<string> {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message,
        default: defaultValue,
        validate
      }
    ]);
    
    return input;
  }

  // Recent Commands Tracking (lightweight, in-memory)
  private static recentCommands: string[] = [];
  private static readonly MAX_RECENT_COMMANDS = 10;

  /**
   * Track a command execution for recent commands list
   */
  static trackCommand(command: string): void {
    // Remove if already exists to avoid duplicates
    this.recentCommands = this.recentCommands.filter(cmd => cmd !== command);
    
    // Add to beginning of array
    this.recentCommands.unshift(command);
    
    // Limit to max recent commands
    if (this.recentCommands.length > this.MAX_RECENT_COMMANDS) {
      this.recentCommands = this.recentCommands.slice(0, this.MAX_RECENT_COMMANDS);
    }
  }

  /**
   * Get recent commands list
   */
  static getRecentCommands(): string[] {
    return [...this.recentCommands];
  }

  /**
   * Clear recent commands history
   */
  static clearRecentCommands(): void {
    this.recentCommands = [];
  }
}
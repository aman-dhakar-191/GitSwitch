import { Project, GitConfig } from '@gitswitch/types';

/**
 * Content generators for UI components
 */
export class UIContentGenerators {
  /**
   * Generate GitSwitch ASCII header
   */
  static getGitSwitchHeader(): string {
    return `
   ██████╗ ██╗████████╗███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗
  ██╔════╝ ██║╚══██╔══╝██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║
  ██║  ███╗██║   ██║   ███████╗██║ █╗ ██║██║   ██║   ██║     ███████║
  ██║   ██║██║   ██║   ╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║
  ╚██████╔╝██║   ██║   ███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║
   ╚═════╝ ╚═╝   ╚═╝   ╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
                      Git Identity Management Tool`;
  }

  /**
   * Generate project information content
   */
  static getProjectContent(project: Project): string {
    let content = `{bold}Name:{/bold} ${project.name}\n`;
    content += `{bold}Path:{/bold} ${project.path}\n`;
    
    if (project.remoteUrl) {
      content += `{bold}Remote:{/bold} ${project.remoteUrl}\n`;
    }
    
    if (project.organization) {
      content += `{bold}Organization:{/bold} ${project.organization}\n`;
    }

    const repoType = this.getRepositoryType(project.remoteUrl);
    content += `{bold}Type:{/bold} ${repoType} Repository\n`;
    content += `{bold}Status:{/bold} ${project.status || 'Active'}`;

    return content;
  }

  /**
   * Generate git identity content
   */
  static getIdentityContent(gitConfig?: GitConfig): string {
    if (!gitConfig) {
      return `{red-fg}⚠️  No git identity configured{/red-fg}\n\n` +
             `{yellow-fg}Use 'gitswitch project identity --add' to set your identity:{/yellow-fg}\n`;
    }

    let content = `{bold}Name:{/bold} ${gitConfig.name}\n`;
    content += `{bold}Email:{/bold} ${gitConfig.email}\n\n`;
    
    const accountType = this.detectAccountType(gitConfig.email);
    content += `{bold}Type:{/bold} ${accountType} Account\n`;
    content += `{green-fg}✅ Git identity configured{/green-fg}`;

    return content;
  }

  /**
   * Generate detailed status content
   */
  static getDetailedStatusContent(project: Project, gitConfig?: GitConfig): string {
    let content = `{bold}{blue-fg}PROJECT INFORMATION{/blue-fg}{/bold}\n`;
    content += `{bold}Name:{/bold} ${project.name}\n`;
    content += `{bold}Path:{/bold} ${project.path}\n`;
    
    if (project.remoteUrl) {
      content += `{bold}Remote URL:{/bold} ${project.remoteUrl}\n`;
    }
    
    if (project.organization) {
      content += `{bold}Organization:{/bold} ${project.organization}\n`;
    }

    const repoType = this.getRepositoryType(project.remoteUrl);
    content += `{bold}Repository Type:{/bold} ${repoType}\n`;
    content += `{bold}Status:{/bold} ${project.status || 'Active'}\n\n`;
    
    content += `{bold}{yellow-fg}GIT IDENTITY{/yellow-fg}{/bold}\n`;
    
    if (!gitConfig) {
      content += `{red-fg}⚠️  No git identity configured{/red-fg}\n\n`;
      content += `{yellow-fg}To configure your git identity, run:{/yellow-fg}\n`;
      content += `  git config user.name "Your Name"\n`;
      content += `  git config user.email "your@email.com"\n`;
    } else {
      content += `{bold}Name:{/bold} ${gitConfig.name}\n`;
      content += `{bold}Email:{/bold} ${gitConfig.email}\n`;
      
      const accountType = this.detectAccountType(gitConfig.email);
      content += `{bold}Account Type:{/bold} ${accountType}\n`;
      content += `{green-fg}✅ Git identity is properly configured{/green-fg}\n`;
    }

    return content;
  }

  /**
   * Generate commands list content with categorized commands
   */
  static getCommandsContent(recentCommands?: string[]): string {
    let content = `{bold}{cyan-fg}🎯 Main Commands (Daily Workflow){/cyan-fg}{/bold}
  gitswitch .               Open interactive dashboard for current project
  gitswitch project status  Show current project status with git identity
  gitswitch account login   Authenticate with GitHub and other providers
  gitswitch account logout  Logout from authentication providers

{bold}{yellow-fg}🔧 Common Commands (Regular Use){/yellow-fg}{/bold}
  gitswitch project list    Browse and manage all your git projects
  gitswitch account list    View and manage configured accounts
  gitswitch hook install    Set up git hooks for identity validation
  gitswitch hook status     Check git hook installation status

{bold}{green-fg}🔍 Discovery Commands (Occasional Use){/green-fg}{/bold}
  gitswitch project scan    Scan directories to find git repositories
  gitswitch project import  Import projects from various sources
  gitswitch hook validate   Validate current git identity
  gitswitch account status  Show detailed authentication status`;

    // Add recent commands section if provided
    if (recentCommands && recentCommands.length > 0) {
      content += `\n\n{bold}{magenta-fg}⏱️ Recent Commands{/magenta-fg}{/bold}\n`;
      recentCommands.slice(0, 5).forEach(cmd => {
        content += `  ${cmd}\n`;
      });
    }

    content += `\n\n{bold}{blue-fg}💡 Quick Help{/blue-fg}{/bold}
  gitswitch --help          Show complete command reference
  gitswitch <cmd> --help    Show help for specific command group
  Press [ENTER]             Launch full desktop interface`;

    return content;
  }

  /**
   * Get repository type from remote URL
   */
  private static getRepositoryType(remoteUrl?: string): string {
    if (!remoteUrl) return 'Git';
    
    if (remoteUrl.includes('github.com')) return 'GitHub';
    if (remoteUrl.includes('gitlab.com')) return 'GitLab';
    if (remoteUrl.includes('bitbucket.org')) return 'Bitbucket';
    
    return 'Git';
  }

  /**
   * Detect account type from email
   */
  private static detectAccountType(email: string): 'Personal' | 'Work/Organization' {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const emailLower = email.toLowerCase();
    
    return personalDomains.some(domain => emailLower.includes(domain)) 
      ? 'Personal' 
      : 'Work/Organization';
  }
}
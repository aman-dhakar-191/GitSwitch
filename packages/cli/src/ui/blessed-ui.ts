import * as blessed from 'blessed';
import { Project, GitConfig } from '@gitswitch/types';

export interface BlessedUIOptions {
  project: Project;
  gitConfig?: GitConfig;
  onExit?: () => void;
}

export class BlessedUI {
  private screen: blessed.Widgets.Screen;
  private project: Project;
  private gitConfig?: GitConfig;
  private onExit?: () => void;

  constructor(options: BlessedUIOptions) {
    this.project = options.project;
    this.gitConfig = options.gitConfig;
    this.onExit = options.onExit;
    
    // Create the screen
    this.screen = blessed.screen({
      smartCSR: true,
      dockBorders: true,
      title: 'GitSwitch - Git Identity Management'
    });

    this.setupUI();
    this.setupEvents();
  }

  private setupUI(): void {
    // Main container
    const container = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: 'black'
      }
    });

    // Header with app name
    const header = blessed.box({
      parent: container,
      top: 0,
      left: 0,
      width: '100%',
      height: 15,
      content: this.getHeaderContent(),
      style: {
        fg: 'white',
        bg: 'gray',
        bold: true
      },
      align: 'center',
      valign: 'middle',
      border: {
        type: 'line',
        fg: 'cyan' as any
      },
      tags: true
    });

    // Project info box
    const projectBox = blessed.box({
      parent: container,
      top: 16,
      left: 0,
      width: '50%',
      height: 10,
      label: ' 📁 Project Information ',
      content: this.getProjectContent(),
      style: {
        fg: 'white',
        bg: 'black'
      },
      border: {
        type: 'line',
        fg: 'green' as any
      },
      padding: {
        top: 1,
        left: 2,
        right: 2,
        bottom: 1
      }
    });

    // Git identity box
    const identityBox = blessed.box({
      parent: container,
      top: 16,
      left: '50%',
      width: '50%',
      height: 10,
      label: ' 👤 Git Identity ',
      content: this.getIdentityContent(),
      style: {
        fg: 'white',
        bg: 'black'
      },
      border: {
        type: 'line',
        fg: 'yellow' as any
      },
      padding: {
        top: 1,
        left: 2,
        right: 2,
        bottom: 1
      }
    });

    // Commands list
    const commandsBox = blessed.box({
      parent: container,
      top: 29,
      left: 0,
      width: '100%',
      height: 12,
      label: ' ⚡ Available Commands ',
      content: this.getCommandsContent(),
      style: {
        fg: 'white',
        bg: 'black'
      },
      border: {
        type: 'line',
        fg: 'magenta' as any
      },
      padding: {
        top: 1,
        left: 2,
        right: 2,
        bottom: 1
      },
      scrollable: true,
      mouse: true
    });

    // Footer with instructions
    const footer = blessed.box({
      parent: container,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: ' Press [ESC] or [q] to exit • Press [ENTER] to launch desktop app ',
      style: {
        fg: 'black',
        bg: 'white'
      },
      align: 'center',
      valign: 'middle'
    });

    // Make sure all elements are visible
    this.screen.append(container);
    this.screen.render();
  }

  private setupEvents(): void {
    // Exit on ESC or q
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.exit();
    });

    // Launch desktop app on Enter
    this.screen.key(['enter'], () => {
    });

    // Make sure screen can be focused
    this.screen.key(['tab'], () => {
      this.screen.render();
    });
  }

  private getHeaderContent(): string {
    return `
   ██████╗ ██╗████████╗███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗
  ██╔════╝ ██║╚══██╔══╝██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║
  ██║  ███╗██║   ██║   ███████╗██║ █╗ ██║██║   ██║   ██║     ███████║
  ██║   ██║██║   ██║   ╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║
  ╚██████╔╝██║   ██║   ███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║
   ╚═════╝ ╚═╝   ╚═╝   ╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
                      Git Identity Management Tool`;
  }

  private getProjectContent(): string {
    let content = `{bold}Name:{/bold} ${this.project.name}\n`;
    content += `{bold}Path:{/bold} ${this.project.path}\n`;
    
    if (this.project.remoteUrl) {
      content += `{bold}Remote:{/bold} ${this.project.remoteUrl}\n`;
    }
    
    if (this.project.organization) {
      content += `{bold}Organization:{/bold} ${this.project.organization}\n`;
    }

    const repoType = this.project.remoteUrl?.includes('github.com') ? 'GitHub' :
                    this.project.remoteUrl?.includes('gitlab.com') ? 'GitLab' :
                    this.project.remoteUrl?.includes('bitbucket.org') ? 'Bitbucket' : 'Git';
    
    content += `{bold}Type:{/bold} ${repoType} Repository\n`;
    content += `{bold}Status:{/bold} ${this.project.status || 'Active'}`;

    return content;
  }

  private getIdentityContent(): string {
    if (!this.gitConfig) {
      return `{red-fg}⚠️  No git identity configured{/red-fg}\n\n` +
             `{yellow-fg}Use 'git config' to set your identity:{/yellow-fg}\n` +
             `git config user.name "Your Name"\n` +
             `git config user.email "your@email.com"`;
    }

    let content = `{bold}Name:{/bold} ${this.gitConfig.name}\n`;
    content += `{bold}Email:{/bold} ${this.gitConfig.email}\n\n`;
    
    // Check if this looks like a work or personal account
    const email = this.gitConfig.email.toLowerCase();
    const isPersonal = email.includes('gmail.com') || email.includes('yahoo.com') || 
                      email.includes('hotmail.com') || email.includes('outlook.com');
    const accountType = isPersonal ? 'Personal' : 'Work/Organization';
    
    content += `{bold}Type:{/bold} ${accountType} Account\n`;
    content += `{green-fg}✅ Git identity configured{/green-fg}`;

    return content;
  }

  private getCommandsContent(): string {
    return `{bold}Project Management:{/bold}
  gitswitch project status  Show current project status with details
  gitswitch project list    Interactive project listing and filters
  gitswitch project scan    Scan directories for git repositories
  gitswitch project import  Import projects from various sources
  
{bold}Account Management:{/bold}
  gitswitch account list    Interactive account management
  gitswitch account login   GitHub and provider authentication
  gitswitch account logout  Logout from authentication providers
  gitswitch account status  Show authentication status
  
{bold}Git Hooks:{/bold}
  gitswitch hook install    Install git hooks with validation options
  gitswitch hook uninstall  Remove git hooks from repository
  gitswitch hook status     Check hook installation status
  gitswitch hook validate   Validate current git identity
  
{bold}Current Project:{/bold}
  gitswitch .               Open this interactive view
  Press [ENTER]             Launch full desktop interface
  
{bold}Help & Info:{/bold}
  gitswitch --help          Show complete command reference
  gitswitch <cmd> --help    Show help for specific command group`;
  }

  private exit(): void {
    this.screen.destroy();
    console.log('\n👋 Thank you for using GitSwitch!\n');
    process.exit(0);
  }

  public render(): void {
    this.screen.render();
  }

  public destroy(): void {
    this.screen.destroy();
  }
}

export interface BlessedStatusUIOptions {
  project: Project;
  gitConfig?: GitConfig;
}

export class BlessedStatusUI {
  private screen: blessed.Widgets.Screen;
  private project: Project;
  private gitConfig?: GitConfig;

  constructor(options: BlessedStatusUIOptions) {
    this.project = options.project;
    this.gitConfig = options.gitConfig;
    
    // Create the screen
    this.screen = blessed.screen({
      smartCSR: true,
      dockBorders: true,
      title: 'GitSwitch - Project Status'
    });

    this.setupStatusUI();
    this.setupEvents();
  }

  private setupStatusUI(): void {
    // Main container
    const container = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: 'black'
      }
    });

    // Header
    const header = blessed.box({
      parent: container,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: ' GitSwitch - Project Status ',
      style: {
        fg: 'white',
        bg: 'blue',
        bold: true
      },
      align: 'center',
      valign: 'middle',
      border: {
        type: 'line',
        fg: 'cyan' as any
      }
    });

    // Project status box - larger and centered
    const statusBox = blessed.box({
      parent: container,
      top: 4,
      left: '10%',
      width: '80%',
      height: 15,
      label: ' 📊 Current Project Status ',
      content: this.getStatusContent(),
      style: {
        fg: 'white',
        bg: 'black'
      },
      border: {
        type: 'line',
        fg: 'green' as any
      },
      padding: {
        top: 1,
        left: 2,
        right: 2,
        bottom: 1
      },
      tags: true
    });

    // Footer with instructions
    const footer = blessed.box({
      parent: container,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: ' Press [ESC], [q], or [ENTER] to exit ',
      style: {
        fg: 'black',
        bg: 'white'
      },
      align: 'center',
      valign: 'middle'
    });

    // Make sure all elements are visible
    this.screen.append(container);
    this.screen.render();
  }

  private setupEvents(): void {
    // Exit on ESC, q, or Enter
    this.screen.key(['escape', 'q', 'C-c', 'enter'], () => {
      this.exit();
    });

    // Make sure screen can be focused
    this.screen.key(['tab'], () => {
      this.screen.render();
    });
  }

  private getStatusContent(): string {
    let content = `{bold}{blue-fg}PROJECT INFORMATION{/blue-fg}{/bold}\n`;
    content += `{bold}Name:{/bold} ${this.project.name}\n`;
    content += `{bold}Path:{/bold} ${this.project.path}\n`;
    
    if (this.project.remoteUrl) {
      content += `{bold}Remote URL:{/bold} ${this.project.remoteUrl}\n`;
    }
    
    if (this.project.organization) {
      content += `{bold}Organization:{/bold} ${this.project.organization}\n`;
    }

    const repoType = this.project.remoteUrl?.includes('github.com') ? 'GitHub' :
                    this.project.remoteUrl?.includes('gitlab.com') ? 'GitLab' :
                    this.project.remoteUrl?.includes('bitbucket.org') ? 'Bitbucket' : 'Git';
    
    content += `{bold}Repository Type:{/bold} ${repoType}\n`;
    content += `{bold}Status:{/bold} ${this.project.status || 'Active'}\n\n`;
    
    content += `{bold}{yellow-fg}GIT IDENTITY{/yellow-fg}{/bold}\n`;
    
    if (!this.gitConfig) {
      content += `{red-fg}⚠️  No git identity configured{/red-fg}\n\n`;
      content += `{yellow-fg}To configure your git identity, run:{/yellow-fg}\n`;
      content += `  git config user.name "Your Name"\n`;
      content += `  git config user.email "your@email.com"\n`;
    } else {
      content += `{bold}Name:{/bold} ${this.gitConfig.name}\n`;
      content += `{bold}Email:{/bold} ${this.gitConfig.email}\n`;
      
      // Check if this looks like a work or personal account
      const email = this.gitConfig.email.toLowerCase();
      const isPersonal = email.includes('gmail.com') || email.includes('yahoo.com') || 
                        email.includes('hotmail.com') || email.includes('outlook.com');
      const accountType = isPersonal ? 'Personal' : 'Work/Organization';
      
      content += `{bold}Account Type:{/bold} ${accountType}\n`;
      content += `{green-fg}✅ Git identity is properly configured{/green-fg}\n`;
    }

    return content;
  }

  private exit(): void {
    this.screen.destroy();
  }

  public render(): void {
    this.screen.render();
  }

  public destroy(): void {
    this.screen.destroy();
  }
} 
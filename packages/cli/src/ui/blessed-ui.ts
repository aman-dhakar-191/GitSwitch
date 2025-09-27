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
      height: 3,
      content: this.getHeaderContent(),
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

    // Project info box
    const projectBox = blessed.box({
      parent: container,
      top: 3,
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
      top: 3,
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
      top: 13,
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
      this.launchDesktopApp();
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
  gitswitch status          Show detailed project status
  gitswitch list            List all managed projects
  gitswitch scan            Scan for new git projects
  
{bold}Account Management:{/bold}
  gitswitch accounts        Manage git accounts and identities
  gitswitch login           GitHub authentication and setup
  
{bold}Advanced Features:{/bold}
  gitswitch hooks --install Install git hooks for identity validation
  gitswitch team            Enterprise team management
  gitswitch security        Security and compliance features
  
{bold}Desktop App:{/bold}
  Press [ENTER]             Launch full desktop interface
  gitswitch .               Open this project view (current)
  
{bold}Help:{/bold}
  gitswitch --help          Show complete command reference
  gitswitch <command> -h    Show help for specific command`;
  }

  private launchDesktopApp(): void {
    this.screen.destroy();
    console.log('\n🚀 Launching GitSwitch desktop app...');
    console.log('📝 This will open the desktop interface for managing git identities\n');
    
    if (this.onExit) {
      this.onExit();
    }
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
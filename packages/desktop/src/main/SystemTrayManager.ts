import { Tray, Menu, BrowserWindow, app, shell, nativeImage } from 'electron';
import * as path from 'path';
import { GitManager, StorageManager, ProjectManager } from '@gitswitch/core';
import { GitAccount, Project } from '@gitswitch/types';

/**
 * SystemTrayManager - Manages system tray integration for GitSwitch
 * Provides quick access to common functionality from the system tray
 */
export class SystemTrayManager {
  private tray: Tray | null = null;
  private gitManager: GitManager;
  private storageManager: StorageManager;
  private projectManager: ProjectManager;
  private mainWindow: BrowserWindow | null = null;

  constructor(
    gitManager: GitManager,
    storageManager: StorageManager,
    projectManager: ProjectManager
  ) {
    this.gitManager = gitManager;
    this.storageManager = storageManager;
    this.projectManager = projectManager;
  }

  /**
   * Initialize the system tray
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    this.createTray();
    this.setupTrayEvents();
  }

  /**
   * Update the tray menu with current project context
   */
  updateTrayMenu(currentProject?: Project): void {
    if (!this.tray) return;

    const menu = this.buildTrayMenu(currentProject);
    this.tray.setContextMenu(menu);
  }

  /**
   * Show a balloon notification
   */
  showNotification(title: string, content: string, silent: boolean = false): void {
    if (!this.tray) return;

    this.tray.displayBalloon({
      title,
      content,
      icon: this.getTrayIcon(),
      largeIcon: false,
      noSound: silent,
      respectQuietTime: true
    });
  }

  /**
   * Destroy the tray
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  private createTray(): void {
    const iconPath = this.getTrayIconPath();
    const icon = nativeImage.createFromPath(iconPath);
    
    // Resize icon for proper tray display
    icon.setTemplateImage(true);
    
    this.tray = new Tray(icon);
    this.tray.setToolTip('GitSwitch - Git Identity Manager');
    
    // Initial menu
    this.updateTrayMenu();
  }

  private setupTrayEvents(): void {
    if (!this.tray) return;

    // Double-click to show main window
    this.tray.on('double-click', () => {
      this.showMainWindow();
    });

    // Click behavior (different on platforms)
    this.tray.on('click', () => {
      if (process.platform === 'win32') {
        this.showMainWindow();
      }
    });

    // Right-click shows context menu (handled by setContextMenu)
  }

  private buildTrayMenu(currentProject?: Project): Menu {
    const accounts = this.storageManager.getAccounts();
    const recentProjects = this.getRecentProjects();
    
    // Get current git config if we have a project
    let currentGitConfig = null;
    if (currentProject) {
      currentGitConfig = this.gitManager.getCurrentConfig(currentProject.path);
    }

    const menuTemplate: any[] = [
      {
        label: 'GitSwitch',
        type: 'normal',
        enabled: false
      },
      { type: 'separator' },
    ];

    // Current Project Section
    if (currentProject) {
      menuTemplate.push(
        {
          label: `📁 ${currentProject.name}`,
          type: 'normal',
          enabled: false
        },
        {
          label: currentGitConfig 
            ? `👤 ${currentGitConfig.name} <${currentGitConfig.email}>`
            : '❓ No identity configured',
          type: 'normal',
          enabled: false
        },
        { type: 'separator' }
      );

      // Quick account switching for current project
      if (accounts.length > 0) {
        const switchSubmenu = accounts.map(account => ({
          label: `${account.name} <${account.email}>`,
          type: 'radio',
          checked: currentGitConfig?.email === account.email,
          click: () => this.switchToAccount(currentProject.path, account.id)
        }));

        menuTemplate.push({
          label: '🔄 Switch Identity',
          type: 'submenu',
          submenu: switchSubmenu
        });
      }

      menuTemplate.push({ type: 'separator' });
    }

    // Recent Projects
    if (recentProjects.length > 0) {
      const projectsSubmenu = recentProjects.map(project => ({
        label: `📁 ${project.name}`,
        type: 'normal',
        click: () => this.openProject(project.path)
      }));

      menuTemplate.push({
        label: '📚 Recent Projects',
        type: 'submenu',
        submenu: projectsSubmenu
      });
    }

    // Quick Actions
    menuTemplate.push(
      { type: 'separator' },
      {
        label: '⚡ Quick Actions',
        type: 'submenu',
        submenu: [
          {
            label: '🔍 Scan for Projects',
            type: 'normal',
            click: () => this.scanForProjects()
          },
          {
            label: '👤 Manage Accounts',
            type: 'normal',
            click: () => this.showAccountManager()
          },
          {
            label: '📊 View Analytics',
            type: 'normal',
            click: () => this.showAnalytics()
          },
          {
            label: '⚙️ Automation Rules',
            type: 'normal',
            click: () => this.showAutomationRules()
          }
        ]
      }
    );

    // Main Application Controls
    menuTemplate.push(
      { type: 'separator' },
      {
        label: '🖥️ Show GitSwitch',
        type: 'normal',
        click: () => this.showMainWindow()
      },
      {
        label: '🔄 Refresh',
        type: 'normal',
        click: () => this.refreshData()
      },
      { type: 'separator' }
    );

    // System Controls
    menuTemplate.push(
      {
        label: '📖 Help & Documentation',
        type: 'normal',
        click: () => this.openDocumentation()
      },
      {
        label: '🐛 Report Issue',
        type: 'normal',
        click: () => this.reportIssue()
      },
      { type: 'separator' },
      {
        label: '❌ Quit GitSwitch',
        type: 'normal',
        click: () => this.quitApplication()
      }
    );

    return Menu.buildFromTemplate(menuTemplate);
  }

  private getRecentProjects(): Project[] {
    const projects = this.storageManager.getProjects();
    return projects
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
      .slice(0, 5); // Show top 5 recent projects
  }

  private getTrayIconPath(): string {
    const isDev = process.env.NODE_ENV === 'development';
    const iconName = process.platform === 'win32' ? 'tray-icon.ico' : 
                     process.platform === 'darwin' ? 'tray-iconTemplate.png' : 'tray-icon.png';
    
    if (isDev) {
      return path.join(__dirname, '..', '..', 'assets', 'icons', iconName);
    } else {
      return path.join(process.resourcesPath, 'assets', 'icons', iconName);
    }
  }

  private getTrayIcon(): Electron.NativeImage {
    const iconPath = this.getTrayIconPath();
    return nativeImage.createFromPath(iconPath);
  }

  private showMainWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  private async switchToAccount(projectPath: string, accountId: string): Promise<void> {
    try {
      const success = this.projectManager.switchGitIdentity(projectPath, accountId);
      
      if (success) {
        const account = this.storageManager.getAccounts().find(a => a.id === accountId);
        if (account) {
          this.showNotification(
            'Identity Switched',
            `Switched to ${account.name} <${account.email}>`,
            false
          );
          
          // Update tray menu to reflect the change
          const project = this.storageManager.getProjects().find(p => p.path === projectPath);
          this.updateTrayMenu(project);
        }
      } else {
        this.showNotification(
          'Switch Failed',
          'Failed to switch git identity',
          false
        );
      }
    } catch (error) {
      console.error('Failed to switch account from tray:', error);
      this.showNotification(
        'Error',
        'An error occurred while switching accounts',
        false
      );
    }
  }

  private openProject(projectPath: string): void {
    try {
      // Open project in main window
      if (this.mainWindow) {
        this.mainWindow.webContents.send('open-project', { projectPath });
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to open project from tray:', error);
    }
  }

  private async scanForProjects(): Promise<void> {
    try {
      this.showNotification(
        'Scanning Projects',
        'Scanning for git repositories...',
        true
      );
      
      // This would trigger a project scan
      if (this.mainWindow) {
        this.mainWindow.webContents.send('scan-projects');
        this.showMainWindow();
      }
    } catch (error) {
      console.error('Failed to scan projects from tray:', error);
    }
  }

  private showAccountManager(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('navigate-to', { view: 'accounts' });
      this.showMainWindow();
    }
  }

  private showAnalytics(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('navigate-to', { view: 'analytics' });
      this.showMainWindow();
    }
  }

  private showAutomationRules(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('navigate-to', { view: 'automation' });
      this.showMainWindow();
    }
  }

  private refreshData(): void {
    try {
      // Refresh the tray menu
      this.updateTrayMenu();
      
      // Notify main window to refresh data
      if (this.mainWindow) {
        this.mainWindow.webContents.send('refresh-data');
      }
      
      this.showNotification(
        'Data Refreshed',
        'GitSwitch data has been refreshed',
        true
      );
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }

  private openDocumentation(): void {
    shell.openExternal('https://github.com/aman-dhakar-191/GitSwitch/blob/main/README.md');
  }

  private reportIssue(): void {
    shell.openExternal('https://github.com/aman-dhakar-191/GitSwitch/issues/new');
  }

  private quitApplication(): void {
    app.quit();
  }
}

export default SystemTrayManager;
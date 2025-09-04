import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { GitManager, StorageManager, ProjectManager, SmartDetector, GitHookManager } from '@gitswitch/core';
import { IPCEvent, IPCResponse } from '@gitswitch/types';

class GitSwitchApp {
  private mainWindow: BrowserWindow | null = null;
  private gitManager: GitManager;
  private storageManager: StorageManager;
  private projectManager: ProjectManager;
  private smartDetector: SmartDetector;
  private gitHookManager: GitHookManager;

  constructor() {
    this.gitManager = new GitManager();
    this.storageManager = new StorageManager();
    this.projectManager = new ProjectManager();
    this.smartDetector = new SmartDetector(this.storageManager);
    this.gitHookManager = new GitHookManager(this.gitManager, this.storageManager, this.smartDetector);
    
    this.initializeApp();
    this.setupIPC();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'default',
      show: false, // Don't show until ready
    });

    // Load the React app
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIPC(): void {
    // Handle IPC events from renderer process
    ipcMain.handle('api', async (event, ipcEvent: IPCEvent): Promise<IPCResponse> => {
      try {
        switch (ipcEvent.type) {
          case 'GET_ACCOUNTS':
            return {
              success: true,
              data: this.storageManager.getAccounts()
            };

          case 'ADD_ACCOUNT':
            const newAccount = this.storageManager.addAccount(ipcEvent.payload.account);
            return {
              success: true,
              data: newAccount
            };

          case 'UPDATE_ACCOUNT':
            const updateSuccess = this.storageManager.updateAccount(
              ipcEvent.payload.id,
              ipcEvent.payload.account
            );
            return {
              success: updateSuccess,
              data: updateSuccess
            };

          case 'DELETE_ACCOUNT':
            const deleteSuccess = this.storageManager.deleteAccount(ipcEvent.payload.id);
            return {
              success: deleteSuccess,
              data: deleteSuccess
            };

          case 'OPEN_PROJECT':
            const project = this.projectManager.analyzeProject(ipcEvent.payload.projectPath);
            return {
              success: !!project,
              data: project
            };

          case 'GET_GIT_CONFIG':
            const gitConfig = this.projectManager.getCurrentGitConfig(ipcEvent.payload.projectPath);
            return {
              success: !!gitConfig,
              data: gitConfig
            };

          case 'SWITCH_GIT_IDENTITY':
            const switchSuccess = this.projectManager.switchGitIdentity(
              ipcEvent.payload.projectPath,
              ipcEvent.payload.accountId
            );
            return {
              success: switchSuccess,
              data: switchSuccess
            };

          case 'INSTALL_GIT_HOOKS':
            const installSuccess = this.gitHookManager.installHooks(
              ipcEvent.payload.projectPath,
              ipcEvent.payload.config
            );
            return {
              success: installSuccess,
              data: installSuccess
            };

          case 'REMOVE_GIT_HOOKS':
            const removeSuccess = this.gitHookManager.removeHooks(ipcEvent.payload.projectPath);
            return {
              success: removeSuccess,
              data: removeSuccess
            };

          case 'VALIDATE_COMMIT':
            const validationResult = this.gitHookManager.validateCommit(ipcEvent.payload.projectPath);
            return {
              success: true,
              data: validationResult
            };

          case 'GET_SMART_SUGGESTIONS':
            try {
              const projects = this.storageManager.getProjects();
              const project = projects.find(p => p.path === ipcEvent.payload.projectPath);
              
              if (!project) {
                return {
                  success: false,
                  error: 'Project not found'
                };
              }
              
              const suggestions = this.smartDetector.suggestAccounts(project);
              return {
                success: true,
                data: suggestions
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'GET_PROJECT_LIST':
            try {
              const projects = this.storageManager.getProjects();
              const filteredProjects = projects.filter(project => {
                if (ipcEvent.payload.filter) {
                  const filter = ipcEvent.payload.filter.toLowerCase();
                  return project.name.toLowerCase().includes(filter) || 
                         project.path.toLowerCase().includes(filter);
                }
                if (ipcEvent.payload.status) {
                  return project.status === ipcEvent.payload.status;
                }
                return true;
              });
              
              return {
                success: true,
                data: filteredProjects
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'GET_ANALYTICS':
            try {
              const analytics = this.storageManager.getAnalytics();
              return {
                success: true,
                data: analytics
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          default:
            return {
              success: false,
              error: 'Unknown IPC event type'
            };
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Unknown error occurred'
        };
      }
    });
  }
}

// Create the app instance
new GitSwitchApp();
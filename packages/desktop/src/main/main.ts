import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { GitManager, StorageManager, ProjectManager, SmartDetector, GitHookManager, TeamManager, SecurityManager, PluginManager, AdvancedGitManager, WorkflowAutomationManager, BulkImportManager, ProjectScanner, OAuthManager } from '@gitswitch/core';
import { IPCEvent, IPCResponse } from '@gitswitch/types';
import { SystemTrayManager } from './SystemTrayManager';

// Load environment variables from .env file if it exists
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });
} catch (error) {
  console.log('No .env file found, using default OAuth configuration');
}

class GitSwitchApp {
  private mainWindow: BrowserWindow | null = null;
  private gitManager: GitManager;
  private storageManager: StorageManager;
  private projectManager: ProjectManager;
  private smartDetector: SmartDetector;
  private gitHookManager: GitHookManager;
  private teamManager: TeamManager;
  private securityManager: SecurityManager;
  private pluginManager: PluginManager;
  private advancedGitManager: AdvancedGitManager;
  private workflowAutomationManager: WorkflowAutomationManager;
  private bulkImportManager: BulkImportManager;
  private projectScanner: ProjectScanner;
  private oauthManager: OAuthManager;
  private systemTrayManager: SystemTrayManager;
  private hasShownTrayNotification: boolean = false;
  private initialProjectPath: string | null = null;

  constructor() {
    this.gitManager = new GitManager();
    this.storageManager = new StorageManager();
    this.projectManager = new ProjectManager();
    this.smartDetector = new SmartDetector(this.storageManager);
    this.gitHookManager = new GitHookManager(this.gitManager, this.storageManager, this.smartDetector);
    this.teamManager = new TeamManager(this.storageManager);
    this.securityManager = new SecurityManager(this.storageManager);
    this.pluginManager = new PluginManager(this.storageManager, this.gitManager, this.projectManager);
    this.advancedGitManager = new AdvancedGitManager(this.gitManager, this.securityManager, this.storageManager);
    this.workflowAutomationManager = new WorkflowAutomationManager(this.storageManager, this.gitManager, this.projectManager, this.securityManager, this.advancedGitManager);
    this.projectScanner = new ProjectScanner(this.gitManager, this.storageManager);
    this.bulkImportManager = new BulkImportManager(this.storageManager, this.projectScanner, this.smartDetector, this.gitManager);
    this.oauthManager = new OAuthManager(this.storageManager);
    this.systemTrayManager = new SystemTrayManager(this.gitManager, this.storageManager, this.projectManager);
    
    // Parse command line arguments
    this.parseCommandLineArgs();
    
    this.initializeApp();
    this.setupIPC();
  }

  private parseCommandLineArgs(): void {
    // Parse command line arguments to get project path
    const args = process.argv;
    const projectIndex = args.findIndex(arg => arg === '--project');
    
    if (projectIndex !== -1 && projectIndex + 1 < args.length) {
      this.initialProjectPath = args[projectIndex + 1];
      console.log('🎯 Initial project path from CLI:', this.initialProjectPath);
    }
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
      // On macOS, keep app running even when all windows are closed
      // On other platforms, quit unless specifically keeping in tray
      if (process.platform !== 'darwin') {
        // Don't quit, just hide to tray
        return;
      }
    });

    app.on('before-quit', () => {
      (app as any).isQuiting = true;
    });

    app.on('activate', () => {
      // On macOS, re-create window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      } else if (this.mainWindow) {
        this.mainWindow.show();
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
        experimentalFeatures: true,
        enableBlinkFeatures: 'CSSBackdropFilter',
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'default',
      show: false, // Don't show until ready
      icon: path.join(__dirname, '..', '..', 'assets', 'icons', 'tray-icon.png')
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
      
      // Initialize system tray after window is ready
      this.systemTrayManager.initialize(this.mainWindow!);
    });

    // Handle window close - minimize to tray instead of quitting
    this.mainWindow.on('close', (event) => {
      if (!(app as any).isQuiting) {
        event.preventDefault();
        this.mainWindow?.hide();
        
        // Show notification on first minimize
        if (!this.hasShownTrayNotification) {
          this.systemTrayManager.showNotification(
            'GitSwitch',
            'GitSwitch is still running in the system tray',
            false
          );
          this.hasShownTrayNotification = true;
        }
      }
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
          case 'GET_INITIAL_PROJECT':
            // Return the initial project path from CLI
            if (this.initialProjectPath) {
              const project = this.projectManager.analyzeProject(this.initialProjectPath);
              return {
                success: !!project,
                data: project
              };
            }
            return {
              success: false,
              data: null
            };

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
            
            // Update tray menu with current project context
            this.systemTrayManager.updateTrayMenu(project || undefined);
            
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

          // Team Management IPC Handlers
          case 'CREATE_TEAM':
            try {
              const newTeam = this.teamManager.createTeam(ipcEvent.payload.team);
              return {
                success: true,
                data: newTeam
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'GET_TEAMS':
            try {
              const teams = this.teamManager.getTeams();
              return {
                success: true,
                data: teams
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'UPDATE_TEAM':
            try {
              const updateSuccess = this.teamManager.updateTeam(
                ipcEvent.payload.id,
                ipcEvent.payload.team
              );
              return {
                success: updateSuccess,
                data: updateSuccess
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'DELETE_TEAM':
            try {
              const deleteSuccess = this.teamManager.deleteTeam(ipcEvent.payload.id);
              return {
                success: deleteSuccess,
                data: deleteSuccess
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'INVITE_MEMBER':
            try {
              const inviteSuccess = this.teamManager.addTeamMember(
                ipcEvent.payload.teamId,
                {
                  email: ipcEvent.payload.email,
                  name: ipcEvent.payload.email.split('@')[0], // Use email prefix as name
                  role: ipcEvent.payload.role,
                  permissions: []
                }
              );
              return {
                success: inviteSuccess,
                data: inviteSuccess
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'GENERATE_SHARE_CODE':
            try {
              const shareCode = this.teamManager.generateShareCode(ipcEvent.payload.teamId);
              return {
                success: !!shareCode,
                data: shareCode
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          // Plugin System IPC Handlers
          case 'GET_INSTALLED_PLUGINS':
            try {
              const plugins = this.pluginManager.getInstalledPlugins();
              return {
                success: true,
                data: plugins
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'SEARCH_PLUGINS':
            try {
              const results = await this.pluginManager.searchPlugins(
                ipcEvent.payload.query,
                ipcEvent.payload.category
              );
              return {
                success: true,
                data: results
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'INSTALL_PLUGIN':
            try {
              const result = await this.pluginManager.installPlugin(
                ipcEvent.payload.pluginId,
                ipcEvent.payload.version
              );
              return {
                success: result.success,
                data: result,
                error: result.error
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'UNINSTALL_PLUGIN':
            try {
              const success = await this.pluginManager.uninstallPlugin(ipcEvent.payload.pluginId);
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'ENABLE_PLUGIN':
            try {
              const success = await this.pluginManager.enablePlugin(ipcEvent.payload.pluginId);
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'DISABLE_PLUGIN':
            try {
              const success = await this.pluginManager.disablePlugin(ipcEvent.payload.pluginId);
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'GET_PLUGIN_SETTINGS':
            try {
              const settings = this.pluginManager.getPluginSettings(ipcEvent.payload.pluginId);
              return {
                success: true,
                data: settings
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'UPDATE_PLUGIN_SETTINGS':
            try {
              const success = await this.pluginManager.updatePluginSettings(
                ipcEvent.payload.pluginId,
                ipcEvent.payload.settings
              );
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          // Advanced Git Operations
          case 'GET_REMOTES':
            try {
              const remotes = this.advancedGitManager.getRemotes(ipcEvent.payload.projectPath);
              return {
                success: true,
                data: remotes
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'ADD_REMOTE':
            try {
              const success = this.advancedGitManager.addRemote(
                ipcEvent.payload.projectPath,
                ipcEvent.payload.remote
              );
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'SET_REMOTE_ACCOUNT':
            try {
              const accounts = this.storageManager.getAccounts();
              const account = accounts.find(a => a.id === ipcEvent.payload.accountId);
              if (!account) {
                return {
                  success: false,
                  error: 'Account not found'
                };
              }
              const success = this.advancedGitManager.setRemoteAccount(
                ipcEvent.payload.projectPath,
                ipcEvent.payload.remoteName,
                account
              );
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'PUSH_TO_REMOTE':
            try {
              const result = await this.advancedGitManager.pushToRemote(
                ipcEvent.payload.projectPath,
                ipcEvent.payload.remoteName,
                ipcEvent.payload.branch,
                ipcEvent.payload.force
              );
              return {
                success: result.success,
                data: result,
                error: result.error
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'PULL_FROM_REMOTE':
            try {
              const result = await this.advancedGitManager.pullFromRemote(
                ipcEvent.payload.projectPath,
                ipcEvent.payload.remoteName,
                ipcEvent.payload.branch
              );
              return {
                success: result.success,
                data: result,
                error: result.error
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'GET_BRANCH_POLICIES':
            try {
              const policies = this.advancedGitManager.getBranchPolicies(ipcEvent.payload.projectPath);
              return {
                success: true,
                data: policies
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'ADD_BRANCH_POLICY':
            try {
              const policy = this.advancedGitManager.addBranchPolicy(ipcEvent.payload.policy);
              return {
                success: true,
                data: policy
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'VALIDATE_BRANCH_COMMIT':
            try {
              const accounts = this.storageManager.getAccounts();
              const account = accounts.find(a => a.id === ipcEvent.payload.account.id) || ipcEvent.payload.account;
              const validation = this.advancedGitManager.validateBranchCommit(
                ipcEvent.payload.projectPath,
                ipcEvent.payload.branch,
                account
              );
              return {
                success: true,
                data: validation
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'VALIDATE_COMMIT_FULL':
            try {
              const validation = this.advancedGitManager.validateBranchCommit(
                ipcEvent.payload.projectPath,
                ipcEvent.payload.branch || 'main',
                this.storageManager.getAccounts()[0] // Default account for validation
              );
              return {
                success: true,
                data: validation
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          // Workflow Automation
          case 'GET_AUTOMATION_RULES':
            try {
              const rules = this.workflowAutomationManager.getRules(ipcEvent.payload.teamId);
              return {
                success: true,
                data: rules
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'CREATE_AUTOMATION_RULE':
            try {
              const rule = this.workflowAutomationManager.createRule(ipcEvent.payload.rule);
              return {
                success: true,
                data: rule
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'UPDATE_AUTOMATION_RULE':
            try {
              const success = this.workflowAutomationManager.updateRule(
                ipcEvent.payload.id,
                ipcEvent.payload.rule
              );
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'DELETE_AUTOMATION_RULE':
            try {
              const success = this.workflowAutomationManager.deleteRule(ipcEvent.payload.id);
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'TRIGGER_AUTOMATION_RULE':
            try {
              const success = await this.workflowAutomationManager.triggerRule(
                ipcEvent.payload.id,
                ipcEvent.payload.context
              );
              return {
                success: success,
                data: success
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'TEST_AUTOMATION_RULE':
            try {
              const result = this.workflowAutomationManager.testRule(
                ipcEvent.payload.rule,
                ipcEvent.payload.context
              );
              return {
                success: true,
                data: result
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          // System Tray Integration
          case 'UPDATE_TRAY_MENU':
            try {
              this.systemTrayManager.updateTrayMenu(ipcEvent.payload.currentProject);
              return {
                success: true,
                data: true
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'SHOW_TRAY_NOTIFICATION':
            try {
              this.systemTrayManager.showNotification(
                ipcEvent.payload.title,
                ipcEvent.payload.content,
                ipcEvent.payload.silent || false
              );
              return {
                success: true,
                data: true
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'MINIMIZE_TO_TRAY':
            try {
              if (this.mainWindow) {
                this.mainWindow.hide();
              }
              return {
                success: true,
                data: true
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          // Bulk Import IPC Handlers
          case 'BULK_IMPORT_PREVIEW':
            try {
              const preview = await this.bulkImportManager.previewImport(ipcEvent.payload.config);
              return {
                success: true,
                data: preview
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'BULK_IMPORT_EXECUTE':
            try {
              // Execute import with progress callback if provided
              const result = await this.bulkImportManager.executeImport(
                ipcEvent.payload.config,
                (step) => {
                  // Send progress updates to renderer
                  this.mainWindow?.webContents.send('bulk-import-progress', step);
                }
              );
              return {
                success: true,
                data: result
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'GET_SUGGESTED_IMPORT_PATHS':
            try {
              const paths = this.bulkImportManager.getSuggestedImportPaths();
              return {
                success: true,
                data: paths
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'BULK_IMPORT_SCAN_PATH':
            try {
              // Scan a specific path for projects
              const scanResult = await this.projectScanner.scanDirectory(
                ipcEvent.payload.path,
                ipcEvent.payload.depth || 3
              );
              return {
                success: true,
                data: scanResult
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          // OAuth Authentication IPC Handlers
          case 'GET_OAUTH_PROVIDERS':
            try {
              const providers = this.oauthManager.getProviders();
              return {
                success: true,
                data: providers
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'START_OAUTH_FLOW':
            try {
              const account = await this.oauthManager.authenticateWithProvider(ipcEvent.payload.provider);
              return {
                success: true,
                data: account
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'OAUTH_CALLBACK':
            try {
              await this.oauthManager.handleOAuthCallback(
                ipcEvent.payload.code,
                ipcEvent.payload.state,
                ipcEvent.payload.provider as any
              );
              return {
                success: true,
                data: 'OAuth callback handled successfully'
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'REFRESH_OAUTH_TOKEN':
            try {
              const accounts = this.storageManager.getAccounts();
              const account = accounts.find(a => a.id === ipcEvent.payload.accountId) as any;
              if (!account || !account.oauthProvider) {
                return {
                  success: false,
                  error: 'OAuth account not found'
                };
              }
              const refreshedAccount = await this.oauthManager.refreshToken(account);
              return {
                success: true,
                data: refreshedAccount
              };
            } catch (error: any) {
              return {
                success: false,
                error: error.message
              };
            }

          case 'REVOKE_OAUTH_TOKEN':
            try {
              const accounts = this.storageManager.getAccounts();
              const account = accounts.find(a => a.id === ipcEvent.payload.accountId) as any;
              if (!account || !account.oauthProvider) {
                return {
                  success: false,
                  error: 'OAuth account not found'
                };
              }
              await this.oauthManager.revokeToken(account);
              return {
                success: true,
                data: 'Token revoked successfully'
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
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const core_1 = require("@gitswitch/core");
const SystemTrayManager_1 = require("./SystemTrayManager");
const WindowManager_1 = require("./WindowManager");
// Load environment variables from .env file if it exists
try {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '..', '.env') });
}
catch (error) {
    console.log('No .env file found, using default OAuth configuration');
}
class GitSwitchApp {
    constructor() {
        this.mainWindow = null;
        this.hasShownTrayNotification = false;
        this.initialProjectPath = null;
        this.pendingOAuthState = null;
        // Register custom protocol handler for gitswitch://
        if (!electron_1.app.isDefaultProtocolClient('gitswitch')) {
            electron_1.app.setAsDefaultProtocolClient('gitswitch');
        }
        // Initialize WindowManager with configuration
        this.windowManager = WindowManager_1.WindowManager.getInstance({
            defaultWidth: 800,
            defaultHeight: 600,
            minWidth: 600,
            minHeight: 400,
            preventMultipleInstances: true,
            saveWindowState: true,
            restoreWindowState: true
        });
        this.gitManager = new core_1.GitManager();
        this.storageManager = new core_1.StorageManager();
        this.projectManager = new core_1.ProjectManager();
        this.smartDetector = new core_1.SmartDetector(this.storageManager);
        this.gitHookManager = new core_1.GitHookManager(this.gitManager, this.storageManager, this.smartDetector);
        this.teamManager = new core_1.TeamManager(this.storageManager);
        this.securityManager = new core_1.SecurityManager(this.storageManager);
        this.pluginManager = new core_1.PluginManager(this.storageManager, this.gitManager, this.projectManager);
        this.advancedGitManager = new core_1.AdvancedGitManager(this.gitManager, this.securityManager, this.storageManager);
        this.workflowAutomationManager = new core_1.WorkflowAutomationManager(this.storageManager, this.gitManager, this.projectManager, this.securityManager, this.advancedGitManager);
        this.projectScanner = new core_1.ProjectScanner(this.gitManager, this.storageManager);
        this.bulkImportManager = new core_1.BulkImportManager(this.storageManager, this.projectScanner, this.smartDetector, this.gitManager);
        this.oauthManager = new core_1.OAuthManager(this.storageManager);
        this.systemTrayManager = new SystemTrayManager_1.SystemTrayManager(this.gitManager, this.storageManager, this.projectManager);
        // Parse command line arguments
        this.parseCommandLineArgs();
        this.initializeApp();
        this.setupIPC();
    }
    parseCommandLineArgs() {
        // Parse command line arguments to get project path
        const args = process.argv;
        const projectIndex = args.findIndex(arg => arg === '--project');
        if (projectIndex !== -1 && projectIndex + 1 < args.length) {
            this.initialProjectPath = args[projectIndex + 1];
            console.log('🎯 Initial project path from CLI:', this.initialProjectPath);
        }
    }
    initializeApp() {
        electron_1.app.whenReady().then(() => {
            this.createMainWindow();
            electron_1.app.on('activate', () => {
                console.log('whenReady Activate');
                if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow();
                }
            });
        });
        electron_1.app.on('window-all-closed', () => {
            console.log('Quit');
            // On macOS, keep app running even when all windows are closed
            // On other platforms, quit unless specifically keeping in tray
            if (process.platform !== 'darwin') {
                // Don't quit, just hide to tray
                return;
            }
        });
        electron_1.app.on('before-quit', () => {
            console.log('Before Quit');
            electron_1.app.isQuiting = true;
            this.windowManager.cleanup();
        });
        // Handle protocol for OAuth callback on Windows/Linux
        electron_1.app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Someone tried to run a second instance, we should focus our window instead
            // Also check if it's an OAuth callback
            const url = commandLine.find(arg => arg.startsWith('gitswitch://'));
            if (url) {
                this.handleProtocolUrl(url);
            }
            // Focus the main window
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized())
                    this.mainWindow.restore();
                this.mainWindow.focus();
            }
        });
        // Handle protocol URLs on macOS
        electron_1.app.on('open-url', (event, url) => {
            event.preventDefault();
            this.handleProtocolUrl(url);
        });
        electron_1.app.on('activate', () => {
            console.log('Activate');
            // On macOS, re-create window when dock icon is clicked
            if (!this.windowManager.hasOpenWindows()) {
                this.createMainWindow();
            }
            else {
                this.windowManager.focusWindow('main');
            }
        });
    }
    createMainWindow() {
        console.log('🚀 Initializing GitSwitch...');
        console.log('[GitSwitchApp] dirname: ', __dirname);
        // Create window using WindowManager for better management
        this.mainWindow = this.windowManager.createWindow('main', {
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                experimentalFeatures: true,
                enableBlinkFeatures: 'CSSBackdropFilter',
                preload: path.join(__dirname, 'preload.js'),
            },
            titleBarStyle: 'default',
            show: false, // Don't show until ready
            icon: path.join(__dirname, '..', 'assets', 'icons', 'tray-icon.png'),
            title: 'GitSwitch - Git Identity Manager'
        });
        // Load the React app
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
            this.mainWindow.loadURL('http://localhost:3000');
            this.mainWindow.webContents.openDevTools();
        }
        else {
            this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
        }
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
            // Initialize system tray after window is ready
            this.systemTrayManager.initialize(this.mainWindow);
        });
        // Handle window close - minimize to tray instead of quitting
        this.mainWindow.on('close', (event) => {
            if (!electron_1.app.isQuiting) {
                event.preventDefault();
                this.mainWindow?.hide();
                // Show notification on first minimize
                if (!this.hasShownTrayNotification) {
                    this.systemTrayManager.showNotification('GitSwitch', 'GitSwitch is still running in the system tray', false);
                    this.hasShownTrayNotification = true;
                }
            }
        });
        this.mainWindow.on('closed', () => {
            console.log('🔄 Main window closed');
            this.windowManager.closeWindow('main');
            this.mainWindow = null;
        });
    }
    setupIPC() {
        // Handle IPC events from renderer process
        electron_1.ipcMain.handle('api', async (event, ipcEvent) => {
            try {
                console.log('📨 IPC Event received:', ipcEvent.type, ipcEvent.payload);
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
                        const updateSuccess = this.storageManager.updateAccount(ipcEvent.payload.id, ipcEvent.payload.account);
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
                        const switchSuccess = this.projectManager.switchGitIdentity(ipcEvent.payload.projectPath, ipcEvent.payload.accountId);
                        return {
                            success: switchSuccess,
                            data: switchSuccess
                        };
                    case 'INSTALL_GIT_HOOKS':
                        const installSuccess = this.gitHookManager.installHooks(ipcEvent.payload.projectPath, ipcEvent.payload.config);
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'UPDATE_TEAM':
                        try {
                            const updateSuccess = this.teamManager.updateTeam(ipcEvent.payload.id, ipcEvent.payload.team);
                            return {
                                success: updateSuccess,
                                data: updateSuccess
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'INVITE_MEMBER':
                        try {
                            const inviteSuccess = this.teamManager.addTeamMember(ipcEvent.payload.teamId, {
                                email: ipcEvent.payload.email,
                                name: ipcEvent.payload.email.split('@')[0], // Use email prefix as name
                                role: ipcEvent.payload.role,
                                permissions: []
                            });
                            return {
                                success: inviteSuccess,
                                data: inviteSuccess
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'SEARCH_PLUGINS':
                        try {
                            const results = await this.pluginManager.searchPlugins(ipcEvent.payload.query, ipcEvent.payload.category);
                            return {
                                success: true,
                                data: results
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'INSTALL_PLUGIN':
                        try {
                            const result = await this.pluginManager.installPlugin(ipcEvent.payload.pluginId, ipcEvent.payload.version);
                            return {
                                success: result.success,
                                data: result,
                                error: result.error
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'UPDATE_PLUGIN_SETTINGS':
                        try {
                            const success = await this.pluginManager.updatePluginSettings(ipcEvent.payload.pluginId, ipcEvent.payload.settings);
                            return {
                                success: success,
                                data: success
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'ADD_REMOTE':
                        try {
                            const success = this.advancedGitManager.addRemote(ipcEvent.payload.projectPath, ipcEvent.payload.remote);
                            return {
                                success: success,
                                data: success
                            };
                        }
                        catch (error) {
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
                            const success = this.advancedGitManager.setRemoteAccount(ipcEvent.payload.projectPath, ipcEvent.payload.remoteName, account);
                            return {
                                success: success,
                                data: success
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'PUSH_TO_REMOTE':
                        try {
                            const result = await this.advancedGitManager.pushToRemote(ipcEvent.payload.projectPath, ipcEvent.payload.remoteName, ipcEvent.payload.branch, ipcEvent.payload.force);
                            return {
                                success: result.success,
                                data: result,
                                error: result.error
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'PULL_FROM_REMOTE':
                        try {
                            const result = await this.advancedGitManager.pullFromRemote(ipcEvent.payload.projectPath, ipcEvent.payload.remoteName, ipcEvent.payload.branch);
                            return {
                                success: result.success,
                                data: result,
                                error: result.error
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'VALIDATE_BRANCH_COMMIT':
                        try {
                            const accounts = this.storageManager.getAccounts();
                            const account = accounts.find(a => a.id === ipcEvent.payload.account.id) || ipcEvent.payload.account;
                            const validation = this.advancedGitManager.validateBranchCommit(ipcEvent.payload.projectPath, ipcEvent.payload.branch, account);
                            return {
                                success: true,
                                data: validation
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'VALIDATE_COMMIT_FULL':
                        try {
                            const validation = this.advancedGitManager.validateBranchCommit(ipcEvent.payload.projectPath, ipcEvent.payload.branch || 'main', this.storageManager.getAccounts()[0] // Default account for validation
                            );
                            return {
                                success: true,
                                data: validation
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'UPDATE_AUTOMATION_RULE':
                        try {
                            const success = this.workflowAutomationManager.updateRule(ipcEvent.payload.id, ipcEvent.payload.rule);
                            return {
                                success: success,
                                data: success
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'TRIGGER_AUTOMATION_RULE':
                        try {
                            const success = await this.workflowAutomationManager.triggerRule(ipcEvent.payload.id, ipcEvent.payload.context);
                            return {
                                success: success,
                                data: success
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'TEST_AUTOMATION_RULE':
                        try {
                            const result = this.workflowAutomationManager.testRule(ipcEvent.payload.rule, ipcEvent.payload.context);
                            return {
                                success: true,
                                data: result
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'SHOW_TRAY_NOTIFICATION':
                        try {
                            this.systemTrayManager.showNotification(ipcEvent.payload.title, ipcEvent.payload.content, ipcEvent.payload.silent || false);
                            return {
                                success: true,
                                data: true
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'BULK_IMPORT_EXECUTE':
                        try {
                            // Execute import with progress callback if provided
                            const result = await this.bulkImportManager.executeImport(ipcEvent.payload.config, (step) => {
                                // Send progress updates to renderer
                                this.mainWindow?.webContents.send('bulk-import-progress', step);
                            });
                            return {
                                success: true,
                                data: result
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'BULK_IMPORT_SCAN_PATH':
                        try {
                            // Scan a specific path for projects
                            const scanResult = await this.projectScanner.scanDirectory(ipcEvent.payload.path, ipcEvent.payload.depth || 3);
                            return {
                                success: true,
                                data: scanResult
                            };
                        }
                        catch (error) {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'OAUTH_CALLBACK':
                        try {
                            await this.oauthManager.handleOAuthCallback(ipcEvent.payload.code, ipcEvent.payload.state, ipcEvent.payload.provider);
                            return {
                                success: true,
                                data: 'OAuth callback handled successfully'
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'REFRESH_OAUTH_TOKEN':
                        try {
                            const accounts = this.storageManager.getAccounts();
                            const account = accounts.find(a => a.id === ipcEvent.payload.accountId);
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'REVOKE_OAUTH_TOKEN':
                        try {
                            const accounts = this.storageManager.getAccounts();
                            const account = accounts.find(a => a.id === ipcEvent.payload.accountId);
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
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message
                            };
                        }
                    case 'GITHUB_START_REDIRECT_FLOW':
                        try {
                            console.log('🔄 Starting GitHub redirect flow...');
                            // Generate secure state parameter for CSRF protection
                            this.pendingOAuthState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                            console.log('📊 OAuth Manager:', this.oauthManager);
                            console.log('📊 OAuth Manager providers:', this.oauthManager.providers);
                            const provider = this.oauthManager.providers.github;
                            console.log('📊 GitHub provider:', provider);
                            // Build authorization URL with redirect to custom protocol
                            const authUrl = new URL(provider.authUrl);
                            authUrl.searchParams.set('client_id', provider.clientId);
                            authUrl.searchParams.set('redirect_uri', 'gitswitch://auth/callback');
                            authUrl.searchParams.set('scope', provider.scope);
                            authUrl.searchParams.set('state', this.pendingOAuthState);
                            authUrl.searchParams.set('response_type', 'code');
                            // Open browser to GitHub authorization URL
                            const { shell } = require('electron');
                            await shell.openExternal(authUrl.toString());
                            return {
                                success: true,
                                data: {
                                    message: 'Browser opened for GitHub authorization. Complete the process in your browser.',
                                    authUrl: authUrl.toString()
                                }
                            };
                        }
                        catch (error) {
                            console.error('❌ GitHub redirect flow error:', error);
                            console.error('❌ Error stack:', error.stack);
                            return {
                                success: false,
                                error: error.message || 'Failed to start GitHub redirect flow'
                            };
                        }
                    case 'GITHUB_OAUTH_LOGIN':
                        try {
                            const account = await this.oauthManager.authenticateWithProvider('github');
                            // Store the account with secure token storage
                            if (account.oauthToken) {
                                // Encrypt the token using Electron's safeStorage
                                try {
                                    const { safeStorage } = require('electron');
                                    if (safeStorage.isEncryptionAvailable()) {
                                        const encryptedToken = safeStorage.encryptString(account.oauthToken);
                                        account.oauthTokenEncrypted = encryptedToken.toString('base64');
                                        delete account.oauthToken; // Remove plain text token
                                    }
                                }
                                catch (encryptError) {
                                    console.warn('Failed to encrypt token:', encryptError);
                                    // Continue without encryption as fallback
                                }
                            }
                            const savedAccount = this.storageManager.addAccount(account);
                            return {
                                success: true,
                                data: savedAccount
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message || 'GitHub authentication failed'
                            };
                        }
                    case 'DELETE_GITHUB_ACCOUNT':
                        try {
                            const accountId = ipcEvent.payload.accountId;
                            const accounts = this.storageManager.getAccounts();
                            const account = accounts.find(a => a.id === accountId);
                            if (!account) {
                                return {
                                    success: false,
                                    error: 'Account not found'
                                };
                            }
                            // Revoke the OAuth token if it exists
                            if (account.oauthProvider === 'github' && (account.oauthToken || account.oauthTokenEncrypted)) {
                                try {
                                    // Decrypt token if encrypted
                                    if (account.oauthTokenEncrypted) {
                                        const { safeStorage } = require('electron');
                                        if (safeStorage.isEncryptionAvailable()) {
                                            const encryptedBuffer = Buffer.from(account.oauthTokenEncrypted, 'base64');
                                            account.oauthToken = safeStorage.decryptString(encryptedBuffer);
                                        }
                                    }
                                    if (account.oauthToken) {
                                        await this.oauthManager.revokeToken(account);
                                    }
                                }
                                catch (revokeError) {
                                    console.warn('Failed to revoke token during deletion:', revokeError);
                                    // Continue with deletion even if revocation fails
                                }
                            }
                            // Delete the account
                            const deleteSuccess = this.storageManager.deleteAccount(accountId);
                            return {
                                success: deleteSuccess,
                                data: deleteSuccess
                            };
                        }
                        catch (error) {
                            return {
                                success: false,
                                error: error.message || 'Failed to delete GitHub account'
                            };
                        }
                    default:
                        return {
                            success: false,
                            error: 'Unknown IPC event type'
                        };
                }
            }
            catch (error) {
                console.error('❌ IPC Handler Error:', error);
                console.error('❌ Error stack:', error.stack);
                return {
                    success: false,
                    error: error.message || 'Unknown error occurred'
                };
            }
        });
    }
    async handleProtocolUrl(url) {
        console.log('🔗 Protocol URL received:', url);
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol === 'gitswitch:' && urlObj.pathname === '/auth/callback') {
                const code = urlObj.searchParams.get('code');
                const state = urlObj.searchParams.get('state');
                const error = urlObj.searchParams.get('error');
                if (error) {
                    console.error('❌ OAuth error:', error);
                    this.showOAuthResult(false, `OAuth error: ${error}`);
                    return;
                }
                if (!code || !state) {
                    console.error('❌ Missing code or state in OAuth callback');
                    this.showOAuthResult(false, 'Invalid OAuth callback - missing parameters');
                    return;
                }
                // Verify state matches what we sent (basic CSRF protection)
                if (state !== this.pendingOAuthState) {
                    console.error('❌ OAuth state mismatch');
                    this.showOAuthResult(false, 'OAuth state mismatch - possible CSRF attack');
                    return;
                }
                console.log('✅ Valid OAuth callback received, exchanging code for token...');
                // Exchange code for token using existing OAuth manager
                try {
                    const provider = this.oauthManager.providers.github;
                    // Exchange authorization code for access token
                    const tokenResponse = await this.exchangeCodeForToken(code, provider);
                    // Get user info
                    const userInfo = await this.oauthManager.getUserInfo('github', tokenResponse.access_token);
                    // Create account
                    const account = await this.oauthManager.createAccountFromOAuth('github', tokenResponse, userInfo);
                    // Store the account with secure token storage
                    if (account.oauthToken) {
                        try {
                            const { safeStorage } = require('electron');
                            if (safeStorage.isEncryptionAvailable()) {
                                const encryptedToken = safeStorage.encryptString(account.oauthToken);
                                account.oauthTokenEncrypted = encryptedToken.toString('base64');
                                delete account.oauthToken; // Remove plain text token
                            }
                        }
                        catch (encryptError) {
                            console.warn('Failed to encrypt token:', encryptError);
                        }
                    }
                    const savedAccount = this.storageManager.addAccount(account);
                    console.log(`✅ GitHub account successfully added: ${userInfo.login}`);
                    // Clear pending state
                    this.pendingOAuthState = null;
                    // Show success and notify renderer
                    this.showOAuthResult(true, `Successfully connected GitHub account: ${userInfo.login}`);
                    // Notify renderer process that account was added
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('oauth-success', savedAccount);
                    }
                }
                catch (tokenError) {
                    console.error('❌ Failed to exchange OAuth code:', tokenError);
                    this.showOAuthResult(false, `Failed to complete GitHub authentication: ${tokenError.message}`);
                }
            }
        }
        catch (parseError) {
            console.error('❌ Failed to parse protocol URL:', parseError);
            this.showOAuthResult(false, 'Invalid protocol URL format');
        }
    }
    async exchangeCodeForToken(code, provider) {
        const response = await fetch(provider.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'GitSwitch/1.0',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: provider.clientId,
                code: code,
                redirect_uri: 'gitswitch://auth/callback',
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }
        const responseText = await response.text();
        try {
            return JSON.parse(responseText);
        }
        catch (parseError) {
            // Handle URL-encoded response
            if (responseText.includes('access_token=')) {
                const urlParams = new URLSearchParams(responseText);
                return {
                    access_token: urlParams.get('access_token') || '',
                    token_type: urlParams.get('token_type') || 'bearer',
                    scope: urlParams.get('scope') || '',
                };
            }
            throw new Error('Invalid token response format');
        }
    }
    showOAuthResult(success, message) {
        // Focus the main window if it exists
        if (this.mainWindow) {
            if (this.mainWindow.isMinimized())
                this.mainWindow.restore();
            this.mainWindow.focus();
            // Send result to renderer
            this.mainWindow.webContents.send('oauth-result', { success, message });
        }
        else {
            // If no window, show system notification
            console.log(success ? '✅' : '❌', message);
        }
    }
}
// Create the app instance
new GitSwitchApp();

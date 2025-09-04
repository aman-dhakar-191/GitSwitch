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
class GitSwitchApp {
    constructor() {
        this.mainWindow = null;
        this.gitManager = new core_1.GitManager();
        this.storageManager = new core_1.StorageManager();
        this.projectManager = new core_1.ProjectManager();
        this.smartDetector = new core_1.SmartDetector(this.storageManager);
        this.gitHookManager = new core_1.GitHookManager(this.gitManager, this.storageManager, this.smartDetector);
        this.initializeApp();
        this.setupIPC();
    }
    initializeApp() {
        electron_1.app.whenReady().then(() => {
            this.createMainWindow();
            electron_1.app.on('activate', () => {
                if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow();
                }
            });
        });
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
    }
    createMainWindow() {
        this.mainWindow = new electron_1.BrowserWindow({
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
        }
        else {
            this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
        }
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
        });
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }
    setupIPC() {
        // Handle IPC events from renderer process
        electron_1.ipcMain.handle('api', async (event, ipcEvent) => {
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
                    default:
                        return {
                            success: false,
                            error: 'Unknown IPC event type'
                        };
                }
            }
            catch (error) {
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

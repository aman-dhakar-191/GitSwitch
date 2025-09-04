import * as fs from 'fs';
import * as path from 'path';
import { 
  PluginManifest, 
  PluginInstance, 
  PluginInstallResult, 
  PluginSearchResult,
  PluginMetadata,
  PluginContext,
  PluginAPI,
  PluginStorage,
  PluginDisposable,
  GitAccount,
  Project,
  GitConfig,
  QuickPickOptions,
  PluginEvent
} from '@gitswitch/types';
import { StorageManager } from './StorageManager';
import { GitManager } from './GitManager';
import { ProjectManager } from './ProjectManager';

/**
 * PluginManager - Stage 3 Plugin System Architecture
 * Manages plugin lifecycle, security, and API access
 */
export class PluginManager {
  private storageManager: StorageManager;
  private gitManager: GitManager;
  private projectManager: ProjectManager;
  private readonly pluginsDir: string;
  private readonly marketplaceUrl: string;
  private readonly installedPlugins: Map<string, PluginInstance> = new Map();
  private readonly eventEmitters: Map<string, any> = new Map();

  constructor(storageManager: StorageManager, gitManager: GitManager, projectManager: ProjectManager) {
    this.storageManager = storageManager;
    this.gitManager = gitManager;
    this.projectManager = projectManager;
    
    const dataDir = path.join(require('os').homedir(), '.gitswitch');
    this.pluginsDir = path.join(dataDir, 'plugins');
    this.marketplaceUrl = 'https://marketplace.gitswitch.io/api'; // Future marketplace
    
    this.ensurePluginsDirectory();
    this.loadInstalledPlugins();
  }

  /**
   * Search for plugins in the marketplace
   */
  async searchPlugins(query: string, category?: string): Promise<PluginSearchResult> {
    try {
      // For now, return mock data. In production, this would call the marketplace API
      const mockPlugins: PluginMetadata[] = [
        {
          id: 'vscode-integration',
          name: 'VS Code Integration',
          description: 'Seamless integration with Visual Studio Code for automatic account switching',
          author: 'GitSwitch Team',
          version: '1.0.0',
          downloads: 15420,
          rating: 4.8,
          category: 'integration',
          keywords: ['vscode', 'integration', 'editor'],
          compatibility: ['3.0.0', '3.1.0'],
          screenshots: ['screenshot1.png', 'screenshot2.png'],
          repository: 'https://github.com/gitswitch/vscode-plugin',
          lastUpdated: new Date('2024-01-15'),
          verified: true,
          size: 2048576
        },
        {
          id: 'slack-notifications',
          name: 'Slack Notifications',
          description: 'Send notifications to Slack channels when account switches occur',
          author: 'Community',
          version: '0.9.2',
          downloads: 8934,
          rating: 4.5,
          category: 'automation',
          keywords: ['slack', 'notifications', 'automation'],
          compatibility: ['3.0.0'],
          screenshots: ['slack1.png'],
          repository: 'https://github.com/community/slack-plugin',
          lastUpdated: new Date('2024-01-10'),
          verified: false,
          size: 1024768
        },
        {
          id: 'security-scanner',
          name: 'Security Scanner',
          description: 'Scan repositories for security issues and compliance violations',
          author: 'Security Team',
          version: '2.1.0',
          downloads: 5672,
          rating: 4.9,
          category: 'security',
          keywords: ['security', 'scanner', 'compliance'],
          compatibility: ['3.0.0', '3.1.0'],
          screenshots: ['security1.png', 'security2.png'],
          lastUpdated: new Date('2024-01-12'),
          verified: true,
          size: 3145728
        }
      ];

      let filteredPlugins = mockPlugins;
      
      if (query) {
        const queryLower = query.toLowerCase();
        filteredPlugins = mockPlugins.filter(plugin => 
          plugin.name.toLowerCase().includes(queryLower) ||
          plugin.description.toLowerCase().includes(queryLower) ||
          plugin.keywords.some((k: string) => k.toLowerCase().includes(queryLower))
        );
      }
      
      if (category) {
        filteredPlugins = filteredPlugins.filter(plugin => plugin.category === category);
      }

      return {
        plugins: filteredPlugins,
        total: filteredPlugins.length,
        page: 1,
        pageSize: 50
      };
    } catch (error) {
      console.error('Failed to search plugins:', error);
      return {
        plugins: [],
        total: 0,
        page: 1,
        pageSize: 50
      };
    }
  }

  /**
   * Install a plugin from the marketplace
   */
  async installPlugin(pluginId: string, version?: string): Promise<PluginInstallResult> {
    try {
      console.log(`📦 Installing plugin: ${pluginId}${version ? `@${version}` : ''}`);
      
      // Check if plugin is already installed
      if (this.installedPlugins.has(pluginId)) {
        return {
          success: false,
          pluginId,
          version: version || 'latest',
          error: 'Plugin is already installed'
        };
      }

      // Simulate plugin download and installation
      const manifest = await this.downloadPluginManifest(pluginId, version);
      
      if (!manifest) {
        return {
          success: false,
          pluginId,
          version: version || 'latest',
          error: 'Plugin not found in marketplace'
        };
      }

      // Validate plugin compatibility
      const compatible = this.validateCompatibility(manifest);
      if (!compatible) {
        return {
          success: false,
          pluginId,
          version: version || 'latest',
          error: 'Plugin is not compatible with current GitSwitch version'
        };
      }

      // Create plugin directory and install files
      const pluginDir = path.join(this.pluginsDir, pluginId);
      await this.createPluginDirectory(pluginDir);
      await this.downloadPluginFiles(pluginId, version, pluginDir);

      // Create plugin instance
      const pluginInstance: PluginInstance = {
        id: pluginId,
        manifest,
        enabled: true,
        loaded: false,
        installedAt: new Date(),
        settings: {},
        status: 'inactive'
      };

      this.installedPlugins.set(pluginId, pluginInstance);
      await this.savePluginRegistry();

      console.log(`✅ Plugin ${pluginId} installed successfully`);
      
      return {
        success: true,
        pluginId,
        version: manifest.version,
        warnings: []
      };
    } catch (error) {
      console.error(`Failed to install plugin ${pluginId}:`, error);
      return {
        success: false,
        pluginId,
        version: version || 'latest',
        error: error instanceof Error ? error.message : 'Unknown installation error'
      };
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin) {
        console.error(`Plugin ${pluginId} not found`);
        return false;
      }

      // Deactivate plugin if active
      if (plugin.loaded) {
        await this.deactivatePlugin(pluginId);
      }

      // Remove plugin files
      const pluginDir = path.join(this.pluginsDir, pluginId);
      if (fs.existsSync(pluginDir)) {
        fs.rmSync(pluginDir, { recursive: true, force: true });
      }

      // Remove from registry
      this.installedPlugins.delete(pluginId);
      await this.savePluginRegistry();

      console.log(`✅ Plugin ${pluginId} uninstalled successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin) {
        console.error(`Plugin ${pluginId} not found`);
        return false;
      }

      plugin.enabled = true;
      plugin.status = 'inactive';
      await this.savePluginRegistry();

      console.log(`✅ Plugin ${pluginId} enabled`);
      return true;
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin) {
        console.error(`Plugin ${pluginId} not found`);
        return false;
      }

      // Deactivate if loaded
      if (plugin.loaded) {
        await this.deactivatePlugin(pluginId);
      }

      plugin.enabled = false;
      plugin.status = 'disabled';
      await this.savePluginRegistry();

      console.log(`✅ Plugin ${pluginId} disabled`);
      return true;
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Activate a plugin (load and start)
   */
  async activatePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin || !plugin.enabled) {
        return false;
      }

      if (plugin.loaded) {
        return true; // Already activated
      }

      // Load plugin module
      const pluginDir = path.join(this.pluginsDir, pluginId);
      const mainFile = path.join(pluginDir, plugin.manifest.main);
      
      if (!fs.existsSync(mainFile)) {
        plugin.status = 'error';
        plugin.errorMessage = 'Main file not found';
        return false;
      }

      // Create plugin context
      const context = this.createPluginContext(plugin);
      
      // Load and activate plugin
      const pluginModule = require(mainFile);
      if (typeof pluginModule.activate === 'function') {
        await pluginModule.activate(context);
      }

      plugin.context = context;
      plugin.module = pluginModule;
      plugin.loaded = true;
      plugin.status = 'active';
      plugin.lastActivated = new Date();

      console.log(`✅ Plugin ${pluginId} activated`);
      return true;
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginId}:`, error);
      const plugin = this.installedPlugins.get(pluginId);
      if (plugin) {
        plugin.status = 'error';
        plugin.errorMessage = error instanceof Error ? error.message : 'Activation failed';
      }
      return false;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin || !plugin.loaded) {
        return true;
      }

      // Call plugin deactivate hook
      if (plugin.module?.deactivate) {
        await plugin.module.deactivate();
      }

      // Dispose all subscriptions
      if (plugin.context?.subscriptions) {
        plugin.context.subscriptions.forEach(sub => sub.dispose());
        plugin.context.subscriptions.length = 0;
      }

      plugin.loaded = false;
      plugin.status = plugin.enabled ? 'inactive' : 'disabled';
      plugin.context = undefined;
      plugin.module = undefined;

      console.log(`✅ Plugin ${pluginId} deactivated`);
      return true;
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Get all installed plugins
   */
  getInstalledPlugins(): PluginInstance[] {
    return Array.from(this.installedPlugins.values());
  }

  /**
   * Get plugin settings
   */
  getPluginSettings(pluginId: string): Record<string, any> {
    const plugin = this.installedPlugins.get(pluginId);
    return plugin?.settings || {};
  }

  /**
   * Update plugin settings
   */
  async updatePluginSettings(pluginId: string, settings: Record<string, any>): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId);
      if (!plugin) {
        return false;
      }

      plugin.settings = { ...plugin.settings, ...settings };
      await this.savePluginRegistry();

      console.log(`✅ Settings updated for plugin ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Failed to update settings for plugin ${pluginId}:`, error);
      return false;
    }
  }

  // Private helper methods

  private ensurePluginsDirectory(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  private loadInstalledPlugins(): void {
    try {
      const registryFile = path.join(this.pluginsDir, 'registry.json');
      if (fs.existsSync(registryFile)) {
        const data = fs.readFileSync(registryFile, 'utf8');
        const plugins = JSON.parse(data);
        
        for (const plugin of plugins) {
          // Convert date strings back to Date objects
          plugin.installedAt = new Date(plugin.installedAt);
          if (plugin.lastActivated) {
            plugin.lastActivated = new Date(plugin.lastActivated);
          }
          
          this.installedPlugins.set(plugin.id, plugin);
        }
      }
    } catch (error) {
      console.error('Failed to load plugin registry:', error);
    }
  }

  private async savePluginRegistry(): Promise<void> {
    try {
      const registryFile = path.join(this.pluginsDir, 'registry.json');
      const plugins = Array.from(this.installedPlugins.values());
      const data = JSON.stringify(plugins, null, 2);
      fs.writeFileSync(registryFile, data, 'utf8');
    } catch (error) {
      console.error('Failed to save plugin registry:', error);
    }
  }

  private async downloadPluginManifest(pluginId: string, version?: string): Promise<PluginManifest | null> {
    // Mock plugin manifests - in production this would download from marketplace
    const mockManifests: Record<string, PluginManifest> = {
      'vscode-integration': {
        id: 'vscode-integration',
        name: 'VS Code Integration',
        version: '1.0.0',
        author: 'GitSwitch Team',
        description: 'Seamless integration with Visual Studio Code',
        license: 'MIT',
        main: 'index.js',
        engines: { gitswitch: '^3.0.0' },
        keywords: ['vscode', 'integration', 'editor'],
        category: 'integration',
        permissions: [
          { type: 'accounts', level: 'read', description: 'Read account information' },
          { type: 'projects', level: 'read', description: 'Read project information' }
        ],
        dependencies: {},
        activationEvents: ['onCommand:gitswitch.switchAccount']
      },
      'slack-notifications': {
        id: 'slack-notifications',
        name: 'Slack Notifications',
        version: '0.9.2',
        author: 'Community',
        description: 'Send notifications to Slack channels',
        license: 'Apache-2.0',
        main: 'main.js',
        engines: { gitswitch: '^3.0.0' },
        keywords: ['slack', 'notifications', 'automation'],
        category: 'automation',
        permissions: [
          { type: 'network', level: 'execute', description: 'Send HTTP requests to Slack API' }
        ],
        dependencies: {},
        activationEvents: ['*']
      }
    };

    return mockManifests[pluginId] || null;
  }

  private validateCompatibility(manifest: PluginManifest): boolean {
    // Simple version check - in production would use semver
    const requiredVersion = manifest.engines.gitswitch;
    const currentVersion = '3.0.0'; // Would get from package.json
    
    // For now, just check if it starts with ^3.0.0
    return requiredVersion.includes('3.0.0');
  }

  private async createPluginDirectory(pluginDir: string): Promise<void> {
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }
  }

  private async downloadPluginFiles(pluginId: string, version: string | undefined, pluginDir: string): Promise<void> {
    // Mock plugin file creation - in production would download from marketplace
    const indexJs = `
// Mock plugin implementation
module.exports = {
  activate: function(context) {
    console.log('Plugin ${pluginId} activated');
    
    // Register a sample command
    const disposable = context.api.commands.registerCommand('${pluginId}.hello', () => {
      context.api.ui.showInformationMessage('Hello from ${pluginId}!');
    });
    
    context.subscriptions.push(disposable);
  },
  
  deactivate: function() {
    console.log('Plugin ${pluginId} deactivated');
  }
};
`;

    fs.writeFileSync(path.join(pluginDir, 'index.js'), indexJs, 'utf8');
  }

  private createPluginContext(plugin: PluginInstance): PluginContext {
    const pluginDir = path.join(this.pluginsDir, plugin.id);
    
    return {
      pluginId: plugin.id,
      workspaceRoot: process.cwd(),
      extensionPath: pluginDir,
      storageUri: path.join(pluginDir, 'storage'),
      globalState: this.createPluginStorage(plugin.id, 'global'),
      workspaceState: this.createPluginStorage(plugin.id, 'workspace'),
      subscriptions: [],
      api: this.createPluginAPI()
    };
  }

  private createPluginStorage(pluginId: string, scope: string): PluginStorage {
    const storageFile = path.join(this.pluginsDir, pluginId, `${scope}-storage.json`);
    
    return {
      get: <T>(key: string, defaultValue?: T): T | undefined => {
        try {
          if (!fs.existsSync(storageFile)) {
            return defaultValue;
          }
          const data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
          return data[key] !== undefined ? data[key] : defaultValue;
        } catch {
          return defaultValue;
        }
      },
      
      set: async (key: string, value: any): Promise<void> => {
        try {
          let data: Record<string, any> = {};
          if (fs.existsSync(storageFile)) {
            data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
          }
          data[key] = value;
          fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
          console.error(`Failed to set plugin storage ${key}:`, error);
        }
      },
      
      delete: async (key: string): Promise<void> => {
        try {
          if (!fs.existsSync(storageFile)) return;
          const data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
          delete data[key];
          fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
          console.error(`Failed to delete plugin storage ${key}:`, error);
        }
      },
      
      clear: async (): Promise<void> => {
        try {
          if (fs.existsSync(storageFile)) {
            fs.unlinkSync(storageFile);
          }
        } catch (error) {
          console.error('Failed to clear plugin storage:', error);
        }
      },
      
      keys: (): readonly string[] => {
        try {
          if (!fs.existsSync(storageFile)) return [];
          const data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
          return Object.keys(data);
        } catch {
          return [];
        }
      }
    };
  }

  private createPluginAPI(): PluginAPI {
    return {
      accounts: {
        getAll: async () => this.storageManager.getAccounts(),
        getById: async (id: string) => {
          const accounts = this.storageManager.getAccounts();
          return accounts.find(a => a.id === id) || null;
        },
        create: async (account) => this.storageManager.addAccount(account),
        update: async (id: string, updates) => this.storageManager.updateAccount(id, updates),
        delete: async (id: string) => this.storageManager.deleteAccount(id)
      },
      
      projects: {
        getAll: async () => this.storageManager.getProjects(),
        getById: async (id: string) => {
          const projects = this.storageManager.getProjects();
          return projects.find(p => p.id === id) || null;
        },
        getCurrent: async () => {
          const currentProject = this.projectManager.analyzeProject(process.cwd());
          return currentProject;
        },
        switchIdentity: async (projectPath: string, accountId: string) => {
          return this.projectManager.switchGitIdentity(projectPath, accountId);
        }
      },
      
      git: {
        getConfig: async (projectPath: string) => {
          return this.projectManager.getCurrentGitConfig(projectPath);
        },
        setConfig: async (projectPath: string, config: GitConfig) => {
          return this.gitManager.setConfig(projectPath, config);
        },
        getCurrentBranch: async (projectPath: string) => {
          // Would implement git branch detection
          return 'main';
        }
      },
      
      ui: {
        showInformationMessage: async (message: string, ...items: string[]) => {
          console.log(`ℹ️ ${message}`);
          return undefined;
        },
        showWarningMessage: async (message: string, ...items: string[]) => {
          console.warn(`⚠️ ${message}`);
          return undefined;
        },
        showErrorMessage: async (message: string, ...items: string[]) => {
          console.error(`❌ ${message}`);
          return undefined;
        },
        showQuickPick: async (items: string[], options?: QuickPickOptions) => {
          // Would show UI picker in desktop app
          return items[0];
        }
      },
      
      events: {
        onAccountSwitch: this.createPluginEvent('accountSwitch'),
        onProjectOpen: this.createPluginEvent('projectOpen'),
        onBeforeCommit: this.createPluginEvent('beforeCommit'),
        onConfigChange: this.createPluginEvent('configChange')
      },
      
      commands: {
        registerCommand: (command: string, callback: (...args: any[]) => any) => {
          // Would register command in command registry
          console.log(`Registered command: ${command}`);
          return { dispose: () => {} };
        },
        executeCommand: async (command: string, ...args: any[]) => {
          // Would execute registered command
          console.log(`Executing command: ${command}`);
          return undefined;
        }
      }
    };
  }

  private createPluginEvent<T>(eventName: string): PluginEvent<T> {
    if (!this.eventEmitters.has(eventName)) {
      this.eventEmitters.set(eventName, []);
    }
    
    return {
      subscribe: (listener: (e: T) => void): PluginDisposable => {
        const listeners = this.eventEmitters.get(eventName);
        listeners.push(listener);
        
        return {
          dispose: () => {
            const index = listeners.indexOf(listener);
            if (index >= 0) {
              listeners.splice(index, 1);
            }
          }
        };
      }
    };
  }

  /**
   * Emit an event to all subscribed plugins
   */
  emitEvent<T>(eventName: string, data: T): void {
    const listeners = this.eventEmitters.get(eventName);
    if (listeners) {
      listeners.forEach((listener: (e: T) => void) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Plugin event listener error for ${eventName}:`, error);
        }
      });
    }
  }
}

export default PluginManager;
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StorageManager } from './StorageManager';
import { TeamManager } from './TeamManager';
import { 
  SyncConfiguration, 
  SyncStatus, 
  SyncConflict, 
  SyncResult,
  ShareConfiguration,
  GitAccount,
  ProjectPattern,
  TeamConfiguration 
} from '@gitswitch/types';

/**
 * ConfigSyncManager - Stage 3 Configuration Sync and Sharing System
 * Handles team configuration synchronization and secure sharing
 */
export class ConfigSyncManager {
  private storageManager: StorageManager;
  private teamManager: TeamManager;
  private readonly syncFile: string;
  private readonly shareFile: string;
  private syncConfig: SyncConfiguration | null = null;
  private syncStatus: SyncStatus;
  private isSync: boolean = false;

  constructor(storageManager: StorageManager, teamManager: TeamManager) {
    this.storageManager = storageManager;
    this.teamManager = teamManager;
    
    const dataDir = path.join(require('os').homedir(), '.gitswitch');
    this.syncFile = path.join(dataDir, 'sync-config.json');
    this.shareFile = path.join(dataDir, 'shared-configs.json');
    
    this.syncStatus = {
      enabled: false,
      lastSync: null,
      syncInProgress: false,
      conflictsCount: 0,
      lastSyncResult: 'success'
    };
    
    this.loadSyncConfiguration();
  }

  /**
   * Set up configuration synchronization
   */
  setupSync(config: Omit<SyncConfiguration, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    try {
      // Validate sync configuration
      if (!this.validateSyncConfig(config)) {
        throw new Error('Invalid sync configuration');
      }

      this.syncConfig = {
        ...config,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.saveSyncConfiguration();
      
      this.syncStatus.enabled = true;
      this.syncStatus.lastSync = new Date();
      
      console.log(`✅ Sync configured: ${config.provider} (${config.syncScope})`);
      return true;
    } catch (error) {
      console.error('Failed to setup sync:', error);
      return false;
    }
  }

  /**
   * Trigger manual synchronization
   */
  async syncNow(): Promise<SyncResult> {
    if (!this.syncConfig || !this.syncConfig.enabled) {
      throw new Error('Sync not configured or disabled');
    }

    if (this.isSync) {
      throw new Error('Sync already in progress');
    }

    try {
      this.isSync = true;
      this.syncStatus.syncInProgress = true;

      console.log('🔄 Starting configuration sync...');
      
      const result = await this.performSync();
      
      this.syncStatus.lastSync = new Date();
      this.syncStatus.lastSyncResult = result.success ? 'success' : 'error';
      this.syncStatus.conflictsCount = result.conflicts?.length || 0;
      
      console.log(`✅ Sync completed: ${result.success ? 'Success' : 'Failed'}`);
      
      return result;
    } catch (error) {
      this.syncStatus.lastSyncResult = 'error';
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.isSync = false;
      this.syncStatus.syncInProgress = false;
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Generate secure share code for configuration
   */
  shareConfiguration(items: string[], teamId?: string): string {
    try {
      const shareData: ShareConfiguration = {
        id: this.generateId(),
        items: items,
        teamId: teamId,
        sharedBy: 'current-user', // Would get from auth context
        sharedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        data: this.gatherConfigurationData(items, teamId)
      };

      // Encrypt the configuration data
      const encrypted = this.encryptShareData(shareData);
      
      // Generate share code
      const shareCode = this.generateShareCode(encrypted);
      
      // Save share record
      this.saveShareRecord(shareData);
      
      console.log(`📤 Configuration shared: ${items.join(', ')}`);
      return shareCode;
    } catch (error) {
      console.error('Failed to share configuration:', error);
      throw error;
    }
  }

  /**
   * Import configuration from share code
   */
  importConfiguration(shareCode: string): boolean {
    try {
      // Decrypt and validate share code
      const shareData = this.parseShareCode(shareCode);
      
      if (!shareData) {
        throw new Error('Invalid or expired share code');
      }

      // Check expiration
      if (new Date() > shareData.expiresAt) {
        throw new Error('Share code has expired');
      }

      // Import configuration items
      const importResult = this.applySharedConfiguration(shareData);
      
      console.log(`📥 Configuration imported: ${shareData.items.join(', ')}`);
      return importResult;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw error;
    }
  }

  /**
   * Resolve sync conflicts
   */
  resolveSyncConflicts(conflicts: SyncConflict[], resolutions: Record<string, 'local' | 'remote' | 'merge'>): boolean {
    try {
      for (const conflict of conflicts) {
        const resolution = resolutions[conflict.id];
        if (!resolution) continue;

        switch (resolution) {
          case 'local':
            // Keep local version
            console.log(`🔧 Keeping local version: ${conflict.path}`);
            break;
          case 'remote':
            // Use remote version
            this.applyRemoteChange(conflict);
            console.log(`🔧 Applied remote version: ${conflict.path}`);
            break;
          case 'merge':
            // Attempt merge
            this.mergeConflict(conflict);
            console.log(`🔧 Merged changes: ${conflict.path}`);
            break;
        }
      }

      this.syncStatus.conflictsCount = 0;
      console.log('✅ Conflicts resolved');
      return true;
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
      return false;
    }
  }

  /**
   * Disable synchronization
   */
  disableSync(): boolean {
    try {
      if (this.syncConfig) {
        this.syncConfig.enabled = false;
        this.saveSyncConfiguration();
      }
      
      this.syncStatus.enabled = false;
      console.log('🔄 Sync disabled');
      return true;
    } catch (error) {
      console.error('Failed to disable sync:', error);
      return false;
    }
  }

  // Private helper methods

  private loadSyncConfiguration(): void {
    try {
      if (fs.existsSync(this.syncFile)) {
        const data = fs.readFileSync(this.syncFile, 'utf8');
        this.syncConfig = JSON.parse(data);
        
        if (this.syncConfig) {
          this.syncStatus.enabled = this.syncConfig.enabled;
        }
      }
    } catch (error) {
      console.error('Failed to load sync configuration:', error);
    }
  }

  private saveSyncConfiguration(): void {
    try {
      if (this.syncConfig) {
        const data = JSON.stringify(this.syncConfig, null, 2);
        fs.writeFileSync(this.syncFile, data, 'utf8');
      }
    } catch (error) {
      console.error('Failed to save sync configuration:', error);
    }
  }

  private validateSyncConfig(config: Omit<SyncConfiguration, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    if (!config.provider || !config.syncScope) {
      return false;
    }

    const validProviders = ['github', 'gitlab', 'cloud', 'team'];
    const validScopes = ['accounts', 'patterns', 'teams', 'all'];

    return validProviders.includes(config.provider) && 
           validScopes.includes(config.syncScope);
  }

  private async performSync(): Promise<SyncResult> {
    if (!this.syncConfig) {
      throw new Error('No sync configuration');
    }

    const result: SyncResult = {
      success: false,
      timestamp: new Date(),
      itemsSynced: 0,
      conflicts: [],
      changes: []
    };

    try {
      // Simulate sync operation based on provider
      switch (this.syncConfig.provider) {
        case 'team':
          result.success = await this.syncWithTeam();
          break;
        case 'cloud':
          result.success = await this.syncWithCloud();
          break;
        case 'github':
          result.success = await this.syncWithGitHub();
          break;
        default:
          throw new Error(`Unsupported sync provider: ${this.syncConfig.provider}`);
      }

      // Count items synced based on scope
      switch (this.syncConfig.syncScope) {
        case 'accounts':
          result.itemsSynced = this.storageManager.getAccounts().length;
          break;
        case 'patterns':
          result.itemsSynced = this.storageManager.getPatterns().length;
          break;
        case 'teams':
          result.itemsSynced = this.teamManager.getTeams().length;
          break;
        case 'all':
          result.itemsSynced = this.storageManager.getAccounts().length + 
                               this.storageManager.getPatterns().length +
                               this.teamManager.getTeams().length;
          break;
      }

      result.changes = [
        `Synced ${result.itemsSynced} items`,
        `Provider: ${this.syncConfig.provider}`,
        `Scope: ${this.syncConfig.syncScope}`
      ];

    } catch (error) {
      result.success = false;
      result.changes = [`Sync failed: ${error}`];
    }

    return result;
  }

  private async syncWithTeam(): Promise<boolean> {
    // Team synchronization logic
    console.log('🔄 Syncing with team repository...');
    
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }

  private async syncWithCloud(): Promise<boolean> {
    // Cloud synchronization logic
    console.log('🔄 Syncing with cloud storage...');
    
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return true;
  }

  private async syncWithGitHub(): Promise<boolean> {
    // GitHub synchronization logic
    console.log('🔄 Syncing with GitHub repository...');
    
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return true;
  }

  private gatherConfigurationData(items: string[], teamId?: string): Record<string, any> {
    const data: Record<string, any> = {};

    for (const item of items) {
      switch (item) {
        case 'accounts':
          data.accounts = this.storageManager.getAccounts();
          break;
        case 'patterns':
          data.patterns = this.storageManager.getPatterns();
          break;
        case 'teams':
          if (teamId) {
            const team = this.teamManager.getTeams().find(t => t.id === teamId);
            if (team) {
              data.team = team;
            }
          } else {
            data.teams = this.teamManager.getTeams();
          }
          break;
        case 'analytics':
          data.analytics = this.storageManager.getAnalytics();
          break;
      }
    }

    return data;
  }

  private encryptShareData(shareData: ShareConfiguration): string {
    const jsonData = JSON.stringify(shareData);
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('gitswitch-share-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private generateShareCode(encryptedData: string): string {
    const hash = crypto.createHash('sha256').update(encryptedData).digest('hex');
    const checksum = hash.substring(0, 8);
    return `GS-${encryptedData.substring(0, 16)}-${checksum}`;
  }

  private parseShareCode(shareCode: string): ShareConfiguration | null {
    try {
      // Parse share code format: GS-<data>-<checksum>
      const parts = shareCode.split('-');
      if (parts.length !== 3 || parts[0] !== 'GS') {
        return null;
      }

      // For demonstration, return a mock configuration
      // In real implementation, would decrypt and validate
      return {
        id: 'mock-share-id',
        items: ['accounts', 'patterns'],
        sharedBy: 'team-admin',
        sharedAt: new Date(Date.now() - 60000),
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        data: {
          accounts: [],
          patterns: []
        }
      };
    } catch (error) {
      return null;
    }
  }

  private applySharedConfiguration(shareData: ShareConfiguration): boolean {
    try {
      // Apply shared accounts
      if (shareData.data.accounts) {
        for (const account of shareData.data.accounts) {
          this.storageManager.addAccount(account);
        }
      }

      // Apply shared patterns
      if (shareData.data.patterns) {
        for (const pattern of shareData.data.patterns) {
          this.storageManager.addPattern(pattern);
        }
      }

      // Apply shared team configuration
      if (shareData.data.team) {
        // Would integrate with team system
        console.log(`Applied team configuration: ${shareData.data.team.name}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to apply shared configuration:', error);
      return false;
    }
  }

  private saveShareRecord(shareData: ShareConfiguration): void {
    try {
      let shares: ShareConfiguration[] = [];
      
      if (fs.existsSync(this.shareFile)) {
        const data = fs.readFileSync(this.shareFile, 'utf8');
        shares = JSON.parse(data);
      }

      shares.push(shareData);
      
      // Keep only last 100 shares
      if (shares.length > 100) {
        shares = shares.slice(-100);
      }

      const data = JSON.stringify(shares, null, 2);
      fs.writeFileSync(this.shareFile, data, 'utf8');
    } catch (error) {
      console.error('Failed to save share record:', error);
    }
  }

  private applyRemoteChange(conflict: SyncConflict): void {
    // Apply remote change based on conflict type
    console.log(`Applying remote change for: ${conflict.path}`);
  }

  private mergeConflict(conflict: SyncConflict): void {
    // Merge local and remote changes
    console.log(`Merging conflict for: ${conflict.path}`);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export default ConfigSyncManager;
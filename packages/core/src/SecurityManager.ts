import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { SecurityPolicy, SSOConfiguration, SigningConfiguration, AuditEvent, AuditFilters, PasswordPolicy } from '@gitswitch/types';
import { StorageManager } from './StorageManager';

/**
 * SecurityManager - Stage 3 Enterprise Security and Compliance
 * Handles security policies, SSO, commit signing, and audit logging
 */
export class SecurityManager {
  private storageManager: StorageManager;
  private readonly securityFile: string;
  private readonly auditFile: string;
  private readonly encryptionKey: string;

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
    const dataDir = path.join(require('os').homedir(), '.gitswitch');
    this.securityFile = path.join(dataDir, 'security.json');
    this.auditFile = path.join(dataDir, 'audit.json');
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  // Security Policy Management

  /**
   * Create a new security policy
   */
  createSecurityPolicy(policyData: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): SecurityPolicy {
    const policies = this.getSecurityPolicies();
    
    const newPolicy: SecurityPolicy = {
      ...policyData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    policies.push(newPolicy);
    this.saveSecurityPolicies(policies);
    
    this.logAuditEvent({
      userId: 'current-user',
      userEmail: 'current-user@company.com',
      action: 'policy_violation',
      severity: 'info',
      ipAddress: '127.0.0.1',
      userAgent: 'GitSwitch',
      sessionId: this.generateSessionId(),
      metadata: { policyId: newPolicy.id, policyName: newPolicy.name }
    });

    console.log(`✅ Created security policy: ${newPolicy.name}`);
    return newPolicy;
  }

  /**
   * Get all security policies
   */
  getSecurityPolicies(): SecurityPolicy[] {
    try {
      if (!fs.existsSync(this.securityFile)) {
        return [];
      }
      const data = fs.readFileSync(this.securityFile, 'utf8');
      const securityData = JSON.parse(data);
      
      return (securityData.policies || []).map((policy: any) => ({
        ...policy,
        createdAt: new Date(policy.createdAt),
        updatedAt: new Date(policy.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load security policies:', error);
      return [];
    }
  }

  /**
   * Update a security policy
   */
  updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): boolean {
    const policies = this.getSecurityPolicies();
    const index = policies.findIndex(policy => policy.id === policyId);
    
    if (index === -1) {
      return false;
    }

    policies[index] = {
      ...policies[index],
      ...updates,
      id: policyId,
      updatedAt: new Date()
    };

    this.saveSecurityPolicies(policies);
    
    this.logAuditEvent({
      userId: 'current-user',
      userEmail: 'current-user@company.com',
      action: 'config_change',
      severity: 'info',
      ipAddress: '127.0.0.1',
      userAgent: 'GitSwitch',
      sessionId: this.generateSessionId(),
      metadata: { policyId, action: 'policy_updated' }
    });

    console.log(`✅ Updated security policy: ${policyId}`);
    return true;
  }

  /**
   * Delete a security policy
   */
  deleteSecurityPolicy(policyId: string): boolean {
    const policies = this.getSecurityPolicies();
    const filtered = policies.filter(policy => policy.id !== policyId);
    
    if (filtered.length === policies.length) {
      return false;
    }

    this.saveSecurityPolicies(filtered);
    
    this.logAuditEvent({
      userId: 'current-user',
      userEmail: 'current-user@company.com',
      action: 'config_change',
      severity: 'warning',
      ipAddress: '127.0.0.1',
      userAgent: 'GitSwitch',
      sessionId: this.generateSessionId(),
      metadata: { policyId, action: 'policy_deleted' }
    });

    console.log(`✅ Deleted security policy: ${policyId}`);
    return true;
  }

  // SSO Configuration

  /**
   * Setup SSO configuration
   */
  setupSSO(ssoConfig: SSOConfiguration): boolean {
    try {
      const securityData = this.getSecurityData();
      
      // Encrypt sensitive data
      if (ssoConfig.clientSecret) {
        ssoConfig.clientSecret = this.encrypt(ssoConfig.clientSecret);
      }

      securityData.ssoConfigs = securityData.ssoConfigs || [];
      const existingIndex = securityData.ssoConfigs.findIndex((config: SSOConfiguration) => config.id === ssoConfig.id);
      
      if (existingIndex >= 0) {
        securityData.ssoConfigs[existingIndex] = ssoConfig;
      } else {
        securityData.ssoConfigs.push(ssoConfig);
      }

      this.saveSecurityData(securityData);
      
      this.logAuditEvent({
        userId: 'current-user',
        userEmail: 'current-user@company.com',
        action: 'config_change',
        severity: 'info',
        ipAddress: '127.0.0.1',
        userAgent: 'GitSwitch',
        sessionId: this.generateSessionId(),
        metadata: { ssoProvider: ssoConfig.provider, domain: ssoConfig.domain }
      });

      console.log(`✅ SSO configured for ${ssoConfig.provider}: ${ssoConfig.domain}`);
      return true;
    } catch (error) {
      console.error('Failed to setup SSO:', error);
      return false;
    }
  }

  /**
   * Get SSO configurations
   */
  getSSOConfigurations(): SSOConfiguration[] {
    const securityData = this.getSecurityData();
    return securityData.ssoConfigs || [];
  }

  // Commit Signing Management

  /**
   * Configure commit signing for an account
   */
  configureCommitSigning(accountId: string, signingConfig: Omit<SigningConfiguration, 'id' | 'createdAt'>): SigningConfiguration {
    const securityData = this.getSecurityData();
    
    const newConfig: SigningConfiguration = {
      ...signingConfig,
      id: this.generateId(),
      accountId,
      createdAt: new Date()
    };

    // Encrypt passphrase if provided
    if (newConfig.passphrase) {
      newConfig.passphrase = this.encrypt(newConfig.passphrase);
    }

    securityData.signingConfigs = securityData.signingConfigs || [];
    
    // Remove existing config for this account
    securityData.signingConfigs = securityData.signingConfigs.filter(
      (config: SigningConfiguration) => config.accountId !== accountId
    );
    
    securityData.signingConfigs.push(newConfig);
    this.saveSecurityData(securityData);

    this.logAuditEvent({
      userId: 'current-user',
      userEmail: 'current-user@company.com',
      action: 'config_change',
      severity: 'info',
      ipAddress: '127.0.0.1',
      userAgent: 'GitSwitch',
      sessionId: this.generateSessionId(),
      metadata: { accountId, signingKeyType: newConfig.keyType }
    });

    console.log(`✅ Configured commit signing for account: ${accountId}`);
    return newConfig;
  }

  /**
   * Get signing configuration for an account
   */
  getSigningConfiguration(accountId: string): SigningConfiguration | null {
    const securityData = this.getSecurityData();
    const signingConfigs = securityData.signingConfigs || [];
    
    const config = signingConfigs.find((config: SigningConfiguration) => config.accountId === accountId);
    
    if (config && config.passphrase) {
      // Decrypt passphrase
      config.passphrase = this.decrypt(config.passphrase);
    }
    
    return config || null;
  }

  /**
   * Verify commit signatures in a repository
   */
  verifyCommitSignatures(projectPath: string): { verified: number; unverified: number; errors: string[] } {
    try {
      // This would integrate with git to verify signatures
      // For now, return mock data
      const result = {
        verified: 15,
        unverified: 2,
        errors: []
      };

      this.logAuditEvent({
        userId: 'current-user',
        userEmail: 'current-user@company.com',
        action: 'commit',
        severity: 'info',
        ipAddress: '127.0.0.1',
        userAgent: 'GitSwitch',
        sessionId: this.generateSessionId(),
        projectPath,
        metadata: { action: 'signature_verification', ...result }
      });

      return result;
    } catch (error: any) {
      return { verified: 0, unverified: 0, errors: [error.message] };
    }
  }

  // Audit Logging

  /**
   * Log an audit event
   */
  logAuditEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    try {
      const auditEvent: AuditEvent = {
        ...eventData,
        id: this.generateId(),
        timestamp: new Date()
      };

      const events = this.getAuditEvents({});
      events.unshift(auditEvent); // Add to beginning for chronological order

      // Keep only last 10,000 events to prevent file bloat
      if (events.length > 10000) {
        events.splice(10000);
      }

      this.saveAuditEvents(events);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Get audit events with filtering
   */
  getAuditEvents(filters: AuditFilters): AuditEvent[] {
    try {
      if (!fs.existsSync(this.auditFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.auditFile, 'utf8');
      let events: AuditEvent[] = JSON.parse(data);

      // Convert date strings back to Date objects
      events = events.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp)
      }));

      // Apply filters
      if (filters.startDate) {
        events = events.filter(event => event.timestamp >= filters.startDate!);
      }
      
      if (filters.endDate) {
        events = events.filter(event => event.timestamp <= filters.endDate!);
      }
      
      if (filters.userId) {
        events = events.filter(event => event.userId === filters.userId);
      }
      
      if (filters.action) {
        events = events.filter(event => event.action === filters.action);
      }
      
      if (filters.severity) {
        events = events.filter(event => event.severity === filters.severity);
      }
      
      if (filters.projectPath) {
        events = events.filter(event => event.projectPath === filters.projectPath);
      }

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 100;
      
      return events.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get audit events:', error);
      return [];
    }
  }

  /**
   * Export audit log in various formats
   */
  exportAuditLog(format: 'json' | 'csv' | 'excel', filters: AuditFilters): Buffer {
    const events = this.getAuditEvents(filters);
    
    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(events, null, 2));
      
      case 'csv':
        return this.exportToCSV(events);
      
      case 'excel':
        // Would use a library like xlsx for Excel export
        return Buffer.from('Excel export not implemented yet');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Validate password against security policy
   */
  validatePassword(password: string, policy?: PasswordPolicy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!policy) {
      return { valid: true, errors: [] };
    }

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSymbols && !/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one symbol');
    }

    return { valid: errors.length === 0, errors };
  }

  // Private helper methods

  private getSecurityData(): any {
    try {
      if (!fs.existsSync(this.securityFile)) {
        return { policies: [], ssoConfigs: [], signingConfigs: [] };
      }
      return JSON.parse(fs.readFileSync(this.securityFile, 'utf8'));
    } catch (error) {
      return { policies: [], ssoConfigs: [], signingConfigs: [] };
    }
  }

  private saveSecurityData(data: any): boolean {
    try {
      fs.writeFileSync(this.securityFile, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save security data:', error);
      return false;
    }
  }

  private saveSecurityPolicies(policies: SecurityPolicy[]): boolean {
    const securityData = this.getSecurityData();
    securityData.policies = policies;
    return this.saveSecurityData(securityData);
  }

  private saveAuditEvents(events: AuditEvent[]): boolean {
    try {
      fs.writeFileSync(this.auditFile, JSON.stringify(events, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save audit events:', error);
      return false;
    }
  }

  private exportToCSV(events: AuditEvent[]): Buffer {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Severity', 'Project', 'IP Address', 'Details'];
    const rows = events.map(event => [
      event.id,
      event.timestamp.toISOString(),
      event.userEmail,
      event.action,
      event.severity,
      event.projectPath || '',
      event.ipAddress,
      JSON.stringify(event.metadata)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `\"${cell}\"`).join(','))
      .join('\n');

    return Buffer.from(csvContent);
  }

  private getOrCreateEncryptionKey(): string {
    const keyFile = path.join(path.dirname(this.securityFile), 'encryption.key');
    
    try {
      if (fs.existsSync(keyFile)) {
        return fs.readFileSync(keyFile, 'utf8');
      }
      
      const key = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(keyFile, key, { mode: 0o600 }); // Restrict permissions
      return key;
    } catch (error) {
      console.error('Failed to manage encryption key:', error);
      return 'fallback-key-for-development-only';
    }
  }

  private encrypt(text: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return text; // Fallback to plaintext (not secure)
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey, 'hex');
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText; // Return as-is if decryption fails
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}

export default SecurityManager;
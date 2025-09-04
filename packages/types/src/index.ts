/**
 * GitSwitch Enhanced Data Models for Stage 2
 * Based on Stage 2 Enhanced specifications
 */

export interface GitAccount {
  id: string;
  name: string;          // Display name
  email: string;         // Git email
  gitName: string;       // Git user.name
  description?: string;  // "Work", "Personal", etc.
  
  // Stage 2 enhancements
  sshKeyPath?: string;   // Path to SSH key for this account
  patterns: string[];    // URL patterns for auto-matching
  priority: number;      // User preference priority (1-10)
  color: string;         // Visual identification color
  isDefault: boolean;    // Default account flag
  usageCount: number;    // Number of times used
  lastUsed: Date;        // Last usage timestamp
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  path: string;          // Absolute path to project
  name: string;          // Derived from folder name
  remoteUrl?: string;    // Git remote URL
  accountId?: string;    // Associated account ID
  
  // Stage 2 enhancements
  organization?: string; // Detected org (github.com/company)
  platform: 'github' | 'gitlab' | 'bitbucket' | 'other';
  status: 'active' | 'inactive' | 'archived';
  tags: string[];        // User-defined tags
  lastCommit?: Date;     // Last commit timestamp
  commitCount: number;   // Total commit count
  confidence: number;    // Confidence in account assignment (0-1)
  
  lastAccessed: Date;
  createdAt: Date;
}

export interface AppConfig {
  defaultAccount?: string;
  autoScan: boolean;
  theme: 'dark' | 'light';
  startMinimized: boolean;
  
  // Stage 2 enhancements
  scanDepth: number;           // Max directory depth for scanning
  autoWatch: boolean;          // Watch for new projects
  showNotifications: boolean;  // Show system notifications
  preventWrongCommits: boolean; // Install git hooks
  scanPaths: string[];         // Common paths to scan
  updateCheckInterval: number; // Hours between update checks
}

export interface GitConfig {
  name: string;
  email: string;
}

// Stage 2 New Models

export interface ProjectAnalytics {
  projectId: string;
  switchCount: number;
  errorsPrevented: number;
  lastActivity: Date;
  avgSessionTime: number; // Average session time in minutes
  dailyCommits: number;
}

export interface UsageAnalytics {
  projectSwitches: number;
  accountUsage: Record<string, number>;
  errorsPrevented: number;
  timesSaved: number;     // Estimated seconds saved
  topProjects: Project[];
  patternAccuracy: number; // % of smart suggestions accepted
  totalProjects: number;
  totalAccounts: number;
}

export interface SmartSuggestion {
  accountId: string;
  confidence: number;     // 0-1 confidence score
  reason: string;         // Human-readable reason
  patterns: string[];     // Matching patterns
  usageHistory: number;   // Times used for similar projects
}

export interface GitHookConfig {
  projectPath: string;
  hooksInstalled: boolean;
  preCommitEnabled: boolean;
  validationLevel: 'strict' | 'warning' | 'off';
  autoFix: boolean;       // Auto-fix identity before commit
}

export interface GitHookInstallConfig {
  validationLevel: 'strict' | 'warning' | 'off';
  autoFix: boolean;
  preCommitEnabled: boolean;
}

export interface ProjectPattern {
  id: string;
  name: string;
  pattern: string;        // Regex or glob pattern
  accountId: string;
  confidence: number;
  createdBy: 'user' | 'system';
  usageCount: number;
}

export interface ScanResult {
  path: string;
  projects: Project[];
  totalFound: number;
  skipped: string[];      // Paths that were skipped
  errors: string[];       // Paths that had errors
  duration: number;       // Scan duration in ms
}

export interface CLIOptions {
  help?: boolean;
  version?: boolean;
  projectPath?: string;
  accountName?: string;   // Stage 2: Quick switch by account name
  scanPath?: string;      // Stage 2: Path to scan
  depth?: number;         // Stage 2: Scan depth
}

export interface AppState {
  accounts: GitAccount[];
  projects: Project[];
  config: AppConfig;
  currentProject?: Project;
  currentGitConfig?: GitConfig;
  
  // Stage 2 enhancements
  analytics: UsageAnalytics;
  patterns: ProjectPattern[];
  scanResults?: ScanResult;
}

// Bulk Import Types
export interface ImportConfiguration {
  sourcePaths: string[];
  scanDepth: number;
  autoDetectAccounts: boolean;
  createMissingAccounts: boolean;
  applySmartSuggestions: boolean;
  importPatterns: boolean;
  excludePatterns: string[];
  includePatterns: string[];
  dryRun: boolean;
}

export interface ImportResult {
  totalScanned: number;
  projectsFound: number;
  projectsImported: number;
  accountsCreated: number;
  patternsCreated: number;
  errors: ImportError[];
  warnings: string[];
  summary: ImportSummary;
}

export interface ImportError {
  type: 'scan_error' | 'import_error' | 'account_error' | 'pattern_error';
  path: string;
  message: string;
  details?: any;
}

export interface ImportSummary {
  newProjects: Project[];
  newAccounts: GitAccount[];
  newPatterns: ProjectPattern[];
  skippedProjects: string[];
  duplicateProjects: string[];
}

export interface ImportStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  progress: number;
  result?: any;
  error?: string;
}

// Enhanced IPC Events for Stage 2 & 3
export type IPCEvent = 
  // Stage 1 events
  | { type: 'GET_INITIAL_PROJECT'; payload: null }
  | { type: 'OPEN_PROJECT'; payload: { projectPath: string } }
  | { type: 'GET_ACCOUNTS'; payload: null }
  | { type: 'ADD_ACCOUNT'; payload: { account: Omit<GitAccount, 'id' | 'createdAt' | 'updatedAt'> } }
  | { type: 'UPDATE_ACCOUNT'; payload: { id: string; account: Partial<GitAccount> } }
  | { type: 'DELETE_ACCOUNT'; payload: { id: string } }
  | { type: 'SWITCH_GIT_IDENTITY'; payload: { projectPath: string; accountId: string } }
  | { type: 'GET_GIT_CONFIG'; payload: { projectPath: string } }
  
  // Stage 2 events
  | { type: 'SCAN_PROJECTS'; payload: { basePath: string; depth?: number } }
  | { type: 'GET_SMART_SUGGESTIONS'; payload: { projectPath: string; remoteUrl?: string } }
  | { type: 'RECORD_USER_CHOICE'; payload: { projectId: string; accountId: string; confidence: number } }
  | { type: 'GET_ANALYTICS'; payload: null }
  | { type: 'GET_PROJECT_LIST'; payload: { filter?: string; status?: string } }
  | { type: 'BULK_IMPORT_PROJECTS'; payload: { projects: Partial<Project>[]; accountMappings: Record<string, string> } }
  | { type: 'BULK_IMPORT_PREVIEW'; payload: { config: ImportConfiguration } }
  | { type: 'BULK_IMPORT_EXECUTE'; payload: { config: ImportConfiguration } }
  | { type: 'GET_SUGGESTED_IMPORT_PATHS'; payload: null }
  | { type: 'BULK_IMPORT_SCAN_PATH'; payload: { path: string; depth?: number } }
  | { type: 'INSTALL_GIT_HOOKS'; payload: { projectPath: string; config: GitHookInstallConfig } }
  | { type: 'REMOVE_GIT_HOOKS'; payload: { projectPath: string } }
  | { type: 'VALIDATE_COMMIT'; payload: { projectPath: string } }
  | { type: 'GET_PATTERNS'; payload: null }
  | { type: 'ADD_PATTERN'; payload: { pattern: Omit<ProjectPattern, 'id'> } }
  | { type: 'UPDATE_PATTERN'; payload: { id: string; pattern: Partial<ProjectPattern> } }
  | { type: 'DELETE_PATTERN'; payload: { id: string } }
  
  // Stage 3 Enterprise events
  | { type: 'CREATE_TEAM'; payload: { team: Omit<TeamConfiguration, 'id' | 'sharedAt' | 'version' | 'updatedAt'> } }
  | { type: 'GET_TEAMS'; payload: null }
  | { type: 'UPDATE_TEAM'; payload: { id: string; team: Partial<TeamConfiguration> } }
  | { type: 'DELETE_TEAM'; payload: { id: string } }
  | { type: 'JOIN_TEAM'; payload: { teamId: string; shareCode?: string } }
  | { type: 'LEAVE_TEAM'; payload: { teamId: string } }
  | { type: 'INVITE_MEMBER'; payload: { teamId: string; email: string; role: 'admin' | 'member' | 'viewer' } }
  | { type: 'REMOVE_MEMBER'; payload: { teamId: string; memberId: string } }
  | { type: 'UPDATE_MEMBER_ROLE'; payload: { teamId: string; memberId: string; role: 'admin' | 'member' | 'viewer' } }
  | { type: 'GENERATE_SHARE_CODE'; payload: { teamId: string } }
  
  // Security and Compliance
  | { type: 'GET_SECURITY_POLICIES'; payload: { teamId?: string } }
  | { type: 'CREATE_SECURITY_POLICY'; payload: { policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'> } }
  | { type: 'UPDATE_SECURITY_POLICY'; payload: { id: string; policy: Partial<SecurityPolicy> } }
  | { type: 'DELETE_SECURITY_POLICY'; payload: { id: string } }
  | { type: 'SETUP_SSO'; payload: { teamId: string; ssoConfig: SSOConfiguration } }
  | { type: 'CONFIGURE_SIGNING'; payload: { accountId: string; signingConfig: Omit<SigningConfiguration, 'id' | 'createdAt'> } }
  | { type: 'VERIFY_SIGNATURES'; payload: { projectPath: string } }
  
  // Audit and Logging
  | { type: 'GET_AUDIT_EVENTS'; payload: { filters: AuditFilters } }
  | { type: 'EXPORT_AUDIT_LOG'; payload: { format: 'json' | 'csv' | 'excel'; filters: AuditFilters } }
  | { type: 'LOG_AUDIT_EVENT'; payload: { event: Omit<AuditEvent, 'id' | 'timestamp'> } }
  
  // Automation and Rules
  | { type: 'GET_AUTOMATION_RULES'; payload: { teamId?: string } }
  | { type: 'CREATE_AUTOMATION_RULE'; payload: { rule: Omit<AutomationRule, 'id' | 'createdAt' | 'lastTriggered' | 'triggerCount' | 'errorCount'> } }
  | { type: 'UPDATE_AUTOMATION_RULE'; payload: { id: string; rule: Partial<AutomationRule> } }
  | { type: 'DELETE_AUTOMATION_RULE'; payload: { id: string } }
  | { type: 'TRIGGER_AUTOMATION_RULE'; payload: { id: string; context: Record<string, any> } }
  | { type: 'TEST_AUTOMATION_RULE'; payload: { rule: AutomationRule; context: Record<string, any> } }
  
  // Plugin System
  | { type: 'GET_INSTALLED_PLUGINS'; payload: null }
  | { type: 'SEARCH_PLUGINS'; payload: { query: string; category?: string } }
  | { type: 'INSTALL_PLUGIN'; payload: { pluginId: string; version?: string } }
  | { type: 'UNINSTALL_PLUGIN'; payload: { pluginId: string } }
  | { type: 'UPDATE_PLUGIN'; payload: { pluginId: string; version?: string } }
  | { type: 'ENABLE_PLUGIN'; payload: { pluginId: string } }
  | { type: 'DISABLE_PLUGIN'; payload: { pluginId: string } }
  | { type: 'GET_PLUGIN_SETTINGS'; payload: { pluginId: string } }
  | { type: 'UPDATE_PLUGIN_SETTINGS'; payload: { pluginId: string; settings: Record<string, any> } }
  
  // Configuration Sync
  | { type: 'SETUP_SYNC'; payload: { syncConfig: SyncConfiguration } }
  | { type: 'SYNC_NOW'; payload: null }
  | { type: 'GET_SYNC_STATUS'; payload: null }
  | { type: 'RESOLVE_SYNC_CONFLICTS'; payload: { conflicts: SyncConflict[]; resolutions: Record<string, 'local' | 'remote' | 'merge'> } }
  | { type: 'SHARE_CONFIGURATION'; payload: { items: string[]; teamId?: string } }
  | { type: 'IMPORT_CONFIGURATION'; payload: { shareCode: string } }
  
  // Advanced Git Operations
  | { type: 'GET_REMOTES'; payload: { projectPath: string } }
  | { type: 'ADD_REMOTE'; payload: { projectPath: string; remote: Omit<RemoteConfiguration, 'createdAt'> } }
  | { type: 'UPDATE_REMOTE'; payload: { projectPath: string; remoteName: string; config: Partial<RemoteConfiguration> } }
  | { type: 'REMOVE_REMOTE'; payload: { projectPath: string; remoteName: string } }
  | { type: 'SET_REMOTE_ACCOUNT'; payload: { projectPath: string; remoteName: string; accountId: string } }
  | { type: 'PUSH_TO_REMOTE'; payload: { projectPath: string; remoteName: string; branch: string; force?: boolean } }
  | { type: 'PULL_FROM_REMOTE'; payload: { projectPath: string; remoteName: string; branch: string } }
  | { type: 'FETCH_FROM_REMOTE'; payload: { projectPath: string; remoteName: string } }
  | { type: 'GET_BRANCH_POLICIES'; payload: { projectPath: string } }
  | { type: 'ADD_BRANCH_POLICY'; payload: { projectPath: string; policy: Omit<BranchPolicy, 'id' | 'createdAt' | 'createdBy'> } }
  | { type: 'UPDATE_BRANCH_POLICY'; payload: { policyId: string; policy: Partial<BranchPolicy> } }
  | { type: 'DELETE_BRANCH_POLICY'; payload: { policyId: string } }
  | { type: 'VALIDATE_BRANCH_COMMIT'; payload: { projectPath: string; branch: string; account: GitAccount } }
  | { type: 'GET_MONOREPO_CONFIG'; payload: { projectPath: string } }
  | { type: 'SETUP_MONOREPO'; payload: { config: Omit<MonorepoConfiguration, 'id' | 'createdAt' | 'updatedAt'> } }
  | { type: 'UPDATE_MONOREPO_CONFIG'; payload: { configId: string; config: Partial<MonorepoConfiguration> } }
  | { type: 'ADD_SUBPROJECT'; payload: { monorepoId: string; subproject: Omit<SubprojectConfig, 'id'> } }
  | { type: 'UPDATE_SUBPROJECT'; payload: { subprojectId: string; subproject: Partial<SubprojectConfig> } }
  | { type: 'REMOVE_SUBPROJECT'; payload: { subprojectId: string } }
  | { type: 'DETECT_SUBPROJECT'; payload: { monorepoPath: string; filePath: string } }
  | { type: 'VALIDATE_COMMIT_FULL'; payload: { projectPath: string; branch?: string } }
  
  // System Tray Integration
  | { type: 'UPDATE_TRAY_MENU'; payload: { currentProject?: Project } }
  | { type: 'SHOW_TRAY_NOTIFICATION'; payload: { title: string; content: string; silent?: boolean } }
  | { type: 'MINIMIZE_TO_TRAY'; payload: null };

export type IPCResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Stage 3 Enterprise Data Models

// Team Configuration Management
export interface TeamConfiguration {
  id: string;
  name: string;                    // "Frontend Team", "DevOps"
  organization: string;            // Company/org identifier  
  accounts: GitAccount[];          // Approved accounts
  projectRules: ProjectRule[];     // Automatic project assignments
  policies: SecurityPolicy[];     // Compliance rules
  members: TeamMember[];          // Team members
  sharedAt: Date;
  version: number;                 // For sync conflicts
  createdBy: string;              // User ID who created
  updatedAt: Date;
}

// Configuration Sync and Sharing
export interface SyncConfiguration {
  id: string;
  provider: 'github' | 'gitlab' | 'cloud' | 'team';
  syncScope: 'accounts' | 'patterns' | 'teams' | 'all';
  endpoint?: string;               // Custom sync endpoint
  credentials?: SyncCredentials;   // Provider-specific auth
  autoSync: boolean;               // Enable automatic sync
  syncInterval: number;            // Minutes between syncs
  conflictResolution: 'manual' | 'local' | 'remote';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncCredentials {
  type: 'oauth' | 'token' | 'ssh';
  token?: string;                  // Encrypted token
  refreshToken?: string;           // For OAuth
  sshKeyPath?: string;            // For SSH authentication
  expiresAt?: Date;
}

export interface SyncStatus {
  enabled: boolean;
  lastSync: Date | null;
  syncInProgress: boolean;
  conflictsCount: number;
  lastSyncResult: 'success' | 'error' | 'conflict';
}

export interface SyncResult {
  success: boolean;
  timestamp: Date;
  itemsSynced: number;
  conflicts?: SyncConflict[];
  changes: string[];
}

export interface SyncConflict {
  id: string;
  path: string;                    // Configuration path
  type: 'account' | 'pattern' | 'team' | 'settings';
  localValue: any;
  remoteValue: any;
  lastModified: {
    local: Date;
    remote: Date;
  };
  description: string;
}

export interface ShareConfiguration {
  id: string;
  items: string[];                 // ['accounts', 'patterns', 'teams']
  teamId?: string;                // Optional team context
  sharedBy: string;               // User ID
  sharedAt: Date;
  expiresAt: Date;
  data: Record<string, any>;       // Encrypted configuration data
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  permissions: string[];          // Custom permissions
}

export interface ProjectRule {
  id: string;
  pattern: string;                 // URL/path pattern
  accountId: string;              // Required account
  enforcement: 'strict' | 'suggested' | 'warning';
  description: string;
  priority: number;               // Rule precedence
  conditions: RuleCondition[];    // Additional conditions
  createdAt: Date;
  createdBy: string;
}

export interface RuleCondition {
  type: 'path_contains' | 'remote_url' | 'branch_name' | 'file_exists' | 'time_range';
  operator: 'equals' | 'contains' | 'matches' | 'not_equals';
  value: string;
  caseSensitive?: boolean;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  requireSignedCommits: boolean;
  allowedDomains: string[];       // github.com, gitlab.company.com
  requiredSSHKeys: boolean;
  auditLogging: boolean;
  restrictAccountCreation: boolean;
  passwordPolicy?: PasswordPolicy;
  ssoConfig?: SSOConfiguration;
  complianceStandard?: 'sox' | 'iso27001' | 'gdpr' | 'hipaa';
  maxIdleTime?: number;           // Minutes before auto-lock
  allowPersonalRepos: boolean;
  requireMFA: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAge: number;                 // Days
  preventReuse: number;           // Number of previous passwords
}

// Enterprise Security
export interface SSOConfiguration {
  id: string;
  provider: 'okta' | 'azuread' | 'google' | 'saml' | 'ldap';
  domain: string;
  clientId: string;
  clientSecret?: string;          // Encrypted
  autoCreateAccounts: boolean;
  syncUserInfo: boolean;
  groupMapping: Record<string, string>; // SSO group to role mapping
  enabled: boolean;
  endpoints?: SSOEndpoints;
}

export interface SSOEndpoints {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  logoutUrl?: string;
}

export interface SigningConfiguration {
  id: string;
  accountId: string;
  enabled: boolean;
  signingKey: string;              // GPG key ID or SSH key path
  keyType: 'gpg' | 'ssh';
  keyPath?: string;                // For SSH signing
  passphrase?: string;             // Encrypted storage
  autoSign: boolean;
  verifySignatures: boolean;
  keyFingerprint: string;
  expiresAt?: Date;
  createdAt: Date;
}

// Audit and Compliance
export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: 'account_switch' | 'commit' | 'config_change' | 'policy_violation' | 'login' | 'logout' | 'team_join' | 'team_leave';
  projectPath?: string;
  projectName?: string;
  fromAccount?: string;
  toAccount?: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata: Record<string, any>;
  riskScore?: number;             // 0-100 risk assessment
}

export interface AuditFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  severity?: string;
  projectPath?: string;
  limit?: number;
  offset?: number;
}

// Workflow Automation
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  priority: number;
  teamId?: string;                // If team-specific
  createdBy: string;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
  errorCount: number;
}

export interface RuleTrigger {
  type: 'project_open' | 'before_commit' | 'after_clone' | 'schedule' | 'account_switch' | 'policy_violation';
  schedule?: CronExpression;        // For scheduled triggers
  debounceMs?: number;             // Prevent rapid triggering
}

export interface RuleAction {
  id: string;
  type: 'switch_account' | 'notify' | 'run_command' | 'set_config' | 'block_action' | 'send_webhook' | 'log_event';
  parameters: Record<string, any>;
  continueOnError: boolean;
  timeoutMs?: number;
}

export interface CronExpression {
  minute: string;     // 0-59
  hour: string;       // 0-23
  dayOfMonth: string; // 1-31
  month: string;      // 1-12
  dayOfWeek: string;  // 0-7 (0 and 7 are Sunday)
  timezone?: string;
}

// Plugin System
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  homepage?: string;
  repository?: string;
  license: string;
  main: string;                   // Entry point file
  engines: {
    gitswitch: string;           // Compatible GitSwitch versions
  };
  keywords: string[];
  category: 'integration' | 'automation' | 'ui' | 'security' | 'analytics';
  permissions: PluginPermission[];
  dependencies?: Record<string, string>;
  activationEvents: string[];     // When to activate plugin
  contributes?: PluginContributes;
}

export interface PluginPermission {
  type: 'accounts' | 'projects' | 'git' | 'storage' | 'network' | 'filesystem';
  level: 'read' | 'write' | 'execute';
  description: string;
}

export interface PluginContributes {
  commands?: PluginCommand[];
  menus?: PluginMenu[];
  views?: PluginView[];
  settings?: PluginSetting[];
}

export interface PluginCommand {
  command: string;
  title: string;
  category?: string;
  icon?: string;
}

export interface PluginMenu {
  id: string;
  label: string;
  command?: string;
  submenu?: PluginMenu[];
}

export interface PluginView {
  id: string;
  name: string;
  when?: string;                  // Conditional display
}

export interface PluginSetting {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  default: any;
  description: string;
  enum?: string[];                // For enum type
}

export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  category: 'integration' | 'automation' | 'ui' | 'security' | 'analytics';
  keywords: string[];              // Search keywords
  compatibility: string[];        // GitSwitch version compatibility
  screenshots: string[];
  repository?: string;
  lastUpdated: Date;
  verified: boolean;              // Official verification
  size: number;                   // Package size in bytes
}

// Plugin Runtime System
export interface PluginInstance {
  id: string;
  manifest: PluginManifest;
  enabled: boolean;
  loaded: boolean;
  context?: PluginContext;
  module?: any;                   // Loaded plugin module
  installedAt: Date;
  lastActivated?: Date;
  settings: Record<string, any>;
  status: 'active' | 'inactive' | 'error' | 'disabled';
  errorMessage?: string;
}

export interface PluginContext {
  pluginId: string;
  workspaceRoot: string;
  extensionPath: string;
  storageUri: string;
  globalState: PluginStorage;
  workspaceState: PluginStorage;
  subscriptions: PluginDisposable[];
  api: PluginAPI;
}

export interface PluginStorage {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): readonly string[];
}

export interface PluginDisposable {
  dispose(): void;
}

// Advanced Git Operations Types
export interface RemoteConfiguration {
  name: string;                    // 'origin', 'upstream', 'fork'
  url: string;
  account: GitAccount;             // Different accounts for different remotes
  defaultForPush: boolean;
  defaultForPull: boolean;
  signingConfig?: SigningConfiguration;
  lastUsed?: Date;
  createdAt: Date;
}

export interface BranchPolicy {
  id: string;
  pattern: string;                 // Branch name pattern (regex)
  requiredAccount: GitAccount;     // Required identity for this branch
  requireSignedCommits: boolean;
  requireLinearHistory: boolean;
  allowedUsers?: string[];         // Restrict who can commit
  enforcement: 'strict' | 'warning' | 'advisory';
  description: string;
  createdAt: Date;
  createdBy: string;
}

export interface MonorepoConfiguration {
  id: string;
  rootPath: string;
  subprojects: SubprojectConfig[];
  sharedAccount?: GitAccount;      // Default account for root
  inheritanceRules: InheritanceRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubprojectConfig {
  id: string;
  name: string;
  path: string;                    // Relative to monorepo root
  account: GitAccount;             // Account for this subproject
  includePatterns: string[];       // File patterns that belong to this subproject
  excludePatterns: string[];       // File patterns to exclude
  priority: number;                // Resolution priority for overlapping patterns
}

export interface InheritanceRule {
  id: string;
  type: 'account' | 'signing' | 'hooks' | 'patterns';
  parentPath: string;
  childPatterns: string[];
  override: boolean;               // Allow child to override parent
  propagateUp: boolean;            // Changes in child affect parent
}

export interface GitOperationResult {
  success: boolean;
  operation: 'push' | 'pull' | 'fetch' | 'clone' | 'commit';
  remote?: string;
  branch?: string;
  commit?: string;
  message?: string;
  error?: string;
  timestamp: Date;
  accountUsed: GitAccount;
  signatureVerified?: boolean;
}

export interface CommitValidationResult {
  valid: boolean;
  identity: {
    correct: boolean;
    expected: GitAccount;
    actual: GitConfig;
  };
  signature: {
    present: boolean;
    valid: boolean;
    keyId?: string;
    algorithm?: string;
  };
  policy: {
    compliant: boolean;
    violations: string[];
  };
  recommendations: string[];
}

export interface PluginAPI {
  // Core GitSwitch API
  accounts: {
    getAll(): Promise<GitAccount[]>;
    getById(id: string): Promise<GitAccount | null>;
    create(account: Omit<GitAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<GitAccount>;
    update(id: string, updates: Partial<GitAccount>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
  };
  
  projects: {
    getAll(): Promise<Project[]>;
    getById(id: string): Promise<Project | null>;
    getCurrent(): Promise<Project | null>;
    switchIdentity(projectPath: string, accountId: string): Promise<boolean>;
  };
  
  git: {
    getConfig(projectPath: string): Promise<GitConfig | null>;
    setConfig(projectPath: string, config: GitConfig): Promise<boolean>;
    getCurrentBranch(projectPath: string): Promise<string | null>;
  };
  
  ui: {
    showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showQuickPick(items: string[], options?: QuickPickOptions): Promise<string | undefined>;
  };
  
  events: {
    onAccountSwitch: PluginEvent<{ projectPath: string; fromAccount?: string; toAccount: string }>;
    onProjectOpen: PluginEvent<{ projectPath: string }>;
    onBeforeCommit: PluginEvent<{ projectPath: string; accountId: string }>;
    onConfigChange: PluginEvent<{ key: string; value: any }>;
  };
  
  commands: {
    registerCommand(command: string, callback: (...args: any[]) => any): PluginDisposable;
    executeCommand(command: string, ...args: any[]): Promise<any>;
  };
}

export interface QuickPickOptions {
  placeHolder?: string;
  canPickMany?: boolean;
  ignoreFocusOut?: boolean;
}

export interface PluginEvent<T> {
  subscribe(listener: (e: T) => void): PluginDisposable;
}

export interface PluginInstallResult {
  success: boolean;
  pluginId: string;
  version: string;
  error?: string;
  warnings?: string[];
}

export interface PluginSearchResult {
  plugins: PluginMetadata[];
  total: number;
  page: number;
  pageSize: number;
}

// Configuration Sync
export interface SyncItem {
  type: 'accounts' | 'projects' | 'teams' | 'rules' | 'policies';
  enabled: boolean;
  lastSync: Date;
  conflicts?: SyncConflict[];
}
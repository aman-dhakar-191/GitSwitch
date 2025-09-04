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

// Enhanced IPC Events for Stage 2
export type IPCEvent = 
  // Stage 1 events
  | { type: 'OPEN_PROJECT'; payload: { projectPath: string } }
  | { type: 'GET_ACCOUNTS'; payload: null }
  | { type: 'ADD_ACCOUNT'; payload: { account: Omit<GitAccount, 'id' | 'createdAt' | 'updatedAt'> } }
  | { type: 'UPDATE_ACCOUNT'; payload: { id: string; account: Partial<GitAccount> } }
  | { type: 'DELETE_ACCOUNT'; payload: { id: string } }
  | { type: 'SWITCH_GIT_IDENTITY'; payload: { projectPath: string; accountId: string } }
  | { type: 'GET_GIT_CONFIG'; payload: { projectPath: string } }
  
  // Stage 2 new events
  | { type: 'SCAN_PROJECTS'; payload: { basePath: string; depth?: number } }
  | { type: 'GET_SMART_SUGGESTIONS'; payload: { projectPath: string; remoteUrl?: string } }
  | { type: 'RECORD_USER_CHOICE'; payload: { projectId: string; accountId: string; confidence: number } }
  | { type: 'GET_ANALYTICS'; payload: null }
  | { type: 'GET_PROJECT_LIST'; payload: { filter?: string; status?: string } }
  | { type: 'BULK_IMPORT_PROJECTS'; payload: { projects: Partial<Project>[]; accountMappings: Record<string, string> } }
  | { type: 'INSTALL_GIT_HOOKS'; payload: { projectPath: string; config: GitHookInstallConfig } }
  | { type: 'REMOVE_GIT_HOOKS'; payload: { projectPath: string } }
  | { type: 'VALIDATE_COMMIT'; payload: { projectPath: string } }
  | { type: 'GET_PATTERNS'; payload: null }
  | { type: 'ADD_PATTERN'; payload: { pattern: Omit<ProjectPattern, 'id'> } }
  | { type: 'UPDATE_PATTERN'; payload: { id: string; pattern: Partial<ProjectPattern> } }
  | { type: 'DELETE_PATTERN'; payload: { id: string } };

export type IPCResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};
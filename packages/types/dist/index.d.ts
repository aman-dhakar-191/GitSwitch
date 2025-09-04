/**
 * GitSwitch Enhanced Data Models for Stage 2
 * Based on Stage 2 Enhanced specifications
 */
export interface GitAccount {
    id: string;
    name: string;
    email: string;
    gitName: string;
    description?: string;
    sshKeyPath?: string;
    patterns: string[];
    priority: number;
    color: string;
    isDefault: boolean;
    usageCount: number;
    lastUsed: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Project {
    id: string;
    path: string;
    name: string;
    remoteUrl?: string;
    accountId?: string;
    organization?: string;
    platform: 'github' | 'gitlab' | 'bitbucket' | 'other';
    status: 'active' | 'inactive' | 'archived';
    tags: string[];
    lastCommit?: Date;
    commitCount: number;
    confidence: number;
    lastAccessed: Date;
    createdAt: Date;
}
export interface AppConfig {
    defaultAccount?: string;
    autoScan: boolean;
    theme: 'dark' | 'light';
    startMinimized: boolean;
    scanDepth: number;
    autoWatch: boolean;
    showNotifications: boolean;
    preventWrongCommits: boolean;
    scanPaths: string[];
    updateCheckInterval: number;
}
export interface GitConfig {
    name: string;
    email: string;
}
export interface ProjectAnalytics {
    projectId: string;
    switchCount: number;
    errorsPrevented: number;
    lastActivity: Date;
    avgSessionTime: number;
    dailyCommits: number;
}
export interface UsageAnalytics {
    projectSwitches: number;
    accountUsage: Record<string, number>;
    errorsPrevented: number;
    timesSaved: number;
    topProjects: Project[];
    patternAccuracy: number;
    totalProjects: number;
    totalAccounts: number;
}
export interface SmartSuggestion {
    accountId: string;
    confidence: number;
    reason: string;
    patterns: string[];
    usageHistory: number;
}
export interface GitHookConfig {
    projectPath: string;
    hooksInstalled: boolean;
    preCommitEnabled: boolean;
    validationLevel: 'strict' | 'warning' | 'off';
    autoFix: boolean;
}
export interface GitHookInstallConfig {
    validationLevel: 'strict' | 'warning' | 'off';
    autoFix: boolean;
    preCommitEnabled: boolean;
}
export interface ProjectPattern {
    id: string;
    name: string;
    pattern: string;
    accountId: string;
    confidence: number;
    createdBy: 'user' | 'system';
    usageCount: number;
}
export interface ScanResult {
    path: string;
    projects: Project[];
    totalFound: number;
    skipped: string[];
    errors: string[];
    duration: number;
}
export interface CLIOptions {
    help?: boolean;
    version?: boolean;
    projectPath?: string;
    accountName?: string;
    scanPath?: string;
    depth?: number;
}
export interface AppState {
    accounts: GitAccount[];
    projects: Project[];
    config: AppConfig;
    currentProject?: Project;
    currentGitConfig?: GitConfig;
    analytics: UsageAnalytics;
    patterns: ProjectPattern[];
    scanResults?: ScanResult;
}
export type IPCEvent = {
    type: 'OPEN_PROJECT';
    payload: {
        projectPath: string;
    };
} | {
    type: 'GET_ACCOUNTS';
    payload: null;
} | {
    type: 'ADD_ACCOUNT';
    payload: {
        account: Omit<GitAccount, 'id' | 'createdAt' | 'updatedAt'>;
    };
} | {
    type: 'UPDATE_ACCOUNT';
    payload: {
        id: string;
        account: Partial<GitAccount>;
    };
} | {
    type: 'DELETE_ACCOUNT';
    payload: {
        id: string;
    };
} | {
    type: 'SWITCH_GIT_IDENTITY';
    payload: {
        projectPath: string;
        accountId: string;
    };
} | {
    type: 'GET_GIT_CONFIG';
    payload: {
        projectPath: string;
    };
} | {
    type: 'SCAN_PROJECTS';
    payload: {
        basePath: string;
        depth?: number;
    };
} | {
    type: 'GET_SMART_SUGGESTIONS';
    payload: {
        projectPath: string;
        remoteUrl?: string;
    };
} | {
    type: 'RECORD_USER_CHOICE';
    payload: {
        projectId: string;
        accountId: string;
        confidence: number;
    };
} | {
    type: 'GET_ANALYTICS';
    payload: null;
} | {
    type: 'GET_PROJECT_LIST';
    payload: {
        filter?: string;
        status?: string;
    };
} | {
    type: 'BULK_IMPORT_PROJECTS';
    payload: {
        projects: Partial<Project>[];
        accountMappings: Record<string, string>;
    };
} | {
    type: 'INSTALL_GIT_HOOKS';
    payload: {
        projectPath: string;
        config: GitHookInstallConfig;
    };
} | {
    type: 'REMOVE_GIT_HOOKS';
    payload: {
        projectPath: string;
    };
} | {
    type: 'VALIDATE_COMMIT';
    payload: {
        projectPath: string;
    };
} | {
    type: 'GET_PATTERNS';
    payload: null;
} | {
    type: 'ADD_PATTERN';
    payload: {
        pattern: Omit<ProjectPattern, 'id'>;
    };
} | {
    type: 'UPDATE_PATTERN';
    payload: {
        id: string;
        pattern: Partial<ProjectPattern>;
    };
} | {
    type: 'DELETE_PATTERN';
    payload: {
        id: string;
    };
};
export type IPCResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
};

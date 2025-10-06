"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryRewriteManager = exports.AutomationTemplateManager = exports.WorkflowTemplateManager = exports.OAuthManager = exports.BulkImportManager = exports.WorkflowAutomationManager = exports.AdvancedGitManager = exports.PluginManager = exports.ConfigSyncManager = exports.SecurityManager = exports.TeamManager = exports.GitHookManager = exports.ProjectScanner = exports.SmartDetector = exports.ProjectManager = exports.StorageManager = exports.GitManager = void 0;
const GitManager_1 = require("./GitManager");
Object.defineProperty(exports, "GitManager", { enumerable: true, get: function () { return GitManager_1.GitManager; } });
const StorageManager_1 = require("./StorageManager");
Object.defineProperty(exports, "StorageManager", { enumerable: true, get: function () { return StorageManager_1.StorageManager; } });
const ProjectManager_1 = require("./ProjectManager");
Object.defineProperty(exports, "ProjectManager", { enumerable: true, get: function () { return ProjectManager_1.ProjectManager; } });
const SmartDetector_1 = require("./SmartDetector");
Object.defineProperty(exports, "SmartDetector", { enumerable: true, get: function () { return SmartDetector_1.SmartDetector; } });
const ProjectScanner_1 = require("./ProjectScanner");
Object.defineProperty(exports, "ProjectScanner", { enumerable: true, get: function () { return ProjectScanner_1.ProjectScanner; } });
const GitHookManager_1 = require("./GitHookManager");
Object.defineProperty(exports, "GitHookManager", { enumerable: true, get: function () { return GitHookManager_1.GitHookManager; } });
const TeamManager_1 = require("./TeamManager");
Object.defineProperty(exports, "TeamManager", { enumerable: true, get: function () { return TeamManager_1.TeamManager; } });
const SecurityManager_1 = require("./SecurityManager");
Object.defineProperty(exports, "SecurityManager", { enumerable: true, get: function () { return SecurityManager_1.SecurityManager; } });
const ConfigSyncManager_1 = require("./ConfigSyncManager");
Object.defineProperty(exports, "ConfigSyncManager", { enumerable: true, get: function () { return ConfigSyncManager_1.ConfigSyncManager; } });
const PluginManager_1 = require("./PluginManager");
Object.defineProperty(exports, "PluginManager", { enumerable: true, get: function () { return PluginManager_1.PluginManager; } });
const AdvancedGitManager_1 = require("./AdvancedGitManager");
Object.defineProperty(exports, "AdvancedGitManager", { enumerable: true, get: function () { return AdvancedGitManager_1.AdvancedGitManager; } });
const WorkflowAutomationManager_1 = require("./WorkflowAutomationManager");
Object.defineProperty(exports, "WorkflowAutomationManager", { enumerable: true, get: function () { return WorkflowAutomationManager_1.WorkflowAutomationManager; } });
const BulkImportManager_1 = require("./BulkImportManager");
Object.defineProperty(exports, "BulkImportManager", { enumerable: true, get: function () { return BulkImportManager_1.BulkImportManager; } });
const OAuthManager_1 = require("./OAuthManager");
Object.defineProperty(exports, "OAuthManager", { enumerable: true, get: function () { return OAuthManager_1.OAuthManager; } });
const WorkflowTemplateManager_1 = require("./WorkflowTemplateManager");
Object.defineProperty(exports, "WorkflowTemplateManager", { enumerable: true, get: function () { return WorkflowTemplateManager_1.WorkflowTemplateManager; } });
const AutomationTemplateManager_1 = require("./AutomationTemplateManager");
Object.defineProperty(exports, "AutomationTemplateManager", { enumerable: true, get: function () { return AutomationTemplateManager_1.AutomationTemplateManager; } });
const HistoryRewriteManager_1 = require("./HistoryRewriteManager");
Object.defineProperty(exports, "HistoryRewriteManager", { enumerable: true, get: function () { return HistoryRewriteManager_1.HistoryRewriteManager; } });
exports.default = {
    GitManager: GitManager_1.GitManager,
    StorageManager: StorageManager_1.StorageManager,
    ProjectManager: ProjectManager_1.ProjectManager,
    SmartDetector: SmartDetector_1.SmartDetector,
    ProjectScanner: ProjectScanner_1.ProjectScanner,
    GitHookManager: GitHookManager_1.GitHookManager,
    TeamManager: TeamManager_1.TeamManager,
    SecurityManager: SecurityManager_1.SecurityManager,
    ConfigSyncManager: ConfigSyncManager_1.ConfigSyncManager,
    PluginManager: PluginManager_1.PluginManager,
    AdvancedGitManager: AdvancedGitManager_1.AdvancedGitManager,
    WorkflowAutomationManager: WorkflowAutomationManager_1.WorkflowAutomationManager,
    BulkImportManager: BulkImportManager_1.BulkImportManager,
    OAuthManager: OAuthManager_1.OAuthManager,
    WorkflowTemplateManager: WorkflowTemplateManager_1.WorkflowTemplateManager,
    AutomationTemplateManager: AutomationTemplateManager_1.AutomationTemplateManager,
    HistoryRewriteManager: HistoryRewriteManager_1.HistoryRewriteManager
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHookManager = exports.ProjectScanner = exports.SmartDetector = exports.ProjectManager = exports.StorageManager = exports.GitManager = void 0;
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
exports.default = {
    GitManager: GitManager_1.GitManager,
    StorageManager: StorageManager_1.StorageManager,
    ProjectManager: ProjectManager_1.ProjectManager,
    SmartDetector: SmartDetector_1.SmartDetector,
    ProjectScanner: ProjectScanner_1.ProjectScanner,
    GitHookManager: GitHookManager_1.GitHookManager
};

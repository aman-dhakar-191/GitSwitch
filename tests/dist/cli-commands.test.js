"use strict";
/**
 * Comprehensive CLI Commands Test Suite
 * Tests all commands documented in commands_implementation_plan.md
 */
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
var child_process_1 = require("child_process");
var path = __importStar(require("path"));
// Use cli-original.js as it has the most complete implementation
var CLI_PATH = path.resolve(__dirname, '../packages/cli/dist/cli-original.js');
var CLI_MODULAR_PATH = path.resolve(__dirname, '../packages/cli/dist/cli.js');
// Helper function to run CLI commands
function runCommand(command, useCLI) {
    var _a, _b;
    if (useCLI === void 0) { useCLI = 'original'; }
    var cliPath = useCLI === 'original' ? CLI_PATH : CLI_MODULAR_PATH;
    try {
        var stdout = (0, child_process_1.execSync)("node ".concat(cliPath, " ").concat(command), {
            encoding: 'utf8',
            timeout: 10000,
            stdio: 'pipe'
        });
        return { stdout: stdout, stderr: '', exitCode: 0 };
    }
    catch (error) {
        return {
            stdout: ((_a = error.stdout) === null || _a === void 0 ? void 0 : _a.toString()) || '',
            stderr: ((_b = error.stderr) === null || _b === void 0 ? void 0 : _b.toString()) || error.message,
            exitCode: error.status || 1
        };
    }
}
describe('GitSwitch CLI Commands Test Suite', function () {
    describe('Core Commands', function () {
        test('help command should work', function () {
            var result = runCommand('--help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Git identity management tool');
        });
        test('version command should work', function () {
            var result = runCommand('--version');
            expect(result.exitCode).toBe(0);
        });
    });
    describe('Project Commands', function () {
        test('project --help should list all project commands', function () {
            var result = runCommand('project --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Project management commands');
        });
        test('project status command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('status');
        });
        test('project list command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('list');
        });
        test('project scan command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('scan');
        });
        test('project import command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('import');
        });
        test('project identity command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('identity');
        });
        test('project suggest command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('suggest');
        });
        test('project switch command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('switch');
        });
        test('project health command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('health');
        });
        test('project analyze command should exist', function () {
            var result = runCommand('project --help');
            expect(result.stdout).toContain('analyze');
        });
    });
    describe('Account Commands', function () {
        test('account --help should list all account commands', function () {
            var result = runCommand('account --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Account management commands');
        });
        test('account list command should exist', function () {
            var result = runCommand('account --help');
            expect(result.stdout).toContain('list');
        });
        test('account login command should exist', function () {
            var result = runCommand('account --help');
            expect(result.stdout).toContain('login');
        });
        test('account logout command should exist', function () {
            var result = runCommand('account --help');
            expect(result.stdout).toContain('logout');
        });
        test('account status command should exist', function () {
            var result = runCommand('account --help');
            expect(result.stdout).toContain('status');
        });
        test('account usage command should exist', function () {
            var result = runCommand('account --help');
            expect(result.stdout).toContain('usage');
        });
        test('account test command should exist', function () {
            var result = runCommand('account --help');
            expect(result.stdout).toContain('test');
        });
        test('account refresh command should exist', function () {
            var result = runCommand('account --help');
            expect(result.stdout).toContain('refresh');
        });
    });
    describe('Hook Commands', function () {
        test('hook --help should list all hook commands', function () {
            var result = runCommand('hook --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Git hooks management');
        });
        test('hook install command should exist', function () {
            var result = runCommand('hook --help');
            expect(result.stdout).toContain('install');
        });
        test('hook uninstall command should exist', function () {
            var result = runCommand('hook --help');
            expect(result.stdout).toContain('uninstall');
        });
        test('hook status command should exist', function () {
            var result = runCommand('hook --help');
            expect(result.stdout).toContain('status');
        });
        test('hook validate command should exist', function () {
            var result = runCommand('hook --help');
            expect(result.stdout).toContain('validate');
        });
    });
    describe('Repository Commands', function () {
        test('repo --help should list all repo commands', function () {
            var result = runCommand('repo --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Repository management');
        });
        test('repo status command should exist', function () {
            var result = runCommand('repo --help');
            expect(result.stdout).toContain('status');
        });
        test('repo clone command should exist', function () {
            var result = runCommand('repo --help');
            expect(result.stdout).toContain('clone');
        });
        test('repo init command should exist', function () {
            var result = runCommand('repo --help');
            expect(result.stdout).toContain('init');
        });
        test('repo find command should exist', function () {
            var result = runCommand('repo --help');
            expect(result.stdout).toContain('find');
        });
        test('repo validate command should exist', function () {
            var result = runCommand('repo --help');
            expect(result.stdout).toContain('validate');
        });
        test('repo analyze command should exist', function () {
            var result = runCommand('repo --help');
            expect(result.stdout).toContain('analyze');
        });
    });
    describe('Remote Commands', function () {
        test('remote --help should list all remote commands', function () {
            var result = runCommand('remote --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Remote repository management');
        });
        test('remote push command should exist', function () {
            var result = runCommand('remote --help');
            expect(result.stdout).toContain('push');
        });
        test('remote pull command should exist', function () {
            var result = runCommand('remote --help');
            expect(result.stdout).toContain('pull');
        });
        test('remote status command should exist', function () {
            var result = runCommand('remote --help');
            expect(result.stdout).toContain('status');
        });
        test('remote configure command should exist', function () {
            var result = runCommand('remote --help');
            expect(result.stdout).toContain('configure');
        });
        test('remote test command should exist', function () {
            var result = runCommand('remote --help');
            expect(result.stdout).toContain('test');
        });
    });
    describe('Branch Commands', function () {
        test('branch --help should list all branch commands', function () {
            var result = runCommand('branch --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Branch management');
        });
        test('branch policy command should exist', function () {
            var result = runCommand('branch --help');
            expect(result.stdout).toContain('policy');
        });
        test('branch validate command should exist', function () {
            var result = runCommand('branch --help');
            expect(result.stdout).toContain('validate');
        });
        test('branch create command should exist', function () {
            var result = runCommand('branch --help');
            expect(result.stdout).toContain('create');
        });
        test('branch switch command should exist', function () {
            var result = runCommand('branch --help');
            expect(result.stdout).toContain('switch');
        });
        test('branch compare command should exist', function () {
            var result = runCommand('branch --help');
            expect(result.stdout).toContain('compare');
        });
        test('branch authors command should exist', function () {
            var result = runCommand('branch --help');
            expect(result.stdout).toContain('authors');
        });
    });
    describe('Security Commands', function () {
        test('security --help should list all security commands', function () {
            var result = runCommand('security --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Security');
        });
        test('security audit command should exist', function () {
            var result = runCommand('security --help');
            expect(result.stdout).toContain('audit');
        });
        test('security keys command should exist', function () {
            var result = runCommand('security --help');
            expect(result.stdout).toContain('keys');
        });
    });
    describe('Automation Commands', function () {
        test('auto --help should list all automation commands', function () {
            var result = runCommand('auto --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('automation');
        });
        test('auto rule command should exist', function () {
            var result = runCommand('auto --help');
            expect(result.stdout).toContain('rule');
        });
        test('auto template command should exist', function () {
            var result = runCommand('auto --help');
            expect(result.stdout).toContain('template');
        });
        test('auto quickstart command should exist', function () {
            var result = runCommand('auto --help');
            expect(result.stdout).toContain('quickstart');
        });
    });
    describe('Monorepo Commands', function () {
        test('mono --help should list all monorepo commands', function () {
            var result = runCommand('mono --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Monorepo');
        });
        test('mono setup command should exist', function () {
            var result = runCommand('mono --help');
            expect(result.stdout).toContain('setup');
        });
        test('mono detect command should exist', function () {
            var result = runCommand('mono --help');
            expect(result.stdout).toContain('detect');
        });
        test('mono status command should exist', function () {
            var result = runCommand('mono --help');
            expect(result.stdout).toContain('status');
        });
    });
    describe('Commit Commands', function () {
        test('commit --help should list all commit commands', function () {
            var result = runCommand('commit --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('commit');
        });
        test('commit create command should exist', function () {
            var result = runCommand('commit --help');
            expect(result.stdout).toContain('create');
        });
        test('commit sign command should exist', function () {
            var result = runCommand('commit --help');
            expect(result.stdout).toContain('sign');
        });
        test('commit verify command should exist', function () {
            var result = runCommand('commit --help');
            expect(result.stdout).toContain('verify');
        });
        test('commit authors command should exist', function () {
            var result = runCommand('commit --help');
            expect(result.stdout).toContain('authors');
        });
    });
    describe('Workflow Commands', function () {
        test('workflow --help should list all workflow commands', function () {
            var result = runCommand('workflow --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('workflow');
        });
        test('workflow commit command should exist', function () {
            var result = runCommand('workflow --help');
            expect(result.stdout).toContain('commit');
        });
        test('workflow push command should exist', function () {
            var result = runCommand('workflow --help');
            expect(result.stdout).toContain('push');
        });
        test('workflow pull command should exist', function () {
            var result = runCommand('workflow --help');
            expect(result.stdout).toContain('pull');
        });
        test('workflow clone command should exist', function () {
            var result = runCommand('workflow --help');
            expect(result.stdout).toContain('clone');
        });
        test('workflow sync command should exist', function () {
            var result = runCommand('workflow --help');
            expect(result.stdout).toContain('sync');
        });
        test('workflow template command should exist', function () {
            var result = runCommand('workflow --help');
            expect(result.stdout).toContain('template');
        });
        test('workflow record command should exist', function () {
            var result = runCommand('workflow --help');
            expect(result.stdout).toContain('record');
        });
    });
    describe('Config Commands', function () {
        test('config --help should list all config commands', function () {
            var result = runCommand('config --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('Configuration');
        });
        test('config export command should exist', function () {
            var result = runCommand('config --help');
            expect(result.stdout).toContain('export');
        });
        test('config import command should exist', function () {
            var result = runCommand('config --help');
            expect(result.stdout).toContain('import');
        });
        test('config backup command should exist', function () {
            var result = runCommand('config --help');
            expect(result.stdout).toContain('backup');
        });
        test('config restore command should exist', function () {
            var result = runCommand('config --help');
            expect(result.stdout).toContain('restore');
        });
    });
    describe('History Commands', function () {
        test('history --help should list all history commands', function () {
            var result = runCommand('history --help');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('history');
        });
        test('history stats command should exist', function () {
            var result = runCommand('history --help');
            expect(result.stdout).toContain('stats');
        });
        test('history contributions command should exist', function () {
            var result = runCommand('history --help');
            expect(result.stdout).toContain('contributions');
        });
        test('history timeline command should exist', function () {
            var result = runCommand('history --help');
            expect(result.stdout).toContain('timeline');
        });
        test('history blame command should exist', function () {
            var result = runCommand('history --help');
            expect(result.stdout).toContain('blame');
        });
    });
    describe('Git Commands (Phase 3 - Modular CLI)', function () {
        test('git --help should list all git commands', function () {
            var result = runCommand('git --help', 'modular');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('git');
        });
        test('git reset command should exist', function () {
            var result = runCommand('git --help', 'modular');
            expect(result.stdout).toContain('reset');
        });
        test('git revert command should exist', function () {
            var result = runCommand('git --help', 'modular');
            expect(result.stdout).toContain('revert');
        });
        test('git cherry-pick command should exist', function () {
            var result = runCommand('git --help', 'modular');
            expect(result.stdout).toContain('cherry-pick');
        });
        test('git squash command should exist', function () {
            var result = runCommand('git --help', 'modular');
            expect(result.stdout).toContain('squash');
        });
    });
    describe('Integration Commands (Phase 3 - Modular CLI)', function () {
        test('integrate --help should list all integration commands', function () {
            var result = runCommand('integrate --help', 'modular');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('integration');
        });
        test('integrate vscode command should exist', function () {
            var result = runCommand('integrate --help', 'modular');
            expect(result.stdout).toContain('vscode');
        });
        test('integrate git-hooks command should exist', function () {
            var result = runCommand('integrate --help', 'modular');
            expect(result.stdout).toContain('git-hooks');
        });
        test('integrate shell command should exist', function () {
            var result = runCommand('integrate --help', 'modular');
            expect(result.stdout).toContain('shell');
        });
    });
    describe('Context Commands (Phase 3 - Modular CLI)', function () {
        test('context --help should list all context commands', function () {
            var result = runCommand('context --help', 'modular');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('context');
        });
        test('context detect command should exist', function () {
            var result = runCommand('context --help', 'modular');
            expect(result.stdout).toContain('detect');
        });
        test('context switch command should exist', function () {
            var result = runCommand('context --help', 'modular');
            expect(result.stdout).toContain('switch');
        });
        test('context rules command should exist', function () {
            var result = runCommand('context --help', 'modular');
            expect(result.stdout).toContain('rules');
        });
        test('context validate command should exist', function () {
            var result = runCommand('context --help', 'modular');
            expect(result.stdout).toContain('validate');
        });
    });
    describe('Pattern Commands (Phase 3 - Modular CLI)', function () {
        test('pattern --help should list all pattern commands', function () {
            var result = runCommand('pattern --help', 'modular');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('pattern');
        });
        test('pattern learn command should exist', function () {
            var result = runCommand('pattern --help', 'modular');
            expect(result.stdout).toContain('learn');
        });
        test('pattern suggest command should exist', function () {
            var result = runCommand('pattern --help', 'modular');
            expect(result.stdout).toContain('suggest');
        });
        test('pattern export command should exist', function () {
            var result = runCommand('pattern --help', 'modular');
            expect(result.stdout).toContain('export');
        });
        test('pattern import command should exist', function () {
            var result = runCommand('pattern --help', 'modular');
            expect(result.stdout).toContain('import');
        });
        test('pattern list command should exist', function () {
            var result = runCommand('pattern --help', 'modular');
            expect(result.stdout).toContain('list');
        });
    });
    describe('Performance Commands (Phase 3 - Modular CLI)', function () {
        test('perf --help should list all performance commands', function () {
            var result = runCommand('perf --help', 'modular');
            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('perf');
        });
        test('perf analyze command should exist', function () {
            var result = runCommand('perf --help', 'modular');
            expect(result.stdout).toContain('analyze');
        });
        test('perf optimize command should exist', function () {
            var result = runCommand('perf --help', 'modular');
            expect(result.stdout).toContain('optimize');
        });
        test('perf benchmark command should exist', function () {
            var result = runCommand('perf --help', 'modular');
            expect(result.stdout).toContain('benchmark');
        });
    });
});

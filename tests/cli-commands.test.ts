/**
 * Comprehensive CLI Commands Test Suite
 * Tests all commands documented in commands_implementation_plan.md
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Use cli-original.js as it has the most complete implementation
const CLI_PATH = path.resolve(__dirname, '../packages/cli/dist/cli-original.js');
const CLI_MODULAR_PATH = path.resolve(__dirname, '../packages/cli/dist/cli.js');

// Helper function to run CLI commands
function runCommand(command: string, useCLI: 'original' | 'modular' = 'original'): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const cliPath = useCLI === 'original' ? CLI_PATH : CLI_MODULAR_PATH;
  try {
    const stdout = execSync(`node ${cliPath} ${command}`, {
      encoding: 'utf8',
      timeout: 10000,
      stdio: 'pipe'
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
      exitCode: error.status || 1
    };
  }
}

describe('GitSwitch CLI Commands Test Suite', () => {
  
  describe('Core Commands', () => {
    test('help command should work', () => {
      const result = runCommand('--help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Git identity management tool');
    });

    test('version command should work', () => {
      const result = runCommand('--version');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Project Commands', () => {
    test('project --help should list all project commands', () => {
      const result = runCommand('project --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Project management commands');
    });

    test('project status command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('status');
    });

    test('project list command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('list');
    });

    test('project scan command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('scan');
    });

    test('project import command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('import');
    });

    test('project identity command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('identity');
    });

    test('project suggest command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('suggest');
    });

    test('project switch command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('switch');
    });

    test('project health command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('health');
    });

    test('project analyze command should exist', () => {
      const result = runCommand('project --help');
      expect(result.stdout).toContain('analyze');
    });
  });

  describe('Account Commands', () => {
    test('account --help should list all account commands', () => {
      const result = runCommand('account --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Account management commands');
    });

    test('account list command should exist', () => {
      const result = runCommand('account --help');
      expect(result.stdout).toContain('list');
    });

    test('account login command should exist', () => {
      const result = runCommand('account --help');
      expect(result.stdout).toContain('login');
    });

    test('account logout command should exist', () => {
      const result = runCommand('account --help');
      expect(result.stdout).toContain('logout');
    });

    test('account status command should exist', () => {
      const result = runCommand('account --help');
      expect(result.stdout).toContain('status');
    });

    test('account usage command should exist', () => {
      const result = runCommand('account --help');
      expect(result.stdout).toContain('usage');
    });

    test('account test command should exist', () => {
      const result = runCommand('account --help');
      expect(result.stdout).toContain('test');
    });

    test('account refresh command should exist', () => {
      const result = runCommand('account --help');
      expect(result.stdout).toContain('refresh');
    });
  });

  describe('Hook Commands', () => {
    test('hook --help should list all hook commands', () => {
      const result = runCommand('hook --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Git hooks management');
    });

    test('hook install command should exist', () => {
      const result = runCommand('hook --help');
      expect(result.stdout).toContain('install');
    });

    test('hook uninstall command should exist', () => {
      const result = runCommand('hook --help');
      expect(result.stdout).toContain('uninstall');
    });

    test('hook status command should exist', () => {
      const result = runCommand('hook --help');
      expect(result.stdout).toContain('status');
    });

    test('hook validate command should exist', () => {
      const result = runCommand('hook --help');
      expect(result.stdout).toContain('validate');
    });
  });

  describe('Repository Commands', () => {
    test('repo --help should list all repo commands', () => {
      const result = runCommand('repo --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Repository management');
    });

    test('repo status command should exist', () => {
      const result = runCommand('repo --help');
      expect(result.stdout).toContain('status');
    });

    test('repo clone command should exist', () => {
      const result = runCommand('repo --help');
      expect(result.stdout).toContain('clone');
    });

    test('repo init command should exist', () => {
      const result = runCommand('repo --help');
      expect(result.stdout).toContain('init');
    });

    test('repo find command should exist', () => {
      const result = runCommand('repo --help');
      expect(result.stdout).toContain('find');
    });

    test('repo validate command should exist', () => {
      const result = runCommand('repo --help');
      expect(result.stdout).toContain('validate');
    });

    test('repo analyze command should exist', () => {
      const result = runCommand('repo --help');
      expect(result.stdout).toContain('analyze');
    });
  });

  describe('Remote Commands', () => {
    test('remote --help should list all remote commands', () => {
      const result = runCommand('remote --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Remote repository management');
    });

    test('remote push command should exist', () => {
      const result = runCommand('remote --help');
      expect(result.stdout).toContain('push');
    });

    test('remote pull command should exist', () => {
      const result = runCommand('remote --help');
      expect(result.stdout).toContain('pull');
    });

    test('remote status command should exist', () => {
      const result = runCommand('remote --help');
      expect(result.stdout).toContain('status');
    });

    test('remote configure command should exist', () => {
      const result = runCommand('remote --help');
      expect(result.stdout).toContain('configure');
    });

    test('remote test command should exist', () => {
      const result = runCommand('remote --help');
      expect(result.stdout).toContain('test');
    });
  });

  describe('Branch Commands', () => {
    test('branch --help should list all branch commands', () => {
      const result = runCommand('branch --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Branch management');
    });

    test('branch policy command should exist', () => {
      const result = runCommand('branch --help');
      expect(result.stdout).toContain('policy');
    });

    test('branch validate command should exist', () => {
      const result = runCommand('branch --help');
      expect(result.stdout).toContain('validate');
    });

    test('branch create command should exist', () => {
      const result = runCommand('branch --help');
      expect(result.stdout).toContain('create');
    });

    test('branch switch command should exist', () => {
      const result = runCommand('branch --help');
      expect(result.stdout).toContain('switch');
    });

    test('branch compare command should exist', () => {
      const result = runCommand('branch --help');
      expect(result.stdout).toContain('compare');
    });

    test('branch authors command should exist', () => {
      const result = runCommand('branch --help');
      expect(result.stdout).toContain('authors');
    });
  });

  describe('Security Commands', () => {
    test('security --help should list all security commands', () => {
      const result = runCommand('security --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Security');
    });

    test('security audit command should exist', () => {
      const result = runCommand('security --help');
      expect(result.stdout).toContain('audit');
    });

    test('security keys command should exist', () => {
      const result = runCommand('security --help');
      expect(result.stdout).toContain('keys');
    });
  });

  describe('Automation Commands', () => {
    test('auto --help should list all automation commands', () => {
      const result = runCommand('auto --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('automation');
    });

    test('auto rule command should exist', () => {
      const result = runCommand('auto --help');
      expect(result.stdout).toContain('rule');
    });

    test('auto template command should exist', () => {
      const result = runCommand('auto --help');
      expect(result.stdout).toContain('template');
    });

    test('auto quickstart command should exist', () => {
      const result = runCommand('auto --help');
      expect(result.stdout).toContain('quickstart');
    });
  });

  describe('Monorepo Commands', () => {
    test('mono --help should list all monorepo commands', () => {
      const result = runCommand('mono --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Monorepo');
    });

    test('mono setup command should exist', () => {
      const result = runCommand('mono --help');
      expect(result.stdout).toContain('setup');
    });

    test('mono detect command should exist', () => {
      const result = runCommand('mono --help');
      expect(result.stdout).toContain('detect');
    });

    test('mono status command should exist', () => {
      const result = runCommand('mono --help');
      expect(result.stdout).toContain('status');
    });
  });

  describe('Commit Commands', () => {
    test('commit --help should list all commit commands', () => {
      const result = runCommand('commit --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('commit');
    });

    test('commit create command should exist', () => {
      const result = runCommand('commit --help');
      expect(result.stdout).toContain('create');
    });

    test('commit sign command should exist', () => {
      const result = runCommand('commit --help');
      expect(result.stdout).toContain('sign');
    });

    test('commit verify command should exist', () => {
      const result = runCommand('commit --help');
      expect(result.stdout).toContain('verify');
    });

    test('commit authors command should exist', () => {
      const result = runCommand('commit --help');
      expect(result.stdout).toContain('authors');
    });
  });

  describe('Workflow Commands', () => {
    test('workflow --help should list all workflow commands', () => {
      const result = runCommand('workflow --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('workflow');
    });

    test('workflow commit command should exist', () => {
      const result = runCommand('workflow --help');
      expect(result.stdout).toContain('commit');
    });

    test('workflow push command should exist', () => {
      const result = runCommand('workflow --help');
      expect(result.stdout).toContain('push');
    });

    test('workflow pull command should exist', () => {
      const result = runCommand('workflow --help');
      expect(result.stdout).toContain('pull');
    });

    test('workflow clone command should exist', () => {
      const result = runCommand('workflow --help');
      expect(result.stdout).toContain('clone');
    });

    test('workflow sync command should exist', () => {
      const result = runCommand('workflow --help');
      expect(result.stdout).toContain('sync');
    });

    test('workflow template command should exist', () => {
      const result = runCommand('workflow --help');
      expect(result.stdout).toContain('template');
    });

    test('workflow record command should exist', () => {
      const result = runCommand('workflow --help');
      expect(result.stdout).toContain('record');
    });
  });

  describe('Config Commands', () => {
    test('config --help should list all config commands', () => {
      const result = runCommand('config --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration');
    });

    test('config export command should exist', () => {
      const result = runCommand('config --help');
      expect(result.stdout).toContain('export');
    });

    test('config import command should exist', () => {
      const result = runCommand('config --help');
      expect(result.stdout).toContain('import');
    });

    test('config backup command should exist', () => {
      const result = runCommand('config --help');
      expect(result.stdout).toContain('backup');
    });

    test('config restore command should exist', () => {
      const result = runCommand('config --help');
      expect(result.stdout).toContain('restore');
    });
  });

  describe('History Commands', () => {
    test('history --help should list all history commands', () => {
      const result = runCommand('history --help');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('history');
    });

    test('history stats command should exist', () => {
      const result = runCommand('history --help');
      expect(result.stdout).toContain('stats');
    });

    test('history contributions command should exist', () => {
      const result = runCommand('history --help');
      expect(result.stdout).toContain('contributions');
    });

    test('history timeline command should exist', () => {
      const result = runCommand('history --help');
      expect(result.stdout).toContain('timeline');
    });

    test('history blame command should exist', () => {
      const result = runCommand('history --help');
      expect(result.stdout).toContain('blame');
    });
  });

  describe('Git Commands (Phase 3 - Modular CLI)', () => {
    test('git --help should list all git commands', () => {
      const result = runCommand('git --help', 'modular');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('git');
    });

    test('git reset command should exist', () => {
      const result = runCommand('git --help', 'modular');
      expect(result.stdout).toContain('reset');
    });

    test('git revert command should exist', () => {
      const result = runCommand('git --help', 'modular');
      expect(result.stdout).toContain('revert');
    });

    test('git cherry-pick command should exist', () => {
      const result = runCommand('git --help', 'modular');
      expect(result.stdout).toContain('cherry-pick');
    });

    test('git squash command should exist', () => {
      const result = runCommand('git --help', 'modular');
      expect(result.stdout).toContain('squash');
    });
  });

  describe('Integration Commands (Phase 3 - Modular CLI)', () => {
    test('integrate --help should list all integration commands', () => {
      const result = runCommand('integrate --help', 'modular');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('integration');
    });

    test('integrate vscode command should exist', () => {
      const result = runCommand('integrate --help', 'modular');
      expect(result.stdout).toContain('vscode');
    });

    test('integrate git-hooks command should exist', () => {
      const result = runCommand('integrate --help', 'modular');
      expect(result.stdout).toContain('git-hooks');
    });

    test('integrate shell command should exist', () => {
      const result = runCommand('integrate --help', 'modular');
      expect(result.stdout).toContain('shell');
    });
  });

  describe('Context Commands (Phase 3 - Modular CLI)', () => {
    test('context --help should list all context commands', () => {
      const result = runCommand('context --help', 'modular');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('context');
    });

    test('context detect command should exist', () => {
      const result = runCommand('context --help', 'modular');
      expect(result.stdout).toContain('detect');
    });

    test('context switch command should exist', () => {
      const result = runCommand('context --help', 'modular');
      expect(result.stdout).toContain('switch');
    });

    test('context rules command should exist', () => {
      const result = runCommand('context --help', 'modular');
      expect(result.stdout).toContain('rules');
    });

    test('context validate command should exist', () => {
      const result = runCommand('context --help', 'modular');
      expect(result.stdout).toContain('validate');
    });
  });

  describe('Pattern Commands (Phase 3 - Modular CLI)', () => {
    test('pattern --help should list all pattern commands', () => {
      const result = runCommand('pattern --help', 'modular');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('pattern');
    });

    test('pattern learn command should exist', () => {
      const result = runCommand('pattern --help', 'modular');
      expect(result.stdout).toContain('learn');
    });

    test('pattern suggest command should exist', () => {
      const result = runCommand('pattern --help', 'modular');
      expect(result.stdout).toContain('suggest');
    });

    test('pattern export command should exist', () => {
      const result = runCommand('pattern --help', 'modular');
      expect(result.stdout).toContain('export');
    });

    test('pattern import command should exist', () => {
      const result = runCommand('pattern --help', 'modular');
      expect(result.stdout).toContain('import');
    });

    test('pattern list command should exist', () => {
      const result = runCommand('pattern --help', 'modular');
      expect(result.stdout).toContain('list');
    });
  });

  describe('Performance Commands (Phase 3 - Modular CLI)', () => {
    test('perf --help should list all performance commands', () => {
      const result = runCommand('perf --help', 'modular');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('perf');
    });

    test('perf analyze command should exist', () => {
      const result = runCommand('perf --help', 'modular');
      expect(result.stdout).toContain('analyze');
    });

    test('perf optimize command should exist', () => {
      const result = runCommand('perf --help', 'modular');
      expect(result.stdout).toContain('optimize');
    });

    test('perf benchmark command should exist', () => {
      const result = runCommand('perf --help', 'modular');
      expect(result.stdout).toContain('benchmark');
    });
  });
});

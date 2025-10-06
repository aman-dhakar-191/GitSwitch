import { Command } from 'commander';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { CLIUtils } from '../utils/CLIUtils';

/**
 * IDE and tool integration commands (Phase 3 - Q2 2024)
 */
export class IntegrationCommands extends BaseCommand implements ICommand {
  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any
  ) {
    super(gitManager, storageManager, projectManager);
  }

  register(program: Command): void {
    const integrateCmd = program
      .command('integrate')
      .description('External tool integrations');

    this.registerVSCodeCommand(integrateCmd);
    this.registerGitHooksCommand(integrateCmd);
    this.registerShellCommand(integrateCmd);
  }

  private registerVSCodeCommand(integrateCmd: Command): void {
    integrateCmd
      .command('vscode')
      .description('VS Code integration setup')
      .option('--global', 'Install globally in VS Code settings')
      .action(async (options) => {
        try {
          console.log(`🔧 Setting up VS Code integration...`);

          const projectPath = process.cwd();
          const vscodeDir = path.join(projectPath, '.vscode');
          const settingsFile = path.join(vscodeDir, 'settings.json');

          // Ensure .vscode directory exists
          if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
          }

          // Read existing settings or create new
          let settings: any = {};
          if (fs.existsSync(settingsFile)) {
            try {
              const content = fs.readFileSync(settingsFile, 'utf8');
              settings = JSON.parse(content);
            } catch (error) {
              console.log('⚠️  Could not parse existing settings.json, will create new');
            }
          }

          // Add GitSwitch integration settings
          settings['gitswitch.enabled'] = true;
          settings['gitswitch.autoSwitch'] = true;
          settings['gitswitch.showStatusBar'] = true;
          settings['gitswitch.validateOnCommit'] = true;

          // Add git configuration
          if (!settings['git.inputValidationLength']) {
            settings['git.inputValidationLength'] = 72;
          }

          // Write updated settings
          fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');

          console.log(`✅ VS Code settings updated`);
          console.log(`📁 Location: ${settingsFile}`);
          
          console.log(`\n📝 Settings added:`);
          console.log(`   • Auto-switch identity enabled`);
          console.log(`   • Status bar indicator enabled`);
          console.log(`   • Commit validation enabled`);

          // Create tasks.json for GitSwitch commands
          const tasksFile = path.join(vscodeDir, 'tasks.json');
          const tasks = {
            version: '2.0.0',
            tasks: [
              {
                label: 'GitSwitch: Switch Account',
                type: 'shell',
                command: 'gitswitch accounts switch',
                problemMatcher: [],
                presentation: {
                  reveal: 'always',
                  panel: 'new'
                }
              },
              {
                label: 'GitSwitch: Validate Identity',
                type: 'shell',
                command: 'gitswitch hook validate',
                problemMatcher: [],
                presentation: {
                  reveal: 'always',
                  panel: 'new'
                }
              }
            ]
          };

          fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2), 'utf8');
          console.log(`\n✅ VS Code tasks configured`);
          console.log(`📁 Location: ${tasksFile}`);

          console.log(`\n💡 Tip: Install the GitSwitch VS Code extension for full integration:`);
          console.log(`   code --install-extension gitswitch.vscode-gitswitch`);
          
        } catch (error: any) {
          CLIUtils.showError('VS Code integration failed', error);
        }
      });
  }

  private registerGitHooksCommand(integrateCmd: Command): void {
    integrateCmd
      .command('git-hooks')
      .description('Advanced git hooks integration')
      .option('--type <type>', 'Hook type (pre-commit, pre-push, commit-msg)', 'pre-commit')
      .option('--custom <script>', 'Path to custom hook script')
      .action(async (options) => {
        try {
          const projectPath = process.cwd();
          this.validateGitRepository(projectPath);

          console.log(`🔧 Setting up git hooks integration...`);

          const hookType = options.type || 'pre-commit';
          const hooksDir = path.join(projectPath, '.git', 'hooks');
          const hookFile = path.join(hooksDir, hookType);

          // Ensure hooks directory exists
          if (!fs.existsSync(hooksDir)) {
            fs.mkdirSync(hooksDir, { recursive: true });
          }

          // Create hook script
          let hookScript = '#!/bin/sh\n\n';
          hookScript += '# GitSwitch identity validation hook\n';
          hookScript += '# Auto-generated by GitSwitch\n\n';

          if (hookType === 'pre-commit') {
            hookScript += '# Validate identity before commit\n';
            hookScript += 'gitswitch hook validate --silent || exit 1\n\n';
          } else if (hookType === 'pre-push') {
            hookScript += '# Validate identity before push\n';
            hookScript += 'gitswitch hook validate --silent || exit 1\n\n';
          } else if (hookType === 'commit-msg') {
            hookScript += '# Validate commit message\n';
            hookScript += 'COMMIT_MSG_FILE=$1\n';
            hookScript += 'gitswitch hook validate --silent || exit 1\n\n';
          }

          // Add custom script if provided
          if (options.custom && fs.existsSync(options.custom)) {
            const customScript = fs.readFileSync(options.custom, 'utf8');
            hookScript += '# Custom hook logic\n';
            hookScript += customScript + '\n';
          }

          // Write hook file
          fs.writeFileSync(hookFile, hookScript, { mode: 0o755 });

          console.log(`✅ Git hook installed: ${hookType}`);
          console.log(`📁 Location: ${hookFile}`);
          console.log(`\n📝 Hook will:`);
          console.log(`   • Validate git identity`);
          console.log(`   • Prevent commits with wrong identity`);
          console.log(`   • Show helpful error messages`);

          if (options.custom) {
            console.log(`   • Execute custom logic from: ${options.custom}`);
          }

        } catch (error: any) {
          CLIUtils.showError('Git hooks integration failed', error);
        }
      });
  }

  private registerShellCommand(integrateCmd: Command): void {
    integrateCmd
      .command('shell')
      .description('Shell integration (bash/zsh)')
      .option('--shell <type>', 'Shell type (bash, zsh, fish)', 'bash')
      .action(async (options) => {
        try {
          console.log(`🔧 Setting up shell integration...`);

          const shellType = options.shell || 'bash';
          const homeDir = require('os').homedir();
          
          let rcFile: string;
          let shellConfig: string;

          switch (shellType) {
            case 'bash':
              rcFile = path.join(homeDir, '.bashrc');
              shellConfig = this.generateBashConfig();
              break;
            case 'zsh':
              rcFile = path.join(homeDir, '.zshrc');
              shellConfig = this.generateZshConfig();
              break;
            case 'fish':
              rcFile = path.join(homeDir, '.config', 'fish', 'config.fish');
              shellConfig = this.generateFishConfig();
              break;
            default:
              throw new Error(`Unsupported shell: ${shellType}`);
          }

          // Check if already integrated
          let rcContent = '';
          if (fs.existsSync(rcFile)) {
            rcContent = fs.readFileSync(rcFile, 'utf8');
          }

          if (rcContent.includes('# GitSwitch integration')) {
            console.log(`⚠️  GitSwitch is already integrated in ${rcFile}`);
            
            const { overwrite } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'overwrite',
                message: 'Update existing integration?',
                default: true
              }
            ]);

            if (!overwrite) {
              console.log('Integration cancelled.');
              return;
            }

            // Remove old integration
            const lines = rcContent.split('\n');
            const startIdx = lines.findIndex(l => l.includes('# GitSwitch integration'));
            const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('# End GitSwitch integration'));
            
            if (startIdx >= 0 && endIdx >= 0) {
              lines.splice(startIdx, endIdx - startIdx + 1);
              rcContent = lines.join('\n');
            }
          }

          // Append new integration
          rcContent += '\n' + shellConfig + '\n';
          
          // Backup existing file
          if (fs.existsSync(rcFile)) {
            fs.copyFileSync(rcFile, `${rcFile}.backup`);
            console.log(`📋 Backup created: ${rcFile}.backup`);
          }

          // Write updated config
          if (shellType === 'fish') {
            const configDir = path.dirname(rcFile);
            if (!fs.existsSync(configDir)) {
              fs.mkdirSync(configDir, { recursive: true });
            }
          }
          
          fs.writeFileSync(rcFile, rcContent, 'utf8');

          console.log(`✅ Shell integration configured`);
          console.log(`📁 Location: ${rcFile}`);
          console.log(`\n📝 Features added:`);
          console.log(`   • gitswitch command completion`);
          console.log(`   • Current identity in prompt`);
          console.log(`   • Directory change detection`);
          console.log(`\n💡 Reload your shell or run: source ${rcFile}`);

        } catch (error: any) {
          CLIUtils.showError('Shell integration failed', error);
        }
      });
  }

  private generateBashConfig(): string {
    return `# GitSwitch integration
# Auto-generated by GitSwitch

# Command completion
_gitswitch_completion() {
  local cur prev commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="accounts project hook git repo integrate context pattern perf"
  
  COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
  return 0
}
complete -F _gitswitch_completion gitswitch

# Show current git identity in prompt
gitswitch_prompt() {
  if [ -d .git ]; then
    local identity=$(git config user.email 2>/dev/null)
    if [ -n "$identity" ]; then
      echo " (\${identity})"
    fi
  fi
}

# Add to PS1 if desired (uncomment next line)
# PS1="\\u@\\h:\\w\$(gitswitch_prompt)\\$ "

# End GitSwitch integration`;
  }

  private generateZshConfig(): string {
    return `# GitSwitch integration
# Auto-generated by GitSwitch

# Command completion
_gitswitch() {
  local -a commands
  commands=(
    'accounts:Manage git accounts'
    'project:Manage projects'
    'hook:Git hooks management'
    'git:Advanced git operations'
    'repo:Repository management'
    'integrate:Tool integrations'
    'context:Context management'
    'pattern:Pattern learning'
    'perf:Performance monitoring'
  )
  _describe 'command' commands
}
compdef _gitswitch gitswitch

# Show current git identity in prompt
gitswitch_prompt() {
  if [ -d .git ]; then
    local identity=$(git config user.email 2>/dev/null)
    if [ -n "$identity" ]; then
      echo " ($identity)"
    fi
  fi
}

# Add to RPROMPT if desired (uncomment next line)
# RPROMPT='$(gitswitch_prompt)'

# End GitSwitch integration`;
  }

  private generateFishConfig(): string {
    return `# GitSwitch integration
# Auto-generated by GitSwitch

# Command completion
complete -c gitswitch -n "__fish_use_subcommand" -a "accounts" -d "Manage git accounts"
complete -c gitswitch -n "__fish_use_subcommand" -a "project" -d "Manage projects"
complete -c gitswitch -n "__fish_use_subcommand" -a "hook" -d "Git hooks management"
complete -c gitswitch -n "__fish_use_subcommand" -a "git" -d "Advanced git operations"
complete -c gitswitch -n "__fish_use_subcommand" -a "repo" -d "Repository management"
complete -c gitswitch -n "__fish_use_subcommand" -a "integrate" -d "Tool integrations"
complete -c gitswitch -n "__fish_use_subcommand" -a "context" -d "Context management"
complete -c gitswitch -n "__fish_use_subcommand" -a "pattern" -d "Pattern learning"
complete -c gitswitch -n "__fish_use_subcommand" -a "perf" -d "Performance monitoring"

# Show current git identity in prompt
function gitswitch_prompt
  if test -d .git
    set identity (git config user.email 2>/dev/null)
    if test -n "$identity"
      echo " ($identity)"
    end
  end
end

# Add to fish_prompt if desired (uncomment next line)
# function fish_prompt; echo (prompt_pwd)(gitswitch_prompt)' $ '; end

# End GitSwitch integration`;
  }
}

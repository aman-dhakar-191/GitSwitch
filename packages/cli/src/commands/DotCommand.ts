import { Command } from 'commander';
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';
import { BlessedUI } from '../ui/blessed-ui';

/**
 * Dot command - Interactive UI for current project
 */
export class DotCommand extends BaseCommand implements ICommand {
  constructor(
    gitManager: any,
    storageManager: any,
    projectManager: any
  ) {
    super(gitManager, storageManager, projectManager);
  }

  register(program: Command): void {
    program
      .command('.')
      .description('Open GitSwitch for the current project')
      .action(async () => {
        this.trackCommand('gitswitch .');
        const projectPath = process.cwd();

        try {
          const project = this.getCurrentProject(projectPath);
          const gitConfig = this.projectManager.getCurrentGitConfig(projectPath);
          
          const ui = new BlessedUI({
            project,
            gitConfig: gitConfig || undefined,
            onExit: async () => {
              // Launch the desktop app when user presses Enter
            }
          });
          ui.render();

        } catch (error) {
          this.handleError(error, 'Failed to analyze project');
        }
      });
  }
}
import * as blessed from 'blessed';
import { Project, GitConfig } from '@gitswitch/types';
import { BaseUIComponent } from './BaseUIComponent';
import { UIContentGenerators } from './UIContentGenerators';
import { UILayouts, UIThemes } from './UIThemes';
import { CLIUtils } from '../utils/CLIUtils';

export interface BlessedUIOptions {
  project: Project;
  gitConfig?: GitConfig;
  onExit?: () => void;
}

/**
 * Modular GitSwitch main UI component
 */
export class ModularBlessedUI extends BaseUIComponent {
  private project: Project;
  private gitConfig?: GitConfig;
  private onExit?: () => void;

  constructor(options: BlessedUIOptions) {
    super(blessed.screen({
      ...UIThemes.default.screen,
      title: 'GitSwitch - Git Identity Management'
    }));
    
    this.project = options.project;
    this.gitConfig = options.gitConfig;
    this.onExit = options.onExit;
    
    this.buildUI();
    this.setupEvents();
  }

  private buildUI(): void {
    // Header with GitSwitch logo
    this.createHeader(
      UIContentGenerators.getGitSwitchHeader(),
      UILayouts.fullWidth.header
    );

    // Project information box (left side)
    this.createInfoBox(
      '📁 Project Information',
      UIContentGenerators.getProjectContent(this.project),
      UILayouts.twoColumn.left,
      UIThemes.colors.success
    );

    // Git identity box (right side)
    this.createInfoBox(
      '👤 Git Identity',
      UIContentGenerators.getIdentityContent(this.gitConfig),
      UILayouts.twoColumn.right,
      UIThemes.colors.warning
    );

    // Commands list (scrollable)
    this.createScrollableBox(
      '⚡ Available Commands',
      UIContentGenerators.getCommandsContent(CLIUtils.getRecentCommands()),
      { top: 29, left: 0, width: '100%', height: 12 },
      UIThemes.colors.accent
    );

    // Footer with instructions
    this.createFooter(
      ' Press [ESC] or [q] to exit • Press [ENTER] to launch desktop app '
    );
  }

  private setupEvents(): void {
    // Standard exit events
    this.setupExitEvents(['enter']);
    this.setupNavigationEvents();

    // Custom enter handling for desktop app launch
    this.screen.key(['enter'], () => {
      if (this.onExit) {
        this.onExit();
      }
      this.exit();
    });
  }

  protected exit(): void {
    this.screen.destroy();
    console.log('\n👋 Thank you for using GitSwitch!\n');
    process.exit(0);
  }
}

export interface BlessedStatusUIOptions {
  project: Project;
  gitConfig?: GitConfig;
}

/**
 * Modular GitSwitch status UI component
 */
export class ModularBlessedStatusUI extends BaseUIComponent {
  private project: Project;
  private gitConfig?: GitConfig;

  constructor(options: BlessedStatusUIOptions) {
    super(blessed.screen({
      ...UIThemes.default.screen,
      title: 'GitSwitch - Project Status'
    }));
    
    this.project = options.project;
    this.gitConfig = options.gitConfig;
    
    this.buildUI();
    this.setupEvents();
  }

  private buildUI(): void {
    // Compact header
    this.createInfoBox(
      '',
      ' GitSwitch - Project Status ',
      { top: 0, left: 0, width: '100%', height: 3 },
      UIThemes.colors.info
    );

    // Centered status box
    this.createInfoBox(
      '📊 Current Project Status',
      UIContentGenerators.getDetailedStatusContent(this.project, this.gitConfig),
      UILayouts.centered.main,
      UIThemes.colors.success
    );

    // Footer with exit instructions
    this.createFooter(
      ' Press [ESC], [q], or [ENTER] to exit '
    );
  }

  private setupEvents(): void {
    this.setupExitEvents(['enter']);
    this.setupNavigationEvents();
  }
}

// Export both the modular versions and maintain backward compatibility
export class BlessedUI extends ModularBlessedUI {}
export class BlessedStatusUI extends ModularBlessedStatusUI {}
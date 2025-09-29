// GitSwitch Blessed UI - Modular Version
// This file now exports the modular UI components for backward compatibility

import { Project, GitConfig } from '@gitswitch/types';

// Re-export types for backward compatibility
export interface BlessedUIOptions {
  project: Project;
  gitConfig?: GitConfig;
  onExit?: () => void;
}

export interface BlessedStatusUIOptions {
  project: Project;
  gitConfig?: GitConfig;
}

// Import and re-export the modular components
export { 
  ModularBlessedUI as BlessedUI,
  ModularBlessedStatusUI as BlessedStatusUI
} from './ModularBlessedUI';

// Also export the base components for advanced usage
export { BaseUIComponent } from './BaseUIComponent';
export { UIThemes, UILayouts } from './UIThemes';
export { UIContentGenerators } from './UIContentGenerators';
// Export base components
export { BaseUIComponent } from './BaseUIComponent';
export { UIThemes, UILayouts } from './UIThemes';
export { UIContentGenerators } from './UIContentGenerators';

// Export modular UI components
export { 
  ModularBlessedUI, 
  ModularBlessedStatusUI,
  BlessedUI,
  BlessedStatusUI,
  type BlessedUIOptions,
  type BlessedStatusUIOptions
} from './ModularBlessedUI';

// For backward compatibility, also export from the original file
export { BlessedUI as OriginalBlessedUI, BlessedStatusUI as OriginalBlessedStatusUI } from './blessed-ui';
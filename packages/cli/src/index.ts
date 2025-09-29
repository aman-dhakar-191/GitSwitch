// Export CLI entry point
export * from './cli';

// Export all command classes
export { BaseCommand } from './commands/base/BaseCommand';
export { DotCommand } from './commands/DotCommand';
export { AccountCommands } from './commands/AccountCommands';
export { ProjectCommands } from './commands/ProjectCommands';
export { HookCommands } from './commands/HookCommands';
export { CommandRegistry } from './commands/CommandRegistry';

// Export utility classes
export { CLIUtils } from './utils/CLIUtils';
export { AuthUtils } from './utils/AuthUtils';

// Export types and interfaces
export * from './types/CommandTypes';

// Export UI components (both original and modular)
export { BlessedUI, BlessedStatusUI } from './ui/blessed-ui';
export { BaseUIComponent, UIThemes, UILayouts, UIContentGenerators } from './ui';
export { ModularBlessedUI, ModularBlessedStatusUI } from './ui/ModularBlessedUI';
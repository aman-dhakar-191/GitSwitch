# GitSwitch CLI - Modular Architecture

This document describes the new modular architecture implemented for the GitSwitch CLI.

## 🏗️ Architecture Overview

The CLI has been refactored from a single monolithic file (3500+ lines) into a clean, modular structure that improves maintainability, reusability, and testability.

### Directory Structure

```
packages/cli/src/
├── cli.ts                    # Main CLI entry point
├── index.ts                  # Package exports
├── commands/                 # Command modules
│   ├── base/
│   │   └── BaseCommand.ts    # Base class for all commands
│   ├── AccountCommands.ts    # Account management commands
│   ├── ProjectCommands.ts    # Project management commands
│   ├── HookCommands.ts       # Git hooks commands
│   ├── DotCommand.ts         # Interactive UI command
│   └── CommandRegistry.ts    # Command registration and initialization
├── utils/                    # Utility modules
│   ├── CLIUtils.ts          # Common CLI utilities
│   └── AuthUtils.ts         # Authentication utilities
├── types/                    # Type definitions
│   └── CommandTypes.ts      # Command interfaces and types
└── ui/                      # UI components
    └── blessed-ui.ts        # Terminal UI components
```

## 🎯 Key Improvements

### 1. **Separation of Concerns**
- Each command group has its own module
- Utilities are extracted and reusable
- Clear separation between UI, business logic, and CLI handling

### 2. **Consistent Error Handling**
- Base class provides standardized error handling
- Consistent messaging and exit codes
- Centralized validation for git repositories

### 3. **Reusable Utilities**
- `CLIUtils`: Common operations like clipboard, formatting, user prompts
- `AuthUtils`: Authentication flows and OAuth handling
- Type-safe interfaces for all operations

### 4. **Extensible Design**
- Easy to add new command groups
- Plugin-ready architecture
- Clear interfaces for extending functionality

### 5. **Better Testing**
- Each module can be tested independently
- Mock dependencies easily
- Isolated command logic

## 📋 Command Organization

### Core Commands (Implemented)
- **Account Commands**: Login, logout, list, status, usage, test, refresh
- **Project Commands**: Status, list, scan, import, identity, suggest, switch, health, analyze
- **Hook Commands**: Install, uninstall, status, validate
- **Dot Command**: Interactive UI for current project

### Coming Soon Commands (Placeholders)
- Repository management
- Remote operations
- Branch policies
- Security audit
- Workflow automation
- Configuration management
- History analysis
- Monorepo support
- Advanced git operations
- Team collaboration
- Context awareness
- IDE integrations
- Performance monitoring

## 🚀 Usage

All existing commands work exactly as before:

```bash
# Core functionality
gitswitch .                    # Interactive UI
gitswitch account list         # Account management
gitswitch project status       # Project status
gitswitch hook install        # Git hooks

# Coming soon features show helpful messages
gitswitch repo status          # Shows: "Coming soon - use gitswitch project status"
gitswitch workflow commit      # Shows: "Coming soon - use git commit and hooks"
```

## 🔧 Developer Guide

### Adding New Commands

1. **Create a command module** in `src/commands/`:
```typescript
import { BaseCommand } from './base/BaseCommand';
import { ICommand } from '../types/CommandTypes';

export class MyCommands extends BaseCommand implements ICommand {
  register(program: Command): void {
    const myCmd = program.command('my').description('My commands');
    // Add subcommands...
  }
}
```

2. **Register in CommandRegistry**:
```typescript
// In CommandRegistry.ts
this.commands.push(new MyCommands(/* dependencies */));
```

### Utility Functions

Use the utility classes for common operations:

```typescript
// User prompts
const choice = await CLIUtils.selectFromList('Choose option:', choices);
const confirmed = await CLIUtils.confirmAction('Are you sure?');

// Display formatting
CLIUtils.displayProjects(projects);
CLIUtils.displayAccounts(accounts);

// Coming soon features
CLIUtils.showComingSoon('Feature name', 'Q2 2024', 'Alternative command');
```

### Error Handling

Use the base class methods for consistent error handling:

```typescript
export class MyCommands extends BaseCommand {
  private async myAction(): Promise<void> {
    try {
      this.validateGitRepository(); // Validates current directory
      const project = this.getCurrentProject(); // Gets project with error handling
      
      // Your logic here...
      
      this.showSuccess('Operation completed!');
    } catch (error) {
      this.handleError(error, 'Failed to perform operation');
    }
  }
}
```

## ✅ Benefits

1. **Maintainability**: Much easier to find and modify specific functionality
2. **Reusability**: Utilities can be used across commands and even in other packages
3. **Testability**: Each module can be tested in isolation
4. **Extensibility**: New commands follow clear patterns and interfaces
5. **Performance**: Only load needed modules, faster startup
6. **Documentation**: Self-documenting structure with clear boundaries

## 🔄 Migration from Original

The original `cli.ts` (3500+ lines) has been:
- ✅ **Backed up** as `cli-original-backup.ts`
- ✅ **Replaced** with modular architecture
- ✅ **All functionality preserved** - existing commands work identically
- ✅ **Future commands** show helpful "coming soon" messages
- ✅ **Tested** and verified working

## 🎯 Next Steps

1. **Implement remaining commands** by moving them from placeholders to actual modules
2. **Add comprehensive tests** for each command module
3. **Enhance error handling** with more specific error types
4. **Add configuration management** for command preferences
5. **Implement plugin system** for third-party extensions

This modular architecture provides a solid foundation for GitSwitch's continued development while maintaining backward compatibility and improving developer experience.
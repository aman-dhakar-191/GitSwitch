# GitSwitch UI - Modular Architecture

This document describes the modular UI architecture implemented for GitSwitch's blessed-based terminal interfaces.

## 🏗️ Architecture Overview

The UI has been refactored from two large monolithic classes into a clean, modular, and highly reusable component system.

### Directory Structure

```
packages/cli/src/ui/
├── blessed-ui.ts              # Main export (backward compatible)
├── index.ts                   # Comprehensive exports
├── BaseUIComponent.ts         # Base class for all UI components
├── UIThemes.ts               # Themes and layout configurations
├── UIContentGenerators.ts    # Content generation utilities
├── ModularBlessedUI.ts       # Modular UI implementations
├── blessed-ui-backup.ts      # Original implementation backup
└── blessed-ui-original.ts    # Additional backup
```

## 🎯 Key Improvements

### 1. **Component-Based Architecture**
- **BaseUIComponent**: Common functionality for all blessed components
- **Specialized Components**: Header, InfoBox, ScrollableBox, Footer
- **Layout System**: Predefined layouts for consistent positioning
- **Theme System**: Centralized styling and color management

### 2. **Separation of Concerns**
- **UI Structure**: BaseUIComponent handles blessed element creation
- **Content Generation**: UIContentGenerators handles all content formatting
- **Styling**: UIThemes provides consistent theming
- **Business Logic**: Separated from presentation layer

### 3. **Reusability**
- **Composable Components**: Mix and match UI elements
- **Theme Variations**: Easy to create different visual styles
- **Layout Flexibility**: Predefined layouts for common patterns
- **Content Generators**: Reusable across different UI screens

### 4. **Maintainability**
- **Small, Focused Classes**: Each class has a single responsibility
- **Type Safety**: Full TypeScript interfaces
- **Consistent Patterns**: Standardized component creation
- **Easy Testing**: Each component can be tested independently

## 📋 Component System

### BaseUIComponent

Abstract base class providing common functionality:

```typescript
export abstract class BaseUIComponent {
  // Common blessed element creation methods
  protected createContainer(): blessed.Widgets.BoxElement
  protected createHeader(content: string, layout: any): blessed.Widgets.BoxElement
  protected createInfoBox(label: string, content: string, layout: any, borderColor: string): blessed.Widgets.BoxElement
  protected createScrollableBox(...): blessed.Widgets.BoxElement
  protected createFooter(content: string, layout: any): blessed.Widgets.BoxElement
  
  // Event handling
  protected setupExitEvents(additionalKeys: string[]): void
  protected setupNavigationEvents(): void
  
  // Lifecycle
  protected exit(): void
  public render(): void
  public destroy(): void
}
```

### UIThemes

Centralized theming system:

```typescript
export const UIThemes = {
  default: {
    screen: { smartCSR: true, dockBorders: true },
    container: { style: { bg: 'black' } },
    header: { style: { fg: 'white', bg: 'gray', bold: true } },
    infoBox: { style: { fg: 'white', bg: 'black' }, border: { type: 'line' } },
    footer: { style: { fg: 'black', bg: 'white' } }
  },
  colors: {
    primary: 'green',    // Success states
    secondary: 'yellow', // Warnings
    accent: 'magenta',   // Highlights
    info: 'cyan',        // Information
    // ... more colors
  }
}
```

### UILayouts

Standard layout configurations:

```typescript
export const UILayouts = {
  twoColumn: {
    left: { top: 16, left: 0, width: '50%', height: 10 },
    right: { top: 16, left: '50%', width: '50%', height: 10 }
  },
  centered: {
    main: { top: 4, left: '10%', width: '80%', height: 15 }
  },
  fullWidth: {
    header: { top: 0, left: 0, width: '100%', height: 15 },
    content: { top: 16, left: 0, width: '100%', height: 12 },
    footer: { bottom: 0, left: 0, width: '100%', height: 3 }
  }
}
```

### UIContentGenerators

Static methods for content generation:

```typescript
export class UIContentGenerators {
  static getGitSwitchHeader(): string
  static getProjectContent(project: Project): string
  static getIdentityContent(gitConfig?: GitConfig): string
  static getDetailedStatusContent(project: Project, gitConfig?: GitConfig): string
  static getCommandsContent(): string
  // Utility methods for content formatting
}
```

## 🚀 Usage Examples

### Basic Usage (Backward Compatible)

```typescript
import { BlessedUI, BlessedStatusUI } from './ui/blessed-ui';

// Works exactly as before
const ui = new BlessedUI({
  project,
  gitConfig,
  onExit: () => console.log('Exiting...')
});
ui.render();
```

### Advanced Usage with Modular Components

```typescript
import { BaseUIComponent, UIThemes, UILayouts, UIContentGenerators } from './ui';

class CustomUI extends BaseUIComponent {
  constructor() {
    super(blessed.screen({ title: 'Custom GitSwitch UI' }));
    this.buildCustomUI();
  }

  private buildCustomUI(): void {
    // Custom header with different theme
    this.createHeader('Custom Header', UILayouts.fullWidth.header);
    
    // Custom info box with custom styling
    this.createInfoBox(
      '🔧 Custom Info',
      'Custom content here',
      UILayouts.centered.main,
      UIThemes.colors.accent
    );
  }
}
```

### Creating Custom Themes

```typescript
const customTheme = {
  ...UIThemes.default,
  colors: {
    ...UIThemes.colors,
    primary: 'blue',
    accent: 'purple'
  }
};
```

## 🔧 Component Creation Patterns

### Standard Info Box

```typescript
this.createInfoBox(
  '📁 Project Info',                    // Label with emoji
  UIContentGenerators.getProjectContent(project), // Generated content
  UILayouts.twoColumn.left,             // Standard layout
  UIThemes.colors.success               // Theme color
);
```

### Scrollable Content Box

```typescript
this.createScrollableBox(
  '⚡ Commands',
  UIContentGenerators.getCommandsContent(),
  { top: 20, left: 0, width: '100%', height: 15 },
  UIThemes.colors.accent
);
```

### Custom Layout

```typescript
const customLayout = {
  top: 5,
  left: '25%',
  width: '50%',
  height: 8
};

this.createInfoBox('Custom Box', 'Content', customLayout, 'cyan');
```

## ✅ Benefits Achieved

### 1. **Code Reduction**
- **Original**: 450+ lines in blessed-ui.ts
- **Modular**: Distributed across focused modules (~50-100 lines each)
- **Reusability**: Content generators eliminate duplication

### 2. **Maintainability**
- **Single Responsibility**: Each class has one clear purpose
- **Easy Updates**: Styling changes in one place
- **Bug Isolation**: Issues isolated to specific components

### 3. **Extensibility**
- **New UI Screens**: Inherit from BaseUIComponent
- **Custom Themes**: Extend UIThemes
- **Custom Layouts**: Add to UILayouts
- **New Content Types**: Add to UIContentGenerators

### 4. **Testing**
- **Unit Testing**: Each component testable in isolation
- **Mock Dependencies**: Easy to mock blessed elements
- **Regression Testing**: Test UI behavior separately from business logic

### 5. **Developer Experience**
- **IntelliSense**: Full TypeScript support
- **Documentation**: Self-documenting component structure
- **Debugging**: Clear component boundaries
- **Consistency**: Standardized patterns

## 🔄 Migration Notes

### Backward Compatibility
- ✅ **All existing imports work**: `BlessedUI` and `BlessedStatusUI` classes unchanged
- ✅ **Same API**: Constructor options and methods identical
- ✅ **Same Behavior**: Visual appearance and functionality preserved
- ✅ **Same Performance**: No performance degradation

### New Capabilities
- 🎯 **Custom UIs**: Easy to create new UI screens
- 🎨 **Theming**: Switch themes without code changes
- 📱 **Responsive**: Layout system adapts to different needs
- 🔧 **Extensible**: Add new components following established patterns

## 🎯 Future Enhancements

1. **Theme Variants**: Dark mode, high contrast, custom color schemes
2. **Animation Support**: Smooth transitions and loading states
3. **Interactive Components**: Buttons, forms, navigation
4. **Responsive Layouts**: Adapt to terminal size changes
5. **Plugin Architecture**: Third-party UI components
6. **Accessibility**: Screen reader support, keyboard navigation
7. **Testing Framework**: Automated UI testing utilities

## 🛠️ Development Guide

### Adding New UI Screens

1. **Extend BaseUIComponent**:
```typescript
export class MyCustomUI extends BaseUIComponent {
  constructor(data: MyData) {
    super(blessed.screen({ title: 'My Custom UI' }));
    this.buildUI();
    this.setupEvents();
  }

  private buildUI(): void {
    // Use createHeader, createInfoBox, etc.
  }
}
```

2. **Add to exports** in `ui/index.ts`

3. **Create content generators** if needed in `UIContentGenerators`

### Adding New Themes

1. **Extend UIThemes**:
```typescript
export const MyTheme = {
  ...UIThemes.default,
  colors: { /* custom colors */ }
};
```

2. **Use in components**:
```typescript
this.createInfoBox(label, content, layout, MyTheme.colors.primary);
```

The modular UI architecture provides a solid foundation for GitSwitch's terminal interface while maintaining full backward compatibility and opening up new possibilities for customization and extension.
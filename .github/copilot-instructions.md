# GitHub Copilot Instructions for GitSwitch

GitSwitch is a git identity management tool that helps developers manage multiple git accounts across different projects. This document provides context and guidelines for AI-assisted development.

## 🏗 Project Architecture

### Monorepo Structure
```
GitSwitch/
├── packages/
│   ├── types/          # TypeScript type definitions
│   ├── core/           # Business logic and managers
│   ├── cli/            # Command-line interface
│   └── gitswitch/      # Main package for global installation
├── docs/               # Stage-based development documentation
├── scripts/            # Build and release automation
└── tests/              # Test suites
```

### Technology Stack
- **Language**: TypeScript with strict mode enabled
- **Runtime**: Node.js 18+
- **Build**: TypeScript compiler with workspaces
- **CLI**: Commander.js for command parsing
- **Storage**: Local JSON files with encryption for credentials
- **Testing**: Jest for unit tests, custom scripts for integration tests

## 🎯 Development Philosophy

### Stage-Based Development
GitSwitch follows a structured 3-stage development approach:

1. **Stage 1 (MVP)**: Core CLI and basic desktop app functionality
2. **Stage 2 (Enhanced)**: Smart detection, automation, improved UX
3. **Stage 3 (Advanced)**: Enterprise features, plugins, integrations

**IMPORTANT**: Always reference the relevant stage documentation when implementing features:
- `docs/stage-1-mvp.md` - Foundation features
- `docs/stage-2-enhanced.md` - Enhanced features with smart detection
- `docs/stage-3-advanced.md` - Enterprise and advanced features
- `docs/development-guide.md` - Complete development guidelines

### AI-Assisted Development Guidelines

#### Context-Rich Prompting
Always include stage context in requests:
```
"I'm working on Stage 2 of GitSwitch. Based on the smart detection engine specifications in stage-2-enhanced.md, help me implement..."
```

#### Reference Specific Architecture
Point to specific technical requirements:
```
"Looking at the Stage 1 technical requirements for the GitManager class, help me implement the getCurrentConfig method that..."
```

## 🔧 Technical Guidelines

### Code Style and Patterns

#### TypeScript Standards
- Use strict TypeScript with explicit types
- Prefer interfaces over type aliases for object shapes
- Use enums for constants with semantic meaning
- Export types from `@gitswitch/types` package

#### Error Handling
- Use custom error classes that extend Error
- Implement comprehensive error handling with user-friendly messages
- Log errors appropriately for debugging
- Follow the error handling patterns in existing managers

#### Async/Await Patterns
- Prefer async/await over Promise chains
- Handle errors with try/catch blocks
- Use Promise.all for concurrent operations
- Implement timeout handling for external operations

### Package Organization

#### Core Package (`packages/core/`)
Contains business logic managers:
- `GitManager` - Git configuration operations
- `ProjectManager` - Project discovery and management
- `AccountManager` - Account CRUD operations
- `SmartDetector` - Intelligent account suggestions (Stage 2)
- `BulkImportManager` - Bulk project import functionality

#### CLI Package (`packages/cli/`)
Command-line interface with these key commands:
- `gitswitch .` - Launch desktop app for current project
- `gitswitch scan` - Discover git projects
- `gitswitch list` - List managed projects
- `gitswitch accounts` - Account management
- `gitswitch hooks` - Git hook management

#### Types Package (`packages/types/`)
Shared TypeScript definitions:
- `GitAccount` - Account data structure
- `Project` - Project metadata
- `SmartSuggestion` - AI recommendation data
- `ProjectPattern` - URL matching patterns

### Key Business Logic

#### Git Configuration Management
```typescript
// GitManager handles git config operations
interface GitConfig {
  name: string;
  email: string;
  signingKey?: string;
}

// Always validate git configs before applying
// Support both global and local git configurations
// Handle git command errors gracefully
```

#### Smart Detection (Stage 2)
```typescript
// SmartDetector provides intelligent account suggestions
interface SmartSuggestion {
  account: GitAccount;
  confidence: number;    // 0-1 confidence score
  reason: string;        // Human-readable explanation
  usageHistory: number;  // Times used for similar projects
}

// Algorithm considers URL patterns, project paths, and usage history
// Continuously learns from user choices
// Provides explanations for recommendations
```

#### Project Discovery
```typescript
// ProjectManager discovers and manages git projects
interface Project {
  id: string;
  name: string;
  path: string;
  remoteUrl?: string;
  accountId?: string;
  lastUsed?: Date;
}

// Scans directories recursively for .git folders
// Extracts remote URLs and repository information
// Tracks usage patterns for smart suggestions
```

## 🚀 Development Workflow

### Building and Testing
```bash
# Build all packages in dependency order
npm run build              # Build types → core → cli

# Test individual packages
cd packages/core && npm test
cd packages/cli && npm test

# Test CLI functionality
npm run test-cli

# Development mode with watch
npm run dev
```

### Adding New Features

#### For Stage 1 Features (MVP)
1. Implement in `packages/core/` with appropriate manager
2. Add CLI command in `packages/cli/`
3. Update types in `packages/types/` if needed
4. Add tests and update documentation

#### For Stage 2 Features (Enhanced)
1. Focus on smart detection and automation
2. Implement learning algorithms in SmartDetector
3. Add bulk operations and improved UX
4. Integrate with existing Stage 1 foundation

#### For Stage 3 Features (Advanced)
1. Build enterprise and team collaboration features
2. Implement plugin architecture
3. Add IDE integrations and advanced workflows
4. Focus on security and compliance

### CLI Command Patterns
```bash
# Follow existing command structure
gitswitch <action> [options]

# Examples:
gitswitch scan --depth 2 --import
gitswitch list --filter api
gitswitch accounts add --name work --email work@company.com
```

### Data Storage Patterns
- Use JSON files for configuration and project data
- Encrypt sensitive credentials (git tokens, signing keys)
- Store in user's home directory under `.gitswitch/`
- Implement atomic file operations to prevent corruption

## 🧪 Testing Strategy

### Unit Tests
- Test individual managers and utilities
- Mock external dependencies (git commands, file system)
- Focus on business logic correctness
- Achieve high code coverage for core functionality

### Integration Tests
- Test CLI commands end-to-end
- Use temporary directories for git operations
- Test cross-platform compatibility
- Validate data persistence and migration

### Manual Testing
- Use the demo scripts (`demo.js`, `stage-1-mvp.js`)
- Test with real git repositories
- Verify smart suggestions accuracy
- Test bulk import with various project structures

## 🔍 Common Implementation Patterns

### Git Operations
```typescript
// Always handle git command failures
try {
  const result = await this.executeGitCommand(['config', 'user.name']);
  return result.stdout.trim();
} catch (error) {
  throw new GitOperationError(`Failed to get git config: ${error.message}`);
}
```

### File System Operations
```typescript
// Use path.join for cross-platform compatibility
// Handle file access errors gracefully
// Implement atomic operations for data integrity
```

### Smart Suggestions Algorithm
```typescript
// Combine multiple factors for confidence scoring:
// - URL pattern matching (40%)
// - Usage history (30%)
// - Path patterns (20%)  
// - Account defaults (10%)
```

## 📋 Quality Standards

### Before Submitting Code
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Code follows existing patterns
- [ ] Error handling is comprehensive
- [ ] Documentation is updated
- [ ] Manual testing completed

### Code Reviews Focus On
- Adherence to stage-based architecture
- Proper error handling and user feedback
- Cross-platform compatibility
- Performance for large project sets
- Security of credential handling

## 🎯 Current Development Status

**Stage 2 Enhanced Features** - Currently implementing smart detection and automation:
- ✅ Smart account suggestions with 90%+ accuracy
- ✅ Bulk project import and discovery
- ✅ Enhanced CLI with rich commands
- ✅ Usage analytics and pattern learning
- 🔄 Git hook integration (CLI complete, UI pending)
- 🔄 Advanced dashboard UI
- 🔄 System integration features

Refer to the README.md and stage documentation for detailed feature status and implementation guidance.
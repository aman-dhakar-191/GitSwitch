# GitSwitch AI Coding Instructions

## Project Overview
GitSwitch is a multi-stage git identity management tool with CLI, Desktop (Electron), and Core business logic packages. Currently at **Stage 2 Enhanced Features** (98% complete). The project uses TypeScript, npm workspaces, and follows a staged development approach.

**Key Concepts:**
- **Multi-Identity Management**: Handles different git accounts (work, personal, client) automatically
- **Smart Detection**: AI-powered suggestions based on project context and usage patterns
- **Cross-Platform**: Runs on Windows, macOS, and Linux with platform-specific considerations
- **Staged Development**: Features are delivered in phases with clear progression paths

## Architecture & Key Components

### Package Structure (Monorepo)
```
packages/
├── types/       # Shared TypeScript definitions - BUILD FIRST
├── core/        # Business logic (GitManager, StorageManager, etc.)
├── cli/         # Commander.js CLI tool
├── desktop/     # Electron app (main + renderer processes)
└── gitswitch/   # Global npm package wrapper
```

**Dependency Order:** `types` → `core` → `cli`/`desktop` → `gitswitch`

### Core Service Architecture
All services are instantiated as singletons in both CLI and Desktop:
```typescript
const gitManager = new GitManager();
const storageManager = new StorageManager();
const projectManager = new ProjectManager();
const smartDetector = new SmartDetector(storageManager);
// 10+ other managers with explicit dependency injection
```

**Critical:** Services use explicit dependency injection. Never use service locator patterns.

### Data Flow Patterns
- **CLI → Desktop:** CLI spawns desktop app with `--project` argument
- **Desktop IPC:** Renderer ↔ Main via typed `IPCEvent`/`IPCResponse` (see types/src/index.ts)
- **Storage:** All data persists to `~/.gitswitch/` directory as JSON files
- **Git Integration:** All git operations wrapped in GitManager with error handling

## Essential Development Commands

### Build System (Critical - Use Gulp, not npm directly)
```bash
# Production builds (with minification)
gulp build          # Build all packages
gulp prod          # Full production build + packaging

# Development builds (no minification, with sourcemaps)
gulp dev           # Development build
gulp build:unminified  # Build without mangling

# Package management
gulp setup         # Create installer/setup files
gulp package:desktop  # Package desktop app only
```

**Never use `npm run build` directly** - use Gulp tasks which handle proper dependency order and cross-package coordination.

### Testing & Debugging
```bash
# CLI testing (from project root)
npm run gitswitch status    # Test current project status
npm run gitswitch scan      # Test project discovery
node test-cli.js           # Comprehensive CLI tests

# Desktop app testing
cd packages/desktop && npm start  # Development mode
npm run demo                      # Interactive feature demo
```

### Stage-Specific Development
Current stage files are in `docs/`:
- `stage-1-mvp.md` - Foundation (complete ✅)
- `stage-2-enhanced.md` - Current stage (98% complete)
- `stage-3-advanced.md` - Future enterprise features

**Use stage files for context** - they contain detailed specifications, success criteria, and implementation priorities.

## Code Patterns & Conventions

### Path Handling (Windows/Cross-platform)
```typescript
// ✅ Correct - use path.join/resolve
const distPath = path.join('dist', 'main.js');
const projectPath = path.resolve(__dirname, '../../desktop');

// ❌ Wrong - hardcoded separators
const distPath = 'dist/main.js';
```

### Error Handling Pattern
```typescript
// Core services use this consistent pattern:
try {
  const result = await this.executeGitCommand(command, cwd);
  return result.trim();
} catch (error: any) {
  console.error(`[GitManager] Git command failed: ${error.message}`);
  throw new Error(`Git command failed: ${error.message}`);
}
```

### IPC Communication (Desktop App)
```typescript
// Renderer → Main
const response = await window.electronAPI.invokeIPC({
  type: 'GET_ACCOUNTS',
  payload: null
});

// Main handler
ipcMain.handle('ipc-request', async (event, request: IPCEvent) => {
  // Route to appropriate service method
  return { success: true, data: result };
});
```

### Storage Patterns
All data models auto-convert dates and have consistent CRUD operations. Use `StorageManager` methods, never direct file I/O.

## Critical Integration Points

### CLI ↔ Desktop Coordination
The CLI launches desktop app using multiple fallback strategies:
1. `npx electron dist/main.js --project <path>`
2. Global electron binary
3. `npm start` in desktop directory

**Critical:** Desktop app paths use `path.join()`, not hardcoded strings.

### Git Hook Integration
Git hooks are shell scripts that call back to GitSwitch CLI. The `GitHookManager` installs pre-commit hooks that validate identity before commits.

### Smart Detection Engine
Uses URL pattern matching and usage analytics. The `SmartDetector` learns from user choices and provides confidence scores (0-1) for account suggestions.

## Current Bugs & Priorities

See `BUGS.md` for complete list. Currently fixing **Medium Priority Bugs**:
1. ✅ Path separator issues (Windows compatibility)
2. [ ] StorageManager data validation
3. [ ] CLI help text standardization  
4. [ ] Desktop app window management

### Known Build Issues
The TypeScript compilation currently has errors in the core package due to missing Node.js type definitions. Quick fixes:
```bash
# Fix Node.js types
cd packages/core && npm install --save-dev @types/node

# Fix tsconfig.json to include proper lib settings
# Update compilerOptions to include "dom", "node" libraries
```

### Project Status by Stage
- **Stage 1 (Foundation MVP)**: ✅ Complete (CLI + Desktop core functionality)
- **Stage 2 (Enhanced Features)**: 🔄 98% Complete (Smart detection, bulk operations)
- **Stage 3 (Advanced Features)**: 📋 Planned (Enterprise features, plugins)
- **Stage 4 (Advanced Repository Features)**: 📋 Future roadmap

## Development Workflow Tips

1. **Always build types first:** `cd packages/types && npm run build`
2. **Use Gulp for builds:** Never bypass the Gulp build system
3. **Test cross-platform:** Pay attention to Windows path handling
4. **Check stage docs:** Use current stage specifications for context
5. **Follow dependency injection:** Services are explicit dependencies, not singletons
6. **Test CLI extensively:** Most users interact via CLI first

## Common Pitfalls

- Don't use `npm && npm` - use `;` for PowerShell on Windows
- Don't bypass Gulp build system - it handles package ordering
- Don't hardcode file paths - always use `path.join()`
- Don't modify type definitions without rebuilding dependent packages
- Don't create circular dependencies between core services

## Testing Strategy

The project uses both unit tests (`packages/*/tests/`) and integration testing via `demo.js` and `test-cli.js`. Manual testing commands are documented in `README.md`.

Focus testing on cross-platform compatibility, especially Windows path handling and PowerShell command execution.

## Quick Reference

### Essential Files to Know
- `docs/stage-*.md` - Feature specifications and requirements
- `BUGS.md` - Current known issues and priorities  
- `GULP_TASKS.md` - Build system documentation
- `packages/types/src/index.ts` - All TypeScript type definitions
- `packages/core/src/GitManager.ts` - Core git operations
- `packages/core/src/SmartDetector.ts` - AI recommendation engine
- `packages/desktop/src/main.ts` - Electron main process
- `packages/cli/src/index.ts` - CLI entry point

### Key Commands for Development
```bash
# Initial setup
npm install && npm run build:types

# Development cycle
npm run gulp:dev          # Development build
npm run test-cli          # Test CLI functionality  
npm run demo              # Interactive feature demo
npm run gulp:prod         # Production build + packaging

# Debug specific components
cd packages/core && npm test         # Unit tests
cd packages/desktop && npm start     # Desktop app development
node test-cli.js                     # Comprehensive CLI tests
```

### Architecture Quick Start
1. **Types Package**: Shared interfaces, build this first
2. **Core Package**: Business logic, all managers and services
3. **CLI Package**: Commander.js interface, calls core services
4. **Desktop Package**: Electron app, IPC bridge to core services
5. **GitSwitch Package**: Global npm wrapper, ties everything together

### Context for AI Assistants
When working on GitSwitch:
- Reference the appropriate `stage-*.md` file for feature context
- Check `BUGS.md` for known issues that might affect your changes
- Use existing manager classes rather than creating new ones
- Follow the established error handling and logging patterns
- Test cross-platform compatibility, especially Windows paths
- Consider the staged development approach - don't implement future stage features

## Security & Privacy Guidelines

### Data Protection
- **Local Storage Only**: All data is stored locally in `~/.gitswitch/` directory as JSON files
- **No Cloud Sync**: GitSwitch never sends user data to external services
- **Credential Security**: Git credentials are managed by the system's git installation, not stored directly
- **OAuth Tokens**: GitHub/GitLab tokens are stored securely using system keychain when available

### Security Best Practices
- Always validate file paths to prevent directory traversal attacks
- Sanitize all git command inputs to prevent command injection
- Use TypeScript strict mode for compile-time safety
- Validate all JSON data when loading from storage files
- Use `path.join()` and `path.resolve()` for all file operations

### Example Security Pattern:
```typescript
// ✅ Safe git command execution
private async executeGitCommand(command: string, cwd: string): Promise<string> {
  // Validate inputs
  if (!command || typeof command !== 'string') {
    throw new Error('Invalid git command');
  }
  
  if (!fs.existsSync(cwd)) {
    throw new Error('Invalid working directory');
  }
  
  // Execute with proper escaping
  const result = execSync(`git ${command}`, { 
    cwd: path.resolve(cwd),
    encoding: 'utf8' 
  });
  return result.trim();
}
```

## Performance Considerations

### Optimization Guidelines
- **Project Scanning**: Process large directory trees efficiently (100+ projects in <5 seconds)
- **Git Operations**: Batch git commands where possible to reduce system calls
- **File I/O**: Use streaming for large file operations, avoid loading entire files into memory
- **Desktop App**: Keep renderer process lightweight, move heavy operations to main process

### Performance Patterns:
```typescript
// ✅ Efficient project scanning
async scanDirectory(dir: string): Promise<Project[]> {
  const projects: Project[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  
  // Process in batches to avoid overwhelming the system
  const batches = chunk(entries, 10);
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(entry => this.checkIfProject(path.join(dir, entry.name)))
    );
    projects.push(...batchResults.filter(Boolean));
  }
  
  return projects;
}
```

## Error Handling & Logging

### Error Categories
1. **Git Errors**: Command failures, invalid repositories, permission issues
2. **File System Errors**: Missing directories, permission denied, disk space
3. **Configuration Errors**: Invalid JSON, missing required fields, version conflicts
4. **Network Errors**: OAuth failures, API rate limits, connectivity issues

### Logging Patterns:
```typescript
// ✅ Consistent error handling with context
async switchAccount(projectPath: string, accountId: string): Promise<void> {
  try {
    const account = await this.getAccount(accountId);
    await this.executeGitConfig(projectPath, account);
    
    // Success logging with context
    console.log(`[GitManager] Switched to ${account.name} for ${path.basename(projectPath)}`);
  } catch (error: any) {
    // Error logging with full context
    console.error(`[GitManager] Failed to switch account for ${projectPath}:`, {
      accountId,
      error: error.message,
      stack: error.stack
    });
    
    // Re-throw with user-friendly message
    throw new Error(`Failed to switch git account: ${error.message}`);
  }
}
```

## API Design & Patterns

### Service Layer Architecture
All core functionality is organized into manager classes with clear responsibilities:

```typescript
// ✅ Service dependency injection pattern
export class ProjectManager {
  constructor(
    private gitManager: GitManager,
    private storageManager: StorageManager,
    private smartDetector: SmartDetector
  ) {}
  
  // Methods use injected dependencies, never direct instantiation
  async createProject(path: string): Promise<Project> {
    const gitInfo = await this.gitManager.getRepositoryInfo(path);
    const project = this.createProjectFromGitInfo(gitInfo);
    await this.storageManager.saveProject(project);
    return project;
  }
}
```

### Data Model Consistency
- All models have `id`, `createdAt`, `updatedAt` fields
- Use discriminated unions for polymorphic types
- Validate data at boundaries (file I/O, IPC, user input)
- Maintain backward compatibility when evolving schemas

## Accessibility & User Experience

### Desktop App Requirements
- Full keyboard navigation support
- Screen reader compatibility (ARIA labels, semantic HTML)
- High contrast mode support
- Responsive design (works at 1024x768 minimum)
- Loading states for all async operations
- Clear error messages with actionable solutions

### CLI Requirements
- Consistent command structure following Unix conventions
- Helpful error messages with suggested fixes
- Progress indicators for long-running operations
- Proper exit codes (0 for success, non-zero for errors)
- Color output with fallback for non-color terminals

## Integration Guidelines

### External Tool Integration
- **IDE Extensions**: VS Code, IntelliJ (planned for Stage 3)
- **Git Hosting**: GitHub, GitLab, Bitbucket API integration
- **Development Tools**: Docker, npm, yarn workspace detection
- **CI/CD**: Webhook support for automated workflows

### Git Hook Integration
```bash
#!/bin/sh
# .git/hooks/pre-commit
# GitSwitch identity validation hook

current_user=$(git config user.email)
if [ -z "$current_user" ]; then
  echo "❌ No git user configured. Run 'gitswitch .' to set up."
  exit 1
fi

# Call GitSwitch CLI for validation
gitswitch validate-identity
exit $?
```

## Troubleshooting Guide

### Common Issues & Solutions

#### Build Failures
```bash
# TypeScript compilation errors
npm run clean && npm install && npm run build:types

# Cross-package dependency issues
npm run verify && npm run build

# Gulp task failures
npm run gulp:clean && npm run gulp:dev
```

#### Runtime Issues
```bash
# Desktop app won't start
cd packages/desktop && npm run electron:debug

# CLI command not found
npm run install-global

# Git operations failing
gitswitch hooks --status  # Check hook installation
```

#### Platform-Specific Issues
```bash
# Windows PowerShell execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# macOS permission issues
sudo chown -R $(whoami) ~/.gitswitch/

# Linux desktop integration
npm run create-desktop-entry
```

## Contributing Guidelines

### Pull Request Requirements
- All changes must pass existing tests
- New features require corresponding tests
- Documentation updates for user-facing changes
- Cross-platform testing on Windows, macOS, Linux
- Performance impact assessment for core operations

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Cross-platform path handling (`path.join()`)
- [ ] Error handling with proper context
- [ ] Security validation for user inputs  
- [ ] Performance considerations for large datasets
- [ ] Accessibility compliance for UI changes
- [ ] Documentation updates for API changes

Focus testing on cross-platform compatibility, especially Windows path handling and PowerShell command execution.
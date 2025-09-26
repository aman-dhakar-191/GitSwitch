# GitSwitch AI Coding Instructions

## Project Overview
GitSwitch is a multi-stage git identity management tool with CLI, Desktop (Electron), and Core business logic packages. Currently at **Stage 2 Enhanced Features** (98% complete). The project uses TypeScript, npm workspaces, and follows a staged development approach.

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
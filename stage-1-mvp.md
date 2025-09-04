# Stage 1: Foundation MVP
## GitSwitch Core Functionality

**Timeline**: 4-6 weeks  
**Goal**: Solve the basic git identity switching problem with CLI + desktop app

---

## 🎯 Stage Objectives

### Primary Goals
- [ ] CLI tool that works with `gitswitch .` command
- [ ] Basic desktop app for account management  
- [ ] Git config switching functionality
- [ ] Local project detection and mapping
- [ ] Secure account credential storage

### Success Criteria
- CLI command launches desktop app for current project
- Users can add/manage multiple git accounts
- Git identity switches correctly per project
- 10+ beta testers using daily
- Zero data loss or corruption

---

## 🔧 Technical Requirements

### CLI Tool (`gitswitch`)
```bash
# Core commands for MVP
gitswitch .                 # Open app for current project
gitswitch --version        # Show version
gitswitch --help          # Show help
```

**Technical Specs:**
- **Language**: Node.js/TypeScript (for rapid development)
- **Package**: Single executable binary
- **Installation**: npm global install initially
- **Path Detection**: Process.cwd() for current directory
- **App Communication**: Launch Electron with project path parameter

### Desktop App (Electron)
**Core Windows:**
1. **Main Window**: Project context view
2. **Accounts Window**: Manage git accounts
3. **Settings Window**: Basic configuration

**Technical Specs:**
- **Framework**: Electron + TypeScript + React
- **State Management**: Context API (simple for MVP)
- **Styling**: CSS Modules + custom CSS (no external UI library)
- **Data Storage**: Local JSON files + OS credential store

### Git Integration
**Required Operations:**
- Read current git config (user.name, user.email)
- Write git config for specific repository
- Detect git repository (find .git directory)
- Parse remote URLs to identify platform/organization

**Implementation:**
```typescript
// Core git operations
class GitManager {
  getCurrentConfig(repoPath: string): GitConfig
  setConfig(repoPath: string, config: GitConfig): void  
  getRemoteUrl(repoPath: string): string
  isGitRepository(path: string): boolean
}
```

---

## 🎨 UI/UX Specifications

### Visual Design (MVP)
**Color Scheme:**
```css
:root {
  --bg-primary: #1e1e1e;
  --bg-secondary: #2d2d2d;  
  --accent: #007acc;
  --success: #4caf50;
  --text-primary: #cccccc;
  --text-secondary: #999999;
}
```

**Typography:**
- Primary: System fonts (SF Pro/Segoe UI)
- Monospace: System monospace fonts
- Sizes: 14px base, 16px headings, 12px secondary

### Main Window Layout
```
┌─────────────────────────────────────────────────┐
│ GitSwitch - Current Project                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  📁 Project: /Users/dev/myapp                   │
│  🔗 Remote: github.com/company/myapp            │
│                                                 │
│  Current Git Identity:                          │
│  👤 work@company.com                            │
│  📝 John Developer                              │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐     │
│  │  ✅ Looks Good   │  │  🔄 Change      │     │
│  └─────────────────┘  └─────────────────┘     │
│                                                 │
│  [⚙️ Manage Accounts]  [📊 All Projects]       │
└─────────────────────────────────────────────────┘
```

### Account Management Window
```
┌─────────────────────────────────────────────────┐
│ Manage Git Accounts                    [+ Add]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 work@company.com                            │
│     John Developer                              │
│     🏢 Work Account                              │
│     [Edit] [Delete]                             │
│                                                 │
│  👤 me@personal.com                             │
│     Jane Developer                              │
│     🏠 Personal                                  │
│     [Edit] [Delete]                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 💾 Data Models

### Account Model
```typescript
interface GitAccount {
  id: string;
  name: string;          // Display name
  email: string;         // Git email
  gitName: string;       // Git user.name
  description?: string;  // "Work", "Personal", etc.
  createdAt: Date;
  updatedAt: Date;
}
```

### Project Model  
```typescript
interface Project {
  id: string;
  path: string;          // Absolute path to project
  name: string;          // Derived from folder name
  remoteUrl?: string;    // Git remote URL
  accountId?: string;    // Associated account ID
  lastAccessed: Date;
  createdAt: Date;
}
```

### Configuration Model
```typescript
interface AppConfig {
  defaultAccount?: string;
  autoScan: boolean;
  theme: 'dark' | 'light';
  startMinimized: boolean;
}
```

---

## 🏗 Implementation Tasks

### Week 1: Project Setup & CLI
- [ ] Initialize TypeScript project structure
- [ ] Set up build system (webpack/rollup)
- [ ] Create basic CLI tool structure  
- [ ] Implement directory detection
- [ ] Add argument parsing
- [ ] Test CLI launches Electron app

### Week 2: Core Git Integration
- [ ] Implement GitManager class
- [ ] Add git config read/write operations
- [ ] Create repository detection logic
- [ ] Add remote URL parsing
- [ ] Write unit tests for git operations
- [ ] Handle edge cases (no git, no remote, etc.)

### Week 3: Desktop App Foundation
- [ ] Set up Electron + React app
- [ ] Create main window layout
- [ ] Implement account management UI
- [ ] Add basic routing/navigation
- [ ] Connect to git operations
- [ ] Test window communication with CLI

### Week 4: Data Persistence & Polish
- [ ] Implement local data storage
- [ ] Add account CRUD operations
- [ ] Create project-account mapping
- [ ] Add error handling and validation
- [ ] Implement basic settings
- [ ] End-to-end testing

---

## 🧪 Testing Strategy

### Unit Tests
- Git operations (config read/write)
- Account management logic
- Project detection algorithms  
- CLI argument parsing

### Integration Tests
- CLI → Electron app communication
- Git config changes in real repositories
- Account persistence and retrieval
- Error handling scenarios

### Manual Testing
- Test with real git repositories
- Multiple account switching
- Edge cases (nested repos, no git, etc.)
- Cross-platform compatibility

---

## 🚀 Deployment & Distribution

### MVP Distribution
- **Development**: Local npm link for CLI
- **Beta Testing**: GitHub releases with binaries
- **Packaging**: electron-builder for desktop app
- **Platforms**: macOS first, Windows second

### Installation Flow
1. Download desktop app installer
2. CLI tool bundled with desktop app
3. App adds CLI to PATH during installation
4. User runs `gitswitch .` from any project directory

---

## ⚠️ Technical Risks & Mitigations

### Risk 1: Git Config Conflicts
**Mitigation**: Always backup original config, provide restore functionality

### Risk 2: Cross-Platform Path Issues  
**Mitigation**: Use Node.js path utilities, test on both platforms early

### Risk 3: Security of Stored Credentials
**Mitigation**: Use OS credential store (Keychain/Credential Manager)

### Risk 4: Performance with Large Repositories
**Mitigation**: Cache git operations, implement timeout limits

---

## 📋 Definition of Done

### Feature Complete When:
- [ ] CLI tool installs and runs on target systems
- [ ] Desktop app launches from CLI command
- [ ] Users can add/edit/delete git accounts
- [ ] Git identity switches correctly for projects
- [ ] Data persists between app sessions
- [ ] Basic error handling prevents data corruption
- [ ] 10+ users successfully complete core workflow

### Technical Complete When:
- [ ] Unit test coverage > 80%
- [ ] Integration tests pass on CI
- [ ] App packages successfully for distribution
- [ ] Performance benchmarks met (< 2s startup)
- [ ] Security review completed
- [ ] Documentation updated

---

*This MVP establishes the foundation for GitSwitch. Focus on core functionality and user validation before adding advanced features.*
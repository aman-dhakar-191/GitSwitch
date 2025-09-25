# GitSwitch Installation Guide

Complete installation and distribution guide for GitSwitch.

## 🚀 Quick Install (Choose One)

### Option 1: Global CLI (Recommended)
```bash
npm install -g gitswitch
gitswitch --version
```

### Option 2: Desktop App
Download from [Releases](https://github.com/aman-dhakar-191/GitSwitch/releases):
- **Windows**: `.exe` installer or `GitSwitch-Setup.zip`
- **macOS**: `.dmg` or `.zip` archive  
- **Linux**: `.AppImage`, `.deb`, or `.tar.gz`

### Option 3: Development Build
```bash
git clone https://github.com/aman-dhakar-191/GitSwitch.git
cd GitSwitch
npm install
npm run build
npm run install-global
```

---

## 📦 Installation Options

### 1. Global CLI Installation

**For End Users:**
```bash
npm install -g gitswitch

# Verify installation
gitswitch --version
gitswitch --help
```

**For Development:**
```bash
git clone https://github.com/aman-dhakar-191/GitSwitch.git
cd GitSwitch
npm install
npm run build:global
npm run install-global
```

### 2. Desktop Application Installation

#### Windows
1. Download `GitSwitch-Setup.zip` or `Install-GitSwitch.bat`
2. **Option A**: Run `Install-GitSwitch.bat` (automatic install to C:\GitSwitch)
3. **Option B**: Extract `GitSwitch-Setup.zip` to any folder
4. Use desktop shortcut or run `GitSwitch.bat`

#### macOS/Linux
1. Download appropriate package from releases
2. Install using system package manager
3. Launch from Applications or command line

### 3. Development Installation
```bash
git clone https://github.com/aman-dhakar-191/GitSwitch.git
cd GitSwitch
npm install
npm run build
```

---

## 🛠 Building & Packaging

### CLI Package
```bash
# Build CLI for distribution
npm run build:global

# Install globally from source
npm run install-global

# Uninstall global
npm run uninstall-global
```

### Desktop Application

#### Quick Build
```bash
npm run create-installer  # Creates complete installer package
```

#### Manual Build
```bash
# Build desktop app
npm run build:desktop

# Package for current platform
cd packages/desktop
npm run pack

# Package for specific platforms
npm run dist:win      # Windows
npm run dist:mac      # macOS  
npm run dist:linux    # Linux
npm run dist          # All platforms
```

### Release Management
```bash
# Full build and test
node release.js build

# Package desktop apps
node release.js pack win
node release.js pack mac
node release.js pack linux

# Complete release process
node release.js release
```

---

## 📋 System Requirements

### CLI Requirements
- Node.js 18+
- npm 8+
- Git installed and in PATH

### Desktop App Requirements
- **Windows**: Windows 10+
- **macOS**: macOS 10.15+
- **Linux**: glibc 2.17+
- 100MB disk space
- Git installed and in PATH

---

## 🎯 Post-Installation Usage

### First Steps
1. **Verify installation:**
   ```bash
   gitswitch --version
   gitswitch --help
   ```

2. **Navigate to a git project:**
   ```bash
   cd /path/to/git/repo
   gitswitch status
   ```

3. **Launch desktop app:**
   ```bash
   gitswitch .
   ```

### Managing Accounts
```bash
gitswitch accounts          # List all accounts
gitswitch status           # Show current identity
gitswitch hooks --install  # Install commit validation
```

---

## 🔄 Updates & Maintenance

### CLI Updates
```bash
npm update -g gitswitch
```

### Desktop App Updates
- Download new version from GitHub releases
- Replace existing installation
- Future: Auto-update notifications planned

---

## 🐛 Troubleshooting

### CLI Issues

**"gitswitch command not found":**
```bash
# Check global npm path
npm config get prefix

# Add to PATH (Linux/Mac)
export PATH=$PATH:$(npm config get prefix)/bin

# Windows: Add npm global path to system PATH
```

**Permission errors:**
```bash
# Fix npm permissions (Linux/Mac)
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Desktop App Issues

**App won't start:**
```bash
# Verify build
cd packages/desktop
npm run build
npm run start

# Kill existing processes (Windows)
taskkill /f /im electron.exe
```

**Installation blocked (Windows):**
- Try "Extract GitSwitch-Setup.zip" method instead
- Run as Administrator if needed
- Ensure Node.js 18+ is installed

### Build Issues

**electron-builder problems:**
- Use custom packaging: `npm run package-manual`
- Our scripts bypass Windows code signing issues
- Creates working portable application

**File lock errors:**
1. Close all GitSwitch instances
2. Kill electron processes
3. Wait and retry build

---

## 📊 Package Structure

```
GitSwitch/
├── packages/
│   ├── gitswitch/          # Global CLI package
│   │   ├── bin/gitswitch   # Global binary
│   │   ├── lib/            # Compiled code
│   │   └── package.json    # npm package config
│   ├── cli/                # CLI implementation
│   ├── desktop/            # Electron app
│   │   └── release/        # Built installers
│   ├── core/               # Core functionality
│   └── types/              # TypeScript types
├── release.js              # Release management
└── INSTALLATION.md         # This guide
```

---

## 🚀 Distribution

### NPM Registry
- **Package**: `gitswitch`
- **Install**: `npm install -g gitswitch`
- **Update**: `npm update -g gitswitch`

### GitHub Releases
- Desktop apps for all platforms
- Source code archives
- Release notes and changelogs

### Future Distribution (Planned)
- Microsoft Store (Windows)
- Mac App Store (macOS)
- Snap Store (Linux)

---

## 🔧 Build Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run build` | Build all packages |
| `npm run build:global` | Build + prepare global CLI package |
| `npm run install-global` | Install CLI globally from source |
| `npm run create-installer` | Create complete desktop installer |
| `npm run package` | Build + package desktop app |
| `node release.js release` | Full release process |

---

## 👥 For System Administrators

### Automated Deployment
- Use `Install-GitSwitch.bat` for automated installs
- Extract `GitSwitch-Setup.zip` to network locations
- Set up PATH environment variables as needed

### Enterprise Considerations
- All data stored locally (no cloud dependencies)
- Portable installation option available
- Group policy support for desktop shortcuts
- No special permissions required for CLI

---

## 🤝 Getting Help

- **Issues**: [GitHub Issues](https://github.com/aman-dhakar-191/GitSwitch/issues)
- **Documentation**: `gitswitch --help`
- **Contributing**: See CONTRIBUTING.md

---

*GitSwitch - Never commit with the wrong identity again!* 🔄
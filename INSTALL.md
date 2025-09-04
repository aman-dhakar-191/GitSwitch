# GitSwitch Installation & Distribution Guide

This guide covers installation options and packaging for GitSwitch.

## 🎯 Installation Options

### 1. Global CLI Installation (Recommended)

**For End Users:**
```bash
npm install -g gitswitch
```

**For Development:**
```bash
git clone https://github.com/aman-dhakar-191/GitSwitch.git
cd GitSwitch
npm install
npm run build:global
npm run install-global
```

### 2. Desktop Application

Download pre-built packages from [Releases](https://github.com/aman-dhakar-191/GitSwitch/releases):

- **Windows**: `.exe` installer or portable `.exe`
- **macOS**: `.dmg` or `.zip` archive  
- **Linux**: `.AppImage`, `.deb`, or `.tar.gz`

### 3. Development Installation

```bash
git clone https://github.com/aman-dhakar-191/GitSwitch.git
cd GitSwitch
npm install
npm run build
```

## 🏗️ Building & Packaging

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

# Publish CLI to npm
node release.js publish-cli

# Complete release process
node release.js release
```

## 📦 Package Structure

```
GitSwitch/
├── packages/
│   ├── gitswitch/          # Global CLI package
│   │   ├── bin/gitswitch   # Global binary
│   │   ├── lib/            # Compiled code
│   │   └── package.json    # npm package config
│   ├── cli/                # CLI implementation
│   ├── desktop/            # Electron app
│   ├── core/               # Core functionality
│   └── types/              # TypeScript types
├── release.js              # Release management
└── INSTALL.md             # This file
```

## 🔧 Build Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build all packages |
| `npm run build:global` | Build + prepare global package |
| `npm run install-global` | Install CLI globally from source |
| `npm run package` | Build + package desktop app |
| `node release.js release` | Full release process |

## 🌐 Distribution Channels

### NPM Registry
- Package: `gitswitch`
- Installation: `npm install -g gitswitch`
- Auto-updates: via `npm update -g gitswitch`

### GitHub Releases
- Desktop apps for all platforms
- Source code archives
- Release notes and changelogs

### Platform Stores (Future)
- Microsoft Store (Windows)
- Mac App Store (macOS)
- Snap Store (Linux)

## 🚀 Post-Installation

After installation, users can:

1. **Verify installation:**
   ```bash
   gitswitch --version
   gitswitch --help
   ```

2. **Start using:**
   ```bash
   cd /path/to/git/repo
   gitswitch .
   ```

3. **Manage accounts:**
   ```bash
   gitswitch accounts
   gitswitch status
   ```

## 🔄 Updates

### CLI Updates
```bash
npm update -g gitswitch
```

### Desktop App Updates
- Auto-update notifications (future feature)
- Manual download from GitHub releases
- In-app update checker (future feature)

## 🐛 Troubleshooting

### Common Issues

**CLI not found after global install:**
```bash
# Check global npm path
npm config get prefix

# Add to PATH if needed (Linux/Mac)
export PATH=$PATH:$(npm config get prefix)/bin

# Windows: Add to PATH via System Properties
```

**Desktop app won't start:**
```bash
# Check if built properly
cd packages/desktop
npm run build
npm run start
```

**Permission errors:**
```bash
# Linux/Mac: Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## 📋 System Requirements

### CLI
- Node.js 18+
- npm 8+
- Git installed and in PATH

### Desktop App
- Windows 10+, macOS 10.15+, or Linux with glibc 2.17+
- 100MB disk space
- Git installed and in PATH

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.
# GitSwitch

A lightweight git identity management tool that simplifies switching between multiple GitHub/GitLab accounts across different projects.

## 🚀 Quick Start

### Global Installation

```bash
npm install -g gitswitch
```

### Basic Usage

```bash
# Navigate to any git repository
cd /path/to/your/project

# Open GitSwitch for current project
gitswitch .

# Show current git identity
gitswitch status

# List all configured accounts
gitswitch accounts
```

## 📋 Features

- **Multi-Account Management**: Manage multiple git accounts with ease
- **Project Context Awareness**: Automatically detect and switch git identities per project
- **Desktop GUI**: User-friendly interface for account management
- **CLI Integration**: Powerful command-line interface for automation
- **Smart Detection**: Intelligent account suggestions based on repository URLs
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🎯 Core Commands

### Project Management
```bash
gitswitch .                    # Open desktop app for current project
gitswitch status              # Show current git identity status
gitswitch list                # List all managed projects
gitswitch list --filter api   # Filter projects by name/path
```

### Project Discovery
```bash
gitswitch scan                # Scan current directory for projects
gitswitch scan ~/dev --depth 2 # Scan with custom depth
gitswitch scan --import       # Automatically import found projects
gitswitch import              # Import from common dev directories
```

### Account Management
```bash
gitswitch accounts            # List all configured accounts
```

### Bulk Operations
```bash
gitswitch bulk-import --preview              # Preview bulk import
gitswitch bulk-import --suggested            # Import from suggested paths
gitswitch bulk-import --detect-accounts      # Auto-detect git accounts
```

### Help & Information
```bash
gitswitch --help             # Show all commands
gitswitch --version          # Show version information
```

## 🏗️ Architecture

GitSwitch consists of three main components:

- **Core**: Git operations and data management
- **CLI**: Command-line interface for automation
- **Desktop**: Electron-based GUI application

## 🔧 Development

### Requirements
- Node.js 18+
- Git

### Local Development
```bash
git clone https://github.com/aman-dhakar-191/GitSwitch.git
cd GitSwitch
npm install
npm run build
```

### Testing
```bash
npm test                     # Run all tests
npm run test-cli            # Test CLI functionality
```

## 📖 Documentation

- [User Guide](https://github.com/aman-dhakar-191/GitSwitch/blob/main/docs/user-guide.md)
- [API Reference](https://github.com/aman-dhakar-191/GitSwitch/blob/main/docs/api.md)
- [Contributing](https://github.com/aman-dhakar-191/GitSwitch/blob/main/CONTRIBUTING.md)

## 🐛 Issues & Support

- [Report Issues](https://github.com/aman-dhakar-191/GitSwitch/issues)
- [Feature Requests](https://github.com/aman-dhakar-191/GitSwitch/issues/new?template=feature_request.md)

## 📄 License

MIT License - see [LICENSE](https://github.com/aman-dhakar-191/GitSwitch/blob/main/LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](https://github.com/aman-dhakar-191/GitSwitch/blob/main/CONTRIBUTING.md) for details.
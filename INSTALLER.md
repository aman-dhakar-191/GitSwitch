# GitSwitch Installer Creation Guide

This guide explains how to create installers for the GitSwitch desktop application.

## Quick Start

From the root directory, run:
```bash
npm run create-installer
```

This will create a complete installer package in `packages/desktop/release/`.

## Output Files

The installer creation process generates several files:

### 1. GitSwitch-Setup.zip
- **Size**: ~580KB
- **Contents**: Complete application package
- **Usage**: Extract and run GitSwitch.bat

### 2. Install-GitSwitch.bat
- **Type**: Windows batch installer
- **Function**: Automatically extracts to C:\GitSwitch
- **Features**: Creates desktop shortcut

### 3. INSTALLATION.md
- **Type**: User instructions
- **Contents**: Installation and usage guide
- **Audience**: End users

### 4. GitSwitch-win-x64/ (Directory)
- **Type**: Portable application folder
- **Contents**: Ready-to-run application
- **Usage**: Can be copied to any location

## Manual Steps

If you prefer to run the steps individually:

```bash
# Build all packages
npm run build

# Build desktop specifically  
cd packages/desktop
npm run build

# Create portable package
npm run package-manual

# Create installer files
npm run create-installer

# Or do both packaging steps
npm run package-full
```

## Distribution

### For End Users
1. Provide `GitSwitch-Setup.zip` or `Install-GitSwitch.bat`
2. Include `INSTALLATION.md` for instructions
3. Ensure users have Node.js 18+ installed

### For System Administrators
1. Use `Install-GitSwitch.bat` for automated deployment
2. Or extract `GitSwitch-Setup.zip` to network locations
3. Create group policies for desktop shortcuts if needed

## Troubleshooting

### electron-builder Issues
If you encounter Windows code signing issues with electron-builder:
1. Our custom scripts bypass these problems
2. Use `npm run package-manual` instead of electron-builder
3. This creates a working portable application

### File Lock Issues
If you get "resource busy" errors:
1. Close any running GitSwitch instances
2. Kill electron processes: `taskkill /f /im electron.exe`
3. Wait a moment and retry

### Node.js Dependencies
The installer includes all dependencies, but requires:
- Node.js 18+ on target machines
- Windows 10 or higher

## Development Notes

### Custom Packaging Scripts
- `create-package.js`: Creates portable directory package
- `create-installer.js`: Creates ZIP and batch installer
- Both scripts bypass electron-builder Windows issues

### Why Custom Scripts?
electron-builder has Windows-specific issues with:
- Code signing permissions
- Symbolic link creation
- Windows Developer Mode requirements

Our custom approach:
- ✅ Works on all Windows systems
- ✅ No special permissions required
- ✅ Creates working installers
- ✅ Includes all dependencies

## Future Improvements

Potential enhancements:
1. **NSIS Installer**: Professional Windows installer
2. **Auto-updater**: Built-in update mechanism  
3. **MSI Package**: Enterprise deployment format
4. **Portable Mode**: USB-stick friendly version
5. **Silent Install**: Command-line installation options

## Testing

Always test installers on clean Windows systems:
1. Extract/install on fresh Windows VM
2. Verify Node.js requirement handling
3. Test desktop shortcuts and file associations
4. Confirm uninstall process works correctly

---

Generated on: ${new Date().toLocaleString()}
GitSwitch Version: 1.0.0
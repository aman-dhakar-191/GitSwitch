# GitSwitch GitHub Workflows

This directory contains GitHub Actions workflows for the GitSwitch project.

## Workflows

### 1. CI Workflow (`ci.yml`)
**Triggered on:** Push to main/master, Pull Requests
**Purpose:** Continuous Integration - builds and tests the project

**Steps:**
- ✅ Checkout code
- ✅ Setup Node.js 18 with npm caching
- ✅ Install dependencies with npm caching
- ✅ Run tests (`npm test`)
- ✅ Build production version (`npm run gulp:prod`)
- ✅ Test CLI functionality
- ✅ Verify build artifacts

### 2. Build and Release Workflow (`build-and-release.yml`)
**Triggered on:** Push to main/master, Tags (v*), Manual dispatch
**Purpose:** Build production version and upload artifacts

**Features:**
- 🚀 **Production Build**: Uses `gulp:prod` for optimized, minified build
- 🧪 **Testing**: Runs test suite after build
- 🗄️ **Node Module Caching**: Efficient caching of npm dependencies
- 📤 **Artifact Upload**: Stores build artifacts for 30 days
- ✅ **Verification**: Confirms all build outputs are present

**Build Outputs:**
- `packages/types/dist/` - TypeScript definitions
- `packages/core/dist/` - Core functionality
- `packages/cli/dist/` - Command-line interface
- `release/` - Complete release package

## Usage

### For Development
Push to `main` or create PR → CI workflow runs automatically

### For Releases
1. Tag your commit: `git tag v1.0.0`
2. Push the tag: `git push origin v1.0.0`
3. Release workflow will:
   - Build production version
   - Run tests
   - Upload build artifacts

### Manual Trigger
Go to Actions tab → "Build and Release GitSwitch" → "Run workflow"

## Cache Strategy

The workflows use efficient caching:
- **npm packages**: Cached by `package-lock.json` hash
- **Node modules**: Cached across builds for faster execution
- **Restoration**: Falls back to partial matches for cache hits

## Build Process

1. **Clean**: Remove old build artifacts
2. **TypeScript Compilation**: Build all packages (types, core, cli)
3. **Minification**: JS minification with terser
4. **Packaging**: Create comprehensive release package
5. **Testing**: Run test suite to verify functionality
6. **Verification**: Confirm all outputs are present

## File Outputs

After successful build:
```
packages/
├── types/dist/       # TypeScript definitions
├── core/dist/        # Core functionality  
├── cli/dist/         # Command-line interface
└── gitswitch/        # Global package

release/
├── types/            # TypeScript definitions
├── core/             # Core functionality  
├── cli/              # Command-line interface
└── gitswitch/        # Global package
```

## Requirements

- Node.js 18+
- All dependencies installed via `npm ci`
- Working gulp build system
- Valid `package-lock.json` for caching
- Test suite for verification
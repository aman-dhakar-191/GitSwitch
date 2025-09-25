# GitSwitch Gulp Tasks

This document describes the Gulp build system implemented for the GitSwitch project. The gulp tasks provide comprehensive build options with and without minification, packaging, and installer creation.

## Available Tasks

### 🏗️ Build Tasks

#### Basic Build Commands
- `gulp build` or `npm run gulp:build` - Build all packages (with minification by default)
- `gulp build:minified` or `npm run gulp:build:minified` - Build with full minification and mangling
- `gulp build:unminified` or `npm run gulp:build:unminified` - Build without minification (development mode)

#### Development & Production
- `gulp dev` or `npm run gulp:dev` - Development build (unminified, with sourcemaps)
- `gulp prod` or `npm run gulp:prod` - Full production build (minified + packaged)

### 🔧 Utility Tasks

- `gulp clean` or `npm run gulp:clean` - Clean all build directories
- `gulp watch` - Watch for file changes during development
- `gulp minify:js` - Additional JavaScript minification for built files

### 📦 Packaging Tasks

- `gulp package` or `npm run gulp:package` - Create complete release package
- `gulp package:desktop` - Package desktop application only
- `gulp setup` or `npm run gulp:setup` - Create installer/setup files (including .exe on Windows)

### ℹ️ Information

- `gulp help` or `npm run gulp:help` - Display help information
- `gulp` (default) - Shows help information

## Key Features

### ✨ Minification Options

The gulp tasks provide fine-grained control over code minification:

**With Minification (`build:minified`):**
- JavaScript code is minified and mangled
- Variable names are shortened
- Console statements are removed
- File sizes are significantly reduced
- Example: GitManager.js: 16.6KB → 5.8KB (65% reduction)

**Without Minification (`build:unminified`):**
- Readable JavaScript output
- Preserved variable names
- Console statements retained
- Larger file sizes but easier debugging
- Sourcemaps included for debugging

### 📱 Desktop App Building

The system handles both Electron main process and renderer process:
- **Main Process**: TypeScript compilation for Node.js environment
- **Renderer Process**: Webpack bundling for browser environment
- **Production**: webpack production mode (563 KiB minified)
- **Development**: webpack development mode (3.5 MiB unminified)

### 📋 Package Structure

The gulp tasks create comprehensive release packages:

```
release/
├── types/           # TypeScript definitions
├── core/            # Core functionality
├── cli/             # Command-line interface
└── gitswitch/       # Global package
```

### 🚀 Setup/Installer Creation

The `gulp setup` task generates:
- **GitSwitch-Setup.zip** - Main application package (~21MB)
- **Install-GitSwitch.bat** - Windows batch installer
- **INSTALLATION.md** - Installation instructions
- **Desktop shortcuts** - Automatically created during installation

## Usage Examples

### Development Workflow
```bash
# Start development
npm run gulp:dev
npm run gulp:watch    # In another terminal

# Test changes
cd packages/desktop && npm start
```

### Production Build
```bash
# Full production build with packaging
npm run gulp:prod

# Or step by step
npm run gulp:build:minified
npm run gulp:package
npm run gulp:setup
```

### Build Comparison
```bash
# Build without minification (for debugging)
npm run gulp:build:unminified

# Build with minification (for production)
npm run gulp:build:minified

# Check the size difference in packages/desktop/dist/renderer.js
```

## Configuration

The gulp configuration can be found at the top of `gulpfile.js`:

```javascript
const config = {
  paths: {
    packages: ['packages/types', 'packages/core', 'packages/cli', 'packages/desktop'],
    desktop: 'packages/desktop',
    output: 'build',
    release: 'release'
  },
  options: {
    mangle: true,      // Enable/disable code mangling
    sourcemaps: true   // Enable/disable sourcemap generation
  }
};
```

## File Structure After Build

### Development Build (`gulp dev`)
```
packages/
├── types/dist/       # Unminified TypeScript output
├── core/dist/        # Unminified core modules
├── cli/dist/         # Unminified CLI
└── desktop/dist/     # Unminified desktop app (3.5MB renderer.js)
```

### Production Build (`gulp prod`)
```
packages/
├── types/dist/       # Minified + original files
├── core/dist/        # Minified + original files (*.min.js)
├── cli/dist/         # Minified + original files
├── desktop/
│   ├── dist/         # Minified desktop app (563KB renderer.js)
│   └── release/      # Packaged application
└── release/          # Complete release package
```

## Integration with Existing Scripts

The gulp tasks integrate seamlessly with existing npm scripts:
- Existing `npm run build` continues to work as before
- New `npm run gulp:*` scripts provide gulp functionality
- Both systems can be used simultaneously
- No breaking changes to existing workflows

## Troubleshooting

### Common Issues

1. **"Cannot find module 'gulp'"**
   ```bash
   npm install  # Reinstall dependencies
   ```

2. **Build fails with permission errors**
   ```bash
   npm run gulp:clean  # Clean and retry
   ```

3. **Minification breaks the application**
   ```bash
   npm run gulp:build:unminified  # Use development build
   ```

### Debug Mode

To debug gulp tasks, run with verbose output:
```bash
npx gulp build:minified --verbose
```

## Platform Support

- **Windows**: Full support including .exe installer creation
- **macOS**: Build and package support (installer creation limited)
- **Linux**: Build and package support (installer creation limited)

The gulp tasks enhance the existing build system while maintaining backward compatibility with all existing npm scripts and workflows.
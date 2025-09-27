const gulp = require('gulp');
const terser = require('gulp-terser');
const ts = require('gulp-typescript');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const gulpIf = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const config = {
  paths: {
    packages: ['packages/types', 'packages/core', 'packages/cli'],
    output: 'build',
    release: 'release'
  },
  options: {
    mangle: true,
    sourcemaps: true
  }
};

// Helper function to execute npm commands
function execNpm(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Executing: ${command} in ${cwd}`);
      execSync(command, { 
        stdio: 'inherit', 
        cwd: cwd 
      });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Clean task
gulp.task('clean', async function() {
  console.log('🧹 Cleaning build directories...');
  
  const dirsToClean = [
    'build',
    'release',
    'packages/*/dist'
  ];
  
  try {
    const { deleteAsync } = await import('del');
    await deleteAsync(dirsToClean, { force: true });
    console.log('✅ Clean completed');
  } catch (error) {
    console.error('❌ Clean failed:', error);
    throw error;
  }
});

// Build TypeScript packages
gulp.task('build:packages', async function() {
  console.log('📦 Building TypeScript packages...');
  
  try {
    // Build types first (dependency for others)
    await execNpm('npm run build', path.join(__dirname, 'packages/types'));
    
    // Build core (depends on types)
    await execNpm('npm run build', path.join(__dirname, 'packages/core'));
    
    // Build CLI (depends on core and types)
    await execNpm('npm run build', path.join(__dirname, 'packages/cli'));
    
    console.log('✅ All packages built successfully');
  } catch (error) {
    console.error('❌ Package build failed:', error);
    throw error;
  }
});

// Build with minification/mangling
gulp.task('build:minified', gulp.series('clean', function(done) {
  config.options.mangle = true;
  console.log('🔧 Building with minification enabled...');
  done();
}, 'build:packages'));

// Build without minification/mangling
gulp.task('build:unminified', gulp.series('clean', function(done) {
  config.options.mangle = false;
  console.log('🔧 Building without minification...');
  done();
}, 'build:packages'));

// Default build task (with minification)
gulp.task('build', gulp.series('build:minified'));

// Post-process built files for additional minification if needed
gulp.task('minify:js', function() {
  if (!config.options.mangle) {
    console.log('⏭️ Skipping JS minification (disabled)');
    return Promise.resolve();
  }
  
  console.log('🗜️ Minifying JavaScript files...');
  
  return gulp.src(['packages/*/dist/**/*.js', '!packages/*/dist/**/*.min.js'], { base: '.' })
    .pipe(gulpIf(config.options.sourcemaps, sourcemaps.init()))
    .pipe(terser({
      mangle: true,
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      format: {
        comments: false
      }
    }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpIf(config.options.sourcemaps, sourcemaps.write('.')))
    .pipe(gulp.dest('.'));
});

// Create comprehensive release package
gulp.task('package', gulp.series('build', function(done) {
  console.log('📦 Creating comprehensive release package...');
  
  // Ensure release directory exists
  const releaseDir = path.join(__dirname, config.paths.release);
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }
  
  // Copy built packages
  const packages = ['types', 'core', 'cli'];
  packages.forEach(pkg => {
    const srcDir = path.join(__dirname, 'packages', pkg, 'dist');
    const destDir = path.join(releaseDir, pkg);
    
    if (fs.existsSync(srcDir)) {
      console.log(`📋 Copying ${pkg} package...`);
      copyRecursively(srcDir, destDir);
    }
  });
  
  // Copy gitswitch global package
  const gitswitchSrc = path.join(__dirname, 'packages/gitswitch');
  const gitswitchDest = path.join(releaseDir, 'gitswitch');
  if (fs.existsSync(gitswitchSrc)) {
    console.log('📋 Copying gitswitch global package...');
    copyRecursively(gitswitchSrc, gitswitchDest);
  }
  
  console.log('✅ Release package created successfully');
  done();
}));

// Development build (unminified, with sourcemaps)
gulp.task('dev', gulp.series('build:unminified', function(done) {
  console.log('🚀 Development build completed');
  done();
}));

// Production build with full optimization
gulp.task('prod', gulp.series('build:minified', 'minify:js', 'package', function(done) {
  console.log('🎉 Production build completed');
  done();
}));

// Watch for changes during development
gulp.task('watch', function() {
  console.log('👀 Watching for changes...');
  
  gulp.watch('packages/*/src/**/*.ts', gulp.series('build:packages'));
});

// Helper function to copy directories recursively
function copyRecursively(src, dest) {
  if (!fs.existsSync(src)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursively(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Display help information
gulp.task('help', function(done) {
  console.log('\n🚀 GitSwitch Gulp Tasks');
  console.log('========================\n');
  
  console.log('📦 Build Tasks:');
  console.log('  gulp build            - Build all packages (minified)');
  console.log('  gulp build:minified   - Build with minification/mangling');
  console.log('  gulp build:unminified - Build without minification');
  console.log('  gulp dev              - Development build (unminified + sourcemaps)');
  console.log('  gulp prod             - Production build (fully optimized)');
  
  console.log('\n🔧 Utility Tasks:');
  console.log('  gulp clean            - Clean all build directories');
  console.log('  gulp watch            - Watch for changes (development)');
  console.log('  gulp minify:js        - Minify JavaScript files');
  
  console.log('\n📱 Packaging Tasks:');
  console.log('  gulp package          - Create release package');
  console.log('  gulp package:desktop  - Package desktop application');
  console.log('  gulp setup            - Create installer/setup files');
  
  console.log('\n💡 Examples:');
  console.log('  gulp build:unminified  # Build without code mangling');
  console.log('  gulp build:minified    # Build with full optimization');
  console.log('  gulp setup             # Create Windows installer');
  console.log('  gulp prod              # Full production build + package');
  
  console.log('\n📋 Options:');
  console.log('  Minification: ' + (config.options.mangle ? 'enabled' : 'disabled'));
  console.log('  Sourcemaps: ' + (config.options.sourcemaps ? 'enabled' : 'disabled'));
  console.log('');
  
  done();
});

// Default task
gulp.task('default', gulp.series('help'));

// Export configuration for external access
module.exports = { config };
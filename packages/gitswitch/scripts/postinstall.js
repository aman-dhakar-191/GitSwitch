#!/usr/bin/env node

/**
 * GitSwitch Post-Install Setup Script
 * Sets up the global CLI integration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up GitSwitch...');

try {
  // Ensure the lib directory exists
  const libDir = path.join(__dirname, '..', 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  // Copy CLI files to lib directory
  const cliSource = path.join(__dirname, '..', '..', 'cli', 'dist');
  const cliDest = path.join(libDir);
  
  if (fs.existsSync(cliSource)) {
    copyRecursively(cliSource, cliDest);
    console.log('✅ CLI files copied successfully');
  } else {
    console.log('⚠️  CLI not built yet. Run: npm run build');
  }

  // Copy core files
  const coreSource = path.join(__dirname, '..', '..', 'core', 'dist');
  const coreDest = path.join(libDir, 'core');
  
  if (fs.existsSync(coreSource)) {
    copyRecursively(coreSource, coreDest);
    console.log('✅ Core files copied successfully');
  }

  // Copy types files
  const typesSource = path.join(__dirname, '..', '..', 'types', 'dist');
  const typesDest = path.join(libDir, 'types');
  
  if (fs.existsSync(typesSource)) {
    copyRecursively(typesSource, typesDest);
    console.log('✅ Types files copied successfully');
  }

  console.log('🎉 GitSwitch setup complete!');
  console.log('');
  console.log('📋 Usage:');
  console.log('  gitswitch .              # Open GitSwitch for current project');
  console.log('  gitswitch status         # Show current git identity');
  console.log('  gitswitch accounts       # List configured accounts');
  console.log('  gitswitch --help         # Show all commands');
  console.log('');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}

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
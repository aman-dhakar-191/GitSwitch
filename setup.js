#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up GitSwitch...\n');

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js 18+ is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Check if git is installed
try {
  execSync('git --version', { stdio: 'pipe' });
  console.log('✅ Git is installed');
} catch (error) {
  console.error('❌ Git is not installed or not in PATH');
  process.exit(1);
}

// Check if we're in a git repository
try {
  execSync('git rev-parse --git-dir', { stdio: 'pipe' });
  console.log('✅ Running in a git repository');
} catch (error) {
  console.log('⚠️  Not in a git repository (this is okay for setup)');
}

console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

console.log('\n🔨 Building packages...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ All packages built successfully');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

console.log('\n🧪 Running tests...');
try {
  execSync('npm run test-cli', { stdio: 'inherit' });
  console.log('✅ CLI tests passed');
} catch (error) {
  console.error('❌ CLI tests failed');
  process.exit(1);
}

console.log('\n🎉 GitSwitch setup complete!');
console.log('\n📋 Next steps:');
console.log('  1. Navigate to any git repository');
console.log('  2. Run: node packages/cli/dist/cli.js status');
console.log('  3. Run: node packages/cli/dist/cli.js . (to launch desktop app)');
console.log('\n📚 For more information, see README.md');
console.log('\n🚀 Happy git switching! 🔄');
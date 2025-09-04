#!/usr/bin/env node

// Simple test script to verify CLI functionality
const { spawn } = require('child_process');
const path = require('path');

const cliPath = path.join(__dirname, 'packages', 'cli', 'dist', 'cli.js');

console.log('🧪 Testing GitSwitch CLI...');
console.log('📍 CLI Path:', cliPath);

// Test the status command
console.log('\n📊 Testing `gitswitch status` command...');

const statusProcess = spawn('node', [cliPath, 'status'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

statusProcess.on('close', (code) => {
  console.log(`\n✅ Status command finished with code: ${code}`);
  
  if (code === 0) {
    console.log('\n🎉 GitSwitch CLI is working correctly!');
    console.log('\n📋 Available commands:');
    console.log('  • gitswitch .      - Open GitSwitch for current project');
    console.log('  • gitswitch status - Show current git identity');
    console.log('  • gitswitch --help - Show help information');
  } else {
    console.log('\n❌ CLI test failed');
  }
});
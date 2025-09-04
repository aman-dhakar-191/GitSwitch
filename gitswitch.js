#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// Path to the built CLI tool
const cliPath = path.join(__dirname, 'packages', 'cli', 'dist', 'cli.js');

// Forward all arguments to the CLI tool
const args = process.argv.slice(2);
const child = spawn('node', [cliPath, ...args], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('close', (code) => {
  process.exit(code);
});
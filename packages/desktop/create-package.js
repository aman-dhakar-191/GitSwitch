const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 GitSwitch Desktop Packaging Script');
console.log('=====================================\n');

async function createPackage() {
  // Clean and prepare
  console.log('📦 Step 1: Building the application...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }

  // Create simple directory package
  console.log('📁 Step 2: Creating directory package...');
  const releaseDir = path.join(__dirname, 'release');
  const packageDir = path.join(releaseDir, 'GitSwitch-win-x64');

  // Ensure release directory exists
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }

  // Copy built files
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(packageDir)) {
    console.log('🧹 Cleaning existing package directory...');
    try {
      fs.rmSync(packageDir, { recursive: true, force: true });
    } catch (error) {
      console.log('⚠️  Could not remove directory (may be in use). Continuing...');
      console.log('   If errors occur, please close any running GitSwitch instances.');
    }
    // Wait a moment for file handles to release
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  fs.mkdirSync(packageDir, { recursive: true });

  // Copy main application files
  console.log('📋 Copying application files...');
  const filesToCopy = [
    { src: distDir, dest: path.join(packageDir, 'dist') },
    { src: path.join(__dirname, 'node_modules'), dest: path.join(packageDir, 'node_modules') },
    { src: path.join(__dirname, 'package.json'), dest: path.join(packageDir, 'package.json') }
  ];

  filesToCopy.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        copyDir(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  });

  // Create startup script
  console.log('📝 Creating startup script...');
  const startupScript = `@echo off
cd /d "%~dp0"
npx electron dist/main.js
pause
`;

  fs.writeFileSync(path.join(packageDir, 'GitSwitch.bat'), startupScript);

  // Create README
  console.log('📖 Creating package README...');
  const packageReadme = `# GitSwitch Desktop Application

## How to Run
1. Double-click 'GitSwitch.bat' to start the application
2. Or open command prompt in this directory and run: npx electron dist/main.js

## Requirements
- Node.js 18 or higher
- Windows 10 or higher

## Package Contents
- dist/           - Application files
- node_modules/   - Dependencies
- GitSwitch.bat   - Startup script
- package.json    - Package information

Generated on: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(packageDir, 'README.txt'), packageReadme);

  console.log('✅ Package created successfully!');
  console.log(`📂 Location: ${packageDir}`);
  console.log('\n🎉 You can now distribute the GitSwitch-win-x64 folder');
  console.log('💡 Recipients can run GitSwitch.bat to start the application');
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run the packaging
createPackage().catch(console.error);
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const archiver = require('archiver');

console.log('🚀 GitSwitch Installer Creator');
console.log('==============================\n');

async function createInstaller() {
  const releaseDir = path.join(__dirname, 'release');
  const packageDir = path.join(releaseDir, 'GitSwitch-win-x64');
  
  if (!fs.existsSync(packageDir)) {
    console.log('❌ Package directory not found. Run npm run package-manual first.');
    process.exit(1);
  }

  console.log('📦 Creating ZIP installer...');
  
  // Create ZIP archive
  const zipPath = path.join(releaseDir, 'GitSwitch-Setup.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ ZIP installer created: ${zipPath}`);
      console.log(`📊 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      
      // Create installation instructions
      createInstallationInstructions(releaseDir);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(packageDir, 'GitSwitch');
    archive.finalize();
  });
}

function createInstallationInstructions(releaseDir) {
  console.log('📖 Creating installation instructions...');
  
  const instructions = `# GitSwitch Installation Instructions

## Quick Install (ZIP)
1. Download GitSwitch-Setup.zip
2. Extract to your preferred location (e.g., C:\\Program Files\\GitSwitch)
3. Run GitSwitch.bat from the extracted folder
4. Optional: Create a desktop shortcut to GitSwitch.bat

## System Requirements
- Windows 10 or higher
- Node.js 18+ (if not already installed)

## First Run
When you first run GitSwitch:
1. The application will open in your default browser or as a desktop app
2. You can start managing your Git identities immediately
3. Set up your Git accounts and projects

## Uninstall
To uninstall GitSwitch:
1. Simply delete the GitSwitch folder
2. Remove any shortcuts you created

## Troubleshooting
- If you get Node.js errors, install Node.js from nodejs.org
- If the app doesn't start, try running as administrator
- For issues, check the GitHub repository: https://github.com/aman-dhakar-191/GitSwitch

## CLI Usage
The package also includes the GitSwitch CLI:
- Open command prompt in the GitSwitch folder
- Run: npx gitswitch --help

Generated on: ${new Date().toLocaleString()}
Version: 1.0.0
`;

  fs.writeFileSync(path.join(releaseDir, 'INSTALLATION.md'), instructions);
  
  // Create a simple batch installer
  const batchInstaller = `@echo off
echo GitSwitch Installer
echo ===================
echo.
echo This will extract GitSwitch to C:\\GitSwitch
echo.
set /p confirm="Continue? (y/N): "
if /i "%confirm%" neq "y" goto :cancel

mkdir "C:\\GitSwitch" 2>nul
echo Extracting files...
powershell -command "Expand-Archive -Path '%~dp0GitSwitch-Setup.zip' -DestinationPath 'C:\\GitSwitch' -Force"

echo.
echo Creating desktop shortcut...
powershell -command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\GitSwitch.lnk'); $Shortcut.TargetPath = 'C:\\GitSwitch\\GitSwitch\\GitSwitch.bat'; $Shortcut.Save()"

echo.
echo ✅ Installation complete!
echo GitSwitch has been installed to C:\\GitSwitch
echo A desktop shortcut has been created.
echo.
pause
goto :end

:cancel
echo Installation cancelled.
pause

:end
`;

  fs.writeFileSync(path.join(releaseDir, 'Install-GitSwitch.bat'), batchInstaller);
  
  console.log('✅ Installation files created:');
  console.log('   - GitSwitch-Setup.zip (Main package)');
  console.log('   - Install-GitSwitch.bat (Windows installer)');
  console.log('   - INSTALLATION.md (Instructions)');
}

// Check if archiver is available
try {
  require.resolve('archiver');
} catch (e) {
  console.log('📦 Installing archiver...');
  execSync('npm install archiver --save-dev', { stdio: 'inherit' });
}

createInstaller().catch(console.error);
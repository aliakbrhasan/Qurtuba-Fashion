const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building Electron app (Simple Mode)...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  if (fs.existsSync('dist-electron')) {
    fs.rmSync('dist-electron', { recursive: true, force: true });
  }

  // Build the React app
  console.log('📦 Building React app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Compile Electron TypeScript files
  console.log('⚡ Compiling Electron TypeScript...');
  execSync('npx tsc -p electron/tsconfig.json', { stdio: 'inherit' });

  // Build Electron app without code signing
  console.log('🚀 Building Electron app...');
  execSync('npx electron-builder --win --dir --config.win.signAndEditExecutable=false --config.win.signDlls=false', { 
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true' }
  });

  console.log('✅ Electron build complete!');
  console.log('📁 Output directory: dist/win-unpacked');
  console.log('🚀 Run the app: dist/win-unpacked/أزياء قرطبة.exe');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

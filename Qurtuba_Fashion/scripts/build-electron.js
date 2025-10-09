const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Building Electron app...');

try {
  // Build the React app
  console.log('📦 Building React app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Compile Electron TypeScript files
  console.log('⚡ Compiling Electron TypeScript...');
  execSync('npx tsc -p electron/tsconfig.json', { stdio: 'inherit' });

  console.log('✅ Electron build complete!');
  console.log('🚀 Run "npm run electron:dev" to start development');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}






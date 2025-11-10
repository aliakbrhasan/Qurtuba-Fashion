/**
 * Post-build script to obfuscate JavaScript files
 * Run this after vite build when VITE_SECURE_BUILD=true
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const buildDir = path.join(__dirname, '../build');
const assetsDir = path.join(buildDir, 'assets');

console.log('🔒 Starting code obfuscation...');

// Obfuscation options
const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false, // Set to false to avoid breaking the app
  debugProtectionInterval: 0,
  disableConsoleOutput: false, // Keep console for debugging
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

function obfuscateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(content, obfuscationOptions);
    const obfuscatedCode = obfuscationResult.getObfuscatedCode();
    
    fs.writeFileSync(filePath, obfuscatedCode, 'utf8');
    console.log(`✅ Obfuscated: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error obfuscating ${filePath}:`, error.message);
    return false;
  }
}

function obfuscateDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  Directory does not exist: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  let obfuscatedCount = 0;

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      obfuscateDirectory(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.min.js')) {
      if (obfuscateFile(filePath)) {
        obfuscatedCount++;
      }
    }
  });

  return obfuscatedCount;
}

// Main execution
// This script is specifically for secure builds and will always obfuscate when called
console.log('🔐 Starting secure build obfuscation...');

if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory does not exist. Please run "npm run build" first.');
  process.exit(1);
}

console.log(`📁 Processing files in: ${buildDir}`);

// Obfuscate files in assets directory
const assetsCount = obfuscateDirectory(assetsDir);

// Obfuscate any JS files in root build directory
const rootCount = obfuscateDirectory(buildDir);

const totalCount = (assetsCount || 0) + (rootCount || 0);

console.log(`\n✅ Obfuscation complete! Processed ${totalCount} files.`);
console.log('🔒 Your code is now protected.');


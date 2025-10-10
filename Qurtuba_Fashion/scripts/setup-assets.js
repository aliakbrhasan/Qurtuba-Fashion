/*
  Copies required runtime assets into the built web folder after Vite build:
  - Copies the application icon from assets/icon.ico to build/icon.ico
  - Copies any fonts from common source folders into build/fonts
  - Copies NSIS scripts from installer/nsis to build/nsis (Vite clears build/)
*/

const { existsSync, mkdirSync, readdirSync, copyFileSync, statSync, readFileSync } = require('fs');
const { join, resolve } = require('path');

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function isValidIco(filePath) {
  try {
    const buf = readFileSync(filePath);
    // ICO header: reserved=0 (2 bytes), type=1 (2 bytes), count>=1 (2 bytes)
    if (buf.length < 6) return false;
    const reserved = buf.readUInt16LE(0);
    const type = buf.readUInt16LE(2);
    const count = buf.readUInt16LE(4);
    return reserved === 0 && type === 1 && count >= 1;
  } catch {
    return false;
  }
}

function copyIcon(projectRoot) {
  const srcIcon = join(projectRoot, 'assets', 'icon.ico');
  const destIcon = join(projectRoot, 'build', 'icon.ico');
  if (existsSync(srcIcon) && isValidIco(srcIcon)) {
    ensureDir(join(projectRoot, 'build'));
    copyFileSync(srcIcon, destIcon);
    console.log(`[assets] Copied icon.ico -> ${destIcon}`);
  } else {
    // Fallback: try Vite-emitted hashed ico (build/assets/*.ico)
    const assetsDir = join(projectRoot, 'build', 'assets');
    if (existsSync(assetsDir)) {
      const candidate = readdirSync(assetsDir).find(n => n.toLowerCase().endsWith('.ico'));
      if (candidate) {
        const candPath = join(assetsDir, candidate);
        if (isValidIco(candPath)) {
          ensureDir(join(projectRoot, 'build'));
          copyFileSync(candPath, destIcon);
          console.log(`[assets] Fallback copied ${candidate} -> ${destIcon}`);
          return;
        }
      }
    }
    console.warn('[assets] Valid icon.ico not found. Please place a proper ICO at assets/icon.ico (256x256).');
  }
}

function copyFonts(projectRoot) {
  const candidates = [
    join(projectRoot, 'assets', 'fonts'),
    join(projectRoot, 'resources', 'fonts'),
    join(projectRoot, 'public', 'fonts'),
  ];
  const targetDir = join(projectRoot, 'build', 'fonts');
  ensureDir(targetDir);

  let copiedAny = false;
  for (const dir of candidates) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const src = join(dir, name);
      if (statSync(src).isDirectory()) continue;
      if (!name.toLowerCase().endsWith('.ttf') && !name.toLowerCase().endsWith('.otf')) continue;
      const dest = join(targetDir, name);
      copyFileSync(src, dest);
      copiedAny = true;
      console.log(`[assets] Copied font ${name} -> ${dest}`);
    }
  }

  if (!copiedAny) {
    console.warn('[assets] No font files found in assets/fonts, resources/fonts, or public/fonts.');
  }
}

function copyNsis(projectRoot) {
  const srcNsis = join(projectRoot, 'installer', 'nsis');
  const destNsis = join(projectRoot, 'build', 'nsis');
  if (!existsSync(srcNsis)) {
    console.warn('[assets] installer/nsis not found. Skipping NSIS copy.');
    return;
  }
  ensureDir(destNsis);
  for (const name of readdirSync(srcNsis)) {
    const src = join(srcNsis, name);
    if (statSync(src).isDirectory()) continue;
    const dest = join(destNsis, name);
    copyFileSync(src, dest);
    console.log(`[assets] Copied NSIS ${name} -> ${dest}`);
  }
}

function main() {
  const projectRoot = resolve(__dirname, '..');
  copyIcon(projectRoot);
  copyFonts(projectRoot);
  copyNsis(projectRoot);
}

main();



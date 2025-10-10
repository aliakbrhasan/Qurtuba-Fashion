/*
  Copies required runtime assets into the built web folder after Vite build:
  - Copies the application icon from assets/icon.ico to build/icon.ico
  - Copies any fonts from common source folders into build/fonts
*/

const { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } = require('fs');
const { join, resolve } = require('path');

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function copyIcon(projectRoot) {
  const srcIcon = join(projectRoot, 'assets', 'icon.ico');
  const destIcon = join(projectRoot, 'build', 'icon.ico');
  if (existsSync(srcIcon)) {
    ensureDir(join(projectRoot, 'build'));
    copyFileSync(srcIcon, destIcon);
    console.log(`[assets] Copied icon.ico -> ${destIcon}`);
  } else {
    console.warn('[assets] assets/icon.ico not found. Skipping icon copy.');
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

function main() {
  const projectRoot = resolve(__dirname, '..');
  copyIcon(projectRoot);
  copyFonts(projectRoot);
}

main();



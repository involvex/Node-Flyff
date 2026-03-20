#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function run(cmd, args, opts) {
  const res = spawnSync(cmd, args, Object.assign({ stdio: 'pipe' }, opts));
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`Command failed: ${cmd} ${args.join(' ')}\n${res.stderr.toString()}`);
  return res.stdout.toString();
}

function usage() {
  console.log('Usage: node tools/generate-sprite-sheet.js <packName>');
  process.exit(1);
}

const argv = process.argv.slice(2);
if (argv.length < 1) usage();
const packName = argv[0];
const assetsRoot = path.join(__dirname, '..', 'public', 'assets');
const packDir = path.join(assetsRoot, packName);
if (!fs.existsSync(packDir) || !fs.statSync(packDir).isDirectory()) {
  console.error('Pack directory not found:', packDir);
  process.exit(2);
}

const manifestPath = path.join(assetsRoot, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('manifest.json not found under public/assets');
  process.exit(3);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.assets = manifest.assets || {};
const avatar = manifest.assets.avatar || {};

const outSheetsDir = path.join(packDir, 'sheets');
fs.mkdirSync(outSheetsDir, { recursive: true });

function localPathFromUrl(url) {
  if (!url.startsWith('/assets/')) return null;
  return path.join(__dirname, '..', 'public', url.replace('/assets/', 'assets/'));
}

function identifySize(file) {
  // use ImageMagick identify
  const res = spawnSync('magick', ['identify', '-format', '%w %h', file]);
  if (res.error || res.status !== 0) {
    throw new Error(`ImageMagick 'identify' failed for ${file}: ${res.stderr.toString()}`);
  }
  const out = res.stdout.toString().trim();
  const [w, h] = out.split(/\s+/).map(Number);
  return { w, h };
}

for (const part of Object.keys(avatar)) {
  const paths = avatar[part];
  if (!Array.isArray(paths) || paths.length === 0) continue;
  const localFiles = paths.map(p => localPathFromUrl(p)).filter(Boolean).filter(fs.existsSync);
  if (localFiles.length === 0) continue;

  // ensure they are images, and determine frame size using first image
  const first = localFiles[0];
  let size;
  try {
    size = identifySize(first);
  } catch (e) {
    console.error('identify failed:', e.message);
    process.exit(4);
  }

  // create horizontal strip: magick img1 img2 img3 +append out.png
  const outFile = path.join(outSheetsDir, `${part}.png`);
  const args = [].concat(localFiles).concat(['+append', outFile]);
  try {
    run('magick', args);
  } catch (e) {
    console.error('magick command failed:', e.message);
    process.exit(5);
  }

  // update manifest with sheet info
  manifest.assets.avatar_sheets = manifest.assets.avatar_sheets || {};
  manifest.assets.avatar_sheets[part] = {
    sheet: `/assets/${packName}/sheets/${part}.png`,
    frameWidth: size.w,
    frameHeight: size.h,
    count: localFiles.length
  };
  console.log(`Generated sheet for ${part}: ${outFile} (${localFiles.length} frames @ ${size.w}x${size.h})`);
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Updated manifest:', manifestPath);

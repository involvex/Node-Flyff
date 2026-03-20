#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
let AdmZip;
try {
  AdmZip = require('adm-zip');
} catch (e) {
  console.error('Missing dependency adm-zip. Run `npm install adm-zip` in web-client/');
  process.exit(2);
}

function usage() {
  console.log('Usage: node tools/import-assets.js <path-to-zip> [packName]');
}

const argv = process.argv.slice(2);
if (argv.length < 1) {
  usage();
  process.exit(1);
}

const zipPath = path.resolve(argv[0]);
const packName = argv[1] || path.basename(zipPath, path.extname(zipPath)).replace(/[^a-z0-9_-]/ig, '_');
const outDir = path.join(__dirname, '..', 'public', 'assets', packName);
if (!fs.existsSync(zipPath)) {
  console.error('Zip file not found:', zipPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const zip = new AdmZip(zipPath);
const entries = zip.getEntries();
entries.forEach(entry => {
  if (entry.isDirectory) return;
  const entryName = path.basename(entry.entryName);
  const outFile = path.join(outDir, entryName);
  fs.writeFileSync(outFile, entry.getData());
});

// load or create manifest
const manifestPath = path.join(__dirname, '..', 'public', 'assets', 'manifest.json');
let manifest = { version: '1', generated: true, assets: {} };
if (fs.existsSync(manifestPath)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch (e) { /* ignore */ }
}

manifest.assets = manifest.assets || {};
manifest.assets.avatar = manifest.assets.avatar || {};

function detectPart(filename) {
  const n = filename.toLowerCase();
  if (/hair|bang|toupe/i.test(n)) return 'hair';
  if (/head|face|eyes|mouth/i.test(n)) return 'head';
  if (/body|torso|chest|body_/i.test(n)) return 'body';
  if (/idle|stand/i.test(n)) return 'idle';
  if (/walk|run/i.test(n)) return 'walk';
  if (/attack|atk/i.test(n)) return 'attack';
  return 'misc';
}

const files = fs.readdirSync(outDir).filter(f => f.match(/\.(png|jpg|jpeg|svg|webp)$/i));
for (const f of files) {
  const part = detectPart(f);
  manifest.assets.avatar[part] = manifest.assets.avatar[part] || [];
  const rel = `/assets/${packName}/${f}`;
  if (!manifest.assets.avatar[part].includes(rel)) manifest.assets.avatar[part].push(rel);
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Imported', files.length, 'files to', outDir);
console.log('Updated manifest at', manifestPath);

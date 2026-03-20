# Asset tools

This directory contains helper scripts to import asset packs and generate sprite sheets.

Prerequisites
- Node.js (for running the scripts)
- ImageMagick (`magick`) on PATH for sprite-sheet generation

Scripts
- `node import-assets.js <zip-or-dir>` — extracts an asset pack into `public/assets/<packName>` and updates `public/assets/manifest.json`.
- `node generate-sprite-sheet.js <packName>` — generates horizontal sprite sheets for parts listed in the manifest under the given pack and writes sheets into `public/assets/<packName>/sheets/`. It will update `public/assets/manifest.json` with `avatar_sheets` entries.

Examples

PowerShell (Windows):
```
# import a zip into public/assets/mypack
node tools/import-assets.js path\to\mypack.zip

# generate sheets for that pack
node tools/generate-sprite-sheet.js mypack
```

Notes
- The sprite-sheet generator uses ImageMagick via the `magick` command. Install ImageMagick and ensure `magick` is available on PATH.
- The scripts avoid modifying assets not under `public/assets/<pack>`.

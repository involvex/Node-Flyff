import fs from "fs";
import path from "path";
import { Logger } from "../helpers/logger";
import { AssetCache } from "./assetCache";

export interface CwfEntry {
  name: string;
  offset: number;
  size: number;
  compressedSize: number;
  checksum: number;
}

export class CwfExtractor {
  private logger: Logger;
  private assetCache: AssetCache;

  constructor (assetCache: AssetCache) {
    this.logger = new Logger("CwfExtractor");
    this.assetCache = assetCache;
  }

  async extractCwfFile (
    cwfPath: string,
    _targetDir?: string
  ): Promise<Map<string, Buffer>> {
    try {
      this.logger.info(`Extracting CWF file: ${cwfPath}`);

      if (!fs.existsSync(cwfPath)) {
        throw new Error(`CWF file not found: ${cwfPath}`);
      }

      const buffer = fs.readFileSync(cwfPath);
      const entries = this.parseCwfHeader(buffer);
      const extractedFiles = new Map<string, Buffer>();

      for (const entry of entries) {
        const fileData = this.extractEntry(buffer, entry);
        extractedFiles.set(entry.name, fileData);

        // Cache the extracted file
        const assetType = this.determineAssetType(entry.name);
        const assetId = this.getAssetId(entry.name);
        await this.assetCache.cacheAsset(assetType, assetId, cwfPath, fileData);
      }

      this.logger.success(`Extracted ${extractedFiles.size} files from CWF`);
      return extractedFiles;
    } catch (_error) {
      this.logger.error(`Failed to extract CWF file ${cwfPath}:`, _error);
      throw _error;
    }
  }

  private parseCwfHeader (buffer: Buffer): CwfEntry[] {
    const entries: CwfEntry[] = [];

    try {
      // CWF file format (simplified - actual format may vary)
      // Header: 4 bytes magic, 4 bytes version, 4 bytes entry count
      const magic = buffer.readUInt32LE(0);
      const version = buffer.readUInt32LE(4);
      const entryCount = buffer.readUInt32LE(8);

      this.logger.info(
        `CWF Header - Magic: 0x${magic.toString(16)}, Version: ${version}, Entries: ${entryCount}`
      );

      // Parse entries (starting at offset 12)
      let offset = 12;
      for (let i = 0; i < entryCount; i++) {
        const entry: CwfEntry = {
          name: this.readString(buffer, offset),
          offset: buffer.readUInt32LE(offset + 256),
          size: buffer.readUInt32LE(offset + 260),
          compressedSize: buffer.readUInt32LE(offset + 264),
          checksum: buffer.readUInt32LE(offset + 268)
        };

        entries.push(entry);
        offset += 272; // Entry size
      }

      return entries;
    } catch (_error) {
      this.logger.warn(
        "Failed to parse CWF header, trying alternative format:",
        _error
      );
      return this.parseAlternativeCwfHeader(buffer);
    }
  }

  private parseAlternativeCwfHeader (buffer: Buffer): CwfEntry[] {
    const entries: CwfEntry[] = [];

    try {
      // Alternative parsing for different CWF versions
      // This is a simplified version - actual implementation would need reverse engineering
      const offset = 12;
      let currentOffset = offset;

      while (currentOffset < buffer.length - 100) {
        // Try to find file entries by looking for patterns
        const nameLength = buffer.readUInt8(currentOffset);
        if (nameLength > 0 && nameLength < 100) {
          const name = buffer.toString(
            "utf8",
            currentOffset + 1,
            currentOffset + 1 + nameLength
          );

          if (this.isValidFileName(name)) {
            const entry: CwfEntry = {
              name,
              offset: buffer.readUInt32LE(currentOffset + 1 + nameLength),
              size: buffer.readUInt32LE(currentOffset + 5 + nameLength),
              compressedSize: buffer.readUInt32LE(
                currentOffset + 9 + nameLength
              ),
              checksum: 0
            };

            entries.push(entry);
            currentOffset += 13 + nameLength;
            continue;
          }
        }
        currentOffset++;
      }

      this.logger.info(
        `Found ${entries.length} entries using alternative parsing`
      );
      return entries;
    } catch (_error) {
      this.logger.error("Alternative CWF parsing failed:", _error);
      return [];
    }
  }

  private extractEntry (buffer: Buffer, entry: CwfEntry): Buffer {
    try {
      const startOffset = entry.offset;
      const endOffset = startOffset + entry.size;

      if (endOffset > buffer.length) {
        throw new Error(`Entry ${entry.name} exceeds buffer size`);
      }

      const data = buffer.subarray(startOffset, endOffset);

      // Check if data is compressed (simple check)
      if (this.isCompressed(data)) {
        return this.decompressData(data);
      }

      return data;
    } catch (_error) {
      this.logger.error(`Failed to extract entry ${entry.name}:`, _error);
      throw _error;
    }
  }

  private isCompressed (_data: Buffer): boolean {
    // Simple check for compression (would need actual compression detection)
    // For now, assume data is not compressed
    return false;
  }

  private decompressData (data: Buffer): Buffer {
    // Decompression would be implemented here
    // For now, return data as-is
    this.logger.warn("Decompression not implemented, returning raw data");
    return data;
  }

  private readString (buffer: Buffer, offset: number): string {
    // Read null-terminated string
    let end = offset;
    while (end < buffer.length && buffer[end] !== 0) {
      end++;
    }
    return buffer.toString("utf8", offset, end);
  }

  private isValidFileName (name: string): boolean {
    // Check if the string looks like a valid filename
    const validExtensions = [
      ".o3d",
      ".dds",
      ".wav",
      ".mp3",
      ".txt",
      ".xml",
      ".lua"
    ];
    return (
      validExtensions.some((ext) => name.toLowerCase().endsWith(ext)) ||
      (name.length > 3 && name.length < 100)
    );
  }

  private determineAssetType (fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();

    switch (ext) {
      case ".o3d":
      case ".msh":
      case ".x":
        return "models";
      case ".dds":
      case ".tga":
      case ".png":
      case ".jpg":
        return "textures";
      case ".wav":
      case ".mp3":
      case ".ogg":
        return "sounds";
      case ".xml":
      case ".txt":
      case ".lua":
        return "maps";
      default:
        return "models";
    }
  }

  private getAssetId (fileName: string): string {
    // Generate a consistent asset ID from filename
    return fileName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  }

  async extractAllCwfFiles (
    clientPath: string
  ): Promise<Map<string, Map<string, Buffer>>> {
    this.logger.info("Extracting all CWF files from client...");

    const allExtracted = new Map<string, Map<string, Buffer>>();
    const modelDir = path.join(clientPath, "model");

    if (!fs.existsSync(modelDir)) {
      this.logger.warn(`Model directory not found: ${modelDir}`);
      return allExtracted;
    }

    const files = fs.readdirSync(modelDir);
    let processedCount = 0;

    for (const file of files) {
      if (file.endsWith(".cwf")) {
        const cwfPath = path.join(modelDir, file);
        try {
          const extracted = await this.extractCwfFile(cwfPath);
          allExtracted.set(file, extracted);
          processedCount++;
        } catch (_error) {
          this.logger.error(`Failed to extract ${file}:`, _error);
        }
      }
    }

    this.logger.success(`Extracted ${processedCount} CWF files`);
    return allExtracted;
  }

  getCwfFileList (clientPath: string): string[] {
    const modelDir = path.join(clientPath, "model");

    if (!fs.existsSync(modelDir)) {
      return [];
    }

    const files = fs.readdirSync(modelDir);
    return files.filter((file) => file.endsWith(".cwf"));
  }
}

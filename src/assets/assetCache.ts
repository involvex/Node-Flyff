import fs from "fs";
import path from "path";
import { Logger } from "../helpers/logger";

export interface AssetInfo {
  id: string;
  type: "model" | "texture" | "sound" | "music" | "map" | "animation";
  sourcePath: string;
  cachedPath: string;
  size: number;
  lastModified: number;
  loaded: boolean;
}

export class AssetCache {
  private logger: Logger;
  private cachePath: string;
  private clientPath: string;
  private assetIndex: Map<string, AssetInfo> = new Map();
  private enabled: boolean;

  constructor(clientPath: string, cachePath: string, enabled: boolean = true) {
    this.logger = new Logger("AssetCache");
    this.clientPath = clientPath;
    this.cachePath = cachePath;
    this.enabled = enabled;

    if (this.enabled) {
      this.initializeCache();
    }
  }

  private initializeCache(): void {
    try {
      if (!fs.existsSync(this.cachePath)) {
        fs.mkdirSync(this.cachePath, { recursive: true });
        this.logger.info(`Created asset cache directory: ${this.cachePath}`);
      }

      // Create subdirectories
      const subdirs = [
        "models",
        "textures",
        "sounds",
        "music",
        "maps",
        "animations",
      ];
      for (const subdir of subdirs) {
        const dirPath = path.join(this.cachePath, subdir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      this.logger.success("Asset cache initialized");
    } catch (error) {
      this.logger.error("Failed to initialize asset cache:", error);
    }
  }

  async cacheAsset(
    assetType: string,
    assetId: string,
    sourcePath: string,
    data: Buffer,
  ): Promise<string> {
    if (!this.enabled) {
      return sourcePath;
    }

    try {
      const cacheDir = path.join(this.cachePath, assetType);
      const cacheFile = path.join(cacheDir, `${assetId}.bin`);

      // Ensure directory exists
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Write cached data
      fs.writeFileSync(cacheFile, data);

      // Update index
      const assetInfo: AssetInfo = {
        id: assetId,
        type: assetType as any,
        sourcePath,
        cachedPath: cacheFile,
        size: data.length,
        lastModified: Date.now(),
        loaded: true,
      };

      this.assetIndex.set(`${assetType}:${assetId}`, assetInfo);

      this.logger.info(`Cached ${assetType}:${assetId}`);
      return cacheFile;
    } catch (error) {
      this.logger.error(`Failed to cache ${assetType}:${assetId}:`, error);
      return sourcePath;
    }
  }

  getCachedAsset(assetType: string, assetId: string): string | null {
    if (!this.enabled) {
      return null;
    }

    const key = `${assetType}:${assetId}`;
    const assetInfo = this.assetIndex.get(key);

    if (assetInfo && fs.existsSync(assetInfo.cachedPath)) {
      return assetInfo.cachedPath;
    }

    return null;
  }

  async loadAssetFromCache(
    assetType: string,
    assetId: string,
  ): Promise<Buffer | null> {
    const cachedPath = this.getCachedAsset(assetType, assetId);

    if (!cachedPath) {
      return null;
    }

    try {
      const data = fs.readFileSync(cachedPath);
      this.logger.info(`Loaded ${assetType}:${assetId} from cache`);
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to load ${assetType}:${assetId} from cache:`,
        error,
      );
      return null;
    }
  }

  clearCache(assetType?: string): void {
    try {
      if (assetType) {
        const cacheDir = path.join(this.cachePath, assetType);
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true, force: true });
          fs.mkdirSync(cacheDir, { recursive: true });
          this.logger.info(`Cleared cache for ${assetType}`);
        }
      } else {
        fs.rmSync(this.cachePath, { recursive: true, force: true });
        this.initializeCache();
        this.logger.info("Cleared entire cache");
      }

      // Clear index
      if (assetType) {
        for (const key of this.assetIndex.keys()) {
          if (key.startsWith(`${assetType}:`)) {
            this.assetIndex.delete(key);
          }
        }
      } else {
        this.assetIndex.clear();
      }
    } catch (error) {
      this.logger.error("Failed to clear cache:", error);
    }
  }

  getCacheStats(): {
    enabled: boolean;
    totalAssets: number;
    totalSize: number;
    byType: Record<string, number>;
  } {
    const stats = {
      enabled: this.enabled,
      totalAssets: this.assetIndex.size,
      totalSize: 0,
      byType: {} as Record<string, number>,
    };

    for (const assetInfo of this.assetIndex.values()) {
      stats.totalSize += assetInfo.size;
      const type = assetInfo.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }

  preloadIndex(): void {
    try {
      // Scan cache directory and build index
      const types = [
        "models",
        "textures",
        "sounds",
        "music",
        "maps",
        "animations",
      ];

      for (const type of types) {
        const typeDir = path.join(this.cachePath, type);
        if (!fs.existsSync(typeDir)) {
          continue;
        }

        const files = fs.readdirSync(typeDir);
        for (const file of files) {
          if (file.endsWith(".bin")) {
            const assetId = file.replace(".bin", "");
            const filePath = path.join(typeDir, file);
            const stats = fs.statSync(filePath);

            const assetInfo: AssetInfo = {
              id: assetId,
              type: type as any,
              sourcePath: "",
              cachedPath: filePath,
              size: stats.size,
              lastModified: stats.mtimeMs,
              loaded: false,
            };

            this.assetIndex.set(`${type}:${assetId}`, assetInfo);
          }
        }
      }

      this.logger.info(`Preloaded ${this.assetIndex.size} assets from cache`);
    } catch (error) {
      this.logger.error("Failed to preload cache index:", error);
    }
  }

  isAssetCached(assetType: string, assetId: string): boolean {
    return this.getCachedAsset(assetType, assetId) !== null;
  }

  getClientPath(): string {
    return this.clientPath;
  }

  getCachePath(): string {
    return this.cachePath;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

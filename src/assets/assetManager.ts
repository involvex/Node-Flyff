import { Logger } from "../helpers/logger";
import { AssetCache } from "./assetCache";
import { CwfExtractor } from "./cwfExtractor";
import { ModelLoader } from "./modelLoader";
import { WorldLoader } from "./worldLoader";

export interface AssetManagerConfig {
  clientPath: string;
  cachePath: string;
  enableCache: boolean;
}

export class AssetManager {
  private logger: Logger;
  private assetCache: AssetCache;
  private cwfExtractor: CwfExtractor;
  private modelLoader: ModelLoader;
  private worldLoader: WorldLoader;
  private initialized: boolean = false;

  constructor(config: AssetManagerConfig) {
    this.logger = new Logger("AssetManager");

    // Initialize components
    this.assetCache = new AssetCache(
      config.clientPath,
      config.cachePath,
      config.enableCache
    );

    this.cwfExtractor = new CwfExtractor(this.assetCache);
    this.modelLoader = new ModelLoader(this.assetCache);
    this.worldLoader = new WorldLoader(this.assetCache);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn("AssetManager already initialized");
      return;
    }

    try {
      this.logger.info("Initializing AssetManager...");

      // Preload cache index if caching is enabled
      if (this.assetCache.isEnabled()) {
        this.assetCache.preloadIndex();
      }

      this.initialized = true;
      this.logger.success("AssetManager initialized");
    } catch (error) {
      this.logger.error("Failed to initialize AssetManager:", error);
      throw error;
    }
  }

  async loadModel(modelId: string): Promise<any> {
    if (!this.initialized) {
      throw new Error("AssetManager not initialized");
    }

    return await this.modelLoader.loadModel(
      modelId,
      this.assetCache.getClientPath()
    );
  }

  async loadWorld(worldId: string): Promise<any> {
    if (!this.initialized) {
      throw new Error("AssetManager not initialized");
    }

    return await this.worldLoader.loadWorld(
      worldId,
      this.assetCache.getClientPath()
    );
  }

  async preloadAssets(modelIds?: string[], worldIds?: string[]): Promise<void> {
    if (!this.initialized) {
      throw new Error("AssetManager not initialized");
    }

    this.logger.info("Preloading assets...");

    const promises: Promise<void>[] = [];

    if (modelIds && modelIds.length > 0) {
      promises.push(
        this.modelLoader.preloadModels(
          modelIds,
          this.assetCache.getClientPath()
        )
      );
    }

    if (worldIds && worldIds.length > 0) {
      promises.push(
        this.worldLoader.preloadWorlds(
          worldIds,
          this.assetCache.getClientPath()
        )
      );
    }

    await Promise.all(promises);
    this.logger.success("Asset preloading complete");
  }

  async extractCwfArchives(): Promise<void> {
    if (!this.initialized) {
      throw new Error("AssetManager not initialized");
    }

    this.logger.info("Extracting CWF archives...");

    try {
      await this.cwfExtractor.extractAllCwfFiles(
        this.assetCache.getClientPath()
      );
      this.logger.success("CWF archive extraction complete");
    } catch (error) {
      this.logger.error("Failed to extract CWF archives:", error);
      throw error;
    }
  }

  getModel(modelId: string): any {
    return this.modelLoader.getModel(modelId);
  }

  getWorld(worldId: string): any {
    return this.worldLoader.getWorld(worldId);
  }

  clearCache(assetType?: string): void {
    this.assetCache.clearCache(assetType);
  }

  getCacheStats(): any {
    return this.assetCache.getCacheStats();
  }

  getModelStats(): any {
    return this.modelLoader.getStats();
  }

  getWorldStats(): any {
    return this.worldLoader.getStats();
  }

  getOverallStats(): {
    initialized: boolean;
    cache: any;
    models: any;
    worlds: any;
    } {
    return {
      initialized: this.initialized,
      cache: this.getCacheStats(),
      models: this.getModelStats(),
      worlds: this.getWorldStats()
    };
  }

  unloadModel(modelId: string): boolean {
    return this.modelLoader.unloadModel(modelId);
  }

  unloadWorld(worldId: string): boolean {
    return this.worldLoader.unloadWorld(worldId);
  }

  unloadAll(): void {
    this.modelLoader.unloadAllModels();
    this.worldLoader.unloadAllWorlds();
    this.logger.info("Unloaded all assets");
  }

  async shutdown(): Promise<void> {
    this.logger.info("Shutting down AssetManager...");

    this.unloadAll();
    this.initialized = false;

    this.logger.success("AssetManager shutdown complete");
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getClientPath(): string {
    return this.assetCache.getClientPath();
  }

  getCachePath(): string {
    return this.assetCache.getCachePath();
  }

  isCacheEnabled(): boolean {
    return this.assetCache.isEnabled();
  }
}

import fs from "fs";
import path from "path";
import { Logger } from "../helpers/logger";
import { AssetCache } from "./assetCache";
import { WldFile } from "../abstract/wldFile";
import { DyoFile } from "../abstract/dyo/dyoFile";
import { RgnFile } from "../abstract/rgn/rgnFile";

export interface WorldData {
  id: string;
  name: string;
  wldData: any;
  dyoObjects: any[];
  rgnRegions: any[];
  models: Map<string, any>;
  textures: Map<string, any>;
  sounds: Map<string, any>;
  loaded: boolean;
}

export class WorldLoader {
  private logger: Logger;
  private assetCache: AssetCache;
  private loadedWorlds: Map<string, WorldData> = new Map();

  constructor(assetCache: AssetCache) {
    this.logger = new Logger("WorldLoader");
    this.assetCache = assetCache;
  }

  async loadWorld(worldId: string, clientPath: string): Promise<WorldData> {
    // Check if already loaded
    if (this.loadedWorlds.has(worldId)) {
      return this.loadedWorlds.get(worldId)!;
    }

    try {
      this.logger.info(`Loading world: ${worldId}`);

      const worldData: WorldData = {
        id: worldId,
        name: worldId,
        wldData: null,
        dyoObjects: [],
        rgnRegions: [],
        models: new Map(),
        textures: new Map(),
        sounds: new Map(),
        loaded: false
      };

      // Load WLD file
      await this.loadWldFile(worldId, clientPath, worldData);

      // Load DYO file
      await this.loadDyoFile(worldId, clientPath, worldData);

      // Load RGN file
      await this.loadRgnFile(worldId, clientPath, worldData);

      // Load associated assets
      await this.loadWorldAssets(worldId, clientPath, worldData);

      worldData.loaded = true;
      this.loadedWorlds.set(worldId, worldData);

      this.logger.success(`Loaded world: ${worldId}`);
      return worldData;
    } catch (error) {
      this.logger.error(`Failed to load world ${worldId}:`, error);
      throw error;
    }
  }

  private async loadWldFile(
    worldId: string,
    clientPath: string,
    worldData: WorldData
  ): Promise<void> {
    try {
      const worldDir = path.join(clientPath, "world");
      const wldPath = path.join(worldDir, `${worldId}.wld`);

      if (!fs.existsSync(wldPath)) {
        this.logger.warn(`WLD file not found: ${wldPath}`);
        return;
      }

      this.logger.info(`Loading WLD file: ${wldPath}`);
      const wldFile = new WldFile(wldPath);
      worldData.wldData = wldFile.worldData;

      this.logger.info(`Loaded WLD data for ${worldId}`);
    } catch (error) {
      this.logger.error(`Failed to load WLD file for ${worldId}:`, error);
    }
  }

  private async loadDyoFile(
    worldId: string,
    clientPath: string,
    worldData: WorldData
  ): Promise<void> {
    try {
      const worldDir = path.join(clientPath, "world");
      const dyoPath = path.join(worldDir, `${worldId}.dyo`);

      if (!fs.existsSync(dyoPath)) {
        this.logger.warn(`DYO file not found: ${dyoPath}`);
        return;
      }

      this.logger.info(`Loading DYO file: ${dyoPath}`);
      const dyoFile = new DyoFile(dyoPath);
      worldData.dyoObjects = dyoFile.Elements;

      this.logger.info(
        `Loaded ${worldData.dyoObjects.length} DYO objects for ${worldId}`
      );
    } catch (error) {
      this.logger.error(`Failed to load DYO file for ${worldId}:`, error);
    }
  }

  private async loadRgnFile(
    worldId: string,
    clientPath: string,
    worldData: WorldData
  ): Promise<void> {
    try {
      const worldDir = path.join(clientPath, "world");
      const rgnPath = path.join(worldDir, `${worldId}.rgn`);

      if (!fs.existsSync(rgnPath)) {
        this.logger.warn(`RGN file not found: ${rgnPath}`);
        return;
      }

      this.logger.info(`Loading RGN file: ${rgnPath}`);
      const rgnFile = new RgnFile(rgnPath);
      worldData.rgnRegions = [...rgnFile.Elements];

      this.logger.info(
        `Loaded ${worldData.rgnRegions.length} RGN regions for ${worldId}`
      );
    } catch (error) {
      this.logger.error(`Failed to load RGN file for ${worldId}:`, error);
    }
  }

  private async loadWorldAssets(
    worldId: string,
    clientPath: string,
    worldData: WorldData
  ): Promise<void> {
    try {
      this.logger.info(`Loading assets for world: ${worldId}`);

      // Collect asset references from DYO objects
      const modelIds = new Set<string>();
      const textureIds = new Set<string>();
      const soundIds = new Set<string>();

      for (const obj of worldData.dyoObjects) {
        if (obj.modelId) {
          modelIds.add(obj.modelId);
        }
        if (obj.textureId) {
          textureIds.add(obj.textureId);
        }
        if (obj.soundId) {
          soundIds.add(obj.soundId);
        }
      }

      this.logger.info(
        `Found ${modelIds.size} models, ${textureIds.size} textures, ${soundIds.size} sounds`
      );

      // Load models (placeholder - would use ModelLoader)
      for (const modelId of modelIds) {
        try {
          const modelData = await this.loadModelAsset(modelId, clientPath);
          if (modelData) {
            worldData.models.set(modelId, modelData);
          }
        } catch (error) {
          this.logger.warn(`Failed to load model ${modelId}:`, error);
        }
      }

      // Load textures (placeholder)
      for (const textureId of textureIds) {
        try {
          const textureData = await this.loadTextureAsset(
            textureId,
            clientPath
          );
          if (textureData) {
            worldData.textures.set(textureId, textureData);
          }
        } catch (error) {
          this.logger.warn(`Failed to load texture ${textureId}:`, error);
        }
      }

      // Load sounds (placeholder)
      for (const soundId of soundIds) {
        try {
          const soundData = await this.loadSoundAsset(soundId, clientPath);
          if (soundData) {
            worldData.sounds.set(soundId, soundData);
          }
        } catch (error) {
          this.logger.warn(`Failed to load sound ${soundId}:`, error);
        }
      }

      this.logger.success(
        `Loaded assets for ${worldId}: ${worldData.models.size} models, ${worldData.textures.size} textures, ${worldData.sounds.size} sounds`
      );
    } catch (error) {
      this.logger.error(`Failed to load assets for world ${worldId}:`, error);
    }
  }

  private async loadModelAsset(
    modelId: string,
    clientPath: string
  ): Promise<any> {
    // Check cache first
    const cached = await this.assetCache.loadAssetFromCache("models", modelId);
    if (cached) {
      return { id: modelId, data: cached };
    }

    // Try to load from client files
    const modelDir = path.join(clientPath, "model");
    const possiblePaths = [
      path.join(modelDir, `${modelId}.o3d`),
      path.join(modelDir, `${modelId}.x`),
      path.join(modelDir, `${modelId}.msh`)
    ];

    for (const modelPath of possiblePaths) {
      if (fs.existsSync(modelPath)) {
        const data = fs.readFileSync(modelPath);
        await this.assetCache.cacheAsset("models", modelId, modelPath, data);
        return { id: modelId, data };
      }
    }

    return null;
  }

  private async loadTextureAsset(
    textureId: string,
    clientPath: string
  ): Promise<any> {
    // Check cache first
    const cached = await this.assetCache.loadAssetFromCache(
      "textures",
      textureId
    );
    if (cached) {
      return { id: textureId, data: cached };
    }

    // Try to load from client files
    const textureDirs = [
      path.join(clientPath, "model", "texture"),
      path.join(clientPath, "texture"),
      path.join(clientPath, "theme")
    ];

    const possibleExtensions = [".dds", ".tga", ".png", ".jpg"];

    for (const textureDir of textureDirs) {
      if (!fs.existsSync(textureDir)) {
        continue;
      }

      for (const ext of possibleExtensions) {
        const texturePath = path.join(textureDir, `${textureId}${ext}`);
        if (fs.existsSync(texturePath)) {
          const data = fs.readFileSync(texturePath);
          await this.assetCache.cacheAsset(
            "textures",
            textureId,
            texturePath,
            data
          );
          return { id: textureId, data };
        }
      }
    }

    return null;
  }

  private async loadSoundAsset(
    soundId: string,
    clientPath: string
  ): Promise<any> {
    // Check cache first
    const cached = await this.assetCache.loadAssetFromCache("sounds", soundId);
    if (cached) {
      return { id: soundId, data: cached };
    }

    // Try to load from client files
    const soundDirs = [
      path.join(clientPath, "sfx"),
      path.join(clientPath, "Sound"),
      path.join(clientPath, "Music")
    ];

    const possibleExtensions = [".wav", ".mp3", ".ogg"];

    for (const soundDir of soundDirs) {
      if (!fs.existsSync(soundDir)) {
        continue;
      }

      for (const ext of possibleExtensions) {
        const soundPath = path.join(soundDir, `${soundId}${ext}`);
        if (fs.existsSync(soundPath)) {
          const data = fs.readFileSync(soundPath);
          await this.assetCache.cacheAsset("sounds", soundId, soundPath, data);
          return { id: soundId, data };
        }
      }
    }

    return null;
  }

  getWorld(worldId: string): WorldData | null {
    return this.loadedWorlds.get(worldId) || null;
  }

  getLoadedWorldCount(): number {
    return this.loadedWorlds.size;
  }

  unloadWorld(worldId: string): boolean {
    return this.loadedWorlds.delete(worldId);
  }

  unloadAllWorlds(): void {
    this.loadedWorlds.clear();
    this.logger.info("Unloaded all worlds");
  }

  async preloadWorlds(worldIds: string[], clientPath: string): Promise<void> {
    this.logger.info(`Preloading ${worldIds.length} worlds...`);

    for (const worldId of worldIds) {
      try {
        await this.loadWorld(worldId, clientPath);
      } catch (error) {
        this.logger.warn(`Failed to preload world ${worldId}:`, error);
      }
    }

    this.logger.success(`Preloaded ${this.loadedWorlds.size} worlds`);
  }

  getStats(): {
    loadedWorlds: number;
    totalObjects: number;
    totalRegions: number;
    totalModels: number;
    totalTextures: number;
    totalSounds: number;
    } {
    let totalObjects = 0;
    let totalRegions = 0;
    let totalModels = 0;
    let totalTextures = 0;
    let totalSounds = 0;

    for (const world of this.loadedWorlds.values()) {
      totalObjects += world.dyoObjects.length;
      totalRegions += world.rgnRegions.length;
      totalModels += world.models.size;
      totalTextures += world.textures.size;
      totalSounds += world.sounds.size;
    }

    return {
      loadedWorlds: this.loadedWorlds.size,
      totalObjects,
      totalRegions,
      totalModels,
      totalTextures,
      totalSounds
    };
  }
}

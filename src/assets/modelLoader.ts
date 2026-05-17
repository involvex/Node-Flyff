import fs from "fs";
import path from "path";
import { Logger } from "../helpers/logger";
import { AssetCache } from "./assetCache";
import { CwfExtractor } from "./cwfExtractor";

export interface ModelData {
  id: string;
  name: string;
  vertices: Float32Array;
  indices: Uint16Array;
  normals: Float32Array;
  texCoords: Float32Array;
  materials: MaterialData[];
  animations: AnimationData[];
  boundingBox: BoundingBox;
}

export interface MaterialData {
  id: string;
  name: string;
  diffuseTexture: string;
  normalTexture: string;
  specularTexture: string;
  diffuseColor: [number, number, number, number];
  specularColor: [number, number, number, number];
  shininess: number;
}

export interface AnimationData {
  name: string;
  duration: number;
  frames: number;
  tracks: AnimationTrack[];
}

export interface AnimationTrack {
  boneName: string;
  keyframes: Keyframe[];
}

export interface Keyframe {
  time: number;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
}

export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
}

export class ModelLoader {
  private logger: Logger;
  private assetCache: AssetCache;
  private cwfExtractor: CwfExtractor;
  private loadedModels: Map<string, ModelData> = new Map();

  constructor(assetCache: AssetCache) {
    this.logger = new Logger("ModelLoader");
    this.assetCache = assetCache;
    this.cwfExtractor = new CwfExtractor(assetCache);
  }

  async loadModel(modelId: string, clientPath: string): Promise<ModelData> {
    // Check if already loaded
    if (this.loadedModels.has(modelId)) {
      return this.loadedModels.get(modelId)!;
    }

    // Check cache
    const cachedData = await this.assetCache.loadAssetFromCache(
      "models",
      modelId,
    );
    if (cachedData) {
      const model = this.parseModelData(cachedData, modelId);
      this.loadedModels.set(modelId, model);
      return model;
    }

    // Load from client files
    try {
      this.logger.info(`Loading model: ${modelId}`);

      // Try to find the model in CWF archives
      const cwfFiles = this.cwfExtractor.getCwfFileList(clientPath);
      let modelData: ModelData | null = null;

      for (const cwfFile of cwfFiles) {
        try {
          const extracted = await this.cwfExtractor.extractCwfFile(
            path.join(clientPath, "model", cwfFile),
          );

          // Look for the model file in extracted data
          for (const [fileName, data] of extracted.entries()) {
            if (
              fileName.toLowerCase().includes(modelId.toLowerCase()) ||
              this.getAssetId(fileName) === modelId
            ) {
              modelData = this.parseModelData(data, modelId);
              break;
            }
          }

          if (modelData) {
            break;
          }
        } catch (error) {
          this.logger.warn(`Failed to extract from ${cwfFile}:`, error);
        }
      }

      if (!modelData) {
        throw new Error(`Model ${modelId} not found in any CWF archive`);
      }

      this.loadedModels.set(modelId, modelData);
      this.logger.success(`Loaded model: ${modelId}`);
      return modelData;
    } catch (error) {
      this.logger.error(`Failed to load model ${modelId}:`, error);
      throw error;
    }
  }

  private parseModelData(buffer: Buffer, modelId: string): ModelData {
    try {
      // Parse model data (simplified - actual format would need reverse engineering)
      // This is a placeholder implementation

      const model: ModelData = {
        id: modelId,
        name: modelId,
        vertices: new Float32Array(0),
        indices: new Uint16Array(0),
        normals: new Float32Array(0),
        texCoords: new Float32Array(0),
        materials: [],
        animations: [],
        boundingBox: {
          min: [0, 0, 0],
          max: [1, 1, 1],
        },
      };

      // Try to detect format and parse accordingly
      if (this.isO3DFormat(buffer)) {
        return this.parseO3DModel(buffer, modelId);
      } else if (this.isXFormat(buffer)) {
        return this.parseXModel(buffer, modelId);
      } else {
        this.logger.warn(
          `Unknown model format for ${modelId}, using placeholder`,
        );
        return model;
      }
    } catch (error) {
      this.logger.error(`Failed to parse model data for ${modelId}:`, error);
      throw error;
    }
  }

  private isO3DFormat(buffer: Buffer): boolean {
    // Check for O3D magic number
    if (buffer.length < 4) return false;
    const magic = buffer.readUInt32LE(0);
    return (
      magic === 0x4f334400 || // O3D\0
      magic === 0x00344f4f
    ); // \0O3O
  }

  private isXFormat(buffer: Buffer): boolean {
    // Check for X file format
    if (buffer.length < 4) return false;
    return buffer.toString("ascii", 0, 4).toLowerCase() === "xof ";
  }

  private parseO3DModel(buffer: Buffer, modelId: string): ModelData {
    this.logger.info(`Parsing O3D model: ${modelId}`);

    // Simplified O3D parsing
    const model: ModelData = {
      id: modelId,
      name: modelId,
      vertices: new Float32Array(0),
      indices: new Uint16Array(0),
      normals: new Float32Array(0),
      texCoords: new Float32Array(0),
      materials: [],
      animations: [],
      boundingBox: {
        min: [0, 0, 0],
        max: [1, 1, 1],
      },
    };

    try {
      // Read O3D header
      const version = buffer.readUInt32LE(4);
      const vertexCount = buffer.readUInt32LE(8);
      const faceCount = buffer.readUInt32LE(12);

      this.logger.info(
        `O3D Version: ${version}, Vertices: ${vertexCount}, Faces: ${faceCount}`,
      );

      // Read vertices (placeholder - actual implementation would parse properly)
      if (vertexCount > 0 && vertexCount < 100000) {
        const vertexData = new Float32Array(vertexCount * 3);
        let offset = 16;

        for (let i = 0; i < vertexCount * 3; i++) {
          if (offset + 4 <= buffer.length) {
            vertexData[i] = buffer.readFloatLE(offset);
            offset += 4;
          }
        }

        model.vertices = vertexData;
      }

      // Read faces/indices
      if (faceCount > 0 && faceCount < 100000) {
        const indexData = new Uint16Array(faceCount * 3);
        let offset = 16 + vertexCount * 12; // Skip vertices

        for (let i = 0; i < faceCount * 3; i++) {
          if (offset + 2 <= buffer.length) {
            indexData[i] = buffer.readUInt16LE(offset);
            offset += 2;
          }
        }

        model.indices = indexData;
      }

      // Calculate bounding box
      if (model.vertices.length > 0) {
        this.calculateBoundingBox(model);
      }

      return model;
    } catch (error) {
      this.logger.error("Failed to parse O3D model:", error);
      return model;
    }
  }

  private parseXModel(buffer: Buffer, modelId: string): ModelData {
    this.logger.info(`Parsing X model: ${modelId}`);

    // Simplified X file parsing
    const model: ModelData = {
      id: modelId,
      name: modelId,
      vertices: new Float32Array(0),
      indices: new Uint16Array(0),
      normals: new Float32Array(0),
      texCoords: new Float32Array(0),
      materials: [],
      animations: [],
      boundingBox: {
        min: [0, 0, 0],
        max: [1, 1, 1],
      },
    };

    // X file parsing would be implemented here
    // For now, return placeholder
    return model;
  }

  private calculateBoundingBox(model: ModelData): void {
    if (model.vertices.length === 0) {
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < model.vertices.length; i += 3) {
      const x = model.vertices[i];
      const y = model.vertices[i + 1];
      const z = model.vertices[i + 2];

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }

    model.boundingBox = {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    };
  }

  private getAssetId(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  }

  async preloadModels(modelIds: string[], clientPath: string): Promise<void> {
    this.logger.info(`Preloading ${modelIds.length} models...`);

    for (const modelId of modelIds) {
      try {
        await this.loadModel(modelId, clientPath);
      } catch (error) {
        this.logger.warn(`Failed to preload model ${modelId}:`, error);
      }
    }

    this.logger.success(`Preloaded ${this.loadedModels.size} models`);
  }

  getModel(modelId: string): ModelData | null {
    return this.loadedModels.get(modelId) || null;
  }

  getLoadedModelCount(): number {
    return this.loadedModels.size;
  }

  unloadModel(modelId: string): boolean {
    return this.loadedModels.delete(modelId);
  }

  unloadAllModels(): void {
    this.loadedModels.clear();
    this.logger.info("Unloaded all models");
  }

  getStats(): {
    loadedModels: number;
    totalVertices: number;
    totalIndices: number;
    memoryUsage: number;
  } {
    let totalVertices = 0;
    let totalIndices = 0;
    let memoryUsage = 0;

    for (const model of this.loadedModels.values()) {
      totalVertices += model.vertices.length;
      totalIndices += model.indices.length;
      memoryUsage += model.vertices.byteLength + model.indices.byteLength;
    }

    return {
      loadedModels: this.loadedModels.size,
      totalVertices,
      totalIndices,
      memoryUsage,
    };
  }
}

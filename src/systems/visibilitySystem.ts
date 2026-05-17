import { Logger } from "../helpers/logger";
import { Vector3 } from "../abstract/vector3";
import { Player } from "../entities/player";
import { Monster } from "../entities/monster";
import { Npc } from "../entities/npc";
import { WorldObject } from "../abstract/worldObject";

export interface VisibilityUpdate {
  entityId: number;
  entityType: string;
  position: Vector3;
  visible: boolean;
  distance: number;
}

export class VisibilitySystem {
  private logger: Logger;
  private visibilityRange: number;
  private updateInterval: number;
  private updateTimer: NodeJS.Timeout | null = null;
  private visibilityMap: Map<number, Set<number>> = new Map(); // objectId -> visible objectIds
  private lastUpdateTime: Map<number, number> = new Map(); // objectId -> last update time

  constructor(visibilityRange: number = 50, updateInterval: number = 100) {
    this.logger = new Logger("VisibilitySystem");
    this.visibilityRange = visibilityRange;
    this.updateInterval = updateInterval;
  }

  start(): void {
    if (this.updateTimer) {
      this.logger.warn("Visibility system already started");
      return;
    }

    this.logger.info(
      `Starting visibility system (range: ${this.visibilityRange}, interval: ${this.updateInterval}ms)`,
    );

    this.updateTimer = setInterval(() => {
      this.updateVisibility();
    }, this.updateInterval);
  }

  stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      this.logger.info("Visibility system stopped");
    }
  }

  private updateVisibility(): void {
    // This would be called by the world server to update visibility for all entities
    // For now, this is a placeholder for the visibility update logic
  }

  calculateDistance(entity1: WorldObject, entity2: WorldObject): number {
    const pos1 = entity1.position;
    const pos2 = entity2.position;

    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  isVisible(entity1: WorldObject, entity2: WorldObject): boolean {
    const distance = this.calculateDistance(entity1, entity2);
    return distance <= this.visibilityRange;
  }

  getVisibleEntities(
    entity: WorldObject,
    allEntities: WorldObject[],
  ): WorldObject[] {
    const visible: WorldObject[] = [];

    for (const other of allEntities) {
      if (other === entity) {
        continue;
      }

      if (this.isVisible(entity, other)) {
        visible.push(other);
      }
    }

    return visible;
  }

  getVisibilityUpdates(
    entity: WorldObject,
    allEntities: WorldObject[],
  ): VisibilityUpdate[] {
    const updates: VisibilityUpdate[] = [];
    const currentVisible = this.getVisibleEntities(entity, allEntities);
    const previousVisible =
      this.visibilityMap.get(entity.objectId) || new Set();

    // Check for newly visible entities
    for (const other of currentVisible) {
      if (!previousVisible.has(other.objectId)) {
        updates.push({
          entityId: other.objectId,
          entityType: other.constructor.name,
          position: other.position.clone(),
          visible: true,
          distance: this.calculateDistance(entity, other),
        });
      }
    }

    // Check for newly invisible entities
    for (const otherId of previousVisible) {
      const stillVisible = currentVisible.some((e) => e.objectId === otherId);
      if (!stillVisible) {
        const other = allEntities.find((e) => e.objectId === otherId);
        if (other) {
          updates.push({
            entityId: other.objectId,
            entityType: other.constructor.name,
            position: other.position.clone(),
            visible: false,
            distance: this.calculateDistance(entity, other),
          });
        }
      }
    }

    // Update visibility map
    const newVisibleSet = new Set(currentVisible.map((e) => e.objectId));
    this.visibilityMap.set(entity.objectId, newVisibleSet);
    this.lastUpdateTime.set(entity.objectId, Date.now());

    return updates;
  }

  updateEntityPosition(entity: WorldObject): void {
    // Mark entity for visibility update
    this.lastUpdateTime.set(entity.objectId, Date.now());
  }

  removeEntity(entity: WorldObject): void {
    this.visibilityMap.delete(entity.objectId);
    this.lastUpdateTime.delete(entity.objectId);

    // Remove this entity from other entities' visibility maps
    for (const [entityId, visibleSet] of this.visibilityMap.entries()) {
      visibleSet.delete(entity.objectId);
    }
  }

  getVisibilityRange(): number {
    return this.visibilityRange;
  }

  setVisibilityRange(range: number): void {
    this.visibilityRange = range;
    this.logger.info(`Visibility range updated to ${range}`);
  }

  getUpdateInterval(): number {
    return this.updateInterval;
  }

  setUpdateInterval(interval: number): void {
    this.updateInterval = interval;

    if (this.updateTimer) {
      this.stop();
      this.start();
    }

    this.logger.info(`Update interval updated to ${interval}ms`);
  }

  getStats(): {
    visibilityRange: number;
    updateInterval: number;
    trackedEntities: number;
    totalVisibilityConnections: number;
  } {
    let totalConnections = 0;
    for (const visibleSet of this.visibilityMap.values()) {
      totalConnections += visibleSet.size;
    }

    return {
      visibilityRange: this.visibilityRange,
      updateInterval: this.updateInterval,
      trackedEntities: this.visibilityMap.size,
      totalVisibilityConnections: totalConnections,
    };
  }

  clear(): void {
    this.visibilityMap.clear();
    this.lastUpdateTime.clear();
    this.logger.info("Visibility system cleared");
  }
}

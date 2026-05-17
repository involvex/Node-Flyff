import { Logger } from "../helpers/logger";
import { Vector3 } from "../abstract/vector3";
import { WorldObject } from "../abstract/worldObject";

export interface MovementUpdate {
  objectId: number;
  position: Vector3;
  rotation: number;
  velocity: Vector3;
  isMoving: boolean;
  timestamp: number;
}

export class MobilitySystem {
  private logger: Logger;
  private movementUpdates: Map<number, MovementUpdate> = new Map();
  private updateInterval: number;
  private updateTimer: NodeJS.Timeout | null = null;
  private maxVelocity: number = 10.0;
  private acceleration: number = 5.0;
  private friction: number = 0.9;

  constructor (updateInterval: number = 50) {
    this.logger = new Logger("MobilitySystem");
    this.updateInterval = updateInterval;
  }

  start (): void {
    if (this.updateTimer) {
      this.logger.warn("Mobility system already started");
      return;
    }

    this.logger.info(
      `Starting mobility system (interval: ${this.updateInterval}ms)`
    );

    this.updateTimer = setInterval(() => {
      this.updateMovements();
    }, this.updateInterval);
  }

  stop (): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      this.logger.info("Mobility system stopped");
    }
  }

  private updateMovements (): void {
    // Update all moving entities
    for (const [objectId, update] of this.movementUpdates.entries()) {
      if (update.isMoving) {
        this.applyMovement(objectId, update);
      }
    }
  }

  private applyMovement (objectId: number, update: MovementUpdate): void {
    // Apply velocity to position
    update.position.x += update.velocity.x * (this.updateInterval / 1000);
    update.position.y += update.velocity.y * (this.updateInterval / 1000);
    update.position.z += update.velocity.z * (this.updateInterval / 1000);

    // Apply friction
    update.velocity.x *= this.friction;
    update.velocity.y *= this.friction;
    update.velocity.z *= this.friction;

    // Stop if velocity is very low
    const speed = Math.sqrt(
      update.velocity.x * update.velocity.x +
        update.velocity.y * update.velocity.y +
        update.velocity.z * update.velocity.z
    );

    if (speed < 0.1) {
      update.isMoving = false;
      update.velocity.x = 0;
      update.velocity.y = 0;
      update.velocity.z = 0;
    }

    update.timestamp = Date.now();
  }

  startMovement (
    entity: WorldObject,
    targetPosition: Vector3,
    speed: number = 1.0
  ): void {
    const direction = this.calculateDirection(entity.position, targetPosition);
    const velocity = this.calculateVelocity(direction, speed);

    const update: MovementUpdate = {
      objectId: entity.objectId,
      position: entity.position.clone(),
      rotation: entity.rotationAngle,
      velocity,
      isMoving: true,
      timestamp: Date.now()
    };

    this.movementUpdates.set(entity.objectId, update);
    this.logger.info(`Started movement for entity ${entity.objectId}`);
  }

  stopMovement (entity: WorldObject): void {
    const update = this.movementUpdates.get(entity.objectId);
    if (update) {
      update.isMoving = false;
      update.velocity.x = 0;
      update.velocity.y = 0;
      update.velocity.z = 0;
      this.logger.info(`Stopped movement for entity ${entity.objectId}`);
    }
  }

  setVelocity (entity: WorldObject, velocity: Vector3): void {
    let update = this.movementUpdates.get(entity.objectId);

    if (!update) {
      update = {
        objectId: entity.objectId,
        position: entity.position.clone(),
        rotation: entity.rotationAngle,
        velocity: velocity.clone(),
        isMoving: true,
        timestamp: Date.now()
      };
      this.movementUpdates.set(entity.objectId, update);
    } else {
      update.velocity = velocity.clone();
      update.isMoving = true;
    }
  }

  setPosition (entity: WorldObject, position: Vector3): void {
    let update = this.movementUpdates.get(entity.objectId);

    if (!update) {
      update = {
        objectId: entity.objectId,
        position: position.clone(),
        rotation: entity.rotationAngle,
        velocity: new Vector3(),
        isMoving: false,
        timestamp: Date.now()
      };
      this.movementUpdates.set(entity.objectId, update);
    } else {
      update.position = position.clone();
    }
  }

  setRotation (entity: WorldObject, rotation: number): void {
    let update = this.movementUpdates.get(entity.objectId);

    if (!update) {
      update = {
        objectId: entity.objectId,
        position: entity.position.clone(),
        rotation,
        velocity: new Vector3(),
        isMoving: false,
        timestamp: Date.now()
      };
      this.movementUpdates.set(entity.objectId, update);
    } else {
      update.rotation = rotation;
    }
  }

  getMovementUpdate (objectId: number): MovementUpdate | null {
    return this.movementUpdates.get(objectId) || null;
  }

  getAllMovementUpdates (): MovementUpdate[] {
    return Array.from(this.movementUpdates.values());
  }

  isMoving (objectId: number): boolean {
    const update = this.movementUpdates.get(objectId);
    return update ? update.isMoving : false;
  }

  private calculateDirection (from: Vector3, to: Vector3): Vector3 {
    const direction = new Vector3(to.x - from.x, to.y - from.y, to.z - from.z);

    const length = Math.sqrt(
      direction.x * direction.x +
        direction.y * direction.y +
        direction.z * direction.z
    );

    if (length > 0) {
      direction.x /= length;
      direction.y /= length;
      direction.z /= length;
    }

    return direction;
  }

  private calculateVelocity (direction: Vector3, speed: number): Vector3 {
    const clampedSpeed = Math.min(speed, this.maxVelocity);
    return new Vector3(
      direction.x * clampedSpeed,
      direction.y * clampedSpeed,
      direction.z * clampedSpeed
    );
  }

  removeEntity (objectId: number): void {
    this.movementUpdates.delete(objectId);
  }

  getMaxVelocity (): number {
    return this.maxVelocity;
  }

  setMaxVelocity (velocity: number): void {
    this.maxVelocity = velocity;
    this.logger.info(`Max velocity set to ${velocity}`);
  }

  getAcceleration (): number {
    return this.acceleration;
  }

  setAcceleration (acceleration: number): void {
    this.acceleration = acceleration;
    this.logger.info(`Acceleration set to ${acceleration}`);
  }

  getFriction (): number {
    return this.friction;
  }

  setFriction (friction: number): void {
    this.friction = Math.max(0, Math.min(1, friction));
    this.logger.info(`Friction set to ${this.friction}`);
  }

  getStats (): {
    updateInterval: number;
    movingEntities: number;
    maxVelocity: number;
    acceleration: number;
    friction: number;
  } {
    let movingCount = 0;
    for (const update of this.movementUpdates.values()) {
      if (update.isMoving) {
        movingCount++;
      }
    }

    return {
      updateInterval: this.updateInterval,
      movingEntities: movingCount,
      maxVelocity: this.maxVelocity,
      acceleration: this.acceleration,
      friction: this.friction
    };
  }

  clear (): void {
    this.movementUpdates.clear();
    this.logger.info("Mobility system cleared");
  }
}

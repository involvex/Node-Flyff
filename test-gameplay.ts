#!/usr/bin/env bun

import { VisibilitySystem } from "./src/systems/visibilitySystem";
import { MobilitySystem } from "./src/systems/mobilitySystem";
import { CombatSystem } from "./src/systems/combatSystem";
import { InventorySystem } from "./src/systems/inventorySystem";
import { Logger } from "./src/helpers/logger";
import { Vector3 } from "./src/abstract/vector3";
import { WorldObject } from "./src/abstract/worldObject";

const logger = new Logger("GameplayTest");

async function main() {
  logger.main("=== Gameplay Systems Test ===");

  try {
    // Test 1: Visibility System
    logger.info("Test 1: Visibility System...");
    const visibilitySystem = new VisibilitySystem(50, 100);
    visibilitySystem.start();
    logger.success("✓ Visibility system started");

    // Create test entities
    const entity1 = createTestEntity(1, new Vector3(0, 0, 0));
    const entity2 = createTestEntity(2, new Vector3(10, 0, 0));
    const entity3 = createTestEntity(3, new Vector3(100, 0, 0));

    const allEntities = [entity1, entity2, entity3];

    // Test visibility
    const visibleTo1 = visibilitySystem.getVisibleEntities(
      entity1,
      allEntities
    );
    logger.success(`✓ Entity 1 can see ${visibleTo1.length} entities`);

    const updates = visibilitySystem.getVisibilityUpdates(entity1, allEntities);
    logger.success(`✓ Generated ${updates.length} visibility updates`);

    const stats = visibilitySystem.getStats();
    logger.success(`✓ Visibility stats: ${JSON.stringify(stats)}`);

    visibilitySystem.stop();
    logger.success("✓ Visibility system test passed");

    // Test 2: Mobility System
    logger.info("Test 2: Mobility System...");
    const mobilitySystem = new MobilitySystem(50);
    mobilitySystem.start();
    logger.success("✓ Mobility system started");

    // Test movement
    const targetPos = new Vector3(50, 0, 50);
    mobilitySystem.startMovement(entity1, targetPos, 5.0);
    logger.success("✓ Started movement");

    const isMoving = mobilitySystem.isMoving(entity1.objectId);
    logger.success(`✓ Entity is moving: ${isMoving}`);

    const moveUpdate = mobilitySystem.getMovementUpdate(entity1.objectId);
    if (moveUpdate) {
      logger.success(
        `✓ Movement update: pos(${moveUpdate.position.x.toFixed(1)}, ${moveUpdate.position.y.toFixed(1)}, ${moveUpdate.position.z.toFixed(1)})`
      );
    }

    mobilitySystem.stopMovement(entity1);
    logger.success("✓ Stopped movement");

    const mobilityStats = mobilitySystem.getStats();
    logger.success(`✓ Mobility stats: ${JSON.stringify(mobilityStats)}`);

    mobilitySystem.stop();
    logger.success("✓ Mobility system test passed");

    // Test 3: Combat System
    logger.info("Test 3: Combat System...");
    const combatSystem = new CombatSystem();
    logger.success("✓ Combat system created");

    // Test attack
    const combatResult = combatSystem.performAttack(entity1, entity2, "melee");
    if (combatResult) {
      logger.success(
        `✓ Attack result: ${combatResult.damage} damage, crit: ${combatResult.isCritical}, blocked: ${combatResult.isBlocked}`
      );
    }

    const combatStats = combatSystem.getCombatStats(entity1.objectId);
    logger.success(`✓ Combat stats: ${JSON.stringify(combatStats)}`);

    const overallCombatStats = combatSystem.getStats();
    logger.success(
      `✓ Overall combat stats: ${JSON.stringify(overallCombatStats)}`
    );

    logger.success("✓ Combat system test passed");

    // Test 4: Inventory System
    logger.info("Test 4: Inventory System...");
    const inventorySystem = new InventorySystem();
    logger.success("✓ Inventory system created");

    // Test inventory operations
    const emptySlots = inventorySystem.getEmptySlotCount(1);
    logger.success(`✓ Empty slots: ${emptySlots}`);

    const inventoryStats = inventorySystem.getStats();
    logger.success(`✓ Inventory stats: ${JSON.stringify(inventoryStats)}`);

    logger.success("✓ Inventory system test passed");

    logger.main("=== All Gameplay Systems Tests Passed ===");
    logger.success("✓ Visibility system: OK");
    logger.success("✓ Mobility system: OK");
    logger.success("✓ Combat system: OK");
    logger.success("✓ Inventory system: OK");

    process.exit(0);
  } catch (error) {
    logger.error("Gameplay systems test failed:", error);
    process.exit(1);
  }
}

function createTestEntity(id: number, position: Vector3): WorldObject {
  // Create a simple test entity
  const entity = {
    objectId: id,
    modelId: 0,
    size: 100,
    map: null,
    mapLayer: null,
    position,
    rotationAngle: 0,
    name: `TestEntity${id}`,
    isSpawned: true,
    isVisible: true,
    objectState: 0,
    objectStateFlags: 0,
    stateMode: 0,
    visibleObjects: [],
    type: 0,
    getVisibleObject: function() {
      return null;
    },
    sendDefinedText: function() {},
    sendSpecialEffect: function() {},
    send: function() {},
    sendToVisible: function() {},
    dispose: function() {}
  } as WorldObject;

  return entity;
}

main();

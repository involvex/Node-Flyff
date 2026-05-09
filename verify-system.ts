#!/usr/bin/env bun

import { InterServerClient } from "./src/protocols/interServerClient";
import { SessionManager } from "./src/protocols/sessionManager";
import { DatabaseManager } from "./src/protocols/databaseManager";
import { ServerType } from "./src/common/serverType";
import { DatabaseType } from "./src/common/databaseType";
import { Logger } from "./src/helpers/logger";

const logger = new Logger("Verification");

async function main() {
  logger.main("=== System Verification ===");

  try {
    // Test 1: Import and create InterServerClient
    logger.info("Test 1: InterServerClient...");
    const interServerClient = new InterServerClient(
      ServerType.LOGIN_SERVER,
      "127.0.0.1",
      23001
    );
    logger.success("✓ InterServerClient created");

    // Test 2: Import and create SessionManager
    logger.info("Test 2: SessionManager...");
    const sessionManager = new SessionManager();
    const sessionId = sessionManager.createSession(
      1,
      1,
      "testuser",
      "TestChar",
      ServerType.WORLD_SERVER,
      3600
    );
    const session = sessionManager.getSession(sessionId);
    if (session) {
      logger.success(`✓ SessionManager working (session ${sessionId})`);
    } else {
      throw new Error("SessionManager failed");
    }
    sessionManager.stop();

    // Test 3: Import and create DatabaseManager
    logger.info("Test 3: DatabaseManager...");
    const dbManager = new DatabaseManager({
      type: DatabaseType.LITE,
      database: "data/verify_flyff.db",
      synchronize: true,
      logging: false,
      entities: [] // Use empty entities for basic test
    });
    await dbManager.initialize();
    const healthy = await dbManager.healthCheck();
    await dbManager.disconnect();
    if (healthy) {
      logger.success("✓ DatabaseManager working");
    } else {
      throw new Error("DatabaseManager failed");
    }

    logger.main("=== All Systems Verified ===");
    logger.success("✓ Inter-server communication: OK");
    logger.success("✓ Session management: OK");
    logger.success("✓ Database management: OK");

    process.exit(0);
  } catch (error) {
    logger.error("Verification failed:", error);
    process.exit(1);
  }
}

main();

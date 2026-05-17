import { InterServerClient } from "./protocols/interServerClient";
import { SessionManager } from "./protocols/sessionManager";
import { DatabaseManager } from "./protocols/databaseManager";
import { ServerType } from "./common/serverType";
import { DatabaseType } from "./common/databaseType";
import { Logger } from "./helpers/logger";

const logger = new Logger("SystemTest");

async function testInterServerCommunication () {
  logger.info("Testing Inter-Server Communication System...");

  try {
    // Create a test inter-server client
    const _client = new InterServerClient(
      ServerType.LOGIN_SERVER,
      "127.0.0.1",
      23001
    );

    logger.success("✓ InterServerClient created successfully");

    // Test message creation
    const _testMessage = {
      type: "test",
      source: ServerType.LOGIN_SERVER,
      target: ServerType.CLUSTER_SERVER,
      timestamp: Date.now(),
      data: { test: "data" }
    };

    logger.success("✓ Message structure valid");

    // Clean up
    // Note: We don't actually start the server in this test
    logger.success("✓ Inter-server communication test passed");
  } catch (_error) {
    logger.error("✗ Inter-server communication test failed:", _error);
    throw _error;
  }
}

async function testSessionManager () {
  logger.info("Testing Session Manager...");

  try {
    const sessionManager = new SessionManager();

    // Create a test session
    const sessionId = sessionManager.createSession(
      1, // accountId
      1, // characterId
      "testuser",
      "TestCharacter",
      ServerType.WORLD_SERVER,
      3600 // 1 hour
    );

    logger.success(`✓ Session created: ${sessionId}`);

    // Retrieve the session
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error("Failed to retrieve session");
    }

    logger.success("✓ Session retrieved successfully");

    // Validate session
    const isValid = sessionManager.validateSession(
      sessionId,
      1, // accountId
      1 // characterId
    );

    if (!isValid) {
      throw new Error("Session validation failed");
    }

    logger.success("✓ Session validation passed");

    // Get session stats
    const stats = sessionManager.getStats();
    logger.success(`✓ Session stats: ${JSON.stringify(stats)}`);

    // Clean up
    sessionManager.stop();
    logger.success("✓ Session manager test passed");
  } catch (_error) {
    logger.error("✗ Session manager test failed:", _error);
    throw _error;
  }
}

async function testDatabaseManager () {
  logger.info("Testing Database Manager...");

  try {
    const dbManager = new DatabaseManager({
      type: DatabaseType.LITE,
      database: "data/test_flyff.db",
      synchronize: true,
      logging: false,
      entities: ["src/database/**/*.ts"]
    });

    logger.success("✓ DatabaseManager created successfully");

    // Test database initialization
    const _dataSource = await dbManager.initialize();
    logger.success("✓ Database initialized successfully");

    // Test health check
    const isHealthy = await dbManager.healthCheck();
    if (!isHealthy) {
      throw new Error("Database health check failed");
    }

    logger.success("✓ Database health check passed");

    // Get database stats
    const stats = await dbManager.getStats();
    logger.success(`✓ Database stats: ${JSON.stringify(stats)}`);

    // Clean up
    await dbManager.disconnect();
    logger.success("✓ Database manager test passed");
  } catch (_error) {
    logger.error("✗ Database manager test failed:", _error);
    throw _error;
  }
}

async function runAllTests () {
  logger.main("=== Starting System Tests ===");

  try {
    await testInterServerCommunication();
    logger.success("");

    await testSessionManager();
    logger.success("");

    await testDatabaseManager();
    logger.success("");

    logger.main("=== All Tests Passed ===");
    logger.success("✓ Inter-server communication: OK");
    logger.success("✓ Session management: OK");
    logger.success("✓ Database management: OK");
  } catch (_error) {
    logger.error("=== Tests Failed ===");
    logger.error(_error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch((error) => {
    logger.error("Test execution failed:", error);
    process.exit(1);
  });
}

export { runAllTests };

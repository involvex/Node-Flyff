import _ from "lodash";
import { Logger } from "../helpers/logger";
import { BuilderType } from "../common/builderType";
import { IRedisClient } from "../interfaces/redis";
import { RedisClient } from "../libraries/redis";
export class RedisBuilder {
  private logger: Logger;
  options: any;

  constructor() {
    this.logger = new Logger(BuilderType.REDIS_BUILDER);
  }

  setRedisOptions(options: any): void {
    this.options = options;
  }

  // Synchronous build kept for compatibility but delegate to async build
  async build(): Promise<{
    subscriber: any | null;
    publisher: any | null;
    client: IRedisClient | null;
  }> {
    // Attempt to build synchronously (best-effort). If Redis is unreachable
    // the async build path in InstanceBuilder will be used instead.
    // Synchronous build: do not attempt to create real Redis connections.
    // Return a RedisClient wrapper that uses a KV-backed client so callers can operate without Redis.
    try {
      const client = new RedisClient(this.options);
      this.logger.success("KV-backed Redis client initialized");
      return {
        subscriber: null,
        publisher: null,
        client,
      };
    } catch (err) {
      this.logger.warn(
        "Initialization failed, falling back to local sqlite storage:",
        err,
      );
      try {
        // lazy import to avoid adding binary deps unless needed
        const { default: SqliteClient } =
          await import("../libraries/sqliteClient");
        const sqliteClient = new SqliteClient();
        this.logger.success("Sqlite fallback client initialized");
        return {
          subscriber: null,
          publisher: null,
          client: sqliteClient,
        };
      } catch (sqliteErr) {
        this.logger.warn(
          "Sqlite fallback initialization failed, continuing without Redis/sqlite:",
          sqliteErr,
        );
        return {
          subscriber: null,
          publisher: null,
          client: null,
        };
      }
    }
  }

  // Async build: try connecting to Redis with a short timeout and fall back to sqlite if unreachable
  async buildAsync(): Promise<{
    subscriber: any | null;
    publisher: any | null;
    client: IRedisClient | null;
  }> {
    // Async build simplified: do not attempt to open Redis connections.
    try {
      const client = new RedisClient(this.options);
      this.logger.success("KV-backed Redis client initialized (async)");
      return { subscriber: null, publisher: null, client };
    } catch (err) {
      this.logger.warn(
        "Initialization failed, falling back to local sqlite storage:",
        err?.message ?? err,
      );
      try {
        const { default: SqliteClient } =
          await import("../libraries/sqliteClient");
        const sqliteClient = new SqliteClient();
        this.logger.success("Sqlite fallback client initialized");
        return { subscriber: null, publisher: null, client: sqliteClient };
      } catch (sqliteErr) {
        this.logger.warn(
          "Sqlite fallback initialization failed, continuing without Redis/sqlite:",
          sqliteErr,
        );
        return { subscriber: null, publisher: null, client: null };
      }
    }
  }
}

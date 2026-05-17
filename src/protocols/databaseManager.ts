import { DataSource, DataSourceOptions } from "typeorm";
import { Logger } from "../helpers/logger";
import { DatabaseType } from "../common/databaseType";
import Database from "better-sqlite3";

export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  synchronize?: boolean;
  logging?: boolean;
  entities: string[];
}

export class DatabaseManager {
  private logger: Logger;
  private dataSource: DataSource | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.logger = new Logger("DatabaseManager");
    this.config = config;
  }

  async initialize(): Promise<DataSource> {
    try {
      this.logger.info(`Initializing ${this.config.type} database...`);

      const options = this.buildDataSourceOptions();
      this.dataSource = new DataSource(options);

      await this.dataSource.initialize();

      if (this.config.synchronize !== false) {
        await this.dataSource.synchronize();
        this.logger.info("Database synchronized");
      }

      this.logger.success(`Database connected: ${this.config.database}`);
      return this.dataSource;
    } catch (error) {
      this.logger.error("Failed to initialize database:", error);
      throw error;
    }
  }

  private buildDataSourceOptions(): DataSourceOptions {
    const baseOptions: DataSourceOptions = {
      type: this.config.type as any,
      database: this.config.database,
      synchronize: this.config.synchronize ?? true,
      logging: this.config.logging ?? false,
      entities: this.config.entities,
    };

    switch (this.config.type) {
      case DatabaseType.LITE:
        return {
          ...baseOptions,
          // Bun SQLite optimizations
          extra: {
            mode: (this.getSqliteMode?.() as any) || 0,
          },
        } as DataSourceOptions;

      case DatabaseType.MYSQL:
      case DatabaseType.MARIADB:
        return {
          ...baseOptions,
          host: this.config.host || "localhost",
          port: this.config.port || 3306,
          username: this.config.username || "root",
          password: this.config.password || "",
          // MySQL optimizations
          extra: {
            connectionLimit: 10,
            acquireTimeout: 60000,
            timeout: 60000,
          },
        } as DataSourceOptions;

      case DatabaseType.POSTGRES:
        return {
          ...baseOptions,
          host: this.config.host || "localhost",
          port: this.config.port || 5432,
          username: this.config.username || "postgres",
          password: this.config.password || "",
          // PostgreSQL optimizations
          extra: {
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        } as DataSourceOptions;

      default:
        return baseOptions;
    }
  }

  private getSqliteMode?(): number {
    try {
      // Try to use better-sqlite3 if available
      if (Database) {
        return Database.OPEN_READWRITE | Database.OPEN_CREATE;
      }
    } catch {
      // Fallback to default mode
    }
    return 0;
  }

  async disconnect(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      this.logger.info("Database disconnected");
    }
  }

  getDataSource(): DataSource | null {
    return this.dataSource;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      return false;
    }

    try {
      await this.dataSource.query("SELECT 1");
      return true;
    } catch (error) {
      this.logger.error("Database health check failed:", error);
      return false;
    }
  }

  async executeQuery<T = any>(query: string, parameters?: any[]): Promise<T> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.dataSource.query(query, parameters);
      return result as T;
    } catch (error) {
      this.logger.error("Query execution failed:", error);
      throw error;
    }
  }

  async transaction<T>(
    callback: (entityManager: any) => Promise<T>,
  ): Promise<T> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error("Database not initialized");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error("Transaction failed:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  getRepository(entity: any): any {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error("Database not initialized");
    }

    return this.dataSource.getRepository(entity);
  }

  async getStats(): Promise<{
    connected: boolean;
    type: string;
    database: string;
    entityCount: number;
  }> {
    const connected = this.dataSource?.isInitialized ?? false;

    return {
      connected,
      type: this.config.type,
      database: this.config.database,
      entityCount: this.config.entities.length,
    };
  }
}

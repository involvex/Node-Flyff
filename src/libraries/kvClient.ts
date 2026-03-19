import fs from "fs";
import path from "path";
import _ from "lodash";

import { Logger } from "../helpers/logger";

export class KvClient {
  private db: any | null = null;
  private memory: Map<string, string> | null = null;
  private expiresMemory: Map<string, number> | null = null;
  private logger: Logger;

  constructor(dbFile?: string) {
    this.logger = new Logger("KV SQLite Client");
    const dataDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const file = dbFile || path.join(dataDir, "kv.db");

    // Try to load better-sqlite3 bindings; if unavailable, fall back to in-memory store
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Database = require("better-sqlite3");
      this.db = new Database(file);
      this.migrate();
      this.logger.main("Using better-sqlite3 for KV storage.");
    } catch (err) {
      this.logger.warn("better-sqlite3 not available or failed to initialize, falling back to in-memory KV store.");
      this.memory = new Map<string, string>();
      this.expiresMemory = new Map<string, number>();
    }
  }

  private migrate() {
    if (!this.db) return;
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS expires (
        key TEXT PRIMARY KEY,
        expireAt INTEGER
      )
    `).run();
  }

  private isExpired(key: string) {
    if (this.db) {
      const row = this.db.prepare(`SELECT expireAt FROM expires WHERE key = ?`).get(key);
      if (!row) return false;
      if (row.expireAt && Date.now() > row.expireAt) {
        this.db.prepare(`DELETE FROM kv WHERE key = ?`).run(key);
        this.db.prepare(`DELETE FROM expires WHERE key = ?`).run(key);
        return true;
      }
      return false;
    }

    if (this.expiresMemory) {
      const exp = this.expiresMemory.get(key);
      if (!exp) return false;
      if (Date.now() > exp) {
        this.memory?.delete(key);
        this.expiresMemory.delete(key);
        return true;
      }
      return false;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    if (this.isExpired(key)) return null;
    if (this.db) {
      const row = this.db.prepare(`SELECT value FROM kv WHERE key = ?`).get(key);
      return row ? row.value : null;
    }
    return this.memory?.get(key) ?? null;
  }

  async set(key: string, value: string | number): Promise<void> {
    if (this.db) {
      this.db.prepare(`INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)`)
        .run(key, String(value));
      return;
    }
    this.memory?.set(key, String(value));
  }

  async del(key: string): Promise<void> {
    if (this.db) {
      this.db.prepare(`DELETE FROM kv WHERE key = ?`).run(key);
      this.db.prepare(`DELETE FROM expires WHERE key = ?`).run(key);
      return;
    }
    this.memory?.delete(key);
    this.expiresMemory?.delete(key);
  }

  async exists(key: string): Promise<number> {
    if (this.isExpired(key)) return 0;
    if (this.db) {
      const row = this.db.prepare(`SELECT 1 FROM kv WHERE key = ?`).get(key);
      return row ? 1 : 0;
    }
    return this.memory?.has(key) ? 1 : 0;
  }

  // keys supports simple glob '*' wildcard
  async keys(pattern: string): Promise<string[]> {
    const like = pattern.replace(/\*/g, "%");
    if (this.db) {
      const rows = this.db.prepare(`SELECT key FROM kv WHERE key LIKE ?`).all(like);
      return rows.map((r: any) => r.key);
    }
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const result: string[] = [];
    for (const k of this.memory?.keys() ?? []) {
      if (regex.test(k)) result.push(k);
    }
    return result;
  }

  // Hash helpers: store hash as JSON under the hashKey
  async hget(hashKey: string, field: string): Promise<string | null> {
    const raw = await this.get(hashKey);
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      return obj[field] !== undefined ? String(obj[field]) : null;
    } catch (err) {
      return null;
    }
  }

  async hgetall(hashKey: string): Promise<{ [k: string]: string } | null> {
    const raw = await this.get(hashKey);
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      return _.mapValues(obj, (v) => String(v));
    } catch (err) {
      return null;
    }
  }

  async hset(hashKey: string, field: string, value: any): Promise<void> {
    const raw = await this.get(hashKey);
    let obj = {} as any;
    if (raw) {
      try { obj = JSON.parse(raw); } catch (_) { obj = {}; }
    }
    obj[field] = value;
    await this.set(hashKey, JSON.stringify(obj));
  }

  async hmset(hashKey: string, obj: Record<string, any>): Promise<void> {
    const raw = await this.get(hashKey);
    let base = {} as any;
    if (raw) {
      try { base = JSON.parse(raw); } catch (_) { base = {}; }
    }
    base = { ...base, ...obj };
    await this.set(hashKey, JSON.stringify(base));
  }

  async expire(key: string, seconds: number): Promise<void> {
    const expireAt = Date.now() + seconds * 1000;
    if (this.db) {
      this.db.prepare(`INSERT OR REPLACE INTO expires (key, expireAt) VALUES (?, ?)`)
        .run(key, expireAt);
      return;
    }
    this.expiresMemory?.set(key, expireAt);
  }
}

export default KvClient;

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import _ from "lodash";

import { ICluster, IChannel } from "../interfaces/cluster";
import { IRedisClient } from "../interfaces/redis";
import { Logger } from "../helpers/logger";

export class SqliteClient implements IRedisClient {
  private logger: Logger;
  private db: any;

  constructor(dbFile?: string) {
    this.logger = new Logger("Sqlite Redis Fallback");
    const dataDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const file = dbFile || path.join(dataDir, "local.db");
    this.db = new Database(file);
    this.migrate();
  }

  private migrate() {
    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS clusters (
        name TEXT PRIMARY KEY,
        host TEXT,
        port INTEGER,
        lastPing INTEGER,
        enabled INTEGER,
        channels TEXT
      )
    `,
      )
      .run();

    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS numpad (
        username TEXT PRIMARY KEY,
        numpad INTEGER
      )
    `,
      )
      .run();

    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS sessions (
        sessionKey INTEGER PRIMARY KEY,
        characterId INTEGER,
        username TEXT,
        password TEXT,
        expireAt INTEGER
      )
    `,
      )
      .run();
  }

  async getAllClusters(): Promise<ICluster[]> {
    const rows = this.db.prepare("SELECT * FROM clusters").all();
    return rows.map((r: any) => ({
      name: r.name,
      host: r.host,
      port: r.port,
      lastPing: r.lastPing || 0,
      channels: JSON.parse(r.channels || "[]"),
      enabled: !!r.enabled,
    }));
  }

  async insertCluster(cluster: ICluster): Promise<void> {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO clusters (name, host, port, lastPing, enabled, channels) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        cluster.name,
        cluster.host,
        cluster.port,
        cluster.lastPing || 0,
        cluster.enabled ? 1 : 0,
        JSON.stringify(cluster.channels || []),
      );
  }

  async updateCluster(cluster: ICluster): Promise<void> {
    await this.insertCluster(cluster);
  }

  async deleteCluster(clusterName: string): Promise<void> {
    this.db.prepare("DELETE FROM clusters WHERE name = ?").run(clusterName);
  }

  async getCluster(clusterName: string): Promise<ICluster | null> {
    const row = this.db
      .prepare("SELECT * FROM clusters WHERE name = ?")
      .get(clusterName);
    if (!row) return null;
    return {
      name: row.name,
      host: row.host,
      port: row.port,
      lastPing: row.lastPing || 0,
      channels: JSON.parse(row.channels || "[]"),
      enabled: !!row.enabled,
    };
  }

  async getAllChannels(clusterName: string): Promise<IChannel[]> {
    const cluster = await this.getCluster(clusterName);
    return cluster?.channels || [];
  }

  async insertChannel(clusterName: string, channel: IChannel): Promise<void> {
    const cluster =
      (await this.getCluster(clusterName)) ||
      ({
        name: clusterName,
        host: "127.0.0.1",
        port: 0,
        lastPing: 0,
        channels: [],
        enabled: true,
      } as ICluster);
    if (_.some(cluster.channels, (c) => c.name === channel.name)) return;
    cluster.channels.push(channel);
    await this.insertCluster(cluster);
  }

  async updateChannel(
    clusterName: string,
    updatedChannel: IChannel,
  ): Promise<void> {
    const cluster = await this.getCluster(clusterName);
    if (!cluster) return;
    const idx = _.findIndex(cluster.channels, { name: updatedChannel.name });
    if (idx >= 0) {
      cluster.channels[idx] = { ...cluster.channels[idx], ...updatedChannel };
    } else cluster.channels.push(updatedChannel);
    await this.insertCluster(cluster);
  }

  async getChannel(
    clusterName: string,
    channelName: string,
  ): Promise<IChannel | null> {
    const cluster = await this.getCluster(clusterName);
    return _.find(cluster?.channels, { name: channelName }) || null;
  }

  async deleteChannel(clusterName: string, channelName: string): Promise<void> {
    const cluster = await this.getCluster(clusterName);
    if (!cluster) return;
    cluster.channels = _.filter(
      cluster.channels,
      (c) => c.name !== channelName,
    );
    await this.insertCluster(cluster);
  }

  async getChannelById(
    clusterName: string,
    id: number,
  ): Promise<IChannel | undefined> {
    const channels = await this.getAllChannels(clusterName);
    return _.find(channels, { id });
  }

  async getNumpadId(username: string): Promise<number | null> {
    const row = this.db
      .prepare("SELECT numpad FROM numpad WHERE username = ?")
      .get(username);
    return row ? row.numpad : null;
  }

  async setNumpadId(username: string, numPadId: number): Promise<void> {
    this.db
      .prepare("INSERT OR REPLACE INTO numpad (username, numpad) VALUES (?, ?)")
      .run(username, numPadId);
  }

  async setCharacterSession(
    sessionKey: number,
    characterId: number,
    username: string,
    password: string,
    expireInSeconds: number,
  ): Promise<void> {
    const expireAt = Date.now() + expireInSeconds * 1000;
    this.db
      .prepare(
        "INSERT OR REPLACE INTO sessions (sessionKey, characterId, username, password, expireAt) VALUES (?, ?, ?, ?, ?)",
      )
      .run(sessionKey, characterId, username, password, expireAt);
  }

  async getCharacterSession(sessionKey: number): Promise<{
    characterId: number;
    username: string;
    password: string;
  } | null> {
    const row = this.db
      .prepare("SELECT * FROM sessions WHERE sessionKey = ?")
      .get(sessionKey);
    if (!row) return null;
    if (row.expireAt && Date.now() > row.expireAt) {
      this.db
        .prepare("DELETE FROM sessions WHERE sessionKey = ?")
        .run(sessionKey);
      return null;
    }
    return {
      characterId: row.characterId,
      username: row.username,
      password: row.password,
    };
  }

  async deleteCharacterSession(sessionKey: number): Promise<void> {
    this.db
      .prepare("DELETE FROM sessions WHERE sessionKey = ?")
      .run(sessionKey);
  }
}

export default SqliteClient;

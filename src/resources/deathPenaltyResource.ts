import fs from "fs";
import path from "path";
import _ from "lodash";
import KvClient from "../libraries/kvClient";
import yaml from "js-yaml";

import { Logger } from "../helpers/logger";
import { ResourcePaths } from "../resources/resourcePaths";
import { DeathPenalty, PenaltyValue } from "../interfaces/resource";
import { tryParseInt } from "../helpers/parsing";

export class DeathPenaltyResources {
  logger: Logger;
  redisClient: any;

  constructor(client?: any) {
    this.logger = new Logger("Death Penalty Resources");
    this.redisClient = client || new KvClient();
  }

  public async getRevivalPenalty(
    level: string | number,
  ): Promise<PenaltyValue | null> {
    const data = await this.redisClient.hgetall(`revivalPenalty:${level}`);
    if (!data) return null;
    return { level: tryParseInt(data.level), value: tryParseInt(data.value) };
  }

  public async getDecreaseExpPenalty(
    level: string | number,
  ): Promise<PenaltyValue | null> {
    const data = await this.redisClient.hgetall(`decreaseExpPenalty:${level}`);
    if (!data) return null;
    return { level: tryParseInt(data.level), value: tryParseInt(data.value) };
  }

  public async getLevelDownPenalty(
    level: string | number,
  ): Promise<PenaltyValue | null> {
    const data = await this.redisClient.hgetall(`levelDownPenalty:${level}`);
    if (!data) return null;
    return { level: tryParseInt(data.level), value: tryParseInt(data.value) };
  }

  public async loadDeathPenalty(): Promise<void> {
    const absolutePath = path.resolve(ResourcePaths.deathPenalty);
    if (!fs.existsSync(absolutePath)) {
      this.logger.error(
        `Unable to load exp character. Reason: cannot find '${absolutePath}' file.`,
      );
    }

    const text = fs.readFileSync(absolutePath, "utf-8");
    const data = yaml.load(text) as DeathPenalty;

    _.forEach(data.revivalPenalty, async (penalty) => {
      await this.redisClient.hmset(`revivalPenalty:${penalty.level}`, penalty);
    });
    _.forEach(data.decreaseExpPenalty, async (penalty) => {
      await this.redisClient.hmset(
        `decreaseExpPenalty:${penalty.level}`,
        penalty,
      );
    });
    _.forEach(data.levelDownPenalty, async (penalty) => {
      await this.redisClient.hmset(
        `levelDownPenalty:${penalty.level}`,
        penalty,
      );
    });
    this.logger.main("Death penalty loaded.");
  }
}

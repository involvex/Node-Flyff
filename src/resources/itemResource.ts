import fs from "fs";
import path from "path";
import _ from "lodash";
import KvClient from "../libraries/kvClient";

import { ResourcePaths } from "../resources/resourcePaths";
import { ItemProperties } from "../interfaces/resource";
import { tryParseInt, cleanString } from "../helpers/parsing";
import { BaseResource } from "../abstract/baseResource";

export class ItemResources extends BaseResource {
  redisClient: any;
  private itemCount: number = 0;

  constructor(client?: any) {
    super("Item");
    this.redisClient = client || new KvClient();
  }

  public getItemCount(): number {
    return this.itemCount;
  }

  public async get(
    itemIdentifier: string | number,
  ): Promise<ItemProperties | null> {
    const itemId =
      typeof itemIdentifier === "number"
        ? itemIdentifier
        : await this.redisClient.hget("itemDefines", itemIdentifier);
    if (!_.isNil(itemId)) {
      const data = await this.redisClient.hgetall(`item:${itemId}`);
      return data ? this.parseItemProperties(data) : null;
    }
    return null;
  }

  public async where(
    predicate: (item: ItemProperties) => boolean,
  ): Promise<ItemProperties[]> {
    const items: ItemProperties[] = [];
    try {
      const keys = await this.redisClient.keys("item:%");
      if (keys && keys.length > 0) {
        for (const key of keys) {
          const data = await this.redisClient.hgetall(key);
          if (data) {
            const item = this.parseItemProperties(data);
            if (predicate(item)) items.push(item);
          }
        }
      }
    } catch (err) {
      this.logLoadError("Error retrieving keys from KV store", err as Error);
    }
    return items;
  }

  public async loadDefines(): Promise<void> {
    const absolutePath = path.resolve(ResourcePaths.defineItem);
    if (!fs.existsSync(absolutePath)) {
      this.logger.warn("Unable to load items. Reason: cannot find file.");
    }

    const data = fs.readFileSync(absolutePath, "utf8");

    const lines = data.split("\n");
    _.forEach(lines, async (line) => {
      if (_.trim(line).startsWith("#define")) {
        const parts = _.trim(line).split(/\s+/);
        const id = tryParseInt(parts[2]);
        const name = parts[1];

        if (!_.isNaN(id) && name !== "") {
          await this.redisClient.hset("itemDefines", name, id);
        }
      }
    });
  }

  public async loadItemsPropStrings(): Promise<void> {
    const absolutePath = path.resolve(ResourcePaths.itemsText);
    if (!fs.existsSync(absolutePath)) {
      this.logger.warn(
        `Unable to load items. Reason: cannot find '${absolutePath}' file.`,
      );
    }
    if (!(await this.redisClient.exists("itemDefines"))) {
      this.logger.warn("Unable to load items. Reason: item defines is empty");
    }

    try {
      const data = fs.readFileSync(absolutePath, "utf16le");
      const lines = data.split("\n").map((_i) => _i.toString().trim());
      const pairs = _.chunk(lines, 2);
      _.forEach(pairs, async (pair, _i) => {
        const [idName, name] = pair[0].split("\t");
        const [idDesc, desc] = pair[1].split("\t");
        await this.redisClient.hset("itemNames", idName, name);
        await this.redisClient.hset("itemDescriptions", idDesc, desc);
      });
    } catch (error) {
      this.logger.error("Error parsing item file:", error);
    }
  }

  public async loadItemsProp(): Promise<void> {
    const absolutePath = path.resolve(ResourcePaths.itemsProp);
    if (!fs.existsSync(absolutePath)) {
      this.logger.warn(
        `Unable to load items. Reason: cannot find '${absolutePath}' file.`,
      );
    }
    if (!(await this.redisClient.exists("itemDefines"))) {
      this.logger.warn("Unable to load items. Reason: item defines is empty");
    }

    await this.cleanCache(); // clean cache

    const _data = fs.readFileSync(absolutePath, "utf8");

    const lines = _data.split("\n");
    _.forEach(lines, async (_line) => {
      const items = _line.trim().split("\t");

      const id = await this.redisClient.hget("itemDefines", items[1]);

      if (!_.isNil(id)) {
        const szName =
          (await this.redisClient.hget("itemNames", cleanString(items[2]))) ||
          "";
        const szComment =
          (await this.redisClient.hget(
            "itemDescriptions",
            cleanString(items[123]),
          )) || "";

        const item: ItemProperties = {
          id: tryParseInt(id),
          ver6: tryParseInt(items[0]),
          dwID: items[1],
          szName,
          szNameId: cleanString(items[2]),
          dwPackMax: tryParseInt(items[4]),
          dwItemKind1: items[5],
          dwItemKind2: items[6],
          dwItemKind3: items[7],
          dwItemJob: items[8],
          bPermanence: items[9] === "TRUE",
          dwUseable: items[10] === "TRUE",
          dwItemSex: tryParseInt(items[11]),
          dwCost: tryParseInt(items[12]),
          dwParts: items[18],
          dwItemLV: tryParseInt(items[23]),
          dwItemRare: tryParseInt(items[24]),
          dwAbilityMin: tryParseInt(items[30]),
          dwAbilityMax: tryParseInt(items[31]),
          eItemType: items[32],
          dwAttackSpeed: tryParseInt(items[49]),
          dwDestParam1: cleanString(items[53]),
          dwDestParam2: cleanString(items[54]),
          dwDestParam3: cleanString(items[55]),
          nAdjParamVal1: tryParseInt(items[56]),
          nAdjParamVal2: tryParseInt(items[57]),
          nAdjParamVal3: tryParseInt(items[58]),
          dwSfxObj: cleanString(items[79]),
          dwSfxObj2: cleanString(items[80]),
          dwSfxObj3: cleanString(items[81]),
          dwSfxObj4: cleanString(items[82]),
          dwSfxObj5: cleanString(items[83]),
          dwCircleTime: tryParseInt(items[85]),
          dwSkillReady: tryParseInt(items[76]),
          dwWeaponType: tryParseInt(items[39]),
          dwItemAtkOrder1: tryParseInt(items[40]),
          dwItemAtkOrder2: tryParseInt(items[41]),
          dwItemAtkOrder3: tryParseInt(items[42]),
          dwItemAtkOrder4: tryParseInt(items[43]),
          dwSkillReadyType: tryParseInt(items[75]),
          dwReferStat1: items[91],
          dwAddSkillMin: tryParseInt(items[36]),
          dwAddSkillMax: tryParseInt(items[37]),
          dwReqMp: tryParseInt(items[68]),
          dwReqFp: tryParseInt(items[69]),
          dwReferStat2: cleanString(items[92]),
          dwLimitLevel1: tryParseInt(items[116]),
          dwReferTarget1: cleanString(items[93]),
          dwReferTarget2: cleanString(items[94]),
          dwReferValue1: tryParseInt(items[95]),
          dwReferValue2: tryParseInt(items[96]),
          dwFlightLimit: tryParseInt(items[112]),
          dwFFuelReMax: tryParseInt(items[113]),
          dwAFuelReMax: tryParseInt(items[114]),
          dwReflect: tryParseInt(items[117]),
          dwQuestID: tryParseInt(items[121]),
          szComment,
        };

        if (item.id) {
          this.redisClient.hmset(`item:${item.id}`, item);
        }
      }
    });

    this.logger.main("Items loaded.");
  }

  parseItemProperties(_data: { [key: string]: string }): ItemProperties {
    return {
      id: parseInt(_data.id),
      ver6: parseInt(_data.ver6),
      dwID: _data.dwID,
      szName: _data.szName,
      szNameId: _data.szNameId,
      dwPackMax: parseInt(_data.dwPackMax),
      dwItemKind1: _data.dwItemKind1,
      dwItemKind2: _data.dwItemKind2,
      dwItemKind3: _data.dwItemKind3,
      dwItemJob: _data.dwItemJob,
      bPermanence: _data.bPermanence === "true",
      dwUseable: _data.dwUseable === "true",
      dwItemSex: parseInt(_data.dwItemSex),
      dwCost: parseInt(_data.dwCost),
      dwLimitLevel1: parseInt(_data.dwLimitLevel1),
      dwParts: _data.dwParts,
      dwAbilityMin: parseInt(_data.dwAbilityMin),
      dwAbilityMax: parseInt(_data.dwAbilityMax),
      eItemType: _data.eItemType,
      dwItemLV: parseInt(_data.dwItemLV),
      dwItemRare: parseInt(_data.dwItemRare),
      dwAttackSpeed: parseFloat(_data.dwAttackSpeed),
      dwDestParam1: cleanString(_data.dwDestParam1),
      dwDestParam2: cleanString(_data.dwDestParam2),
      dwDestParam3: cleanString(_data.dwDestParam3),
      nAdjParamVal1: parseInt(_data.nAdjParamVal1),
      nAdjParamVal2: parseInt(_data.nAdjParamVal2),
      nAdjParamVal3: parseInt(_data.nAdjParamVal3),
      dwCircleTime: parseInt(_data.dwCircleTime),
      dwSfxObj: cleanString(_data.dwSfxObj),
      dwSfxObj2: cleanString(_data.dwSfxObj2),
      dwSfxObj3: cleanString(_data.dwSfxObj3),
      dwSfxObj4: cleanString(_data.dwSfxObj4),
      dwSfxObj5: cleanString(_data.dwSfxObj5),
      dwSkillReady: parseInt(_data.dwSkillReady),
      dwWeaponType: parseInt(_data.dwWeaponType),
      dwItemAtkOrder1: parseInt(_data.dwItemAtkOrder1),
      dwItemAtkOrder2: parseInt(_data.dwItemAtkOrder2),
      dwItemAtkOrder3: parseInt(_data.dwItemAtkOrder3),
      dwItemAtkOrder4: parseInt(_data.dwItemAtkOrder4),
      dwSkillReadyType: parseInt(_data.dwSkillReadyType),
      dwReferStat1: _data.dwReferStat1,
      dwAddSkillMin: parseInt(_data.dwAddSkillMin),
      dwAddSkillMax: parseInt(_data.dwAddSkillMax),
      dwReqMp: parseInt(_data.dwReqMp),
      dwReqFp: parseInt(_data.dwReqFp),
      dwReferStat2: cleanString(_data.dwReferStat2),
      dwReferTarget1: cleanString(_data.dwReferTarget1),
      dwReferTarget2: cleanString(_data.dwReferTarget2),
      dwReferValue1: parseInt(_data.dwReferValue1),
      dwReferValue2: parseInt(_data.dwReferValue2),
      dwFlightLimit: parseInt(_data.dwFlightLimit),
      dwFFuelReMax: parseInt(_data.dwFFuelReMax),
      dwAFuelReMax: parseInt(_data.dwAFuelReMax),
      dwReflect: parseInt(_data.dwReflect),
      dwQuestID: parseInt(_data.dwQuestID),
      szComment: _data.szComment,
    };
  }

  async cleanCache(): Promise<void> {
    try {
      const _keys = await this.redisClient.keys("item:*");
      if (!_keys || _keys.length === 0) return;
      await this.redisClient.del(..._keys);
    } catch {}
  }
}

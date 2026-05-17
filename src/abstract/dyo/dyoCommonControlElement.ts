import { JobMax } from "../../common/defineJob";
import { BinaryStream } from "../../libraries/binaryStream";
import { DyoElement } from "./dyoElement";

export class DyoCommonControlElement extends DyoElement {
  private CommonControlVersion1 = 0x80000000;
  private CommonControlVersion2 = 0x90000000;
  private MaxControlDropItem = 4;
  private MaxControlDropMonster = 3;
  private MaxTrap = 3;
  private MaxKey = 64;

  // Define the size of the data structure
  private readonly Size = 432;

  version: number = 0;
  set: number = 0;
  setItem: number = 0;
  setLevel: number = 0;
  setQuestNum: number = 0;
  setFlagNum: number = 0;
  setGender: number = 0;
  setJob: boolean[] = new Array<boolean>(JobMax.MAX_JOB);
  setEndu: number = 0;
  minItemNum: number = 0;
  maxItemNum: number = 0;
  insideItemKind: number[] = new Array<number>(this.MaxControlDropItem);
  insideItemPer: number[] = new Array<number>(this.MaxControlDropItem);
  monsterResistanceKind: number[] = new Array<number>(
    this.MaxControlDropMonster
  );

  monsterResistanceNum: number[] = new Array<number>(
    this.MaxControlDropMonster
  );

  monsterActionAttack: number[] = new Array<number>(this.MaxControlDropMonster);
  trapOperTime: number = 0;
  trapRandomPer: number = 0;
  trapDelay: number = 0;
  trapKind: number[] = new Array<number>(this.MaxTrap);
  trapLevel: number[] = new Array<number>(this.MaxTrap);
  linkControlKey: string = "";
  controlKey: string = "";
  setQuestNum1: number = 0;
  setFlagNum1: number = 0;
  setQuestNum2: number = 0;
  setFlagNum2: number = 0;
  setItemCount: number = 0;
  teleportWorldId: number = 0;
  teleportX: number = 0;
  teleportY: number = 0;
  teleportZ: number = 0;

  constructor () {
    super();
    this.insideItemKind.fill(0);
    this.insideItemPer.fill(0);
    this.monsterResistanceKind.fill(0);
    this.monsterResistanceNum.fill(0);
    this.monsterActionAttack.fill(0);
    this.trapKind.fill(0);
    this.trapLevel.fill(0);
  }

  read (streamReader: BinaryStream): void {
    this.version = streamReader.readUInt32();

    if (this.version === this.CommonControlVersion1) {
      this.set = streamReader.readUInt32();
      this.setItem = streamReader.readUInt32();
      this.setLevel = streamReader.readUInt32();
      this.setQuestNum = streamReader.readUInt32();
      this.setFlagNum = streamReader.readUInt32();
      this.setGender = streamReader.readUInt32();

      for (let i = 0; i < this.setJob.length; i++) {
        this.setJob[i] = streamReader.readInt32() === 1;
      }

      this.setEndu = streamReader.readUInt32();
      this.minItemNum = streamReader.readUInt32();
      this.maxItemNum = streamReader.readUInt32();

      for (let i = 0; i < this.MaxControlDropItem; i++) {
        this.insideItemKind[i] = streamReader.readUInt32();
        this.insideItemPer[i] = streamReader.readUInt32();
      }

      for (let i = 0; i < this.MaxControlDropMonster; i++) {
        this.monsterResistanceKind[i] = streamReader.readUInt32();
        this.monsterResistanceNum[i] = streamReader.readUInt32();
        this.monsterActionAttack[i] = streamReader.readUInt32();
      }

      this.trapOperTime = streamReader.readUInt32();
      this.trapRandomPer = streamReader.readUInt32();
      this.trapDelay = streamReader.readUInt32();

      for (let i = 0; i < this.MaxTrap; i++) {
        this.trapKind[i] = streamReader.readUInt32();
        this.trapLevel[i] = streamReader.readUInt32();
      }

      this.linkControlKey = streamReader
        .readBytes(this.MaxKey)
        .toString("utf8");
      this.controlKey = streamReader.readBytes(this.MaxKey).toString("utf8");

      this.setQuestNum1 = streamReader.readUInt32();
      this.setFlagNum1 = streamReader.readUInt32();
      this.setQuestNum2 = streamReader.readUInt32();
      this.setFlagNum2 = streamReader.readUInt32();
      this.setItemCount = streamReader.readUInt32();
      this.teleportWorldId = streamReader.readUInt32();
      this.teleportX = streamReader.readUInt32();
      this.teleportY = streamReader.readUInt32();
      this.teleportZ = streamReader.readUInt32();
    } else if (this.version === this.CommonControlVersion2) {
      this.set = streamReader.readUInt32();
      this.setItem = streamReader.readUInt32();
      this.setLevel = streamReader.readUInt32();
      this.setQuestNum = streamReader.readUInt32();
      this.setFlagNum = streamReader.readUInt32();
      this.setGender = streamReader.readUInt32();

      for (let i = 0; i < this.setJob.length; i++) {
        this.setJob[i] = streamReader.readInt32() === 1;
      }

      this.setEndu = streamReader.readUInt32();
      this.minItemNum = streamReader.readUInt32();
      this.maxItemNum = streamReader.readUInt32();

      for (let i = 0; i < this.MaxControlDropItem; i++) {
        this.insideItemKind[i] = streamReader.readUInt32();
      }

      this.insideItemPer[0] = streamReader.readUInt32();
      this.trapOperTime = streamReader.readUInt32();
      this.trapRandomPer = streamReader.readUInt32();
      this.trapDelay = streamReader.readUInt32();

      for (let i = 0; i < this.MaxTrap; i++) {
        this.trapKind[i] = streamReader.readUInt32();
        this.trapLevel[i] = streamReader.readUInt32();
      }

      this.linkControlKey = streamReader
        .readBytes(this.MaxKey)
        .toString("utf8");
      this.controlKey = streamReader.readBytes(this.MaxKey).toString("utf8");

      this.setQuestNum1 = streamReader.readUInt32();
      this.setFlagNum1 = streamReader.readUInt32();
      this.setQuestNum2 = streamReader.readUInt32();
      this.setFlagNum2 = streamReader.readUInt32();
      this.setItemCount = streamReader.readUInt32();
      this.teleportWorldId = streamReader.readUInt32();
      this.teleportX = streamReader.readUInt32();
      this.teleportY = streamReader.readUInt32();
      this.teleportZ = streamReader.readUInt32();
    } else {
      this.set = this.version;
      streamReader.position += this.Size - 4 * 10; // sizeof(uint) * 10;
      this.setItem = streamReader.readUInt32();
    }
  }
}

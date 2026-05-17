import { AttackFlags } from "../../common/attackFlag";

export class AttackResult {
  damages: number;
  flags: AttackFlags;

  constructor (damages: number, flags: AttackFlags) {
    this.damages = damages;
    this.flags = flags;
  }

  static miss (): AttackResult {
    return new AttackResult(0, AttackFlags.AF_MISS);
  }

  static success (damages: number, attackFlags: AttackFlags): AttackResult {
    return new AttackResult(damages, attackFlags);
  }

  get Damages (): number {
    return this.damages;
  }

  get Flags (): AttackFlags {
    return this.flags;
  }
}

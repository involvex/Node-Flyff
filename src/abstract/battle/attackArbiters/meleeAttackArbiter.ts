import { AttackFlags } from "../../../common/attackFlag";
import { DefineAttributes } from "../../../common/defineAttributes";
import { Mover } from "../../../entities/mover";
import { Player } from "../../../entities/player";
import { Monster } from "../../../entities/monster";
import { FFRandom } from "../../../helpers/FFRandom";
import { RangeHelper } from "../../range";
import { AttackResult } from "../attackResult";
import { AttackArbiterBase } from "./attackArbiterBase";

export class MeleeAttackArbiter extends AttackArbiterBase {
  public static MinimalHitRate = 20;
  public static MaximalHitRate = 96;
  private readonly _attackFlags: AttackFlags;
  private readonly _attackPower: number;

  constructor (
    attacker: Mover,
    defender: Mover,
    attackFlags: AttackFlags = AttackFlags.AF_GENERIC,
    attackPower = 0
  ) {
    super(attacker, defender);
    this._attackFlags = attackFlags;
    this._attackPower = attackPower;
  }

  calculateDamages (): AttackResult {
    let flags = this.getAttackFlags();

    if (flags & AttackFlags.AF_MISS) {
      return AttackResult.miss();
    }

    let attackRange: RangeHelper<number> | null = null;

    if (this.attacker instanceof Player) {
      // TODO: Implement weapon attack damages
      // const weapon = this.attacker.inventory.getEquipedItem(ItemPartType.RightWeapon);
      // const weaponAttack = this.getWeaponAttackDamages(this.attacker, weapon.properties.weaponType);
      // attackRange = new RangeHelper<number>(weapon.properties.abilityMin * 2 + weaponAttack, weapon.properties.abilityMax * 2 + weaponAttack);
    } else if (this.attacker instanceof Monster) {
      attackRange = new RangeHelper<number>(
        this.attacker.properties.dwAtkMin,
        this.attacker.properties.dwAtkMax
      );
    }

    if (!attackRange) {
      return AttackResult.miss();
    }

    if (this.isCriticalAttack(this.attacker, flags)) {
      flags |= AttackFlags.AF_CRITICAL;
      attackRange = this.calculateCriticalDamages(attackRange);

      if (this.isKnockback(flags)) {
        flags |= AttackFlags.AF_FLYING;
      }
    }

    let damages = FFRandom.random(attackRange.minimum, attackRange.maximum);

    if (flags & AttackFlags.AF_RANGE) {
      damages = Math.round(damages * this.getChargeAttackMultiplier());
    }

    return AttackResult.success(damages, flags);
  }

  private getAttackFlags (): AttackFlags {
    let hitRate = 0;
    const hitRating = this.getHitRating(this.attacker);
    const escapeRating = this.getEscapeRating(this.defender);

    // if (this.attacker instanceof Monster && this.defender instanceof Player) {
    //   hitRate = (hitRating * 1.5 / (hitRating + escapeRating) * 2.0 * (this.attacker.level * 0.5 / (this.attacker.level + this.defender.level * 0.3)) * 100.0);
    // } else {
    //   hitRate = (hitRating * 1.6 / (hitRating + escapeRating) * 1.5 * (this.attacker.level * 1.2 / (this.attacker.level + this.defender.level)) * 100.0);
    // }

    // Basic fallback calculation until full formula is implemented
    if (hitRating + escapeRating > 0) {
      hitRate = ((hitRating * 1.6) / (hitRating + escapeRating)) * 1.5;
      // incorporate simple level scaling when available
      try {
        const attLevel = (this.attacker as { level?: number }).level ?? 1;
        const defLevel = (this.defender as { level?: number }).level ?? 1;
        hitRate = hitRate * ((attLevel * 1.2) / (attLevel + defLevel));
      } catch {
        // ignore and keep hitRate as-is
      }
      hitRate = Math.round(hitRate * 100.0);
    } else {
      hitRate = MeleeAttackArbiter.MinimalHitRate;
    }

    hitRate = Math.min(
      Math.max(hitRate, MeleeAttackArbiter.MinimalHitRate),
      MeleeAttackArbiter.MaximalHitRate
    );

    return FFRandom.random(0, 100) < hitRate
      ? this._attackFlags
      : AttackFlags.AF_MISS;
  }

  public getHitRating (entity: Mover): number {
    if (entity instanceof Player) {
      return (
        entity.statistics.dexterity +
        entity.attributes.get(DefineAttributes.DST_DEX)
      );
    } else if (entity instanceof Monster) {
      return entity.properties.dwHR;
    }
    return 0;
  }

  public getEscapeRating (entity: Mover): number {
    if (entity instanceof Player) {
      // For players, escape rating might be based on dexterity? Or maybe agility?
      // Since we don't have agility, let's use dexterity for now.
      return (
        entity.statistics.dexterity +
        entity.attributes.get(DefineAttributes.DST_DEX)
      );
    } else if (entity instanceof Monster) {
      // For monsters, maybe they have an escape rating property?
      return entity.properties.dwER ?? 0;
    }
    return 0;
  }

  private isCriticalAttack (
    attacker: Mover,
    currentAttackFlags: AttackFlags
  ): boolean {
    if (
      currentAttackFlags & AttackFlags.AF_MELEE_SKILL ||
      currentAttackFlags & AttackFlags.AF_MAGIC_SKILL
    ) {
      return false;
    }

    let baseDexterity: number = 0;
    let criticalJobFactor: number = 0;

    if (attacker instanceof Player) {
      baseDexterity = attacker.statistics.dexterity;
      criticalJobFactor = attacker.job.critical;
    } else if (attacker instanceof Monster) {
      baseDexterity = attacker.statistics.dexterity;
      criticalJobFactor = 1;
    }

    let criticalProbability = Math.round(
      ((baseDexterity + attacker.attributes.get(DefineAttributes.DST_DEX)) /
        10) *
        criticalJobFactor
    );

    if (criticalProbability < 0) {
      criticalProbability = 0;
    }

    return FFRandom.random(0, 100) < criticalProbability;
  }

  private calculateCriticalDamages (
    actualAttackRange: RangeHelper<number>
  ): RangeHelper<number> {
    const criticalMin = 1.1;
    const criticalMax = 1.4;

    // if (this.attacker.level > this.defender.level) {
    //   if (this.defender instanceof Monster) {
    //     criticalMin = 1.2;
    //     criticalMax = 2.0;
    //   } else {
    //     criticalMin = 1.4;
    //     criticalMax = 1.8;
    //   }
    // }

    let criticalBonus = 1; // TODO: 1 + (DST_CRITICAL_BONUS / 100)

    if (criticalBonus < 0.1) {
      criticalBonus = 0.1;
    }

    const attackMin = Math.round(
      actualAttackRange.minimum * criticalMin * criticalBonus
    );
    const attackMax = Math.round(
      actualAttackRange.maximum * criticalMax * criticalBonus
    );

    return new RangeHelper<number>(attackMin, attackMax);
  }

  private isKnockback (_attackerAttackFlags: AttackFlags): boolean {
    const knockbackChance = FFRandom.random(0, 100) < 15;

    if (this.defender instanceof Player) {
      return false;
    }

    // if (this.attacker instanceof Player) {
    //   const weapon = this.attacker.inventory.getEquipedItem(ItemPartType.RightWeapon);

    //   if (weapon.properties.weaponType === WeaponType.MELEE_YOYO || attackerAttackFlags & AttackFlags.AF_FORCE) {
    //     return false;
    //   }
    // }

    const canFly = false;

    // if (this.defender.objectState & ObjectState.OBJSTA_DMG_FLY_ALL && this.defender instanceof Monster) {
    //   canFly = this.defender.properties.class !== MoverClassType.RANK_SUPER &&
    //       this.defender.properties.class !== MoverClassType.RANK_MATERIAL &&
    //       this.defender.properties.class !== MoverClassType.RANK_MID_BOSS;
    // }

    return canFly && knockbackChance;
  }

  private getChargeAttackMultiplier (): number {
    if (!(this._attackFlags & AttackFlags.AF_RANGE)) {
      return 1;
    }

    switch (this._attackPower) {
      case 0:
        return 1.0;
      case 1:
        return 1.2;
      case 2:
        return 1.5;
      case 3:
        return 1.8;
      case 4:
        return 2.2;
      default:
        return 1.0;
    }
  }
}

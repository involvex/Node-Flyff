import { Item } from "../../../common/item";
import { ItemPartType } from "../../../common/itemPartyType";
import { SkillReferTargetType } from "../../../common/skillPreferTargetType";
import { Mover } from "../../../entities/mover";
import { Player } from "../../../entities/player";
import { FFRandom } from "../../../helpers/FFRandom";
import { RangeHelper } from "../../range";
import { Skill } from "../../skill";
import { AttackArbiterBase } from "./attackArbiterBase";
import { ItemProperties } from "../../../interfaces/resource";

export class SkillAttackArbiterBase extends AttackArbiterBase {
  protected readonly skill: Skill;

  constructor (attacker: Mover, defender: Mover, skill: Skill) {
    super(attacker, defender);
    this.skill = skill;
  }

  protected getAttackerSkillPower (): number {
    const skillProps = this.skill.Properties ?? this.skill.properties ?? {};
    const levelProps =
      this.skill.levelProperties ?? this.skill.levelProperties ?? {};
    const skillLevel: number = this.skill.Level ?? this.skill.level ?? 0;

    let referStatistic1: number = this.attacker.attributes.get(
      skillProps.referStat1
    );
    let referStatistic2: number = this.attacker.attributes.get(
      skillProps.referStat2
    );

    if (
      skillProps.referTarget1 === SkillReferTargetType.Attack &&
      referStatistic1 !== 0
    ) {
      referStatistic1 =
        (skillProps.referValue1 / 10) * referStatistic1 +
        skillLevel * (referStatistic1 / 50);
    }

    if (
      skillProps.referTarget2 === SkillReferTargetType.Attack &&
      referStatistic2 !== 0
    ) {
      referStatistic2 =
        (skillProps.referValue2 / 10) * referStatistic2 +
        skillLevel * (referStatistic2 / 50);
    }

    const referStatistic: number = referStatistic1 + referStatistic2;
    const attack: RangeHelper<number> =
      this.attacker instanceof Player && this.defender instanceof Player
        ? new RangeHelper<number>(
            levelProps.abilityMinPVP,
            levelProps.abilityMaxPVP
          )
        : new RangeHelper<number>(levelProps.abilityMin, levelProps.abilityMax);

    let weaponItem: Item | null = null;

    if (this.attacker instanceof Player) {
      weaponItem = this.attacker.inventory.getEquipedItem(
        ItemPartType.RightWeapon
      );
    }

    const weaponAttackPower: RangeHelper<number> = this.getWeaponAttackPower(
      this.attacker,
      weaponItem
    );
    const weaponExtraDamages: number = this.getWeaponExtraDamages(
      this.attacker,
      weaponItem
    );

    const weaponProps = weaponItem?.properties as ItemProperties | undefined;
    const attackMin = attack.minimum + (weaponProps?.attackSkillMin ?? 0);
    const attackMax = attack.maximum + (weaponProps?.attackSkillMax ?? 0);

    let powerMin: number =
      ((weaponAttackPower.minimum + attackMin * 5 + referStatistic - 20) *
        (16 + skillLevel)) /
      13;
    let powerMax: number =
      ((weaponAttackPower.maximum + attackMax * 5 + referStatistic - 20) *
        (16 + skillLevel)) /
      13;

    // TODO: check CHR_DMG
    powerMin += weaponExtraDamages;
    powerMax += weaponExtraDamages;

    const attackMinMax: number = Math.max(powerMax - powerMin + 1, 1);

    // Use floatRandomBetween for ranged float selection
    return Math.floor(
      powerMin +
        (FFRandom.floatRandomBetween
          ? FFRandom.floatRandomBetween(1, attackMinMax)
          : FFRandom.floatRandom())
    );
  }
}

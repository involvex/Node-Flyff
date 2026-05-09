import { Logger } from "../helpers/logger";
import { Vector3 } from "../abstract/vector3";
import { WorldObject } from "../abstract/worldObject";
import { Player } from "../entities/player";
import { Monster } from "../entities/monster";

export interface CombatResult {
  attackerId: number;
  targetId: number;
  damage: number;
  isCritical: boolean;
  isBlocked: boolean;
  attackType: string;
  timestamp: number;
}

export interface CombatStats {
  totalDamage: number;
  totalHits: number;
  totalCrits: number;
  totalBlocks: number;
  accuracy: number;
  averageDamage: number;
}

export class CombatSystem {
  private logger: Logger;
  private combatResults: Map<number, CombatResult[]> = new Map(); // attackerId -> results
  private combatCooldowns: Map<number, number> = new Map(); // attackerId -> cooldown end time
  private defaultAttackCooldown: number = 1000; // 1 second
  private criticalHitChance: number = 0.1; // 10% chance
  private blockChance: number = 0.15; // 15% chance

  constructor() {
    this.logger = new Logger("CombatSystem");
  }

  performAttack(
    attacker: WorldObject,
    target: WorldObject,
    attackType: string = "melee"
  ): CombatResult | null {
    // Check cooldown
    const cooldownEnd = this.combatCooldowns.get(attacker.objectId) || 0;
    if (Date.now() < cooldownEnd) {
      this.logger.info(`Attack on cooldown for entity ${attacker.objectId}`);
      return null;
    }

    // Calculate damage
    const damage = this.calculateDamage(attacker, target);
    const isCritical = this.isCriticalHit();
    const isBlocked = this.isBlocked();

    // Apply damage modifiers
    const finalDamage = isCritical
      ? damage * 2
      : isBlocked
        ? damage * 0.5
        : damage;

    const result: CombatResult = {
      attackerId: attacker.objectId,
      targetId: target.objectId,
      damage: Math.floor(finalDamage),
      isCritical,
      isBlocked,
      attackType,
      timestamp: Date.now()
    };

    // Store result
    if (!this.combatResults.has(attacker.objectId)) {
      this.combatResults.set(attacker.objectId, []);
    }
    this.combatResults.get(attacker.objectId)!.push(result);

    // Set cooldown
    this.setAttackCooldown(attacker.objectId);

    this.logger.info(
      `Attack: ${attacker.objectId} -> ${target.objectId}, ` +
        `Damage: ${result.damage}, Crit: ${isCritical}, Blocked: ${isBlocked}`
    );

    return result;
  }

  private calculateDamage(attacker: WorldObject, target: WorldObject): number {
    // Base damage calculation (simplified)
    let baseDamage = 10;

    // If attacker is a player, use their stats
    if (attacker instanceof Player) {
      const stats = attacker.statistics;
      if (stats) {
        baseDamage = 5 + stats.strength * 0.5 + stats.dexterity * 0.2;
      }
    }

    // If target is a monster, consider defense
    if (target instanceof Monster) {
      const defense = target.defense ? target.defense.get() : 0;
      baseDamage = Math.max(1, baseDamage - defense);
    }

    // Add some randomness
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    baseDamage *= randomFactor;

    return Math.floor(baseDamage);
  }

  private isCriticalHit(): boolean {
    return Math.random() < this.criticalHitChance;
  }

  private isBlocked(): boolean {
    return Math.random() < this.blockChance;
  }

  setAttackCooldown(attackerId: number, duration?: number): void {
    const cooldown = duration || this.defaultAttackCooldown;
    this.combatCooldowns.set(attackerId, Date.now() + cooldown);
  }

  getAttackCooldown(attackerId: number): number {
    const cooldownEnd = this.combatCooldowns.get(attackerId) || 0;
    const remaining = Math.max(0, cooldownEnd - Date.now());
    return remaining;
  }

  isOnCooldown(attackerId: number): boolean {
    return this.getAttackCooldown(attackerId) > 0;
  }

  getCombatResults(attackerId: number): CombatResult[] {
    return this.combatResults.get(attackerId) || [];
  }

  getCombatStats(attackerId: number): CombatStats {
    const results = this.combatResults.get(attackerId) || [];

    if (results.length === 0) {
      return {
        totalDamage: 0,
        totalHits: 0,
        totalCrits: 0,
        totalBlocks: 0,
        accuracy: 0,
        averageDamage: 0
      };
    }

    const totalDamage = results.reduce((sum, r) => sum + r.damage, 0);
    const totalHits = results.length;
    const totalCrits = results.filter((r) => r.isCritical).length;
    const totalBlocks = results.filter((r) => r.isBlocked).length;
    const averageDamage = totalDamage / totalHits;
    const accuracy = 1.0 - totalBlocks / totalHits;

    return {
      totalDamage,
      totalHits,
      totalCrits,
      totalBlocks,
      accuracy,
      averageDamage
    };
  }

  clearCombatResults(attackerId?: number): void {
    if (attackerId) {
      this.combatResults.delete(attackerId);
    } else {
      this.combatResults.clear();
    }
  }

  removeEntity(entityId: number): void {
    this.combatResults.delete(entityId);
    this.combatCooldowns.delete(entityId);
  }

  getCriticalHitChance(): number {
    return this.criticalHitChance;
  }

  setCriticalHitChance(chance: number): void {
    this.criticalHitChance = Math.max(0, Math.min(1, chance));
    this.logger.info(
      `Critical hit chance set to ${(this.criticalHitChance * 100).toFixed(1)}%`
    );
  }

  getBlockChance(): number {
    return this.blockChance;
  }

  setBlockChance(chance: number): void {
    this.blockChance = Math.max(0, Math.min(1, chance));
    this.logger.info(
      `Block chance set to ${(this.blockChance * 100).toFixed(1)}%`
    );
  }

  getDefaultAttackCooldown(): number {
    return this.defaultAttackCooldown;
  }

  setDefaultAttackCooldown(cooldown: number): void {
    this.defaultAttackCooldown = cooldown;
    this.logger.info(`Default attack cooldown set to ${cooldown}ms`);
  }

  getStats(): {
    totalCombatants: number;
    totalAttacks: number;
    totalDamage: number;
    averageDamage: number;
    criticalRate: number;
    blockRate: number;
    } {
    let totalAttacks = 0;
    let totalDamage = 0;
    let totalCrits = 0;
    let totalBlocks = 0;

    for (const results of this.combatResults.values()) {
      totalAttacks += results.length;
      totalDamage += results.reduce((sum, r) => sum + r.damage, 0);
      totalCrits += results.filter((r) => r.isCritical).length;
      totalBlocks += results.filter((r) => r.isBlocked).length;
    }

    const averageDamage = totalAttacks > 0 ? totalDamage / totalAttacks : 0;
    const criticalRate = totalAttacks > 0 ? totalCrits / totalAttacks : 0;
    const blockRate = totalAttacks > 0 ? totalBlocks / totalAttacks : 0;

    return {
      totalCombatants: this.combatResults.size,
      totalAttacks,
      totalDamage,
      averageDamage,
      criticalRate,
      blockRate
    };
  }

  clear(): void {
    this.combatResults.clear();
    this.combatCooldowns.clear();
    this.logger.info("Combat system cleared");
  }
}

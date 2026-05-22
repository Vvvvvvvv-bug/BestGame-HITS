import { eventBus } from './EventBus';
import {
  BUILDING_CONFIGS,
  FREEZE_TURRET_COST_MULTIPLIER,
  scaleCost,
  TURRET_BUILD_BASE_COST,
  TURRET_CONFIGS,
} from './BuildingConfigs';
import type { ResourceCost } from './BuildingConfigs';

export class GameState {
  public resources = {
    iron: 2200,
    stone: 1800,
    gradePoint: 3,
  };

  public drillsBuilt = 0;
  public turretsBuilt = 0;
  public unlockedTurretLevel = 1;
  public freezeTurretUnlocked = false;
  public turretUpgrades = new Set<string>();

  constructor() {
    eventBus.on('resource-mined', (payload) => {
      this.resources[payload.type] += payload.amount;
    });
  }

  public getDrillCost(): ResourceCost {
    return scaleCost(BUILDING_CONFIGS.drill.cost, Math.pow(2, this.drillsBuilt));
  }

  public getWallCost(): ResourceCost {
    return BUILDING_CONFIGS.wall.cost;
  }

  public getBombCost(): ResourceCost {
    return BUILDING_CONFIGS.bomb.cost;
  }

  public getTurretBuildCost(): number {
    return Math.ceil(TURRET_BUILD_BASE_COST * Math.pow(2, this.turretsBuilt));
  }

  public getFreezeTurretBuildCost(): number {
    return Math.ceil(this.getTurretBuildCost() * FREEZE_TURRET_COST_MULTIPLIER);
  }

  public getTurretUnlockCost(level: number): number {
    if (level === 2) return TURRET_CONFIGS.mk2.unlockCost;
    if (level === 3) return TURRET_CONFIGS.mk3.unlockCost;
    return Infinity;
  }

  public getFreezeTurretUnlockCost(): number {
    return TURRET_CONFIGS.freeze.unlockCost;
  }

  public canAffordCost(cost: ResourceCost): boolean {
    return this.resources.iron >= cost.iron && this.resources.stone >= cost.stone;
  }

  public spendCost(cost: ResourceCost): boolean {
    if (!this.canAffordCost(cost)) return false;
    this.resources.iron -= cost.iron;
    this.resources.stone -= cost.stone;
    return true;
  }

  public recordDrillBuilt(): void {
    this.drillsBuilt++;
  }

  public recordTurretBuilt(): void {
    this.turretsBuilt++;
  }

  public buyTurretUpgrade(id: string, cost: number): boolean {
    if (this.turretUpgrades.has(id)) return false;
    if (this.resources.gradePoint < cost) return false;
    this.resources.gradePoint -= cost;
    this.turretUpgrades.add(id);
    return true;
  }

  public getTurretDamageMult(): number {
    let m = 1;
    if (this.turretUpgrades.has('dmg_1')) m += 0.15;
    if (this.turretUpgrades.has('dmg_2')) m += 0.15;
    return m;
  }

  public getTurretCritChance(): number {
    return this.turretUpgrades.has('dmg_3') ? 0.15 : 0;
  }

  public getTurretRangeMult(): number {
    let m = 1;
    if (this.turretUpgrades.has('rng_1')) m += 0.20;
    if (this.turretUpgrades.has('rng_2')) m += 0.20;
    return m;
  }

  public getTurretFireRateMult(): number {
    let m = 1;
    if (this.turretUpgrades.has('fr_1')) m += 0.15;
    if (this.turretUpgrades.has('fr_2')) m += 0.15;
    return m;
  }

  public getTurretHealthMult(): number {
    let m = 1;
    if (this.turretUpgrades.has('hp_1')) m += 0.25;
    if (this.turretUpgrades.has('hp_2')) m += 0.25;
    return m;
  }

  public unlockTurret(level: number): boolean {
    if (level < 2 || level > 3) return false;
    if (level !== this.unlockedTurretLevel + 1) return false;

    const cost = this.getTurretUnlockCost(level);
    if (this.resources.gradePoint < cost) return false;

    this.resources.gradePoint -= cost;
    this.unlockedTurretLevel = level;
    return true;
  }

  public unlockFreezeTurret(): boolean {
    if (this.freezeTurretUnlocked) return false;
    const cost = this.getFreezeTurretUnlockCost();
    if (this.resources.gradePoint < cost) return false;

    this.resources.gradePoint -= cost;
    this.freezeTurretUnlocked = true;
    return true;
  }
}

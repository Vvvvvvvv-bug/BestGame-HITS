import type { Attackable } from './Attackable';
import type { Building } from '../buildings/Building';
import type { Turret } from '../buildings/Turret';
import type { Bomb } from '../buildings/Bomb';
import type { Enemy } from '../enemies/Enemy';

export class BuildingManager {
  private buildings = new Map<string, Building>();
  private turrets = new Map<string, Turret>();
  private bombs = new Map<string, Bomb>();
  private attackables: Attackable[] = [];

  addBuilding(key: string, building: Building): void {
    this.buildings.set(key, building);
    this.attackables.push(building);
  }

  addTurret(key: string, turret: Turret): void {
    this.turrets.set(key, turret);
    this.attackables.push(turret);
  }

  addBomb(key: string, bomb: Bomb): void {
    this.bombs.set(key, bomb);
    this.attackables.push(bomb);
  }

  isOccupied(key: string): boolean {
    return this.buildings.has(key) || this.turrets.has(key) || this.bombs.has(key);
  }

  getBuildings(): Iterable<Building> {
    return this.buildings.values();
  }

  getAttackables(): Attackable[] {
    return this.attackables;
  }

  getTurrets(): Iterable<Turret> {
    return this.turrets.values();
  }

  getBombs(): Iterable<Bomb> {
    return this.bombs.values();
  }

  update(delta: number, enemies: Set<Enemy>): void {
    for (const building of this.buildings.values()) {
      building.update(delta);
    }

    for (const turret of this.turrets.values()) {
      turret.update(delta, enemies);
    }

    for (const bomb of this.bombs.values()) {
      bomb.update(delta);
    }
  }

  removeDestroyed(): void {
    for (const [key, building] of this.buildings.entries()) {
      if (building.healthPoints <= 0) {
        building.destroy();
        this.buildings.delete(key);
      }
    }
    for (const [key, turret] of this.turrets.entries()) {
      if (turret.healthPoints <= 0) {
        turret.destroy();
        this.turrets.delete(key);
      }
    }
    for (const [key, bomb] of this.bombs.entries()) {
      if (bomb.healthPoints <= 0) {
        bomb.destroy();
        this.bombs.delete(key);
      }
    }
    this.rebuildAttackables();
  }

  removeBomb(key: string): void {
    const bomb = this.bombs.get(key);
    if (bomb) {
      bomb.destroy();
      this.bombs.delete(key);
      this.rebuildAttackables();
    }
  }

  clearBombs(): void {
    for (const bomb of this.bombs.values()) {
      bomb.destroy();
    }
    this.bombs.clear();
    this.rebuildAttackables();
  }

  clearAll(): void {
    for (const b of this.buildings.values()) b.destroy();
    for (const t of this.turrets.values()) t.destroy();
    for (const b of this.bombs.values()) b.destroy();
    this.buildings.clear();
    this.turrets.clear();
    this.bombs.clear();
    this.rebuildAttackables();
  }

  private rebuildAttackables(): void {
    this.attackables = [
      ...this.buildings.values(),
      ...this.turrets.values(),
      ...this.bombs.values(),
    ];
  }
}

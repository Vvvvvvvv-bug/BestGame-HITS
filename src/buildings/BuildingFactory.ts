import type { Building } from './Building';
import { Drill } from './Drill';
import { Wall } from './Wall';
import { Turret } from './Turret';
import { Bomb } from './Bomb';
import type { TurretType } from '../core/BuildingConfigs';

const REGISTRY: Record<string, new (scene: Phaser.Scene, x: number, y: number, resourceType?: string) => Building> = {
  drill: Drill,
  wall: Wall,
};

export function createBuilding(
  type: string,
  scene: Phaser.Scene,
  x: number,
  y: number,
  resourceType?: string
): Building {
  const Ctor = REGISTRY[type];
  if (!Ctor) throw new Error(`Unknown building type: ${type}`);
  return new Ctor(scene, x, y, resourceType);
}

export function createTurret(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: TurretType
): Turret {
  return new Turret(scene, x, y, type);
}

export function createBomb(
  scene: Phaser.Scene,
  x: number,
  y: number,
  onDetonate: (bomb: Bomb) => void
): Bomb {
  return new Bomb(scene, x, y, onDetonate);
}

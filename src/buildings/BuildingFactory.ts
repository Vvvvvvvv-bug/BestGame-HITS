import type { Building } from './Building';
import { Drill } from './Drill';
import { Wall } from './Wall';

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

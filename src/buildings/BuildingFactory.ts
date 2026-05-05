import type { Building } from "./Building";
import { Drill } from "./Drill";
import { Wall } from "./Wall";

const REGISTRY: Record<string, new (scene: Phaser.Scene, x:number, y:number) => Building> = {
    drill:Drill,
    wall:Wall
};

export function createBuilding(
  type: string, 
  scene: Phaser.Scene, 
  x: number, 
  y: number, 
  resourceType?: 'iron' | 'stone'
): Building {
  if (type === 'drill') {
    return new Drill(scene, x, y, resourceType || 'iron');
  }
  if (type === 'wall') {
    return new Wall(scene, x, y);
  }
  throw new Error(`Unknown type: ${type}`);
}
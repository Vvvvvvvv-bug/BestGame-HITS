export type ResourceCost = {
  iron: number;
  stone: number;
};

export type TurretType = 'mk1' | 'mk2' | 'mk3' | 'freeze';

export const BUILDING_CONFIGS = {
  drill: { name: 'БУР', cost: { iron: 100, stone: 100 }, healthPoints: 300 },
  wall: { name: 'СТЕНА', cost: { iron: 0, stone: 50 }, healthPoints: 500 },
  bomb: { name: 'БОМБА', cost: { iron: 100, stone: 0 }, healthPoints: 1 }
} as const;

export const EXPLOSIVE_CONFIG = {
  name: 'БОМБА',
  cost: BUILDING_CONFIGS.bomb.cost,
  damage: 80,
  radius: 75,
  cooldown: 1000
} as const;

export const TURRET_CONFIGS = {
  mk1: { level: 1, name: 'Mk I', unlockCost: 0, damage: 8, fireRate: 4, range: 204 },
  mk2: { level: 2, name: 'Mk II', unlockCost: 2000, damage: 11, fireRate: 5, range: 228 },
  mk3: { level: 3, name: 'Mk III', unlockCost: 4000, damage: 15, fireRate: 6, range: 258 },
  freeze: { level: 0, name: 'Cryo', unlockCost: 3000, damage: 6, fireRate: 4, range: 230 }
} as const;

export const TURRET_BUILD_BASE_COST = 500;
export const FREEZE_TURRET_COST_MULTIPLIER = 1.5;

export function scaleCost(cost: ResourceCost, multiplier: number): ResourceCost {
  return {
    iron: Math.ceil(cost.iron * multiplier),
    stone: Math.ceil(cost.stone * multiplier)
  };
}

export function formatCost(cost: ResourceCost): string {
  const parts: string[] = [];
  if (cost.iron > 0) parts.push(`${cost.iron} Fe`);
  if (cost.stone > 0) parts.push(`${cost.stone} St`);
  return parts.length > 0 ? parts.join(' ') : '0';
}

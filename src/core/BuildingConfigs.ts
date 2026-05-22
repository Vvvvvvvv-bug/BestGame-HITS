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
  mk2: { level: 2, name: 'Mk II', unlockCost: 10, damage: 11, fireRate: 5, range: 228 },
  mk3: { level: 3, name: 'Mk III', unlockCost: 15, damage: 15, fireRate: 6, range: 258 },
  freeze: { level: 0, name: 'Cryo', unlockCost: 3, damage: 6, fireRate: 4, range: 230 }
} as const;

export interface TurretUpgradeDef {
  id: string;
  label: string;
  description: string;
  cost: number;
  requires: string | null;
  branch: 'damage' | 'range' | 'fireRate' | 'health';
  tier: number;
}

export const TURRET_UPGRADES: TurretUpgradeDef[] = [
  { id: 'dmg_1', label: 'Урон +15%', description: 'Базовый урон всех турелей +15%', cost: 3, requires: null, branch: 'damage', tier: 1 },
  { id: 'dmg_2', label: 'Урон +30%', description: 'Базовый урон всех турелей +30%', cost: 6, requires: 'dmg_1', branch: 'damage', tier: 2 },
  { id: 'dmg_3', label: 'Крит. удар 15%', description: '15% шанс нанести 2× урон', cost: 10, requires: 'dmg_2', branch: 'damage', tier: 3 },
  { id: 'rng_1', label: 'Дальность +20%', description: 'Дальность стрельбы +20%', cost: 3, requires: null, branch: 'range', tier: 1 },
  { id: 'rng_2', label: 'Дальность +40%', description: 'Дальность стрельбы +40%', cost: 6, requires: 'rng_1', branch: 'range', tier: 2 },
  { id: 'fr_1', label: 'Скорость +15%', description: 'Скорострельность +15%', cost: 3, requires: null, branch: 'fireRate', tier: 1 },
  { id: 'fr_2', label: 'Скорость +30%', description: 'Скорострельность +30%', cost: 6, requires: 'fr_1', branch: 'fireRate', tier: 2 },
  { id: 'hp_1', label: 'Броня +25%', description: 'Прочность турелей +25%', cost: 2, requires: null, branch: 'health', tier: 1 },
  { id: 'hp_2', label: 'Броня +50%', description: 'Прочность турелей +50%', cost: 5, requires: 'hp_1', branch: 'health', tier: 2 },
];

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

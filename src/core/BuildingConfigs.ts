export type ResourceCost = {
    iron: number;
    stone: number;
};

export const BUILDING_CONFIGS = {
    drill: { name: 'БУР', cost: { iron: 100, stone: 100 }, healthPoints: 300 },
    wall: { name: 'СТЕНА', cost: { iron: 0, stone: 20 }, healthPoints: 500 },
    bomb: { name: 'БОМБА', cost: { iron: 30, stone: 0 }, healthPoints: 1 }
} as const;

export const EXPLOSIVE_CONFIG = {
    name: 'БОМБА',
    cost: BUILDING_CONFIGS.bomb.cost,
    damage: 80,
    radius: 150,
    cooldown: 1000
} as const;

export const TURRET_CONFIGS = [
    { level: 1, name: 'Mk I', unlockCost: 1000, damage: 8, fireRate: 4, range: 170 },
    { level: 2, name: 'Mk II', unlockCost: 2000, damage: 11, fireRate: 5, range: 190 },
    { level: 3, name: 'Mk III', unlockCost: 4000, damage: 15, fireRate: 6, range: 215 },
    { level: 4, name: 'Mk IV', unlockCost: 8000, damage: 20, fireRate: 7, range: 240 },
    { level: 5, name: 'Mk V', unlockCost: 16000, damage: 28, fireRate: 8, range: 270 }
] as const;

export const TURRET_BUILD_BASE_COST = 200;

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

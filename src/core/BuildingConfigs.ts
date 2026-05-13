export const BUILDING_CONFIGS = {
    drill: {
        name: 'Drill',
        color: 0x00aaff,
        cost: 50,
        healthPoints: 300
    },
    wall: {
        name: 'Wall',
        color: 0x8B4513,
        cost: 20,
        healthPoints: 50
    }
} as const;

export const BOMB_CONFIG = {
    name: 'Бомба',
    cost: 30,
    damage: 80,
    radius: 150,
    cooldown: 1000
} as const;
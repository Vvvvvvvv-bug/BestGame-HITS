export type WeaponType = 'hand' | 'axe' | 'pistol' | 'machinegun';

export interface WeaponStats {
  name: string;
  damage: number;
  attackSpeed: number; // атак в секунду
  range: number;
  cost: number;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponStats> = {
  hand: {
    name: 'Рука',
    damage: 10,
    attackSpeed: 1,
    range: 50,
    cost: 0
  },
  axe: {
    name: 'Топор',
    damage: 30,
    attackSpeed: 0.75,
    range: 80,
    cost: 200
  },
  pistol: {
    name: 'Пистолет',
    damage: 40,
    attackSpeed: 2,
    range: 300,
    cost: 300
  },
  machinegun: {
    name: 'Пулемет',
    damage: 18,
    attackSpeed: 7,
    range: 360,
    cost: 700
  }
};

export class Weapon {
  type: WeaponType;
  stats: WeaponStats;
  attackTimer: number = 0;
  canAttack: boolean = true;

  constructor(type: WeaponType = 'hand') {
    this.type = type;
    this.stats = WEAPON_CONFIGS[type];
  }

  update(delta: number): void {
    if (!this.canAttack) {
      this.attackTimer += delta;
      const cooldown = 1000 / this.stats.attackSpeed;
      if (this.attackTimer >= cooldown) {
        this.canAttack = true;
        this.attackTimer = 0;
      }
    }
  }

  attack(): boolean {
    if (this.canAttack) {
      this.canAttack = false;
      this.attackTimer = 0;
      return true;
    }
    return false;
  }

  switchWeapon(type: WeaponType): void {
    this.type = type;
    this.stats = WEAPON_CONFIGS[type];
    this.canAttack = true;
    this.attackTimer = 0;
  }
}

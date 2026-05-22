import { Weapon, WEAPON_CONFIGS } from './Weapon';
import type { WeaponType } from './Weapon';
import { Enemy } from '../enemies/Enemy';
import type { Attackable } from '../core/Attackable';

export class Player implements Attackable {
  sprite: Phaser.GameObjects.Sprite;
  private baseScale!: number;
  healthPoints: number = 1000;
  maxHealthPoints: number = 1000;
  weapon: Weapon;
  scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.weapon = new Weapon('hand');

    this.sprite = scene.add.sprite(x, y, 'base');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(30);
    this.sprite.setDisplaySize(64, 64); // 2x2 клетки по 32px
    this.baseScale = this.sprite.scaleX;
  }

  update(delta: number): void {
    this.weapon.update(delta);
  }

  takeDamage(amount: number): boolean {
    this.healthPoints = Math.max(0, this.healthPoints - amount);
    return this.healthPoints <= 0;
  }

  canAffordWeapon(weaponType: WeaponType, availableIron: number): boolean {
    return WEAPON_CONFIGS[weaponType].cost <= availableIron;
  }

  switchWeapon(weaponType: WeaponType): void {
    this.weapon.switchWeapon(weaponType);
  }

  attackEnemy(enemies: Set<Enemy>): Enemy | null {
    if (!this.weapon.attack()) return null;

    let target: Enemy | null = null;
    let minDistance = this.weapon.stats.range;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const dx = enemy.sprite.x - this.sprite.x;
      const dy = enemy.sprite.y - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        target = enemy;
      }
    }

    if (target) {
      const isDead = target.takeDamage(this.weapon.stats.damage);
      // Визуальный эффект атаки
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: this.baseScale * 1.4,
        scaleY: this.baseScale * 0.9,
        duration: 100,
        yoyo: true
      });
      return isDead ? target : null;
    }

    return null;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

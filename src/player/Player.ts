import { Weapon, WEAPON_CONFIGS } from './Weapon';
import type { WeaponType } from './Weapon';
import { Enemy } from '../enemies/Enemy';
import type { Attackable } from '../core/Attackable';

export class Player implements Attackable {
  sprite: Phaser.GameObjects.Sprite;
  private base: Phaser.GameObjects.Rectangle;
  healthPoints: number = 100;
  maxHealthPoints: number = 100;
  weapon: Weapon;
  scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.weapon = new Weapon('hand');

    this.base = scene.add.rectangle(x, y, 64, 64, 0x20344f, 0.28)
      .setStrokeStyle(2, 0x8bd7ff, 0.8)
      .setDepth(29);

    this.sprite = scene.add.sprite(x, y, 'player');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(30);
    this.sprite.setDisplaySize(64, 64);
  }

  update(delta: number): void {
    this.weapon.update(delta);
  }

  takeDamage(amount: number): boolean {
    this.healthPoints = Math.max(0, this.healthPoints - amount);
    return this.healthPoints <= 0;
  }

  canAffordWeapon(weaponType: WeaponType): boolean {
    return WEAPON_CONFIGS[weaponType].cost <= 0;
  }

  switchWeapon(weaponType: WeaponType): void {
    this.weapon.switchWeapon(weaponType);
  }

  attackEnemy(enemies: Set<Enemy>): Enemy | null {
    if (!this.weapon.attack()) return null;

    let target: Enemy | null = null;
    let minDistance = this.weapon.stats.range;

    for (const enemy of enemies) {
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
        scaleX: 1.8,
        scaleY: 1.2,
        duration: 100,
        yoyo: true
      });
      return isDead ? target : null;
    }

    return null;
  }

  destroy(): void {
    this.base.destroy();
    this.sprite.destroy();
  }
}

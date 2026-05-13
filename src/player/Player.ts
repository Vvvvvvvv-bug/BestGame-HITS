import { Weapon, WEAPON_CONFIGS } from './Weapon';
import type { WeaponType } from './Weapon';
import { Enemy } from '../enemies/Enemy';

export class Player {
  sprite: Phaser.GameObjects.Sprite;
  healthPoints: number = 100;
  maxHealthPoints: number = 100;
  weapon: Weapon;
  scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.weapon = new Weapon('hand');

    this.sprite = scene.add.sprite(x, y, 'player', 'body');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(30);
    this.sprite.setScale(1.5);
  }

  update(delta: number): void {
    this.weapon.update(delta);
  }

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;
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
    this.sprite.destroy();
  }
}

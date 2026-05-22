import { TURRET_CONFIGS } from '../core/BuildingConfigs';
import { Enemy } from '../enemies/Enemy';
import type { Attackable } from '../core/Attackable';
import { playSfx } from '../audio/Sfx';

export class Turret implements Attackable {
  public sprite: Phaser.GameObjects.Sprite;
  private cooldown = 0;
  private readonly stats: typeof TURRET_CONFIGS[number];
  private readonly scene: Phaser.Scene;

  healthPoints: number;

  constructor(scene: Phaser.Scene, x: number, y: number, level: number) {
    this.scene = scene;
    this.stats = TURRET_CONFIGS[level - 1] ?? TURRET_CONFIGS[0];
    this.sprite = scene.add.sprite(x, y, `turret-${this.stats.level}`);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(24);
    this.sprite.setDisplaySize(32, 32);
    this.healthPoints = 200;
  }

  public update(delta: number, enemies: Set<Enemy>): void {
    this.cooldown -= delta;
    const target = this.findTarget(enemies);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.sprite.x, target.sprite.y);
    this.sprite.setRotation(angle);

    if (this.cooldown > 0) return;
    this.cooldown = 1000 / this.stats.fireRate;

    const dead = target.takeDamage(this.stats.damage);
    this.drawShot(target);
    playSfx(this.scene, 'turret-shot');

    if (dead) {
      enemies.delete(target);
      target.destroy();
    }
  }

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;
    return this.healthPoints <= 0;
  }

  public destroy(): void {
    this.sprite.destroy();
  }

  private findTarget(enemies: Set<Enemy>): Enemy | null {
    let bestTarget: Enemy | null = null;
    let bestDistance: number = this.stats.range;

    for (const enemy of enemies) {
      const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
      if (distance <= bestDistance) {
        bestDistance = distance;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  private drawShot(target: Enemy): void {
    const startX = this.sprite.x;
    const startY = this.sprite.y;
    const endX = target.sprite.x;
    const endY = target.sprite.y;

    const tracerCore = this.scene.add.line(0, 0, startX, startY, endX, endY, 0xcff6ff, 0.95)
      .setOrigin(0, 0)
      .setLineWidth(2.6, 2.6)
      .setDepth(25);

    const tracerGlow = this.scene.add.line(0, 0, startX, startY, endX, endY, 0x61d8ff, 0.48)
      .setOrigin(0, 0)
      .setLineWidth(6.5, 6.5)
      .setDepth(24);

    const muzzleFlash = this.scene.add.circle(startX, startY, 4, 0xb8f4ff, 0.95).setDepth(26);
    const hitFlash = this.scene.add.circle(endX, endY, 5, 0xfff0bf, 0.9).setDepth(26);

    this.scene.tweens.add({
      targets: [tracerCore, tracerGlow, muzzleFlash, hitFlash],
      alpha: 0,
      duration: 110,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        tracerCore.destroy();
        tracerGlow.destroy();
        muzzleFlash.destroy();
        hitFlash.destroy();
      },
    });
  }
}

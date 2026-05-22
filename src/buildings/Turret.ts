import { TURRET_CONFIGS } from '../core/BuildingConfigs';
import { Enemy } from '../enemies/Enemy';
import type { Attackable } from '../core/Attackable';

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
    const shot = this.scene.add.line(
      0,
      0,
      this.sprite.x,
      this.sprite.y,
      target.sprite.x,
      target.sprite.y,
      0x9df2ff,
      0.72
    ).setOrigin(0, 0).setDepth(23);

    this.scene.tweens.add({
      targets: shot,
      alpha: 0,
      duration: 90,
      onComplete: () => shot.destroy(),
    });
  }
}

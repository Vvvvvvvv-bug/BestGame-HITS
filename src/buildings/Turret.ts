import { TURRET_CONFIGS, type TurretType } from '../core/BuildingConfigs';
import { Enemy } from '../enemies/Enemy';
import type { Attackable } from '../core/Attackable';
import { playSfx } from '../audio/Sfx';
import { GameState } from '../core/GameState';

export class Turret implements Attackable {
  public sprite: Phaser.GameObjects.Sprite;
  private cooldown = 0;
  private readonly type: TurretType;
  private readonly stats: (typeof TURRET_CONFIGS)[TurretType];
  private readonly scene: Phaser.Scene;
  private readonly gameState: GameState;

  healthPoints: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: TurretType, gameState: GameState) {
    this.scene = scene;
    this.type = type;
    this.stats = TURRET_CONFIGS[type];
    this.gameState = gameState;

    const texture = this.type === 'freeze' ? 'turret-freeze' : `turret-${this.stats.level}`;
    this.sprite = scene.add.sprite(x, y, texture);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(24);
    this.sprite.setDisplaySize(32, 32);
    this.healthPoints = Math.round(200 * gameState.getTurretHealthMult());
  }

  public update(delta: number, enemies: Set<Enemy>): void {
    this.cooldown -= delta;
    const target = this.findTarget(enemies);
    if (!target) return;

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.sprite.x, target.sprite.y);
    this.sprite.setRotation(angle);

    if (this.cooldown > 0) return;
    const fireRate = this.stats.fireRate * this.gameState.getTurretFireRateMult();
    this.cooldown = 1000 / fireRate;

    if (this.type === 'freeze') {
      const freezePerShot = 1000 / fireRate;
      target.applyFreezeCharge(freezePerShot);
    }

    let damage = this.stats.damage * this.gameState.getTurretDamageMult();
    if (Math.random() < this.gameState.getTurretCritChance()) {
      damage *= 2;
    }

    target.takeDamage(Math.round(damage));
    this.drawShot(target);
    playSfx(this.scene, 'turret-shot');
  }

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;
    return this.healthPoints <= 0;
  }

  public destroy(): void {
    this.sprite.destroy();
  }

  private findTarget(enemies: Set<Enemy>): Enemy | null {
    const range = this.stats.range * this.gameState.getTurretRangeMult();
    let bestTarget: Enemy | null = null;
    let bestDistance: number = range;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
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

    const coreColor = this.type === 'freeze' ? 0xb8e6ff : 0xcff6ff;
    const glowColor = this.type === 'freeze' ? 0x59b8ff : 0x61d8ff;

    const tracerCore = this.scene.add.line(0, 0, startX, startY, endX, endY, coreColor, 0.95)
      .setOrigin(0, 0)
      .setLineWidth(2.6, 2.6)
      .setDepth(25);

    const tracerGlow = this.scene.add.line(0, 0, startX, startY, endX, endY, glowColor, 0.48)
      .setOrigin(0, 0)
      .setLineWidth(6.5, 6.5)
      .setDepth(24);

    const muzzleFlash = this.scene.add.circle(startX, startY, 4, coreColor, 0.95).setDepth(26);
    const hitFlash = this.scene.add.circle(endX, endY, 5, this.type === 'freeze' ? 0xaed8ff : 0xfff0bf, 0.9).setDepth(26);

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

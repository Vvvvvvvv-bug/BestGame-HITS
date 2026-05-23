import { TURRET_CONFIGS, type TurretType } from '../core/BuildingConfigs';
import { Enemy } from '../enemies/Enemy';
import type { Attackable } from '../core/Attackable';
import { playSfx, createCryoBeam, type CryoBeamSound } from '../audio/Sfx';
import { GameState } from '../core/GameState';

export class Turret implements Attackable {
  public sprite: Phaser.GameObjects.Sprite;
  private cooldown = 0;
  private readonly type: TurretType;
  private readonly stats: (typeof TURRET_CONFIGS)[TurretType];
  private readonly scene: Phaser.Scene;
  private readonly gameState: GameState;

  
  private beamCore?: Phaser.GameObjects.Line;
  private beamGlow?: Phaser.GameObjects.Line;
  private buzz?: CryoBeamSound;
  private beamPulse = 0;

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

    if (this.type === 'freeze') {
      this.buzz = createCryoBeam(scene);
    }
  }

  public update(delta: number, enemies: Set<Enemy>): void {
    this.cooldown -= delta;
    const target = this.findTarget(enemies);

    
    if (this.type === 'freeze') {
      this.updateCryoBeam(delta, target);
      return;
    }

    if (!target) return;

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.sprite.x, target.sprite.y);
    this.sprite.setRotation(angle);

    if (this.cooldown > 0) return;
    const fireRate = this.stats.fireRate * this.gameState.getTurretFireRateMult();
    this.cooldown = 1000 / fireRate;

    let damage = this.stats.damage * this.gameState.getTurretDamageMult();
    if (Math.random() < this.gameState.getTurretCritChance()) {
      damage *= 2;
    }

    target.takeDamage(Math.round(damage));
    this.drawShot(target);
    playSfx(this.scene, 'turret-shot');
  }

  
  private updateCryoBeam(delta: number, target: Enemy | null): void {
    if (!target) {
      this.clearBeam();
      this.buzz?.setActive(false);
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.sprite.x, target.sprite.y);
    this.sprite.setRotation(angle);

    target.applyFreezeCharge(delta); 
    this.buzz?.setActive(true);
    this.drawBeam(target.sprite.x, target.sprite.y, delta);
  }

  private drawBeam(endX: number, endY: number, delta: number): void {
    const startX = this.sprite.x;
    const startY = this.sprite.y;
    this.beamPulse += delta * 0.02;
    const pulse = 0.72 + Math.sin(this.beamPulse) * 0.22;

    if (!this.beamCore || !this.beamGlow) {
      this.beamCore = this.scene.add.line(0, 0, startX, startY, endX, endY, 0xbfeaff, 1)
        .setOrigin(0, 0).setLineWidth(2.4, 2.4).setDepth(25);
      this.beamGlow = this.scene.add.line(0, 0, startX, startY, endX, endY, 0x59b8ff, 1)
        .setOrigin(0, 0).setLineWidth(7, 7).setDepth(24);
    }

    this.beamCore.setTo(startX, startY, endX, endY).setAlpha(0.95 * pulse);
    this.beamGlow.setTo(startX, startY, endX, endY).setAlpha(0.4 * pulse);
  }

  private clearBeam(): void {
    this.beamCore?.destroy();
    this.beamGlow?.destroy();
    this.beamCore = undefined;
    this.beamGlow = undefined;
  }

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;
    return this.healthPoints <= 0;
  }

  public destroy(): void {
    this.clearBeam();
    this.buzz?.destroy();
    this.sprite.destroy();
  }

  private findTarget(enemies: Set<Enemy>): Enemy | null {
    const range = this.stats.range * this.gameState.getTurretRangeMult();
    let bestTarget: Enemy | null = null;
    let bestScore = -Infinity;

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, enemy.sprite.x, enemy.sprite.y);
      if (distance > range) continue;

      
      const frozen = enemy.freezeStrength > 0.02 ? 1 : 0;
      const score = frozen * 1e6 - distance;
      if (score > bestScore) {
        bestScore = score;
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

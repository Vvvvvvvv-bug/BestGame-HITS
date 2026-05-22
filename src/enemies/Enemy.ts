import type { Attackable } from '../core/Attackable';
import { playSfx } from '../audio/Sfx';

export abstract class Enemy implements Attackable {
  sprite: Phaser.GameObjects.Sprite;
  gridX: number;
  gridY: number;
  healthPoints: number;
  maxHealthPoints: number;
  damage: number;
  speed: number;

  protected targetX: number | null = null;
  protected targetY: number | null = null;
  protected scene: Phaser.Scene;
  protected attackTarget: Attackable | null = null;
  protected attackTimer: number = 0;
  protected attackCooldown: number = 1000;
  protected baseScale: number;
  protected animTime: number = 0;
  protected moveBlend: number = 0;
  protected roarTimer: number = Phaser.Math.Between(2200, 5200);
  protected collisionTargets: Attackable[] = [];

  private hpBarBg?: Phaser.GameObjects.Rectangle;
  private hpBarFill?: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    frameKey: string,
    healthPoints: number,
    damage: number,
    speed: number
  ) {
    this.scene = scene;
    this.gridX = x;
    this.gridY = y;
    this.healthPoints = healthPoints;
    this.maxHealthPoints = healthPoints;
    this.damage = damage;
    this.speed = speed;

    this.sprite = scene.add.sprite(x, y, frameKey);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(20);
    this.sprite.setDisplaySize(44, 44);
    this.baseScale = this.sprite.scaleX;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  setAttackTarget(target: Attackable): void {
    this.attackTarget = target;
  }

  setCollisionTargets(targets: Attackable[]): void {
    this.collisionTargets = targets;
  }

  needsTarget(): boolean {
    if (this.targetX === null || this.targetY === null) return true;
    if (!this.attackTarget) return true;
    if (this.attackTarget.healthPoints <= 0) {
      this.attackTarget = null;
      return true;
    }
    return false;
  }

  protected moveTowardsTarget(delta: number): void {
    if (this.targetX === null || this.targetY === null) return;

    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      this.sprite.x = this.targetX;
      this.sprite.y = this.targetY;
      this.moveBlend = Math.max(0, this.moveBlend - delta * 0.01);
      this.updateHealthBarPosition();
      return;
    }

    const moveDistance = (this.speed * delta) / 1000;
    const moveX = (dx / distance) * moveDistance;
    const moveY = (dy / distance) * moveDistance;

    const moved = this.tryMoveWithAvoidance(moveX, moveY);
    if (!moved) {
      const blocker = this.findCollisionBlocker(this.sprite.x + moveX, this.sprite.y + moveY);
      if (blocker) {
        this.targetX = blocker.sprite.x;
        this.targetY = blocker.sprite.y;
        this.attackTarget = blocker;
      }
      this.moveBlend = Math.max(0, this.moveBlend - delta * 0.01);
      this.updateHealthBarPosition();
      return;
    }

    this.gridX = this.sprite.x;
    this.gridY = this.sprite.y;
    this.moveBlend = Math.min(1, this.moveBlend + delta * 0.008);

    if (Math.abs(moveX) > 0.01) {
      this.sprite.setFlipX(moveX > 0);
    }

    this.updateHealthBarPosition();
  }

  protected canAttack(): boolean {
    return this.attackTimer >= this.attackCooldown;
  }

  protected doAttack(): void {
    if (this.attackTarget && this.canAttack()) {
      this.attackTarget.takeDamage(this.damage);
      playSfx(this.scene, 'enemy-attack');
      this.attackTimer = 0;

      this.sprite.scene.tweens.add({
        targets: this.sprite,
        scaleX: this.baseScale * 1.24,
        scaleY: this.baseScale * 0.88,
        angle: this.sprite.flipX ? -10 : 10,
        duration: 85,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }
  }

  protected updateAttack(delta: number): void {
    this.attackTimer += delta;
  }

  protected updateMovementAnimation(delta: number): void {
    this.animTime += delta * 0.013;

    const stride = Math.sin(this.animTime);
    const bounce = Math.cos(this.animTime * 2);
    const runAmount = this.moveBlend;
    const idleAmount = 1 - runAmount;

    this.sprite.scaleX = this.baseScale * (1 + stride * 0.08 * runAmount + 0.015 * idleAmount);
    this.sprite.scaleY = this.baseScale * (1 - stride * 0.05 * runAmount + 0.015 * idleAmount);
    this.sprite.angle = stride * 7 * runAmount + bounce * 1.5 * idleAmount;
    this.updateRoar(delta);
  }

  abstract update(delta: number): void;

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;

    if (this.healthPoints > 0) {
      playSfx(this.scene, 'enemy-hit');
      this.ensureHealthBar();
      this.updateHealthBarFill();
      this.updateHealthBarPosition();
    } else {
      playSfx(this.scene, 'enemy-death');
    }

    return this.healthPoints <= 0;
  }

  destroy(): void {
    this.hpBarBg?.destroy();
    this.hpBarFill?.destroy();
    this.sprite.destroy();
  }

  private ensureHealthBar(): void {
    if (this.hpBarBg && this.hpBarFill) return;

    const y = this.sprite.y - this.sprite.displayHeight * 0.65;
    this.hpBarBg = this.scene.add.rectangle(this.sprite.x, y, 34, 6, 0x111822, 0.9)
      .setStrokeStyle(1, 0x5d6a7a, 0.9)
      .setDepth(26);

    this.hpBarFill = this.scene.add.rectangle(this.sprite.x - 16, y, 32, 4, 0x5dff90, 1)
      .setOrigin(0, 0.5)
      .setDepth(27);
  }

  private updateHealthBarFill(): void {
    if (!this.hpBarFill) return;

    const pct = Phaser.Math.Clamp(this.healthPoints / this.maxHealthPoints, 0, 1);
    this.hpBarFill.setScale(pct, 1);

    if (pct > 0.6) this.hpBarFill.setFillStyle(0x5dff90);
    else if (pct > 0.3) this.hpBarFill.setFillStyle(0xffd45d);
    else this.hpBarFill.setFillStyle(0xff6b7d);
  }

  private updateHealthBarPosition(): void {
    if (!this.hpBarBg || !this.hpBarFill) return;

    const y = this.sprite.y - this.sprite.displayHeight * 0.65;
    this.hpBarBg.setPosition(this.sprite.x, y);
    this.hpBarFill.setPosition(this.sprite.x - 16, y);
  }

  private updateRoar(delta: number): void {
    this.roarTimer -= delta;
    if (this.roarTimer > 0) return;

    this.roarTimer = Phaser.Math.Between(3200, 7600);
    if (Math.random() < 0.42) {
      playSfx(this.scene, Math.random() < 0.55 ? 'enemy-roar' : 'enemy-chitter');
    }
  }

  private findCollisionBlocker(nextX: number, nextY: number): Attackable | null {
    const ownRadius = Math.max(this.sprite.displayWidth, this.sprite.displayHeight) * 0.28;

    for (const target of this.collisionTargets) {
      if (target.healthPoints <= 0) continue;
      const dx = target.sprite.x - nextX;
      const dy = target.sprite.y - nextY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const targetRadius = Math.max(target.sprite.displayWidth, target.sprite.displayHeight) * 0.34;

      if (distance < ownRadius + targetRadius) {
        return target;
      }
    }

    return null;
  }

  private tryMoveWithAvoidance(moveX: number, moveY: number): boolean {
    const nextX = this.sprite.x + moveX;
    const nextY = this.sprite.y + moveY;
    if (!this.findCollisionBlocker(nextX, nextY)) {
      this.sprite.x = nextX;
      this.sprite.y = nextY;
      return true;
    }

    const angles = [Phaser.Math.DegToRad(35), Phaser.Math.DegToRad(-35), Phaser.Math.DegToRad(65), Phaser.Math.DegToRad(-65)];
    for (const angle of angles) {
      const alt = this.rotate(moveX, moveY, angle);
      const altX = this.sprite.x + alt.x;
      const altY = this.sprite.y + alt.y;
      if (!this.findCollisionBlocker(altX, altY)) {
        this.sprite.x = altX;
        this.sprite.y = altY;
        return true;
      }
    }

    return false;
  }

  private rotate(x: number, y: number, radians: number): { x: number; y: number } {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos,
    };
  }
}

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

  getAttackTarget(): Attackable | null {
    return this.attackTarget;
  }

  clearTarget(): void {
    this.targetX = null;
    this.targetY = null;
    this.attackTarget = null;
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
      return;
    }

    const moveDistance = (this.speed * delta) / 1000;
    const moveX = (dx / distance) * moveDistance;
    const moveY = (dy / distance) * moveDistance;

    this.sprite.x += moveX;
    this.sprite.y += moveY;
    this.gridX = this.sprite.x;
    this.gridY = this.sprite.y;
    this.moveBlend = Math.min(1, this.moveBlend + delta * 0.008);

    if (Math.abs(moveX) > 0.01) {
      this.sprite.setFlipX(moveX > 0);
    }
  }

  protected canAttack(): boolean {
    return this.attackTimer >= this.attackCooldown;
  }

  protected doAttack(): void {
    if (this.attackTarget && this.canAttack()) {
      this.attackTarget.takeDamage(this.damage);
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
  }

  abstract update(delta: number): void;

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;
    if (this.healthPoints > 0) {
      playSfx(this.scene, 'enemy-hit');
    } else {
      playSfx(this.scene, 'enemy-death');
    }
    return this.healthPoints <= 0;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

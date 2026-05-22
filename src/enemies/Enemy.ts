import type { Attackable } from '../core/Attackable';

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
  protected attackCooldown: number = 1000; // атака раз в 1 сек

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
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  setAttackTarget(target: Attackable): void {
    this.attackTarget = target;
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
      return;
    }

    const moveDistance = (this.speed * delta) / 1000;
    const moveX = (dx / distance) * moveDistance;
    const moveY = (dy / distance) * moveDistance;

    this.sprite.x += moveX;
    this.sprite.y += moveY;
    this.gridX = this.sprite.x;
    this.gridY = this.sprite.y;
  }

  protected canAttack(): boolean {
    return this.attackTimer >= this.attackCooldown;
  }

  protected doAttack(): void {
    if (this.attackTarget && this.canAttack()) {
      this.attackTarget.takeDamage(this.damage);
      this.attackTimer = 0;

      // Визуальный эффект атаки
      this.sprite.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 80,
        yoyo: true
      });
    }
  }

  protected updateAttack(delta: number): void {
    this.attackTimer += delta;
  }

  abstract update(delta: number): void;

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;
    return this.healthPoints <= 0;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

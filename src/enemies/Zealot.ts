import { Enemy } from './Enemy';

export class Zealot extends Enemy {
  private readonly idleFrames = ['ant_idle_1', 'ant_idle_2', 'ant_idle_3', 'ant_idle_4'];
  private readonly walkFrames = ['ant_walk_1', 'ant_walk_2', 'ant_walk_3'];
  private readonly attackFrames = ['ant_attack_1', 'ant_attack_2', 'ant_attack_3'];
  protected readonly deadFrames = ['ant_dead_1', 'ant_dead_2', 'ant_dead_3'];
  private animTimer = 0;
  private attackAnimTimer = 0;
  private lastAttackAt = -2000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    
    super(scene, x, y, 'ant_idle_1', 100, 20, 70);
  }

  update(delta: number): void {
    const beforeX = this.sprite.x;
    const beforeY = this.sprite.y;

    this.moveTowardsTarget(delta);
    this.updateMovementAnimation(delta);
    this.updateAttack(delta);

    const moved = Phaser.Math.Distance.Between(beforeX, beforeY, this.sprite.x, this.sprite.y) > 0.12;
    this.animTimer += delta;

    if (this.attackTarget && this.targetX !== null && this.targetY !== null) {
      const dx = this.targetX - this.sprite.x;
      const dy = this.targetY - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 50) {
        const prevAttackTimer = this.attackTimer;
        this.doAttack();
        if (prevAttackTimer >= this.attackCooldown && this.attackTimer === 0) {
          this.lastAttackAt = this.scene.time.now;
          this.attackAnimTimer = 0;
        }
      }
    }

    const inAttackAnim = this.scene.time.now - this.lastAttackAt < 240;
    if (inAttackAnim) {
      this.attackAnimTimer += delta;
      this.applyFrameAnimation(this.attackFrames, this.attackAnimTimer, 70);
      return;
    }

    if (moved) {
      this.applyFrameAnimation(this.walkFrames, this.animTimer, 90);
      return;
    }

    this.applyFrameAnimation(this.idleFrames, this.animTimer, 160);
  }

  private applyFrameAnimation(frames: string[], timer: number, frameDuration: number): void {
    const index = Math.floor(timer / frameDuration) % frames.length;
    const frameKey = frames[index];
    if (this.sprite.texture.key !== frameKey) {
      this.sprite.setTexture(frameKey);
    }
  }
}

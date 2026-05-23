import { Enemy } from './Enemy';

export class BruteAnt extends Enemy {
  private readonly idleFrames = ['brute_idle_1', 'brute_idle_2', 'brute_idle_3', 'brute_idle_4'];
  private readonly walkFrames = ['brute_walk_1', 'brute_walk_2', 'brute_walk_3'];
  private readonly attackFrames = ['brute_attack_1', 'brute_attack_2', 'brute_attack_3'];
  protected readonly deadFrames = ['brute_dead_1', 'brute_dead_2', 'brute_dead_3'];
  private animTimer = 0;
  private attackAnimTimer = 0;
  private lastAttackAt = -2000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    
    super(scene, x, y, 'brute_idle_1', 300, 40, 49);
    this.sprite.setDisplaySize(99, 99); 
    this.baseScale = this.sprite.scaleX;
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

      if (distance < 58) {
        const prevAttackTimer = this.attackTimer;
        this.doAttack();
        if (prevAttackTimer >= this.attackCooldown && this.attackTimer === 0) {
          this.lastAttackAt = this.scene.time.now;
          this.attackAnimTimer = 0;
        }
      }
    }

    const inAttackAnim = this.scene.time.now - this.lastAttackAt < 250;
    if (inAttackAnim) {
      this.attackAnimTimer += delta;
      this.applyFrameAnimation(this.attackFrames, this.attackAnimTimer, 75);
      return;
    }

    if (moved) {
      this.applyFrameAnimation(this.walkFrames, this.animTimer, 100);
      return;
    }

    this.applyFrameAnimation(this.idleFrames, this.animTimer, 170);
  }

  private applyFrameAnimation(frames: string[], timer: number, frameDuration: number): void {
    const index = Math.floor(timer / frameDuration) % frames.length;
    const frameKey = frames[index];
    if (this.sprite.texture.key !== frameKey) {
      this.sprite.setTexture(frameKey);
    }
  }
}

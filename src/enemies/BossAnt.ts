import { Enemy } from './Enemy';

export class BossAnt extends Enemy {
  private readonly idleFrames = ['boss_idle_1', 'boss_idle_2', 'boss_idle_3', 'boss_idle_4'];
  private readonly walkFrames = ['boss_walk_1', 'boss_walk_2', 'boss_walk_3'];
  private readonly attackFrames = ['boss_attack_1', 'boss_attack_2', 'boss_attack_3'];
  private animTimer = 0;
  private attackAnimTimer = 0;
  private lastAttackAt = -2000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Обычный муравей: HP 100, dmg 20, speed 70
    // Босс: x10 HP, x4 dmg, speed -50%, size x5
    super(scene, x, y, 'boss_idle_1', 1000, 80, 35);
    this.sprite.setDisplaySize(220, 220);
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

      if (distance < 120) {
        const prevAttackTimer = this.attackTimer;
        this.doAttack();
        if (prevAttackTimer >= this.attackCooldown && this.attackTimer === 0) {
          this.lastAttackAt = this.scene.time.now;
          this.attackAnimTimer = 0;
        }
      }
    }

    const inAttackAnim = this.scene.time.now - this.lastAttackAt < 300;
    if (inAttackAnim) {
      this.attackAnimTimer += delta;
      this.applyFrameAnimation(this.attackFrames, this.attackAnimTimer, 90);
      return;
    }

    if (moved) {
      this.applyFrameAnimation(this.walkFrames, this.animTimer, 120);
      return;
    }

    this.applyFrameAnimation(this.idleFrames, this.animTimer, 190);
  }

  private applyFrameAnimation(frames: string[], timer: number, frameDuration: number): void {
    const index = Math.floor(timer / frameDuration) % frames.length;
    const frameKey = frames[index];
    if (this.sprite.texture.key !== frameKey) {
      this.sprite.setTexture(frameKey);
    }
  }
}


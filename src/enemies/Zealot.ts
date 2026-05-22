import { Enemy } from './Enemy';

export class Zealot extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // HP: 50, Damage: 20, Speed: 70 px/sec
    super(scene, x, y, 'enemy', 50, 20, 70);
  }

  update(delta: number): void {
    this.moveTowardsTarget(delta);
    this.updateAttack(delta);

    // Если враг рядом с целью, атакуем
    if (this.attackTarget && this.targetX !== null && this.targetY !== null) {
      const dx = this.targetX - this.sprite.x;
      const dy = this.targetY - this.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 50) {
        this.doAttack();
      }
    }
  }
}

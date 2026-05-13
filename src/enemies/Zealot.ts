import { Enemy } from './Enemy';

export class Zealot extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // HP: 50, Damage: 20, Speed: 100 px/sec
    super(scene, x, y, 'zealot', 50, 20, 100);
  }

  update(delta: number): void {
    // Пока просто стоит, позже добавим движение
  }
}

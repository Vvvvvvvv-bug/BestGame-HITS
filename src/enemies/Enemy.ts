export abstract class Enemy {
  sprite: Phaser.GameObjects.Sprite;
  gridX: number;
  gridY: number;
  healthPoints: number;
  maxHealthPoints: number;
  damage: number;
  speed: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    frameKey: string,
    healthPoints: number,
    damage: number,
    speed: number
  ) {
    this.gridX = x;
    this.gridY = y;
    this.healthPoints = healthPoints;
    this.maxHealthPoints = healthPoints;
    this.damage = damage;
    this.speed = speed;

    this.sprite = scene.add.sprite(x, y, 'enemies', frameKey);
    this.sprite.setOrigin(0, 0);
    this.sprite.setDepth(20);
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

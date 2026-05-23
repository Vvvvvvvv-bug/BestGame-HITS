import type { Attackable } from '../core/Attackable';

export abstract class Building implements Attackable {
  sprite: Phaser.GameObjects.Sprite;
  
  protected baseScale: number;
  gridX: number;
  gridY: number;
  healthPoints: number;
  maxHealthPoints: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    healthPoints: number
  ) {
    this.gridX = x;
    this.gridY = y;
    this.healthPoints = healthPoints;
    this.maxHealthPoints = healthPoints;

    this.sprite = scene.add.sprite(x, y, textureKey);
    
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(10);
    this.sprite.setDisplaySize(30, 30);
    this.baseScale = this.sprite.scaleX;
  }

  abstract update(delta: number): void;
  abstract onPlace(): void;

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;
    return this.healthPoints <= 0;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}

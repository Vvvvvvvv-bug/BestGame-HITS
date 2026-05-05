export abstract class Building {
  sprite: Phaser.GameObjects.Sprite;
  gridX: number;
  gridY: number;
  healthPoints: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    frameKey: string,
    healthPoints: number
  ) {
    this.gridX = x;
    this.gridY = y;
    this.healthPoints = healthPoints;

    this.sprite = scene.add.sprite(x, y, 'buildings', frameKey);
    this.sprite.setOrigin(0, 0);
    this.sprite.setDepth(10);
  }

  abstract update(delta: number): void;
  abstract onPlace(): void;

  public destroy(): void {
    this.sprite.destroy();
  }
}
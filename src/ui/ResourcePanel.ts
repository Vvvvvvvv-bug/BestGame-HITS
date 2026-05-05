export class ResourcePanel {
  private ironText: Phaser.GameObjects.Text;
  private stoneText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.ironText = scene.add.text(10, 10, 'Железо: 0', {
      fontSize: '20px',
      color: '#ffffff'
    });
    this.ironText.setDepth(1000);

    this.stoneText = scene.add.text(10, 35, 'Камень: 0', {
      fontSize: '20px',
      color: '#ffffff'
    });
    this.stoneText.setDepth(1000);
  }

  public update(resources: { iron: number; stone: number }): void {
    this.ironText.setText(`Железо: ${resources.iron}`);
    this.stoneText.setText(`Камень: ${resources.stone}`);
  }
}
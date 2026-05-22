import { createHudPanel, TEXT_STYLE, UI_COLORS, UI_DEPTH } from './uiTheme';

export class ResourcePanel {
  private ironText: Phaser.GameObjects.Text;
  private stoneText: Phaser.GameObjects.Text;
  private gradePointText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const centerX = 112;
    createHudPanel(scene, centerX, 45, 218, 74);

    const ironIcon = scene.add.sprite(centerX - 78, 25, 'tile_iron')
      .setDisplaySize(22, 22)
      .setDepth(UI_DEPTH + 1);

    const stoneIcon = scene.add.sprite(centerX - 78, 47, 'tile_stone')
      .setDisplaySize(22, 22)
      .setDepth(UI_DEPTH + 1);

    const gradePointIcon = scene.add.sprite(centerX - 78, 69, 'airdrop')
      .setDisplaySize(22, 22)
      .setDepth(UI_DEPTH + 1);

    this.ironText = scene.add.text(centerX - 54, 15, 'Металл: 0', {
      ...TEXT_STYLE,
      fontSize: '15px',
      fontStyle: 'bold',
    }).setDepth(UI_DEPTH + 1);

    this.stoneText = scene.add.text(centerX - 54, 37, 'Камень: 0', {
      ...TEXT_STYLE,
      fontSize: '15px',
      color: UI_COLORS.mutedText,
      fontStyle: 'bold',
    }).setDepth(UI_DEPTH + 1);

    this.gradePointText = scene.add.text(centerX - 54, 59, 'Очки улучшения: 0', {
      ...TEXT_STYLE,
      fontSize: '14px',
      color: '#ffcf73',
      fontStyle: 'bold',
    }).setDepth(UI_DEPTH + 1);

    ironIcon.setName('iron-resource-icon');
    stoneIcon.setName('stone-resource-icon');
    gradePointIcon.setName('grade-point-resource-icon');
  }

  public update(resources: { iron: number; stone: number; gradePoint: number }): void {
    this.ironText.setText(`Металл: ${resources.iron}`);
    this.stoneText.setText(`Камень: ${resources.stone}`);
    this.gradePointText.setText(`Очки улучшения: ${resources.gradePoint}`);
  }
}

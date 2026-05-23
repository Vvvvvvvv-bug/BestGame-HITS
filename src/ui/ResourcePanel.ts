import { createHudPanel, TEXT_STYLE, UI_COLORS, UI_DEPTH } from './uiTheme';

export class ResourcePanel {
  private ironText: Phaser.GameObjects.Text;
  private stoneText: Phaser.GameObjects.Text;
  private gradePointText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const centerX = 112;
    const panelY = 48;
    const panelH = 82;
    createHudPanel(scene, centerX, panelY, 218, panelH);

    const startY = 18;
    const gap = 24;

    const ironIcon = scene.add.sprite(centerX - 78, startY, 'tileset', 'iron')
      .setDisplaySize(20, 20)
      .setDepth(UI_DEPTH + 1);

    this.ironText = scene.add.text(centerX - 54, startY - 9, 'Металл: 0', {
      ...TEXT_STYLE,
      fontSize: '14px',
      fontStyle: 'bold',
    }).setDepth(UI_DEPTH + 1);

    const stoneY = startY + gap;
    const stoneIcon = scene.add.sprite(centerX - 78, stoneY, 'tileset', 'stone')
      .setDisplaySize(20, 20)
      .setDepth(UI_DEPTH + 1);

    this.stoneText = scene.add.text(centerX - 54, stoneY - 9, 'Камень: 0', {
      ...TEXT_STYLE,
      fontSize: '14px',
      color: UI_COLORS.mutedText,
      fontStyle: 'bold',
    }).setDepth(UI_DEPTH + 1);

    const gradeY = startY + gap * 2;
    const gradePointIcon = scene.add.sprite(centerX - 78, gradeY, 'airdrop')
      .setDisplaySize(20, 20)
      .setDepth(UI_DEPTH + 1);

    this.gradePointText = scene.add.text(centerX - 54, gradeY - 9, 'Очки: 0', {
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
    this.gradePointText.setText(`Очки: ${resources.gradePoint}`);
  }
}

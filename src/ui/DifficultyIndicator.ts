import { createHudPanel, TEXT_STYLE, UI_DEPTH } from './uiTheme';
import { settings, type GameSettings } from '../core/Settings';

const DIFFICULTY_COLORS: Record<GameSettings['difficulty'], number> = {
  easy: 0x6ee7b7,
  normal: 0xfcd34d,
  hard: 0xe11d48,
};

const DIFFICULTY_LABELS: Record<GameSettings['difficulty'], string> = {
  easy: 'Легко',
  normal: 'Средне',
  hard: 'Сложно',
};

export class DifficultyIndicator {
  private text: Phaser.GameObjects.Text;
  private square: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    const x = 112;
    const y = 182;
    createHudPanel(scene, x, y, 218, 36, 0.92);

    const diff = settings.get().difficulty;
    this.square = scene.add
      .rectangle(x - 78, y, 16, 16, DIFFICULTY_COLORS[diff], 1)
      .setStrokeStyle(1.5, 0xffffff, 0.6)
      .setDepth(UI_DEPTH + 1);

    this.text = scene.add
      .text(x - 54, y - 9, `Сложность: ${DIFFICULTY_LABELS[diff]}`, {
        ...TEXT_STYLE,
        fontSize: '13px',
        color: '#b0c8db',
      })
      .setDepth(UI_DEPTH + 1);
  }

  public update(): void {
    const diff = settings.get().difficulty;
    this.text.setText(`Сложность: ${DIFFICULTY_LABELS[diff]}`);
    this.square.setFillStyle(DIFFICULTY_COLORS[diff], 1);
  }
}

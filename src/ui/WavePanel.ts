import { eventBus } from '../core/EventBus';
import { createHudPanel, TEXT_STYLE, UI_COLORS, UI_DEPTH } from './uiTheme';

type WaveData = {
  phase: string;
  waveNumber: number;
  timeLeft: number;
  waveDuration: number;
  enemiesInWave: number;
};

const PHASE_NAMES: Record<string, string> = {
  'gathering': 'Сбор ресурсов',
  'building': 'Строительство',
  'wave': 'Волна атаки',
  'boss': 'БОСС ВОЛНА',
  'gameover': 'ПОРАЖЕНИЕ',
  'victory': 'ПОБЕДА!'
};

const PHASE_COLORS: Record<string, string> = {
  'gathering': '#4CAF50',
  'building': '#2196F3',
  'wave': '#FF5722',
  'boss': '#9C27B0',
  'gameover': '#000000',
  'victory': '#FFD700'
};

export class WavePanel {
  private phaseText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private enemiesText: Phaser.GameObjects.Text;
  private progressBar: Phaser.GameObjects.Rectangle;
  private readonly waveHandler: (data: WaveData) => void;
  private readonly enemiesHandler: (data: { enemiesRemaining: number }) => void;

  constructor(scene: Phaser.Scene) {
    const panelX = 112;
    const panelY = 126;

    createHudPanel(scene, panelX, panelY, 218, 78, 0.92);

    this.phaseText = scene.add.text(panelX, panelY - 30, 'Сбор ресурсов', {
      ...TEXT_STYLE,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#4CAF50'
    });
    this.phaseText.setOrigin(0.5, 0);
    this.phaseText.setDepth(UI_DEPTH + 1);

    this.waveText = scene.add.text(panelX - 94, panelY - 9, 'Волна: 0', {
      ...TEXT_STYLE,
      fontSize: '13px',
      color: UI_COLORS.text
    });
    this.waveText.setOrigin(0, 0);
    this.waveText.setDepth(UI_DEPTH + 1);

    this.enemiesText = scene.add.text(panelX + 18, panelY - 9, 'Врагов: 0', {
      ...TEXT_STYLE,
      fontSize: '13px',
      color: '#ff8da1'
    });
    this.enemiesText.setOrigin(0, 0);
    this.enemiesText.setDepth(UI_DEPTH + 1);

    this.timerText = scene.add.text(panelX - 94, panelY + 12, 'Время: 0с', {
      ...TEXT_STYLE,
      fontSize: '13px',
      color: '#ffe083'
    });
    this.timerText.setOrigin(0, 0);
    this.timerText.setDepth(UI_DEPTH + 1);

    const progressBarBg = scene.add.rectangle(panelX + 8, panelY + 17, 86, 8, 0x263349);
    progressBarBg.setOrigin(0, 0);
    progressBarBg.setDepth(UI_DEPTH + 1);

    this.progressBar = scene.add.rectangle(panelX + 8, panelY + 17, 86, 8, UI_COLORS.selected);
    this.progressBar.setOrigin(0, 0);
    this.progressBar.setDepth(UI_DEPTH + 2);

    this.waveHandler = (data) => this.update(data);
    this.enemiesHandler = (data) => this.enemiesText.setText(`Осталось: ${data.enemiesRemaining}`);

    eventBus.on('wave-update', this.waveHandler);
    eventBus.on('enemies-remaining-update', this.enemiesHandler);
  }

  private update(data: WaveData): void {
    const phase = data.phase as keyof typeof PHASE_NAMES;

    this.phaseText.setText(PHASE_NAMES[phase]);
    this.phaseText.setColor(PHASE_COLORS[phase]);

    this.waveText.setText(`Волна: ${data.waveNumber}`);
    if (data.phase !== 'wave') {
      this.enemiesText.setText(`Врагов: ${data.enemiesInWave}`);
    }

    const seconds = Math.ceil(data.timeLeft / 1000);
    this.timerText.setText(`Время: ${seconds}с`);
  }

  public updateProgress(progress: number): void {
    this.progressBar.setScale(Phaser.Math.Clamp(progress, 0, 1), 1);
  }

  public destroy(): void {
    eventBus.off('wave-update', this.waveHandler);
    eventBus.off('enemies-remaining-update', this.enemiesHandler);
  }
}

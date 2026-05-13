import { eventBus } from '../core/EventBus';

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
  private progressBarBg: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    const panelX = scene.scale.width / 2;
    
    // Фон панели
    const bg = scene.add.rectangle(panelX, 20, 250, 80, 0x1a1a2e, 0.8);
    bg.setStrokeStyle(2, 0x00d2ff);

    // Текст фазы
    this.phaseText = scene.add.text(panelX - 120, 10, 'Сбор ресурсов', {
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#4CAF50'
    });
    this.phaseText.setOrigin(0, 0);
    this.phaseText.setDepth(1001);

    // Текст волны
    this.waveText = scene.add.text(panelX - 120, 30, 'Волна: 0', {
      fontSize: '14px',
      color: '#ffffff'
    });
    this.waveText.setOrigin(0, 0);
    this.waveText.setDepth(1001);

    // Текст врагов
    this.enemiesText = scene.add.text(panelX + 10, 30, 'Врагов: 0', {
      fontSize: '14px',
      color: '#ff6b6b'
    });
    this.enemiesText.setOrigin(0, 0);
    this.enemiesText.setDepth(1001);

    // Таймер
    this.timerText = scene.add.text(panelX - 120, 50, 'Время: 0s', {
      fontSize: '14px',
      color: '#ffeb3b'
    });
    this.timerText.setOrigin(0, 0);
    this.timerText.setDepth(1001);

    // Прогресс бар (фон)
    this.progressBarBg = scene.add.rectangle(panelX - 120, 72, 200, 10, 0x333333);
    this.progressBarBg.setOrigin(0, 0);
    this.progressBarBg.setDepth(1000);

    // Прогресс бар (заполнение)
    this.progressBar = scene.add.rectangle(panelX - 120, 72, 0, 10, 0x00d2ff);
    this.progressBar.setOrigin(0, 0);
    this.progressBar.setDepth(1001);

    // Подписываемся на события волны
    eventBus.on('wave-update', (data) => {
      this.update(data);
    });
  }

  private update(data: {
    phase: string;
    waveNumber: number;
    timeLeft: number;
    enemiesInWave: number;
  }): void {
    const phase = data.phase as keyof typeof PHASE_NAMES;
    
    this.phaseText.setText(PHASE_NAMES[phase]);
    this.phaseText.setColor(PHASE_COLORS[phase]);

    this.waveText.setText(`Волна: ${data.waveNumber}`);
    this.enemiesText.setText(`Врагов: ${data.enemiesInWave}`);
    
    const seconds = Math.ceil(data.timeLeft / 1000);
    this.timerText.setText(`Время: ${seconds}s`);

    // Обновляем прогресс бар - нужно передавать progress из менеджера
  }

  public updateProgress(progress: number): void {
    this.progressBar.setScale(progress, 1);
  }
}

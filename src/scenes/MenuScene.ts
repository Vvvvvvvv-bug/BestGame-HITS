import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Фоновый градиент (simulated через large rect)
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x0f1020)
      .setDepth(0);

    // Заголовок
    const title = this.add.text(centerX, centerY - 140, 'BEST GAME', {
      fontSize: '68px',
      color: '#00ff88',
      fontStyle: 'bold',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: title,
      scale: 1.06,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Подзаголовок
    this.add.text(centerX, centerY - 60, 'Tower Defense', {
      fontSize: '22px',
      color: '#8bd7ff',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    }).setOrigin(0.5).setDepth(10);

    // Кнопки
    this.createButton(centerX, centerY + 30, 'Начать игру', () => {
      this.scene.start('MainScene');
    });

    this.createButton(centerX, centerY + 110, 'Выход', () => {
      if (window.close) window.close();
    });
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void
  ): void {
    const bg = this.add
      .rectangle(x, y, 260, 54, 0x16213e, 0.95)
      .setStrokeStyle(2, 0x0f3460, 1)
      .setDepth(5);

    const label = this.add
      .text(x, y, text, {
        fontSize: '22px',
        color: '#d7e4f2',
        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(6);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(0x1f2f4f);
      label.setColor('#ffffff');
      this.tweens.add({
        targets: [bg, label],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 80,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x16213e);
      label.setColor('#d7e4f2');
      this.tweens.add({
        targets: [bg, label],
        scaleX: 1,
        scaleY: 1,
        duration: 80,
      });
    });

    bg.on('pointerdown', onClick);
  }
}

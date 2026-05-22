import Phaser from 'phaser';
import { playSfx } from '../audio/Sfx';

export default class MenuScene extends Phaser.Scene {
  private centerX = 0;
  private centerY = 0;

  private bgGradient!: Phaser.GameObjects.Graphics;
  private bgGlowTop!: Phaser.GameObjects.Ellipse;
  private bgGlowBottom!: Phaser.GameObjects.Ellipse;

  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.rebuildLayout();

    this.scale.on('resize', () => {
      this.rebuildLayout();
    });
  }

  private rebuildLayout(): void {
    this.centerX = this.scale.width / 2;
    this.centerY = this.scale.height / 2;

    this.children.removeAll(true);

    this.createBackground();
    this.createPanel();
    this.createTexts();
    this.createButtons();
    this.createAmbientMotion();
  }

  private createBackground(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.bgGradient = this.add.graphics().setDepth(0);

    const topColor = Phaser.Display.Color.HexStringToColor('#0a1827').color;
    const bottomColor = Phaser.Display.Color.HexStringToColor('#03070f').color;

    this.bgGradient.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    this.bgGradient.fillRect(0, 0, w, h);

    this.bgGlowTop = this.add
      .ellipse(w * 0.22, h * 0.2, w * 0.72, h * 0.5, 0x2ed3ff, 0.12)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    this.bgGlowBottom = this.add
      .ellipse(w * 0.78, h * 0.82, w * 0.6, h * 0.38, 0x55f5a8, 0.1)
      .setDepth(1)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    const grid = this.add.graphics().setDepth(2);
    grid.lineStyle(1, 0x4eb6d6, 0.08);

    const step = 36;
    for (let x = 0; x <= w; x += step) grid.lineBetween(x, 0, x, h);
    for (let y = 0; y <= h; y += step) grid.lineBetween(0, y, w, y);
  }

  private createPanel(): void {
    const w = Math.min(620, this.scale.width - 40);
    const h = Math.min(430, this.scale.height - 40);

    this.add
      .rectangle(this.centerX, this.centerY, w, h, 0x0c1626, 0.82)
      .setStrokeStyle(2, 0x67e0ff, 0.44)
      .setDepth(5);

    this.add
      .rectangle(this.centerX, this.centerY, w - 20, h - 20, 0x0a101c, 0.88)
      .setStrokeStyle(1, 0x8ff0c6, 0.2)
      .setDepth(6);
  }

  private createTexts(): void {
    const titleSize = Math.max(54, Math.floor(this.scale.width * 0.072));

    this.title = this.add
      .text(this.centerX, this.centerY - 120, 'BEST GAME: HITS', {
        fontSize: `${titleSize}px`,
        color: '#d9fbff',
        fontStyle: 'bold',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        stroke: '#2dc7ff',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(this.centerX, this.centerY - 46, 'Tower Defense // Survival Build', {
        fontSize: '24px',
        color: '#8edbf8',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.hint = this.add
      .text(this.centerX, this.centerY + 156, 'Подсказка: строй буровые и турели до начала волны', {
        fontSize: '18px',
        color: '#92b4cb',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private createButtons(): void {
    this.createButton(this.centerX, this.centerY + 26, 300, 64, 'НАЧАТЬ ИГРУ', () => {
      this.scene.start('MainScene');
    });

    this.createButton(this.centerX, this.centerY + 104, 300, 52, 'ВЫХОД', () => {
      if (window.close) window.close();
    });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const bg = this.add
      .rectangle(0, 0, width, height, 0x142742, 0.92)
      .setStrokeStyle(2, 0x66dfff, 0.62);

    const shine = this.add
      .rectangle(-width * 0.3, 0, width * 0.28, height - 12, 0xd0f8ff, 0.08)
      .setAngle(-8);

    const label = this.add.text(0, 0, text, {
      fontSize: '25px',
      color: '#e9fbff',
      fontStyle: 'bold',
      fontFamily: 'Trebuchet MS, Verdana, sans-serif',
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [bg, shine, label]).setDepth(12);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.setFillStyle(0x1d3558, 0.96);
      label.setColor('#ffffff');
      this.tweens.add({ targets: container, scaleX: 1.045, scaleY: 1.045, duration: 110, ease: 'Quad.easeOut' });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x142742, 0.92);
      label.setColor('#e9fbff');
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 110, ease: 'Quad.easeOut' });
    });

    bg.on('pointerdown', () => {
      playSfx(this, 'ui-click');
      this.tweens.add({
        targets: container,
        scaleX: 0.97,
        scaleY: 0.97,
        duration: 70,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: onClick,
      });
    });

    return container;
  }

  private createAmbientMotion(): void {
    this.tweens.add({
      targets: this.title,
      y: this.title.y - 8,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: [this.bgGlowTop, this.bgGlowBottom],
      alpha: { from: 0.08, to: 0.16 },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: this.hint,
      alpha: { from: 0.6, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}


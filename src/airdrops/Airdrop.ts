import type { Attackable } from '../core/Attackable';

type AirdropState = 'idle' | 'busy' | 'destroyed';

export class Airdrop implements Attackable {
  public sprite: Phaser.GameObjects.Sprite;
  public healthPoints: number;
  public maxHealthPoints: number;
  public readonly lureRadius: number;

  private readonly scene: Phaser.Scene;
  private state: AirdropState = 'idle';
  private baseScale: number;
  private label: Phaser.GameObjects.Text;
  private onOpen: (airdrop: Airdrop) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    lureRadius: number,
    onOpen: (airdrop: Airdrop) => void
  ) {
    this.scene = scene;
    this.maxHealthPoints = 260;
    this.healthPoints = this.maxHealthPoints;
    this.lureRadius = lureRadius;
    this.onOpen = onOpen;

    this.sprite = scene.add.sprite(x, y, 'airdrop');
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(18);
    this.sprite.setDisplaySize(38, 38);
    this.baseScale = this.sprite.scaleX;
    this.sprite.setInteractive({ useHandCursor: true });

    this.label = scene.add.text(x, y + 28, 'ДРОП', {
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      fontSize: '11px',
      color: '#eef7ff',
      fontStyle: 'bold',
      resolution: 2,
    }).setOrigin(0.5).setDepth(21);

    this.sprite.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.open();
    });
  }

  // 'busy' (открыта викторина) считается «не живым» => враги не приманиваются и не бьют дроп.
  public get isOpening(): boolean {
    return this.state === 'busy';
  }

  public get isAlive(): boolean {
    return this.healthPoints > 0 && this.state === 'idle';
  }

  /** Клик по дропу: блокируем и просим сцену открыть окно с вопросом. */
  private open(): void {
    if (this.state !== 'idle') return;
    this.state = 'busy';
    this.label.setText('ВОПРОС…');
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale * 1.12,
      scaleY: this.baseScale * 1.12,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.onOpen(this);
  }

  public update(_delta: number): void {
    // Таймер живёт в окне викторины; здесь обновлять нечего.
  }

  public takeDamage(amount: number): boolean {
    if (!this.isAlive) return true;
    this.healthPoints = Math.max(0, this.healthPoints - amount);
    if (this.healthPoints <= 0) {
      this.state = 'destroyed';
      return true;
    }
    return false;
  }

  public destroy(): void {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    this.label.destroy();
  }
}

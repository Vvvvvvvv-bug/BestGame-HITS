import type { Attackable } from '../core/Attackable';
import { eventBus } from '../core/EventBus';

type AirdropState = 'idle' | 'opening' | 'opened' | 'destroyed';

export class Airdrop implements Attackable {
  public sprite: Phaser.GameObjects.Sprite;
  public healthPoints: number;
  public maxHealthPoints: number;
  public readonly lureRadius: number;

  private readonly scene: Phaser.Scene;
  private readonly openDuration = 60000;
  private readonly rewardAmount: number;
  private state: AirdropState = 'idle';
  private openTime = 0;
  private baseScale: number;
  private healthFill: Phaser.GameObjects.Rectangle;
  private progressFill: Phaser.GameObjects.Rectangle;
  private healthBg: Phaser.GameObjects.Rectangle;
  private progressBg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private onFinished: (airdrop: Airdrop, completed: boolean) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    lureRadius: number,
    onFinished: (airdrop: Airdrop, completed: boolean) => void,
    rewardAmount = 1
  ) {
    this.scene = scene;
    this.maxHealthPoints = 260;
    this.healthPoints = this.maxHealthPoints;
    this.lureRadius = lureRadius;
    this.rewardAmount = rewardAmount;
    this.onFinished = onFinished;

    this.sprite = scene.add.sprite(x, y, 'airdrop');
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(18);
    this.sprite.setDisplaySize(38, 38);
    this.baseScale = this.sprite.scaleX;
    this.sprite.setInteractive({ useHandCursor: true });

    this.healthFill = scene.add.rectangle(x - 22, y - 30, 44, 5, 0x42f5a7, 1)
      .setOrigin(0, 0.5)
      .setDepth(21);
    this.progressFill = scene.add.rectangle(x - 22, y - 24, 0, 4, 0xffcf73, 1)
      .setOrigin(0, 0.5)
      .setDepth(21);
    this.label = scene.add.text(x, y + 28, 'ДРОП', {
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      fontSize: '11px',
      color: '#eef7ff',
      fontStyle: 'bold',
      resolution: 2,
    }).setOrigin(0.5).setDepth(21);

    this.healthBg = scene.add.rectangle(x, y - 30, 46, 7, 0x182433, 0.9)
      .setStrokeStyle(1, 0xd7e4f2, 0.45)
      .setDepth(20);
    this.progressBg = scene.add.rectangle(x, y - 24, 46, 6, 0x182433, 0.9)
      .setStrokeStyle(1, 0xffcf73, 0.45)
      .setDepth(20);

    this.sprite.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.startOpening();
    });
  }

  public get isOpening(): boolean {
    return this.state === 'opening';
  }

  public get isAlive(): boolean {
    return this.healthPoints > 0 && this.state !== 'destroyed' && this.state !== 'opened';
  }

  public startOpening(): void {
    if (this.state !== 'idle') return;
    this.state = 'opening';
    this.label.setText('ОТКРЫТИЕ');
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale * 1.12,
      scaleY: this.baseScale * 1.12,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public update(delta: number): void {
    if (this.state !== 'opening') return;

    this.openTime += delta;
    const progress = Phaser.Math.Clamp(this.openTime / this.openDuration, 0, 1);
    this.progressFill.width = 44 * progress;
    this.label.setText(`${Math.ceil((this.openDuration - this.openTime) / 1000)}с`);

    if (progress >= 1) {
      this.complete();
    }
  }

  public takeDamage(amount: number): boolean {
    if (!this.isAlive) return true;

    this.healthPoints = Math.max(0, this.healthPoints - amount);
    const healthPercent = Phaser.Math.Clamp(this.healthPoints / this.maxHealthPoints, 0, 1);
    this.healthFill.width = 44 * healthPercent;
    this.healthFill.setFillStyle(healthPercent > 0.35 ? 0x42f5a7 : 0xff6b7d);

    if (this.healthPoints <= 0) {
      this.state = 'destroyed';
      this.onFinished(this, false);
      return true;
    }

    return false;
  }

  public destroy(): void {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
    this.healthBg.destroy();
    this.progressBg.destroy();
    this.healthFill.destroy();
    this.progressFill.destroy();
    this.label.destroy();
  }

  private complete(): void {
    if (this.state !== 'opening') return;
    this.state = 'opened';
    eventBus.emit('resource-mined', { type: 'gradePoint', amount: this.rewardAmount });
    this.onFinished(this, true);
  }
}

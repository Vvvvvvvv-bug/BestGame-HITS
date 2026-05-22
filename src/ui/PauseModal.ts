import { TEXT_STYLE, UI_COLORS } from './uiTheme';

const MODAL_DEPTH = 3000;
const PANEL_W = 360;
const PANEL_H = 180;

export class PauseModal {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly onYes: () => void;
  private readonly onNo: () => void;

  constructor(scene: Phaser.Scene, onYes: () => void, onNo: () => void) {
    this.scene = scene;
    this.onYes = onYes;
    this.onNo = onNo;

    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    // backdrop
    const backdrop = scene.add
      .rectangle(cx, cy, scene.scale.width, scene.scale.height, 0x05080f, 0.55)
      .setDepth(MODAL_DEPTH)
      .setInteractive();
    backdrop.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
    this.track(backdrop);

    // panel
    this.track(
      scene.add
        .rectangle(cx, cy, PANEL_W, PANEL_H, 0x0f1a2c, 0.98)
        .setStrokeStyle(2, UI_COLORS.border)
        .setDepth(MODAL_DEPTH + 1)
    );

    // title
    this.track(
      scene.add
        .text(cx, cy - PANEL_H / 2 + 38, 'ПАУЗА', {
          ...TEXT_STYLE,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#d9fbff',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    // question
    this.track(
      scene.add
        .text(cx, cy - 10, 'Хотите выйти в меню?', {
          ...TEXT_STYLE,
          fontSize: '16px',
          color: '#b0c8db',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    // Yes button
    this.buildButton(cx - 78, cy + 48, 'ДА', 0xff6b7d, () => this.onYes());

    // No button
    this.buildButton(cx + 78, cy + 48, 'НЕТ', 0x79e6b2, () => this.onNo());
  }

  private buildButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    const bg = this.scene.add
      .rectangle(x, y, 110, 40, 0x1b2a3f, 0.98)
      .setStrokeStyle(1.5, color, 0.85)
      .setDepth(MODAL_DEPTH + 2)
      .setInteractive({ useHandCursor: true });
    this.track(bg);

    const txt = this.scene.add
      .text(x, y, label, {
        ...TEXT_STYLE,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#e9fbff',
      })
      .setOrigin(0.5)
      .setDepth(MODAL_DEPTH + 3);
    this.track(txt);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x243b55, 1);
      txt.setColor('#ffffff');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1b2a3f, 0.98);
      txt.setColor('#e9fbff');
    });
    bg.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      onClick();
    });
  }

  public getObjects(): Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  public destroy(): void {
    for (const obj of this.objects) obj.destroy();
    this.objects.length = 0;
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj);
    return obj;
  }
}

import { TEXT_STYLE, UI_COLORS } from './uiTheme';

const MODAL_DEPTH = 2500;
const PANEL_W = 460;
const PANEL_H = 320;

export class ModeSelectorModal {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly onSelect: (mode: 'normal' | 'armageddon') => void;

  constructor(scene: Phaser.Scene, onSelect: (mode: 'normal' | 'armageddon') => void) {
    this.scene = scene;
    this.onSelect = onSelect;

    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    
    const backdrop = scene.add
      .rectangle(cx, cy, scene.scale.width, scene.scale.height, 0x05080f, 0.72)
      .setDepth(MODAL_DEPTH)
      .setInteractive();
    backdrop.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => e.stopPropagation());
    this.track(backdrop);

    
    this.track(
      scene.add
        .rectangle(cx, cy, PANEL_W, PANEL_H, 0x0f1a2c, 0.98)
        .setStrokeStyle(2, UI_COLORS.border)
        .setDepth(MODAL_DEPTH + 1)
    );

    
    this.track(
      scene.add
        .text(cx, cy - PANEL_H / 2 + 44, 'ВЫБЕРИТЕ РЕЖИМ', {
          ...TEXT_STYLE,
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#d9fbff',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    
    this.buildModeButton(cx, cy - 28, 'ОБЫЧНЫЙ', 'Пройдите 6 волн и победите', 0x2196F3, 'normal');

    
    this.buildModeButton(cx, cy + 72, 'АРМАГЕДДОН', 'Бесконечная орда. Защищайся до последнего.', 0xe11d48, 'armageddon');
  }

  private buildModeButton(
    x: number,
    y: number,
    label: string,
    desc: string,
    color: number,
    mode: 'normal' | 'armageddon'
  ): void {
    const bg = this.scene.add
      .rectangle(x, y, 380, 70, 0x1b2a3f, 0.98)
      .setStrokeStyle(2, color, 0.85)
      .setDepth(MODAL_DEPTH + 2)
      .setInteractive({ useHandCursor: true });
    this.track(bg);

    this.scene.add
      .text(x, y - 10, label, {
        ...TEXT_STYLE,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#e9fbff',
      })
      .setOrigin(0.5)
      .setDepth(MODAL_DEPTH + 3);

    this.scene.add
      .text(x, y + 18, desc, {
        ...TEXT_STYLE,
        fontSize: '12px',
        color: '#b0c8db',
      })
      .setOrigin(0.5)
      .setDepth(MODAL_DEPTH + 3);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x243b55, 1);
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1b2a3f, 0.98);
    });
    bg.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      this.destroy();
      this.onSelect(mode);
    });
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

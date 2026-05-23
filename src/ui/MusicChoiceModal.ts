import { TEXT_STYLE, UI_COLORS } from './uiTheme';

const MODAL_DEPTH = 2600;
const PANEL_W = 460;
const PANEL_H = 340;

export type ArmageddonMusic = 'грустная' | 'крутая' | 'веселая';

export class MusicChoiceModal {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly onSelect: (track: ArmageddonMusic) => void;

  constructor(scene: Phaser.Scene, onSelect: (track: ArmageddonMusic) => void) {
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
        .text(cx, cy - PANEL_H / 2 + 44, 'ВЫБЕРИТЕ МУЗЫКУ', {
          ...TEXT_STYLE,
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#d9fbff',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    
    this.track(
      scene.add
        .text(cx, cy - PANEL_H / 2 + 82, 'Армагеддон — звуковое сопровождение', {
          ...TEXT_STYLE,
          fontSize: '14px',
          color: UI_COLORS.mutedText,
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    this.buildMusicButton(cx, cy - 28, 'ГРУСТНАЯ', '#92b4cb', 'грустная');
    this.buildMusicButton(cx, cy + 38, 'КРУТАЯ', '#ffcf73', 'крутая');
    this.buildMusicButton(cx, cy + 104, 'ВЕСЕЛАЯ', '#79e6b2', 'веселая');
  }

  private buildMusicButton(
    x: number,
    y: number,
    label: string,
    color: string,
    track: ArmageddonMusic
  ): void {
    const bg = this.scene.add
      .rectangle(x, y, 380, 50, 0x1b2a3f, 0.98)
      .setStrokeStyle(2, parseInt(color.replace('#', '0x')), 0.85)
      .setDepth(MODAL_DEPTH + 2)
      .setInteractive({ useHandCursor: true });
    this.track(bg);

    this.scene.add
      .text(x, y, label, {
        ...TEXT_STYLE,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#e9fbff',
      })
      .setOrigin(0.5)
      .setDepth(MODAL_DEPTH + 3);

    bg.on('pointerover', () => bg.setFillStyle(0x243b55, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x1b2a3f, 0.98));
    bg.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      this.destroy();
      this.onSelect(track);
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

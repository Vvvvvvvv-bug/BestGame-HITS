import { TEXT_STYLE, UI_COLORS } from './uiTheme';
import { settings, type GameSettings } from '../core/Settings';

const MODAL_DEPTH = 2000;
const PANEL_W = 440;
const PANEL_H = 340;

export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly onClose: () => void;

  // slider refs
  private sfxFill!: Phaser.GameObjects.Rectangle;
  private sfxKnob!: Phaser.GameObjects.Ellipse;
  private musicFill!: Phaser.GameObjects.Rectangle;
  private musicKnob!: Phaser.GameObjects.Ellipse;

  // difficulty squares
  private difficultyBgs: Phaser.GameObjects.Rectangle[] = [];
  private difficultyLabels: Phaser.GameObjects.Text[] = [];

  // percent labels
  private sfxPercentText!: Phaser.GameObjects.Text;
  private musicPercentText!: Phaser.GameObjects.Text;

  private unsubscribe!: () => void;

  constructor(scene: Phaser.Scene, onClose: () => void) {
    this.scene = scene;
    this.onClose = onClose;

    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    // backdrop
    const backdrop = scene.add
      .rectangle(cx, cy, scene.scale.width, scene.scale.height, 0x05080f, 0.72)
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

    // inner border
    this.track(
      scene.add
        .rectangle(cx, cy, PANEL_W - 16, PANEL_H - 16, 0x0c1626, 0.9)
        .setStrokeStyle(1, UI_COLORS.borderMuted)
        .setDepth(MODAL_DEPTH + 1)
    );

    // title
    this.track(
      scene.add
        .text(cx, cy - PANEL_H / 2 + 32, 'НАСТРОЙКИ', {
          ...TEXT_STYLE,
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#d9fbff',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    // SFX slider
    this.buildSlider(cx, cy - 60, 'Громкость звуков', (v) => settings.setSfxVolume(v), 'sfx');

    // Music slider
    this.buildSlider(cx, cy - 6, 'Громкость музыки', (v) => settings.setMusicVolume(v), 'music');

    // Difficulty squares
    this.buildDifficultySelector(cx, cy + 52);

    // Close button
    this.buildCloseButton(cx, cy + PANEL_H / 2 - 28);

    this.unsubscribe = settings.subscribe((s) => this.syncFromSettings(s));
    this.syncFromSettings(settings.get());
  }

  private buildSlider(
    cx: number,
    cy: number,
    label: string,
    onChange: (value: number) => void,
    key: 'sfx' | 'music'
  ): void {
    const width = 300;
    const height = 8;
    const knobRadius = 10;

    // label
    this.track(
      this.scene.add
        .text(cx, cy - 20, label, {
          ...TEXT_STYLE,
          fontSize: '14px',
          color: UI_COLORS.mutedText,
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    // track bg
    const trackBg = this.scene.add
      .rectangle(cx, cy, width, height, 0x1b2a3f, 1)
      .setStrokeStyle(1, UI_COLORS.borderMuted)
      .setDepth(MODAL_DEPTH + 2)
      .setInteractive();
    this.track(trackBg);

    // fill
    const fill = this.scene.add
      .rectangle(cx - width / 2, cy, width, height, 0x2dc7ff, 1)
      .setOrigin(0, 0.5)
      .setDepth(MODAL_DEPTH + 3);
    this.track(fill);

    // knob
    const knob = this.scene.add
      .ellipse(cx + width / 2, cy, knobRadius * 2, knobRadius * 2, 0xd9fbff, 1)
      .setStrokeStyle(2, 0x2dc7ff)
      .setDepth(MODAL_DEPTH + 4)
      .setInteractive({ useHandCursor: true, draggable: true });
    this.track(knob);

    if (key === 'sfx') {
      this.sfxFill = fill;
      this.sfxKnob = knob;
    } else {
      this.musicFill = fill;
      this.musicKnob = knob;
    }

    const minX = cx - width / 2;
    const maxX = cx + width / 2;

    const updateValue = (pointerX: number) => {
      const clamped = Math.max(minX, Math.min(maxX, pointerX));
      const ratio = (clamped - minX) / width;
      fill.width = width * ratio;
      fill.x = minX;
      knob.x = clamped;
      onChange(ratio);
    };

    knob.on('drag', (pointer: Phaser.Input.Pointer) => {
      updateValue(pointer.x);
    });

    trackBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      updateValue(pointer.x);
    });

    // percent text
    const percentText = this.scene.add
      .text(cx + width / 2 + 18, cy, '100%', {
        ...TEXT_STYLE,
        fontSize: '13px',
        color: UI_COLORS.mutedText,
      })
      .setOrigin(0, 0.5)
      .setDepth(MODAL_DEPTH + 3);
    this.track(percentText);

    if (key === 'sfx') this.sfxPercentText = percentText;
    else this.musicPercentText = percentText;

    const updatePercent = () => {
      const ratio = (knob.x - minX) / width;
      percentText.setText(`${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`);
    };
    knob.on('drag', updatePercent);
    trackBg.on('pointerdown', updatePercent);
  }

  private buildDifficultySelector(cx: number, cy: number): void {
    this.track(
      this.scene.add
        .text(cx, cy - 34, 'Сложность', {
          ...TEXT_STYLE,
          fontSize: '14px',
          color: UI_COLORS.mutedText,
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    const options: { key: GameSettings['difficulty']; color: number; label: string }[] = [
      { key: 'easy', color: 0x6ee7b7, label: 'Легко' },
      { key: 'normal', color: 0xfcd34d, label: 'Средне' },
      { key: 'hard', color: 0xe11d48, label: 'Сложно' },
    ];

    const size = 40;
    const gap = 28;
    const totalW = options.length * size + (options.length - 1) * gap;
    const startX = cx - totalW / 2 + size / 2;

    options.forEach((opt, i) => {
      const bx = startX + i * (size + gap);

      // colored square
      const bg = this.scene.add
        .rectangle(bx, cy + 10, size, size, opt.color, 0.9)
        .setStrokeStyle(2, 0xffffff, 0.35)
        .setDepth(MODAL_DEPTH + 2)
        .setInteractive({ useHandCursor: true });
      this.track(bg);

      // label below
      const txt = this.scene.add
        .text(bx, cy + 40, opt.label, {
          ...TEXT_STYLE,
          fontSize: '12px',
          color: '#b0c8db',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2);
      this.track(txt);

      bg.on('pointerover', () => {
        this.scene.tweens.add({ targets: bg, scaleX: 1.15, scaleY: 1.15, duration: 100, ease: 'Quad.easeOut' });
        bg.setStrokeStyle(3, 0xffffff, 1);
      });
      bg.on('pointerout', () => {
        this.scene.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 100, ease: 'Quad.easeOut' });
        this.syncFromSettings(settings.get());
      });
      bg.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        settings.setDifficulty(opt.key);
      });

      this.difficultyBgs.push(bg);
      this.difficultyLabels.push(txt);
    });
  }

  private buildCloseButton(cx: number, cy: number): void {
    const bg = this.scene.add
      .rectangle(cx, cy, 140, 34, 0x142742, 0.96)
      .setStrokeStyle(2, 0x66dfff, 0.62)
      .setDepth(MODAL_DEPTH + 2)
      .setInteractive({ useHandCursor: true });
    this.track(bg);

    const txt = this.scene.add
      .text(cx, cy, 'ЗАКРЫТЬ', {
        ...TEXT_STYLE,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#e9fbff',
      })
      .setOrigin(0.5)
      .setDepth(MODAL_DEPTH + 3);
    this.track(txt);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x1d3558, 0.98);
      txt.setColor('#ffffff');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x142742, 0.96);
      txt.setColor('#e9fbff');
    });
    bg.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      this.destroy();
      this.onClose();
    });
  }

  private syncFromSettings(s: GameSettings): void {
    // sfx slider
    if (this.sfxKnob && this.sfxFill) {
      const width = 300;
      const cx = this.scene.scale.width / 2;
      const trackMin = cx - width / 2;
      this.sfxKnob.x = trackMin + width * s.sfxVolume;
      this.sfxFill.width = width * s.sfxVolume;
      this.sfxPercentText?.setText(`${Math.round(s.sfxVolume * 100)}%`);
    }
    // music slider
    if (this.musicKnob && this.musicFill) {
      const width = 300;
      const cx = this.scene.scale.width / 2;
      const trackMin = cx - width / 2;
      this.musicKnob.x = trackMin + width * s.musicVolume;
      this.musicFill.width = width * s.musicVolume;
      this.musicPercentText?.setText(`${Math.round(s.musicVolume * 100)}%`);
    }
    // difficulty highlight
    const difficulties: GameSettings['difficulty'][] = ['easy', 'normal', 'hard'];
    const colors = [0x6ee7b7, 0xfcd34d, 0xe11d48];
    for (let i = 0; i < this.difficultyBgs.length; i++) {
      const bg = this.difficultyBgs[i];
      if (difficulties[i] === s.difficulty) {
        bg.setFillStyle(colors[i], 1).setStrokeStyle(2, 0xffffff, 1).setAlpha(1);
      } else {
        bg.setFillStyle(colors[i], 0.5).setStrokeStyle(2, 0xffffff, 0.2).setAlpha(0.7);
      }
    }
  }

  public destroy(): void {
    this.unsubscribe?.();
    for (const obj of this.objects) obj.destroy();
    this.objects.length = 0;
  }

  public getObjects(): Phaser.GameObjects.GameObject[] {
    return this.objects;
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj);
    return obj;
  }
}

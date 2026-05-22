import { TEXT_STYLE, UI_COLORS } from './uiTheme';
import { settings, type GameSettings } from '../core/Settings';

const MODAL_DEPTH = 2000;
const PANEL_W = 480;
const PANEL_H = 380;

export class SettingsPanel {
  private readonly scene: Phaser.Scene;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly onClose: () => void;

  // slider refs
  private sfxFill!: Phaser.GameObjects.Rectangle;
  private sfxKnob!: Phaser.GameObjects.Ellipse;
  private musicFill!: Phaser.GameObjects.Rectangle;
  private musicKnob!: Phaser.GameObjects.Ellipse;

  // quality & difficulty buttons
  private qualityBgs: Phaser.GameObjects.Rectangle[] = [];
  private difficultyBgs: Phaser.GameObjects.Rectangle[] = [];

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
    this.buildSlider(cx, cy - 70, 'Громкость звуков', (v) => settings.setSfxVolume(v), 'sfx');

    // Music slider
    this.buildSlider(cx, cy - 10, 'Громкость музыки', (v) => settings.setMusicVolume(v), 'music');

    // Graphics quality
    this.buildQualitySelector(cx, cy + 48);

    // Difficulty
    this.buildDifficultySelector(cx, cy + 108);

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
    const width = 320;
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

  private buildQualitySelector(cx: number, cy: number): void {
    this.buildToggleRow(cx, cy, 'Качество графики', [
      { key: 'low' as const, label: 'Плохая' },
      { key: 'medium' as const, label: 'Средняя' },
      { key: 'high' as const, label: 'Крутая' },
    ], (k) => settings.setGraphicsQuality(k), this.qualityBgs);
  }

  private buildDifficultySelector(cx: number, cy: number): void {
    this.buildToggleRow(cx, cy, 'Сложность', [
      { key: 'easy' as const, label: 'Легко' },
      { key: 'normal' as const, label: 'Средне' },
      { key: 'hard' as const, label: 'Сложно' },
    ], (k) => settings.setDifficulty(k), this.difficultyBgs);
  }

  private buildToggleRow<K extends string>(
    cx: number,
    cy: number,
    label: string,
    options: { key: K; label: string }[],
    onSelect: (key: K) => void,
    bgArray: Phaser.GameObjects.Rectangle[]
  ): void {
    this.track(
      this.scene.add
        .text(cx, cy - 18, label, {
          ...TEXT_STYLE,
          fontSize: '13px',
          color: UI_COLORS.mutedText,
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 2)
    );

    const btnW = 100;
    const btnH = 34;
    const gap = 10;
    const totalW = options.length * btnW + (options.length - 1) * gap;
    const startX = cx - totalW / 2 + btnW / 2;

    options.forEach((opt, i) => {
      const bx = startX + i * (btnW + gap);
      const bg = this.scene.add
        .rectangle(bx, cy + 8, btnW, btnH, 0x1b2a3f, 0.98)
        .setStrokeStyle(1.5, UI_COLORS.borderMuted)
        .setDepth(MODAL_DEPTH + 2)
        .setInteractive({ useHandCursor: true });
      this.track(bg);

      const txt = this.scene.add
        .text(bx, cy + 8, opt.label, {
          ...TEXT_STYLE,
          fontSize: '13px',
          color: '#dbe9f7',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 3);
      this.track(txt);

      bg.on('pointerover', () => bg.setStrokeStyle(2, UI_COLORS.selected));
      bg.on('pointerout', () => this.syncFromSettings(settings.get()));
      bg.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        onSelect(opt.key);
      });

      bgArray.push(bg);
    });
  }

  private buildCloseButton(cx: number, cy: number): void {
    const bg = this.scene.add
      .rectangle(cx, cy, 160, 38, 0x142742, 0.96)
      .setStrokeStyle(2, 0x66dfff, 0.62)
      .setDepth(MODAL_DEPTH + 2)
      .setInteractive({ useHandCursor: true });
    this.track(bg);

    const txt = this.scene.add
      .text(cx, cy, 'ЗАКРЫТЬ', {
        ...TEXT_STYLE,
        fontSize: '15px',
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
      const width = 320;
      const cx = this.scene.scale.width / 2;
      const trackMin = cx - width / 2;
      this.sfxKnob.x = trackMin + width * s.sfxVolume;
      this.sfxFill.width = width * s.sfxVolume;
      this.sfxPercentText?.setText(`${Math.round(s.sfxVolume * 100)}%`);
    }
    // music slider
    if (this.musicKnob && this.musicFill) {
      const width = 320;
      const cx = this.scene.scale.width / 2;
      const trackMin = cx - width / 2;
      this.musicKnob.x = trackMin + width * s.musicVolume;
      this.musicFill.width = width * s.musicVolume;
      this.musicPercentText?.setText(`${Math.round(s.musicVolume * 100)}%`);
    }
    // quality highlight
    const qualities: GameSettings['graphicsQuality'][] = ['low', 'medium', 'high'];
    for (let i = 0; i < this.qualityBgs.length; i++) {
      const bg = this.qualityBgs[i];
      if (qualities[i] === s.graphicsQuality) {
        bg.setFillStyle(0x1d3558, 1).setStrokeStyle(2, UI_COLORS.selected);
      } else {
        bg.setFillStyle(0x1b2a3f, 0.98).setStrokeStyle(1.5, UI_COLORS.borderMuted);
      }
    }
    // difficulty highlight
    const difficulties: GameSettings['difficulty'][] = ['easy', 'normal', 'hard'];
    for (let i = 0; i < this.difficultyBgs.length; i++) {
      const bg = this.difficultyBgs[i];
      if (difficulties[i] === s.difficulty) {
        bg.setFillStyle(0x1d3558, 1).setStrokeStyle(2, UI_COLORS.selected);
      } else {
        bg.setFillStyle(0x1b2a3f, 0.98).setStrokeStyle(1.5, UI_COLORS.borderMuted);
      }
    }
  }

  public destroy(): void {
    this.unsubscribe?.();
    for (const obj of this.objects) obj.destroy();
    this.objects.length = 0;
  }

  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.objects.push(obj);
    return obj;
  }
}

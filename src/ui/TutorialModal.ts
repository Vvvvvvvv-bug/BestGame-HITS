import { TEXT_STYLE, UI_COLORS, UI_DEPTH } from './uiTheme';

const MODAL_DEPTH = UI_DEPTH + 50;
const PANEL_W = 580;
const PANEL_H = 420;
const SLIDES_COUNT = 4;

const SLIDE_TITLES = ['Ресурсы', 'Добыча ресурсов', 'Защита базы', 'Дропы'];

export class TutorialModal {
  private readonly scene: Phaser.Scene;
  private readonly onClose: () => void;
  private readonly allObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly slideContents: Phaser.GameObjects.GameObject[][] = [[], [], [], []];
  private titleText!: Phaser.GameObjects.Text;
  private prevBtn!: Phaser.GameObjects.Rectangle;
  private prevLabel!: Phaser.GameObjects.Text;
  private nextBtn!: Phaser.GameObjects.Rectangle;
  private nextLabel!: Phaser.GameObjects.Text;
  private readonly dots: Phaser.GameObjects.Rectangle[] = [];
  private currentSlide = 0;

  constructor(scene: Phaser.Scene, onClose: () => void) {
    this.scene = scene;
    this.onClose = onClose;

    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    // Backdrop — blocks all world input
    const backdrop = scene.add
      .rectangle(cx, cy, scene.scale.width, scene.scale.height, 0x03070f, 0.88)
      .setDepth(MODAL_DEPTH)
      .setInteractive();
    backdrop.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) =>
        e.stopPropagation(),
    );
    this.track(backdrop);

    // Panel
    this.track(
      scene.add
        .rectangle(cx, cy, PANEL_W, PANEL_H, 0x0c1520, 0.98)
        .setStrokeStyle(2, UI_COLORS.border)
        .setDepth(MODAL_DEPTH + 1),
    );

    // Header strip
    this.track(
      scene.add
        .rectangle(cx, cy - PANEL_H / 2 + 26, PANEL_W, 52, 0x111e2e, 1)
        .setDepth(MODAL_DEPTH + 1),
    );

    // "КАК ИГРАТЬ" label
    this.track(
      scene.add
        .text(cx - PANEL_W / 2 + 18, cy - PANEL_H / 2 + 16, 'КАК ИГРАТЬ', {
          ...TEXT_STYLE,
          fontSize: '11px',
          color: '#3a6a8a',
          fontStyle: 'bold',
        })
        .setDepth(MODAL_DEPTH + 2),
    );

    // Slide title (shared, updated per slide)
    this.titleText = scene.add
      .text(cx, cy - PANEL_H / 2 + 26, '', {
        ...TEXT_STYLE,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#d9fbff',
      })
      .setOrigin(0.5)
      .setDepth(MODAL_DEPTH + 2);
    this.track(this.titleText);

    this.buildSlide0(cx, cy);
    this.buildSlide1(cx, cy);
    this.buildSlide2(cx, cy);
    this.buildSlide3(cx, cy);
    this.buildDots(cx, cy);
    this.buildNavButtons(cx, cy);

    this.showSlide(0);
  }

  // ─── Slide 0: Resources ───────────────────────────────────────────────────

  private buildSlide0(cx: number, cy: number): void {
    const items = [
      {
        tex: 'tileset' as const, frame: 'iron' as string | undefined,
        nameColor: '#7fe0ff',
        name: 'Металл',
        desc: 'Основной ресурс. Нужен для турелей, буров и бомб.',
      },
      {
        tex: 'tileset' as const, frame: 'stone' as string | undefined,
        nameColor: '#9bb3c7',
        name: 'Камень',
        desc: 'Строительный ресурс. Используется для буров и стен.',
      },
      {
        tex: 'airdrop' as const, frame: undefined as string | undefined,
        nameColor: '#ffcf73',
        name: 'Очки улучшения',
        desc: 'Открывают турели и апгрейды. Получайте из дропов.',
      },
    ];

    const startY = cy - 96;
    const rowH = 80;
    const rowGap = 10;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const y = startY + i * (rowH + rowGap);

      this.strack(
        this.scene.add
          .rectangle(cx, y, PANEL_W - 44, rowH, 0x131e2e, 0.9)
          .setStrokeStyle(1, UI_COLORS.borderMuted)
          .setDepth(MODAL_DEPTH + 2),
        0,
      );

      this.strack(
        this.scene.add
          .sprite(cx - PANEL_W / 2 + 46, y, item.tex, item.frame)
          .setDisplaySize(42, 42)
          .setDepth(MODAL_DEPTH + 3),
        0,
      );

      this.strack(
        this.scene.add
          .text(cx - PANEL_W / 2 + 78, y - 18, item.name, {
            ...TEXT_STYLE,
            fontSize: '16px',
            fontStyle: 'bold',
            color: item.nameColor,
          })
          .setDepth(MODAL_DEPTH + 3),
        0,
      );

      this.strack(
        this.scene.add
          .text(cx - PANEL_W / 2 + 78, y + 4, item.desc, {
            ...TEXT_STYLE,
            fontSize: '13px',
            color: '#7a9ab5',
            wordWrap: { width: PANEL_W - 130 },
          })
          .setDepth(MODAL_DEPTH + 3),
        0,
      );
    }
  }

  // ─── Slide 1: Drills ──────────────────────────────────────────────────────

  private buildSlide1(cx: number, cy: number): void {
    this.strack(
      this.scene.add
        .sprite(cx, cy - 105, 'drill')
        .setDisplaySize(76, 76)
        .setDepth(MODAL_DEPTH + 3),
      1,
    );

    this.strack(
      this.scene.add
        .text(cx, cy - 48, 'Ставьте буры на плитки железа или камня', {
          ...TEXT_STYLE,
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#d0e8f8',
          align: 'center',
          wordWrap: { width: PANEL_W - 60 },
        })
        .setOrigin(0.5, 0)
        .setDepth(MODAL_DEPTH + 3),
      1,
    );

    this.strack(
      this.scene.add
        .text(cx, cy - 12, 'для автоматической добычи ресурсов', {
          ...TEXT_STYLE,
          fontSize: '15px',
          color: '#7a9ab5',
          align: 'center',
        })
        .setOrigin(0.5, 0)
        .setDepth(MODAL_DEPTH + 3),
      1,
    );

    // Tile icons row
    const tileY = cy + 68;
    const tileSize = 52;

    for (const [offset, frame, label, color] of [
      [-90, 'iron', 'Железо', '#7fe0ff'],
      [90, 'stone', 'Камень', '#9bb3c7'],
    ] as [number, string, string, string][]) {
      this.strack(
        this.scene.add
          .sprite(cx + offset, tileY, 'tileset', frame)
          .setDisplaySize(tileSize, tileSize)
          .setDepth(MODAL_DEPTH + 3),
        1,
      );
      this.strack(
        this.scene.add
          .text(cx + offset, tileY + 32, label, {
            ...TEXT_STYLE,
            fontSize: '13px',
            color,
          })
          .setOrigin(0.5)
          .setDepth(MODAL_DEPTH + 3),
        1,
      );
    }

    this.strack(
      this.scene.add
        .text(cx, tileY + 62, 'Стоимость буров растёт с каждой постройкой', {
          ...TEXT_STYLE,
          fontSize: '12px',
          color: '#3a6a8a',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 3),
      1,
    );
  }

  // ─── Slide 2: Turrets ─────────────────────────────────────────────────────

  private buildSlide2(cx: number, cy: number): void {
    const entries = [
      {
        key: 'turret-1',
        x: cx - 128,
        color: '#7fe0ff',
        name: 'Обычная турель',
        desc: 'Атакует врагов и наносит урон.\nМожно улучшить за очки.',
      },
      {
        key: 'turret-freeze',
        x: cx + 128,
        color: '#b0d8ff',
        name: 'Крио-турель',
        desc: 'Замедляет врагов ледяным лучом.\nОтлично в паре с обычными.',
      },
    ];

    // Vertical divider
    this.strack(
      this.scene.add
        .rectangle(cx, cy - 40, 2, 180, UI_COLORS.borderMuted, 0.5)
        .setDepth(MODAL_DEPTH + 2),
      2,
    );

    for (const t of entries) {
      this.strack(
        this.scene.add
          .sprite(t.x, cy - 95, t.key)
          .setDisplaySize(72, 72)
          .setDepth(MODAL_DEPTH + 3),
        2,
      );

      this.strack(
        this.scene.add
          .text(t.x, cy - 46, t.name, {
            ...TEXT_STYLE,
            fontSize: '15px',
            fontStyle: 'bold',
            color: t.color,
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(MODAL_DEPTH + 3),
        2,
      );

      this.strack(
        this.scene.add
          .text(t.x, cy - 22, t.desc, {
            ...TEXT_STYLE,
            fontSize: '13px',
            color: '#7a9ab5',
            align: 'center',
            wordWrap: { width: 210 },
          })
          .setOrigin(0.5, 0)
          .setDepth(MODAL_DEPTH + 3),
        2,
      );
    }

    // Callout boxes
    const callouts = [
      { x: cx - 128, bg: 0x131f2e, stroke: UI_COLORS.borderMuted, text: 'Урон / Дальность\nСкорость / HP', y: cy + 60 },
      { x: cx + 128, bg: 0x0e1f30, stroke: 0x4a7aaa, text: 'Снижает скорость\nна 60%', y: cy + 60 },
    ];
    for (const c of callouts) {
      this.strack(
        this.scene.add
          .rectangle(c.x, c.y, 195, 52, c.bg, 0.85)
          .setStrokeStyle(1, c.stroke)
          .setDepth(MODAL_DEPTH + 2),
        2,
      );
      this.strack(
        this.scene.add
          .text(c.x, c.y, c.text, {
            ...TEXT_STYLE,
            fontSize: '12px',
            color: '#8aa8c0',
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(MODAL_DEPTH + 3),
        2,
      );
    }

    this.strack(
      this.scene.add
        .text(cx, cy + 110, 'Комбинируйте турели для максимальной обороны', {
          ...TEXT_STYLE,
          fontSize: '13px',
          color: '#3a8a6a',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(MODAL_DEPTH + 3),
      2,
    );
  }

  // ─── Slide 3: Drops ───────────────────────────────────────────────────────

  private buildSlide3(cx: number, cy: number): void {
    this.strack(
      this.scene.add
        .sprite(cx, cy - 108, 'airdrop')
        .setDisplaySize(76, 76)
        .setDepth(MODAL_DEPTH + 3),
      3,
    );

    const steps: [string, string][] = [
      ['#4a7a9b', 'Во время волн на поле появляются Дропы'],
      ['#4a7a9b', 'Подойдите к дропу и кликните — откроется задание'],
      ['#3a8a5a', 'Решите задание правильно → +1 Очко улучшения'],
      ['#8a3a3a', 'Ошибётесь или не успеете → появится враг'],
    ];

    const startY = cy - 40;
    const stepGap = 44;

    for (let i = 0; i < steps.length; i++) {
      const [dotColor, text] = steps[i];
      const y = startY + i * stepGap;

      // dot
      this.strack(
        this.scene.add
          .rectangle(cx - PANEL_W / 2 + 32, y + 8, 8, 8, parseInt(dotColor.replace('#', ''), 16))
          .setDepth(MODAL_DEPTH + 3),
        3,
      );

      this.strack(
        this.scene.add
          .text(cx - PANEL_W / 2 + 46, y, text, {
            ...TEXT_STYLE,
            fontSize: '14px',
            color: '#c0d8ea',
            wordWrap: { width: PANEL_W - 80 },
          })
          .setDepth(MODAL_DEPTH + 3),
        3,
      );
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  private buildDots(cx: number, cy: number): void {
    const dotsY = cy + PANEL_H / 2 - 22;
    const spacing = 18;
    const totalW = (SLIDES_COUNT - 1) * spacing;
    for (let i = 0; i < SLIDES_COUNT; i++) {
      const dot = this.scene.add
        .rectangle(cx - totalW / 2 + i * spacing, dotsY, 8, 8, UI_COLORS.borderMuted)
        .setDepth(MODAL_DEPTH + 3);
      this.dots.push(dot);
      this.track(dot);
    }
  }

  private buildNavButtons(cx: number, cy: number): void {
    const btnY = cy + PANEL_H / 2 - 22;

    this.prevBtn = this.scene.add
      .rectangle(cx - PANEL_W / 2 + 58, btnY, 100, 34, 0x1b2a3f, 0.98)
      .setStrokeStyle(1.5, UI_COLORS.borderMuted)
      .setDepth(MODAL_DEPTH + 3)
      .setInteractive({ useHandCursor: true });
    this.track(this.prevBtn);

    this.prevLabel = this.scene.add
      .text(cx - PANEL_W / 2 + 58, btnY, '← Назад', {
        ...TEXT_STYLE,
        fontSize: '14px',
        color: '#9bb3c7',
      })
      .setOrigin(0.5)
      .setDepth(MODAL_DEPTH + 4);
    this.track(this.prevLabel);

    this.nextBtn = this.scene.add
      .rectangle(cx + PANEL_W / 2 - 62, btnY, 116, 34, 0x163a5a, 0.98)
      .setStrokeStyle(1.5, UI_COLORS.border)
      .setDepth(MODAL_DEPTH + 3)
      .setInteractive({ useHandCursor: true });
    this.track(this.nextBtn);

    this.nextLabel = this.scene.add
      .text(cx + PANEL_W / 2 - 62, btnY, 'Далее →', {
        ...TEXT_STYLE,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#d9fbff',
      })
      .setOrigin(0.5)
      .setDepth(MODAL_DEPTH + 4);
    this.track(this.nextLabel);

    this.prevBtn.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        if (this.currentSlide > 0) this.showSlide(this.currentSlide - 1);
      },
    );
    this.prevBtn.on('pointerover', () => this.prevBtn.setFillStyle(0x243b55, 1));
    this.prevBtn.on('pointerout', () => this.prevBtn.setFillStyle(0x1b2a3f, 0.98));

    this.nextBtn.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        if (this.currentSlide < SLIDES_COUNT - 1) {
          this.showSlide(this.currentSlide + 1);
        } else {
          this.close();
        }
      },
    );
    this.nextBtn.on('pointerover', () => this.nextBtn.setFillStyle(0x1d3f5a, 1));
    this.nextBtn.on('pointerout', () => {
      if (this.currentSlide === SLIDES_COUNT - 1) {
        this.nextBtn.setFillStyle(0x1a3d28, 0.98);
      } else {
        this.nextBtn.setFillStyle(0x163a5a, 0.98);
      }
    });
  }

  // ─── Slide switching ─────────────────────────────────────────────────────

  private showSlide(index: number): void {
    for (let i = 0; i < SLIDES_COUNT; i++) {
      const visible = i === index;
      for (const obj of this.slideContents[i]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).setVisible(visible);
      }
    }
    this.currentSlide = index;

    this.titleText.setText(SLIDE_TITLES[index]);

    for (let i = 0; i < SLIDES_COUNT; i++) {
      this.dots[i].setFillStyle(i === index ? UI_COLORS.selected : UI_COLORS.borderMuted);
    }

    const isFirst = index === 0;
    const isLast = index === SLIDES_COUNT - 1;

    this.prevBtn.setVisible(!isFirst);
    this.prevLabel.setVisible(!isFirst);

    if (isLast) {
      this.nextLabel.setText('Начать!');
      this.nextBtn.setStrokeStyle(1.5, UI_COLORS.success);
      this.nextBtn.setFillStyle(0x1a3d28, 0.98);
    } else {
      this.nextLabel.setText('Далее →');
      this.nextBtn.setStrokeStyle(1.5, UI_COLORS.border);
      this.nextBtn.setFillStyle(0x163a5a, 0.98);
    }
  }

  private close(): void {
    this.onClose();
    this.destroy();
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  public getObjects(): Phaser.GameObjects.GameObject[] {
    return this.allObjects;
  }

  public destroy(): void {
    for (const obj of this.allObjects) {
      if (obj.active) obj.destroy();
    }
    this.allObjects.length = 0;
    for (const s of this.slideContents) s.length = 0;
  }

  // track in allObjects only (shared elements: backdrop, panel, title, nav)
  private track<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.allObjects.push(obj);
    return obj;
  }

  // track in both slideContents[slide] and allObjects (slide-specific elements)
  private strack<T extends Phaser.GameObjects.GameObject>(obj: T, slide: number): T {
    this.slideContents[slide].push(obj);
    this.allObjects.push(obj);
    return obj;
  }
}

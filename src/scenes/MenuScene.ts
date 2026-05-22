import Phaser from 'phaser';
import { playSfx } from '../audio/Sfx';
import { SettingsPanel } from '../ui/SettingsPanel';

export default class MenuScene extends Phaser.Scene {
  private centerX = 0;
  private centerY = 0;

  private bgGradient!: Phaser.GameObjects.Graphics;
  private bgGlowTop!: Phaser.GameObjects.Ellipse;
  private bgGlowBottom!: Phaser.GameObjects.Ellipse;

  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private settingsPanel?: SettingsPanel;

  // Фоновое «поле боя» (без звука)
  private ants: { sprite: Phaser.GameObjects.Sprite; frames: string[]; size: number; speed: number; frameTimer: number; frame: number; dying: boolean }[] = [];
  private turrets: { sprite: Phaser.GameObjects.Sprite; fireTimer: number; freeze: boolean }[] = [];
  private wallX = 0;
  private frontLineX = 0;
  private bombTimer = 0;
  private battleReady = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    // MenuScene идёт раньше MainScene, поэтому грузим нужные ассеты сами.
    this.load.image('mb_ant_1', 'ants_assets/ants_sprite_sheet/4/walk/ant_walk_1.png');
    this.load.image('mb_ant_2', 'ants_assets/ants_sprite_sheet/4/walk/ant_walk_2.png');
    this.load.image('mb_ant_3', 'ants_assets/ants_sprite_sheet/4/walk/ant_walk_3.png');
    this.load.image('mb_brute_1', 'ants_assets/ants_sprite_sheet/10/walk/ant_walk_1.png');
    this.load.image('mb_brute_2', 'ants_assets/ants_sprite_sheet/10/walk/ant_walk_2.png');
    this.load.image('mb_brute_3', 'ants_assets/ants_sprite_sheet/10/walk/ant_walk_3.png');
    this.load.image('mb_boss_1', 'ants_assets/ants_sprite_sheet/9/walk/ant_walk_1.png');
    this.load.image('mb_boss_2', 'ants_assets/ants_sprite_sheet/9/walk/ant_walk_2.png');
    this.load.image('mb_boss_3', 'ants_assets/ants_sprite_sheet/9/walk/ant_walk_3.png');
    this.load.svg('mb_wall', 'src/assets/wall.svg', { width: 96, height: 96 });
    this.load.svg('mb_drill', 'src/assets/drill.svg', { width: 96, height: 96 });
    this.load.svg('mb_bomb', 'src/assets/bomb.svg', { width: 96, height: 96 });
    this.load.svg('mb_base', 'src/assets/base.svg', { width: 192, height: 192 });
    this.load.svg('mb_turret_1', 'src/assets/turret-1.svg', { width: 96, height: 96 });
    this.load.svg('mb_turret_2', 'src/assets/turret-2.svg', { width: 96, height: 96 });
    this.load.svg('mb_turret_3', 'src/assets/turret-3.svg', { width: 96, height: 96 });
    this.load.svg('mb_turret_f', 'src/assets/turret-freeze.svg', { width: 96, height: 96 });
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

    this.battleReady = false;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.children.removeAll(true);

    this.createBackground();
    this.createBattlefield();
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
    const w = Math.min(680, this.scale.width - 40);
    const h = Math.min(500, this.scale.height - 40);

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
    const panelW = Math.min(680, this.scale.width - 40);
    const titleSize = Math.min(72, Math.floor(panelW * 0.13));

    this.title = this.add
      .text(this.centerX, this.centerY - 160, 'BEST GAME: HITS', {
        fontSize: `${titleSize}px`,
        color: '#d9fbff',
        fontStyle: 'bold',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        stroke: '#2dc7ff',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.hint = this.add
      .text(this.centerX, this.centerY + 215, 'Подсказка: строй буровые и турели до начала волны', {
        fontSize: '18px',
        color: '#92b4cb',
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private createButtons(): void {
    this.createButton(this.centerX, this.centerY - 10, 340, 72, 'НАЧАТЬ ИГРУ', () => {
      this.scene.start('MainScene');
    });

    this.createButton(this.centerX, this.centerY + 70, 340, 72, 'НАСТРОЙКИ', () => {
      if (this.settingsPanel) return;
      this.settingsPanel = new SettingsPanel(this, () => {
        this.settingsPanel = undefined;
      });
    });

    this.createButton(this.centerX, this.centerY + 150, 340, 72, 'ВЫХОД', () => {
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

  // === Фон: эпичное поле боя (без звука) =================================

  private createBattlefield(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const top = h * 0.06;
    const bottom = h * 0.95;

    this.ants = [];
    this.turrets = [];

    const frontWallX = w * 0.56;
    const midWallX = w * 0.70;
    const backWallX = w * 0.83;
    const hqX = w * 0.92;
    this.wallX = frontWallX;
    this.frontLineX = frontWallX - 16;
    this.bombTimer = Phaser.Math.Between(500, 1400);

    const addWall = (x: number, y: number) =>
      this.add.image(x, y, 'mb_wall').setDisplaySize(30, 32).setDepth(3).setAlpha(0.95);

    // --- Укрепления: 3 линии стен + рамка форта (плотно) ---
    const step = 30;
    for (let y = top; y <= bottom; y += step) addWall(frontWallX, y);              // фронт (сплошной)
    for (let y = top; y <= bottom; y += step) {
      if (Math.abs(y - this.centerY) < 48) continue;                               // проём в средней
      addWall(midWallX, y);
    }
    for (let y = top; y <= bottom; y += step) {
      if (Math.abs(y - this.centerY) < 70) continue;                               // широкий проём у задней
      addWall(backWallX, y);
    }
    for (let x = frontWallX; x <= w - 6; x += step) {                              // верх/низ форта
      addWall(x, top);
      addWall(x, bottom);
    }

    // --- Турели: 3 эшелона за стенами (целая батарея) ---
    const turretTex = ['mb_turret_1', 'mb_turret_2', 'mb_turret_3', 'mb_turret_f'];
    let ti = 0;
    const addTurretColumn = (x: number, count: number) => {
      for (let r = 0; r < count; r++) {
        const ty = top + 34 + (r * (bottom - top - 68)) / (count - 1);
        const tex = turretTex[ti++ % turretTex.length];
        const sprite = this.add.sprite(x, ty, tex).setDisplaySize(42, 42).setDepth(4);
        this.turrets.push({ sprite, fireTimer: Phaser.Math.Between(120, 1300), freeze: tex === 'mb_turret_f' });
      }
    };
    addTurretColumn(frontWallX + 34, 10);
    addTurretColumn(midWallX + 32, 8);
    addTurretColumn(backWallX + 28, 6);

    // --- Буры внутри базы ---
    for (let i = 0; i < 9; i++) {
      const dx = Phaser.Math.Between(backWallX + 22, hqX - 26);
      const dy = Phaser.Math.Between(top + 36, bottom - 36);
      this.add.image(dx, dy, 'mb_drill').setDisplaySize(26, 26).setDepth(3).setAlpha(0.92);
    }

    // --- ШТАБ (база) ---
    const hq = this.add.image(hqX, this.centerY, 'mb_base').setDisplaySize(96, 96).setDepth(4);
    this.tweens.add({
      targets: hq,
      scaleX: hq.scaleX * 1.05,
      scaleY: hq.scaleY * 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // --- Орда муравьёв: больше видов, тьма штук ---
    const ant = ['mb_ant_1', 'mb_ant_2', 'mb_ant_3'];
    const brute = ['mb_brute_1', 'mb_brute_2', 'mb_brute_3'];
    const boss = ['mb_boss_1', 'mb_boss_2', 'mb_boss_3'];
    const antTypes = [
      { frames: ant, size: 32, speedMin: 22, speedMax: 36, count: 30, tint: 0xffffff }, // рядовые
      { frames: ant, size: 34, speedMin: 18, speedMax: 30, count: 18, tint: 0xff9a8a }, // красные
      { frames: ant, size: 30, speedMin: 24, speedMax: 40, count: 14, tint: 0x9ad7ff }, // синие (быстрые)
      { frames: brute, size: 52, speedMin: 12, speedMax: 20, count: 12, tint: 0xffffff }, // бруты
      { frames: brute, size: 56, speedMin: 10, speedMax: 16, count: 7, tint: 0xc9a6ff }, // фиол. бруты
      { frames: boss, size: 76, speedMin: 8, speedMax: 13, count: 4, tint: 0xffd28a }, // боссы
    ];
    for (const type of antTypes) {
      for (let i = 0; i < type.count; i++) {
        const x = Phaser.Math.Between(-520, this.frontLineX - 30);
        const y = Phaser.Math.Between(top, bottom);
        const sprite = this.add.sprite(x, y, type.frames[0]).setDisplaySize(type.size, type.size).setDepth(3).setFlipX(true);
        if (type.tint !== 0xffffff) sprite.setTint(type.tint);
        this.ants.push({
          sprite,
          frames: type.frames,
          size: type.size,
          speed: Phaser.Math.Between(type.speedMin, type.speedMax),
          frameTimer: Phaser.Math.Between(0, 140),
          frame: 0,
          dying: false,
        });
      }
    }

    this.battleReady = true;
  }

  private recycleAnt(ant: MenuScene['ants'][number]): void {
    const h = this.scale.height;
    ant.sprite.setPosition(Phaser.Math.Between(-340, -20), Phaser.Math.Between(h * 0.06, h * 0.95));
    ant.sprite.setTexture(ant.frames[0]);
    ant.sprite.setDisplaySize(ant.size, ant.size);
    ant.sprite.setAngle(0).setAlpha(1).setFlipX(true);
    ant.frame = 0;
    ant.speed = Phaser.Math.Between(12, 26);
    ant.dying = false;
  }

  private turretFire(t: MenuScene['turrets'][number]): void {
    const candidates = this.ants.filter((a) => !a.dying && a.sprite.x < this.wallX && a.sprite.x > -30);
    if (candidates.length === 0) return;
    const target = Phaser.Utils.Array.GetRandom(candidates);

    const angle = Phaser.Math.Angle.Between(t.sprite.x, t.sprite.y, target.sprite.x, target.sprite.y);
    t.sprite.setRotation(angle);

    const color = t.freeze ? 0x8fe3ff : 0xfff0bf;

    // трассер
    const tracer = this.add
      .line(0, 0, t.sprite.x, t.sprite.y, target.sprite.x, target.sprite.y, color, 0.85)
      .setOrigin(0, 0)
      .setLineWidth(t.freeze ? 3 : 2)
      .setDepth(4);
    this.tweens.add({ targets: tracer, alpha: 0, duration: 170, onComplete: () => tracer.destroy() });

    // вспышка попадания
    const flash = this.add.circle(target.sprite.x, target.sprite.y, 6, color, 0.85).setDepth(4);
    this.tweens.add({ targets: flash, alpha: 0, scale: 2.2, duration: 240, onComplete: () => flash.destroy() });

    // обычные турели иногда «уничтожают» мелкого муравья → он возрождается слева (бесконечная орда).
    // Брутов/боссов не убиваем мгновенно — только подсвечиваем попадание.
    if (!t.freeze && target.size <= 40 && Math.random() < 0.5) {
      this.killAnt(target);
    }
  }

  /** «Смерть» муравья: схлопывается и возрождается слева. */
  private killAnt(ant: MenuScene['ants'][number]): void {
    if (ant.dying) return;
    ant.dying = true;
    this.tweens.add({
      targets: ant.sprite,
      alpha: 0,
      scaleX: ant.sprite.scaleX * 1.3,
      scaleY: ant.sprite.scaleY * 0.5,
      angle: 90,
      duration: 220,
      ease: 'Quad.easeIn',
      onComplete: () => this.recycleAnt(ant),
    });
  }

  /** Бомба падает сверху на орду и взрывается. */
  private dropBomb(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const tx = Phaser.Math.Between(Math.floor(w * 0.06), Math.floor(this.frontLineX - 30));
    const ty = Phaser.Math.Between(Math.floor(h * 0.14), Math.floor(h * 0.9));

    const bomb = this.add.image(tx, -24, 'mb_bomb').setDisplaySize(24, 24).setDepth(5);
    this.tweens.add({
      targets: bomb,
      y: ty,
      angle: 220,
      duration: Phaser.Math.Between(520, 820),
      ease: 'Quad.easeIn',
      onComplete: () => {
        bomb.destroy();
        this.explodeAt(tx, ty);
      },
    });
  }

  private explodeAt(x: number, y: number): void {
    const radius = Phaser.Math.Between(54, 82);

    const core = this.add.circle(x, y, radius * 0.45, 0xfff1c2, 0.95).setDepth(5);
    this.tweens.add({ targets: core, alpha: 0, scale: 1.9, duration: 340, ease: 'Quad.easeOut', onComplete: () => core.destroy() });

    const ring = this.add.circle(x, y, radius * 0.3, 0xff8a3c, 0).setStrokeStyle(3, 0xffb052, 0.9).setDepth(5);
    this.tweens.add({ targets: ring, scale: 2.4, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });

    // выкосить муравьёв в радиусе (боссы переживают)
    for (const a of this.ants) {
      if (a.dying || a.size >= 70) continue;
      if (Phaser.Math.Distance.Between(x, y, a.sprite.x, a.sprite.y) <= radius) {
        this.killAnt(a);
      }
    }
  }

  update(_time: number, delta: number): void {
    if (!this.battleReady) return;
    const step = Math.min(delta, 50); // защита от скачков dt

    for (const ant of this.ants) {
      if (ant.dying) continue;

      ant.sprite.x += (ant.speed * step) / 1000;

      ant.frameTimer += step;
      if (ant.frameTimer >= 140) {
        ant.frameTimer = 0;
        ant.frame = (ant.frame + 1) % ant.frames.length;
        ant.sprite.setTexture(ant.frames[ant.frame]);
      }

      if (ant.sprite.x > this.frontLineX) this.recycleAnt(ant);
    }

    for (const t of this.turrets) {
      t.fireTimer -= step;
      if (t.fireTimer <= 0) {
        t.fireTimer = Phaser.Math.Between(500, 1500);
        this.turretFire(t);
      }
    }

    this.bombTimer -= step;
    if (this.bombTimer <= 0) {
      this.bombTimer = Phaser.Math.Between(800, 2100);
      this.dropBomb();
    }
  }
}


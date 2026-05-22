import Phaser from 'phaser';
import { GameState } from './core/GameState';
import { ResourcePanel } from './ui/ResourcePanel';
import { BuildingSelector } from './ui/BuildingSelector';
import { createBuilding, createTurret, createBomb } from './buildings/BuildingFactory';
import { WaveManager } from './core/WaveManager';
import { WavePanel } from './ui/WavePanel';
import { Enemy } from './enemies/Enemy';
import { EnemySpawner } from './enemies/EnemySpawner';
import { eventBus } from './core/EventBus';
import { Player } from './player/Player';
import { BombSelector } from './ui/BombSelector';
import { TurretSelector } from './ui/TurretSelector';

import { Drill } from './buildings/Drill';
import { BUILDING_CONFIGS } from './core/BuildingConfigs';
import { UI_COLORS, UI_DEPTH } from './ui/uiTheme';
import { BuildingManager } from './core/BuildingManager';
import { CombatManager } from './core/CombatManager';
import { playSfx } from './audio/Sfx';
export default class MainScene extends Phaser.Scene {
  private readonly CELL_SIZE = 32;
  private readonly LEFT_PANEL_WIDTH = 224;
  private readonly RIGHT_PANEL_WIDTH = 256; 

  private readonly GHOST_COLOR_FREE = 0xffffff;
  private readonly GHOST_COLOR_BLOCKED = 0xff0000;

  private ghost!: Phaser.GameObjects.Rectangle;
  private enemies: Set<Enemy> = new Set();
  private buildingManager!: BuildingManager;
  private combatManager!: CombatManager;
  private enemySpawner!: EnemySpawner;
  private player!: Player;
  private playerHealthFill!: Phaser.GameObjects.Rectangle;
  private playerHealthText!: Phaser.GameObjects.Text;
  private gameOverShown: boolean = false;
  private victoryShown: boolean = false;
  private waveUpdateHandler!: (data: { phase: string; enemiesInWave: number; waveNumber: number; waveDuration: number }) => void;

  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;

  private cols = 0;
  private rows = 0;

  // --- RTS-камера ---
  private uiCamera!: Phaser.Cameras.Scene2D.Camera; // отдельная камера для HUD: не скроллится
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly CAMERA_SCROLL_SPEED = 0.85; // пикселей на мс
  private readonly EDGE_SCROLL_MARGIN = 28;     // зона у края экрана для edge-scroll
  private hasPointerMoved = false;              // защита от auto-scroll до первого движения мыши

  // UI компоненты
  private resourcePanel!: ResourcePanel;
  private wavePanel!: WavePanel;
  private bombSelector!: BombSelector;   
  private buildingSelector!: BuildingSelector;
  private turretSelector!: TurretSelector; 
  private skipPhaseButtonBg!: Phaser.GameObjects.Rectangle;
  private skipPhaseButtonLabel!: Phaser.GameObjects.Text;

  public gameState: GameState = new GameState();
  private selectedType: string = 'drill';
  private selectingBomb: boolean = false;
  private waveManager!: WaveManager;
  private currentPhase: string = 'gathering';
  private baseIncomeTimer = 0;
  private readonly BASE_INCOME_INTERVAL = 1800;
  private readonly BASE_INCOME_AMOUNT = 10;

  private readonly TILESET_KEY = 'tileset';
  private readonly TILESET_NAME = 'tileset';

  // Список твоих 5 пулеметов для внутренней логики апгрейдов, если понадобится
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('hero', 'src/assets/hero.png');
    this.load.svg('base', 'src/assets/base.svg', { width: 192, height: 192 });
    this.load.svg('drill', 'src/assets/drill.svg', { width: 96, height: 96 });
    this.load.svg('wall', 'src/assets/wall.svg', { width: 96, height: 96 });
    this.load.svg('bomb', 'src/assets/bomb.svg', { width: 96, height: 96 });
    this.load.svg('enemy', 'src/assets/enemy.svg', { width: 88, height: 88 });
    this.load.image('ant_idle_1', 'ants_assets/ants_sprite_sheet/4/idle/ant_idle_1.png');
    this.load.image('ant_idle_2', 'ants_assets/ants_sprite_sheet/4/idle/ant_idle_2.png');
    this.load.image('ant_idle_3', 'ants_assets/ants_sprite_sheet/4/idle/ant_idle_3.png');
    this.load.image('ant_idle_4', 'ants_assets/ants_sprite_sheet/4/idle/ant_idle_4.png');
    this.load.image('ant_walk_1', 'ants_assets/ants_sprite_sheet/4/walk/ant_walk_1.png');
    this.load.image('ant_walk_2', 'ants_assets/ants_sprite_sheet/4/walk/ant_walk_2.png');
    this.load.image('ant_walk_3', 'ants_assets/ants_sprite_sheet/4/walk/ant_walk_3.png');
    this.load.image('ant_attack_1', 'ants_assets/ants_sprite_sheet/4/attack/ant_attack_1.png');
    this.load.image('ant_attack_2', 'ants_assets/ants_sprite_sheet/4/attack/ant_attack_2.png');
    this.load.image('ant_attack_3', 'ants_assets/ants_sprite_sheet/4/attack/ant_attack_3.png');
    this.load.svg('turret-1', 'src/assets/turret-1.svg', { width: 96, height: 96 });
    this.load.svg('turret-2', 'src/assets/turret-2.svg', { width: 96, height: 96 });
    this.load.svg('turret-3', 'src/assets/turret-3.svg', { width: 96, height: 96 });
    this.load.svg('turret-4', 'src/assets/turret-4.svg', { width: 96, height: 96 });
    this.load.svg('turret-5', 'src/assets/turret-5.svg', { width: 96, height: 96 });
    // 6 тайлов по CELL_SIZE (земля/камень/руда + 3 ландшафтных): растеризуем SVG ровно
    // в размер сетки, чтобы нарезка 32×32 попадала в целые тайлы, а не в их углы.
    this.load.svg(this.TILESET_KEY, 'src/assets/tileset.svg', { width: this.CELL_SIZE * 6, height: this.CELL_SIZE });

    this.load.svg('tile_empty', 'src/assets/tile-empty.svg', { width: 64, height: 64 });
    this.load.svg('tile_iron', 'src/assets/tile-iron.svg', { width: 64, height: 64 });
    this.load.svg('tile_stone', 'src/assets/tile-stone.svg', { width: 64, height: 64 });
  }

  create() {
    this.calculateGridDimensions();
    this.setupTilemap();
    this.setupGridLines();
    this.setupSidebar();
    this.setupGhost();
    this.setupInput();
    
    const centerX = this.getPlayerCenterX();
    const centerY = this.getPlayerCenterY();
    this.player = new Player(this, centerX, centerY);
    this.setupPlayerHealthBar();
    this.setupCamera();
    
    this.buildingManager = new BuildingManager();
    this.combatManager = new CombatManager();

    this.resourcePanel = new ResourcePanel(this);
    this.wavePanel = new WavePanel(this);
    this.waveManager = new WaveManager();
    this.enemySpawner = new EnemySpawner(this, this.enemies, this.getPlayfieldBounds());
    
    this.buildingSelector = new BuildingSelector(this, this.gameState, (type, isBomb) => {
      this.turretSelector?.clearSelection();
      this.selectedType = type;
      this.selectingBomb = isBomb;
    });

    this.bombSelector = new BombSelector();

    this.turretSelector = new TurretSelector(this, this.gameState, (level: number) => {
      this.selectedType = `turret_mk${level}`;
      this.selectingBomb = false;
    });
    this.createSkipPhaseButton();

    this.waveUpdateHandler = (data) => {
      if (data.phase === 'victory') {
        if (!this.victoryShown) {
          this.showVictoryScreen();
        }
        return;
      }

      const previousPhase = this.currentPhase;
      this.currentPhase = data.phase;

      if (data.phase === 'wave' && previousPhase !== 'wave') {
        this.enemySpawner.startWave(data.enemiesInWave, data.waveDuration);
        this.emitEnemiesRemainingUpdate();
        playSfx(this, 'phase-wave');
      } else if (data.phase !== 'wave' && previousPhase === 'wave') {
        this.enemySpawner.stopWave();
      }

      this.updateSkipPhaseButtonState();
    };
    eventBus.on('wave-update', this.waveUpdateHandler);

    this.events.on('shutdown', () => {
      eventBus.off('wave-update', this.waveUpdateHandler);
      this.input.off('pointermove', this.handlePointerMove, this);
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onObjectAdded);
      this.scale.off('resize', this.onResize);
    });

    // Должно идти последним: все HUD-объекты уже созданы.
    this.setupCameraLayers();
  }

  private createSkipPhaseButton(): void {
    const buttonX = this.LEFT_PANEL_WIDTH / 2;
    const buttonY = this.scale.height - 42;

    this.skipPhaseButtonBg = this.add.rectangle(buttonX, buttonY, 188, 34, UI_COLORS.panelAlt, 0.98)
      .setStrokeStyle(1, UI_COLORS.border, 0.95)
      .setDepth(UI_DEPTH + 1);

    this.skipPhaseButtonLabel = this.add.text(buttonX, buttonY, 'Пропустить этап', {
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      fontSize: '15px',
      color: UI_COLORS.text,
      resolution: 2,
    }).setOrigin(0.5).setDepth(UI_DEPTH + 2);

    this.skipPhaseButtonBg.setInteractive({ useHandCursor: true });

    this.skipPhaseButtonBg.on('pointerover', () => {
      if (!this.skipPhaseButtonBg.input?.enabled) return;
      this.skipPhaseButtonBg.setFillStyle(0x213248, 1);
    });

    this.skipPhaseButtonBg.on('pointerout', () => {
      if (!this.skipPhaseButtonBg.input?.enabled) return;
      this.skipPhaseButtonBg.setFillStyle(UI_COLORS.panelAlt, 0.98);
    });

    this.skipPhaseButtonBg.on('pointerdown', () => {
      if (this.waveManager.skipPreparationPhase()) {
        playSfx(this, 'ui-click');
        this.updateSkipPhaseButtonState();
      }
    });

    this.updateSkipPhaseButtonState();
  }

  private updateSkipPhaseButtonState(): void {
    if (!this.skipPhaseButtonBg || !this.skipPhaseButtonLabel) return;

    const canSkip = this.currentPhase === 'gathering' || this.currentPhase === 'building';
    this.skipPhaseButtonBg.input!.enabled = canSkip;

    if (canSkip) {
      this.skipPhaseButtonBg.setFillStyle(UI_COLORS.panelAlt, 0.98);
      this.skipPhaseButtonBg.setStrokeStyle(1, UI_COLORS.border, 0.95);
      this.skipPhaseButtonLabel.setColor(UI_COLORS.text);
      return;
    }

    this.skipPhaseButtonBg.setFillStyle(0x141a24, 0.85);
    this.skipPhaseButtonBg.setStrokeStyle(1, UI_COLORS.borderMuted, 0.75);
    this.skipPhaseButtonLabel.setColor(UI_COLORS.mutedText);
  }

  // === RTS-камера =========================================================

  private setupCamera(): void {
    const cam = this.cameras.main;
    // Мир = левая панель + сетка + правая панель по ширине; высота = сетка.
    const worldWidth = this.LEFT_PANEL_WIDTH + this.cols * this.CELL_SIZE + this.RIGHT_PANEL_WIDTH;
    const worldHeight = this.rows * this.CELL_SIZE;
    cam.setBounds(0, 0, worldWidth, worldHeight); // клампит скролл по краям карты
    cam.centerOn(this.getPlayerCenterX(), this.getPlayerCenterY());

    // Вторая камера для HUD: НЕ скроллится. Ввод по ней мапится 1:1 в экран,
    // поэтому клики/ховеры меню больше не «уезжают» вместе с миром.
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.scale.on('resize', this.onResize);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  /**
   * Раскидывает объекты по камерам: мир рисует только main, HUD — только uiCamera.
   * Порог по depth (UI >= UI_DEPTH-2). Динамика (враги/здания/снаряды) создаётся после
   * create() — она вся «мир», прячем её с uiCamera через событие ADDED_TO_SCENE.
   */
  private setupCameraLayers(): void {
    const uiThreshold = UI_DEPTH - 2;
    const uiList: Phaser.GameObjects.GameObject[] = [];
    const worldList: Phaser.GameObjects.GameObject[] = [];
    for (const obj of this.children.list) {
      const depth = (obj as { depth?: number }).depth ?? 0;
      (depth >= uiThreshold ? uiList : worldList).push(obj);
    }
    this.cameras.main.ignore(uiList);
    this.uiCamera.ignore(worldList);
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.onObjectAdded);
  }

  private onObjectAdded = (go: Phaser.GameObjects.GameObject): void => {
    this.uiCamera?.ignore(go);
  };

  private onResize = (size: Phaser.Structs.Size): void => {
    this.uiCamera?.setSize(size.width, size.height);
  };

  private updateCamera(delta: number): void {
    const cam = this.cameras.main;
    const speed = this.CAMERA_SCROLL_SPEED * delta;
    let dx = 0;
    let dy = 0;

    // Клавиатура: стрелки + WASD
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += speed;

    // Edge-scroll: мышь у края экрана (только после первого движения мыши)
    if (this.hasPointerMoved) {
      const p = this.input.activePointer;
      const m = this.EDGE_SCROLL_MARGIN;
      if (p.x <= m) dx -= speed;
      else if (p.x >= this.scale.width - m) dx += speed;
      if (p.y <= m) dy -= speed;
      else if (p.y >= this.scale.height - m) dy += speed;
    }

    if (dx !== 0 || dy !== 0) {
      cam.scrollX += dx;
      cam.scrollY += dy;
    }
  }

  /** True, если курсор над боковой панелью (там нельзя строить/целиться сквозь HUD). */
  private isPointerOverPanel(pointer: Phaser.Input.Pointer): boolean {
    return pointer.x < this.LEFT_PANEL_WIDTH || pointer.x > this.scale.width - this.RIGHT_PANEL_WIDTH;
  }

  /**
   * Экранные координаты курсора -> клетка сетки. Считаем через main-камеру явно
   * (pointer.worldX ненадёжен при двух камерах — его может выставить uiCamera).
   */
  private pointerToGrid(pointer: Phaser.Input.Pointer): { gridX: number; gridY: number } {
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return {
      gridX: this.getGridXFromWorld(world.x),
      gridY: Math.floor(world.y / this.CELL_SIZE),
    };
  }

  private calculateGridDimensions(): void {
    const { width, height } = this.scale;
    const visibleCols = Math.floor((width - this.LEFT_PANEL_WIDTH - this.RIGHT_PANEL_WIDTH) / this.CELL_SIZE);
    const visibleRows = Math.floor(height / this.CELL_SIZE);
    // Карта заметно больше видимой области — простор для RTS-скролла на любом мониторе.
    this.cols = Math.max(visibleCols + 32, Math.round(visibleCols * 2));
    this.rows = Math.max(visibleRows + 22, Math.round(visibleRows * 2));
  }

  private setupSidebar(): void {
    this.add.rectangle(
      this.LEFT_PANEL_WIDTH / 2,
      this.scale.height / 2,
      this.LEFT_PANEL_WIDTH,
      this.scale.height,
      UI_COLORS.panel,
      0.98
    ).setDepth(UI_DEPTH - 2);

    this.add.rectangle(this.LEFT_PANEL_WIDTH, this.scale.height / 2, 2, this.scale.height, UI_COLORS.borderMuted, 1)
      .setDepth(UI_DEPTH - 1);

    // Правая панель — по краю ЭКРАНА (раньше считалась от ширины сетки, и после увеличения
    // карты уезжала за экран). UI живёт на фиксированной uiCamera, поэтому экранные = её координаты.
    const x = this.scale.width - this.RIGHT_PANEL_WIDTH;
    this.add.rectangle(
      x + this.RIGHT_PANEL_WIDTH / 2,
      this.scale.height / 2,
      this.RIGHT_PANEL_WIDTH,
      this.scale.height,
      UI_COLORS.panel,
      0.98
    ).setDepth(UI_DEPTH - 2);

    this.add.rectangle(x, this.scale.height / 2, 2, this.scale.height, UI_COLORS.borderMuted, 1)
      .setDepth(UI_DEPTH - 1);
  }

  private setupTilemap(): void {
    const data: number[][] = [];
    const playerLeft = this.getPlayerLeftCell();
    const playerTop = this.getPlayerTopCell();

    for (let row = 0; row < this.rows; row++) {
      const rowData: number[] = [];
      for (let col = 0; col < this.cols; col++) {
        if (col >= playerLeft && col <= playerLeft + 1 && row >= playerTop && row <= playerTop + 1) {
          rowData.push(0);
          continue;
        }

        const r = Math.random();
        if (r < 0.025) rowData.push(2);                            // руда (было 5% → вдвое меньше)
        else if (r < 0.075) rowData.push(1);                       // камень (было 10% → вдвое меньше)
        else if (r < 0.225) rowData.push(3 + Math.floor(Math.random() * 3)); // ландшафт: трещины/галька/мох
        else rowData.push(0);                                      // чистая земля
      }
      data.push(rowData);
    }

    this.map = this.make.tilemap({
      data,
      tileWidth: this.CELL_SIZE,
      tileHeight: this.CELL_SIZE,
    });

    const tileset = this.map.addTilesetImage(this.TILESET_NAME, this.TILESET_KEY, this.CELL_SIZE, this.CELL_SIZE, 0, 0);
    if (!tileset) throw new Error('Tileset failed to load');
    this.tileset = tileset;

    const layer = this.map.createLayer(0, this.tileset, this.getGridOriginX(), 0);
    if (!layer) throw new Error('Layer failed to create');
    this.groundLayer = layer;
  }

  private setupGridLines(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x78a6c8, 0.16);
    const originX = this.getGridOriginX();
    const width = this.cols * this.CELL_SIZE;
    const height = this.rows * this.CELL_SIZE;

    for (let x = 0; x <= width; x += this.CELL_SIZE) {
      graphics.lineBetween(originX + x, 0, originX + x, height);
    }

    for (let y = 0; y <= height; y += this.CELL_SIZE) {
      graphics.lineBetween(originX, y, originX + width, y);
    }

    graphics.setDepth(2);
  }

  private setupGhost(): void {
    this.ghost = this.add.rectangle(0, 0, this.CELL_SIZE - 2, this.CELL_SIZE - 2, this.GHOST_COLOR_FREE, 0.4);
    this.ghost.setOrigin(0, 0);
    this.ghost.setVisible(false);
    this.ghost.setDepth(100);
  }

  private setupPlayerHealthBar(): void {
    const x = this.player.sprite.x;
    const y = this.player.sprite.y - 48;

    this.add.rectangle(x, y, 86, 10, 0x182433, 0.95)
      .setStrokeStyle(1, 0xd7e4f2, 0.7)
      .setDepth(32);
    this.playerHealthFill = this.add.rectangle(x - 42, y, 84, 6, 0x42f5a7, 1)
      .setOrigin(0, 0.5)
      .setDepth(33);
    this.playerHealthText = this.add.text(x, y - 18, '', {
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      fontSize: '12px',
      color: '#eef7ff',
      resolution: 2,
    }).setOrigin(0.5).setDepth(33);

    this.updatePlayerHealthBar();
  }

  private updatePlayerHealthBar(): void {
    const healthPercent = Phaser.Math.Clamp(this.player.healthPoints / this.player.maxHealthPoints, 0, 1);
    this.playerHealthFill.setScale(healthPercent, 1);
    this.playerHealthFill.setFillStyle(healthPercent > 0.35 ? 0x42f5a7 : 0xff6b7d);
    this.playerHealthText.setText(`HP: ${this.player.healthPoints}/${this.player.maxHealthPoints}`);
  }

  private setupInput(): void {
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerdown', this.handlePointerDown, this);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    this.hasPointerMoved = true;

    // Перетаскивание карты средней кнопкой мыши (drag-pan, как в RTS).
    if (pointer.middleButtonDown()) {
      this.cameras.main.scrollX -= pointer.x - pointer.prevPosition.x;
      this.cameras.main.scrollY -= pointer.y - pointer.prevPosition.y;
      this.ghost.setVisible(false);
      return;
    }

    if (this.isPointerOverPanel(pointer)) {
      this.ghost.setVisible(false);
      return;
    }

    const { gridX, gridY } = this.pointerToGrid(pointer);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      this.ghost.setVisible(false);
      return;
    }

    this.ghost.setVisible(true);
    this.ghost.setPosition(this.getGridOriginX() + gridX * this.CELL_SIZE + 1, gridY * this.CELL_SIZE + 1);
    this.ghost.setFillStyle(this.isOccupied(gridX, gridY) ? this.GHOST_COLOR_BLOCKED : this.GHOST_COLOR_FREE, 0.4);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.button !== 0) return;        // только ЛКМ (средняя — для drag-pan)
    if (this.isPointerOverPanel(pointer)) return; // клики по HUD не строят сквозь панель

    const { gridX, gridY } = this.pointerToGrid(pointer);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      this.turretSelector?.clearSelection();
      if (this.currentPhase === 'wave') {
        const deadEnemy = this.player.attackEnemy(this.enemies);
        if (deadEnemy) {
          this.enemies.delete(deadEnemy);
          deadEnemy.destroy();
        }
      }
      return;
    }

    this.turretSelector?.clearSelection();

    if (this.selectingBomb) {
      this.placeBomb(gridX, gridY);
    } else {
      this.placeBuilding(gridX, gridY);
    }
  }

  placeBuilding(gridX: number, gridY: number): void {
    if (this.isOccupied(gridX, gridY)) {
      playSfx(this, 'ui-deny');
      return;
    }

    if (this.selectedType.startsWith('turret_mk')) {
      this.placeTurret(gridX, gridY);
      return;
    }

    const tile = this.groundLayer.getTileAt(gridX, gridY);
    let resourceToMine: 'iron' | 'stone' | undefined = undefined;

    if (tile) {
      if (tile.index === 1) resourceToMine = 'stone'; 
      else if (tile.index === 2) resourceToMine = 'iron';
    }

    if (this.selectedType === 'drill' && !resourceToMine) {
      playSfx(this, 'ui-deny');
      return;
    }

    const cost = this.selectedType === 'drill' ? this.gameState.getDrillCost() : BUILDING_CONFIGS[this.selectedType as keyof typeof BUILDING_CONFIGS]?.cost;
    if (!cost || !this.gameState.spendCost(cost)) {
      playSfx(this, 'ui-deny');
      return;
    }

    const worldX = this.getWorldXFromGrid(gridX);
    const worldY = gridY * this.CELL_SIZE + this.CELL_SIZE / 2;

    const building = createBuilding(this.selectedType, this, worldX, worldY, resourceToMine);
    this.buildingManager.addBuilding(this.getGridKey(gridX, gridY), building);
    if (this.selectedType === 'drill') this.gameState.recordDrillBuilt();
    this.ghost.setFillStyle(this.GHOST_COLOR_BLOCKED, 0.4);
    playSfx(this, 'build');
  }

  private placeTurret(gridX: number, gridY: number): void {
    const level = Number(this.selectedType.replace('turret_mk', ''));
    const cost = this.gameState.getTurretBuildCost();
    if (!Number.isFinite(level) || level <= 0 || this.gameState.resources.iron < cost) {
      playSfx(this, 'ui-deny');
      return;
    }

    this.gameState.resources.iron -= cost;
    this.gameState.recordTurretBuilt();

    const worldX = this.getWorldXFromGrid(gridX);
    const worldY = gridY * this.CELL_SIZE + this.CELL_SIZE / 2;
    this.buildingManager.addTurret(this.getGridKey(gridX, gridY), createTurret(this, worldX, worldY, level));
    this.ghost.setFillStyle(this.GHOST_COLOR_BLOCKED, 0.4);
    playSfx(this, 'build');
  }

  placeBomb(gridX: number, gridY: number): void {
    if (this.isOccupied(gridX, gridY)) {
      playSfx(this, 'ui-deny');
      return;
    }

    const cost = BUILDING_CONFIGS.bomb.cost;
    if (this.gameState.resources.iron < cost.iron || this.gameState.resources.stone < cost.stone) {
      playSfx(this, 'ui-deny');
      return;
    }
    this.gameState.resources.iron -= cost.iron;
    this.gameState.resources.stone -= cost.stone;

    const worldX = this.getWorldXFromGrid(gridX);
    const worldY = gridY * this.CELL_SIZE + this.CELL_SIZE / 2;

    const bombKey = this.getGridKey(gridX, gridY);
    const bomb = createBomb(this, worldX, worldY, (activatedBomb) => {
      const affected = activatedBomb.getEnemiesInRadius(this.enemies);
      for (const enemy of affected) {
        if (enemy.takeDamage(50)) { 
          this.enemies.delete(enemy);
          enemy.destroy();
        }
      }
      this.buildingManager.removeBomb(bombKey);
    });
    this.buildingManager.addBomb(bombKey, bomb);
    playSfx(this, 'build');
  }

  private isOccupied(gridX: number, gridY: number): boolean {
    const key = this.getGridKey(gridX, gridY);
    return this.buildingManager.isOccupied(key) || this.isPlayerCell(gridX, gridY);
  }

  private isPlayerCell(gridX: number, gridY: number): boolean {
    const left = this.getPlayerLeftCell();
    const top = this.getPlayerTopCell();
    return gridX >= left && gridX <= left + 1 && gridY >= top && gridY <= top + 1;
  }

  private getPlayerCenterX(): number {
    return this.getGridOriginX() + (this.cols * this.CELL_SIZE) / 2;
  }

  private getPlayerCenterY(): number {
    return (this.rows * this.CELL_SIZE) / 2;
  }

  private getPlayerLeftCell(): number {
    return Math.floor(this.cols / 2) - 1;
  }

  private getPlayerTopCell(): number {
    return Math.floor(this.rows / 2) - 1;
  }

  private getGridKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`;
  }

  private getGridOriginX(): number {
    return this.LEFT_PANEL_WIDTH;
  }

  private getGridXFromWorld(worldX: number): number {
    return Math.floor((worldX - this.getGridOriginX()) / this.CELL_SIZE);
  }

  private getWorldXFromGrid(gridX: number): number {
    return this.getGridOriginX() + gridX * this.CELL_SIZE + this.CELL_SIZE / 2;
  }

  private getPlayfieldBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.getGridOriginX(),
      right: this.getGridOriginX() + this.cols * this.CELL_SIZE,
      top: 0,
      bottom: this.rows * this.CELL_SIZE,
    };
  }

  update(_time: number, delta: number): void {
    if (this.victoryShown || this.gameOverShown) return;

    this.updateCamera(delta);

    this.waveManager.update(delta);
    this.wavePanel.updateProgress(this.waveManager.getPhaseProgress());
    this.enemySpawner.update(delta);

    for (const building of this.buildingManager.getBuildings()) {
      if (building instanceof Drill) {
        building.allowGain = this.currentPhase !== 'wave';
      }
    }

    this.buildingManager.update(delta, this.enemies);

    this.player.update(delta);

    this.bombSelector.updateAffordability();

    const deadEnemies = this.combatManager.update(
      delta,
      this.enemies,
      this.buildingManager.getAttackables(),
      this.player
    );
    for (const enemy of deadEnemies) {
      this.enemies.delete(enemy);
      enemy.destroy();
    }

    this.buildingManager.removeDestroyed();

    this.updatePlayerHealthBar();
    if (this.player.healthPoints <= 0) {
      this.showGameOverScreen();
      return;
    }

    this.completeWaveIfCleared();
    this.updateBaseIncome(delta);
    this.emitEnemiesRemainingUpdate();
    this.resourcePanel.update(this.gameState.resources);
    this.buildingSelector.update();
    this.turretSelector.update();
  }

  private updateBaseIncome(delta: number): void {
    if (this.currentPhase === 'wave' || this.currentPhase === 'gameover' || this.currentPhase === 'victory') return;

    this.baseIncomeTimer += delta;
    if (this.baseIncomeTimer < this.BASE_INCOME_INTERVAL) return;

    this.baseIncomeTimer = 0;
    eventBus.emit('resource-mined', { type: 'iron', amount: this.BASE_INCOME_AMOUNT });
    eventBus.emit('resource-mined', { type: 'stone', amount: this.BASE_INCOME_AMOUNT });
  }

  private emitEnemiesRemainingUpdate(): void {
    if (this.currentPhase !== 'wave') return;

    const enemiesRemaining = this.enemies.size + this.enemySpawner.getRemainingToSpawn();

    eventBus.emit('enemies-remaining-update', { enemiesRemaining });
  }

  private completeWaveIfCleared(): void {
    if (this.currentPhase !== 'wave') return;
    if (this.enemySpawner.isSpawning() || this.enemies.size > 0) return;

    this.waveManager.completeWave();
  }

  private showVictoryScreen(): void {
    if (this.victoryShown) return;

    this.victoryShown = true;
    this.enemySpawner.stopWave();
    this.currentPhase = 'victory';

    // Оверлеи создаются после create() => uiCamera их игнорит, рисует только main (скроллится).
    // setScrollFactor(0) держит их по центру экрана независимо от позиции камеры.
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(1000).setScrollFactor(0);

    const textObj = this.add.text(this.scale.width / 2, this.scale.height / 2, 'ПОБЕДА!', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, `Все ${this.waveManager.getCurrentWave()} волн пройдены`, {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    this.tweens.add({
      targets: textObj,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1
    });

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'Нажмите ЛКМ для меню', {
      fontSize: '16px',
      color: '#aabbcc',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    this.input.once('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  private showGameOverScreen(): void {
    if (this.gameOverShown) return;

    this.gameOverShown = true;
    this.enemySpawner.stopWave();
    this.waveManager.setGameOver();
    this.currentPhase = 'gameover';

    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.72).setDepth(1000).setScrollFactor(0);
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'ПОРАЖЕНИЕ', {
      fontSize: '46px',
      color: '#ff6b7d',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, 'Нажмите ЛКМ для меню', {
      fontSize: '16px',
      color: '#aabbcc',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);

    this.input.once('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}

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
import type { TurretType } from './core/BuildingConfigs';
import { UI_COLORS, UI_DEPTH } from './ui/uiTheme';
import { BuildingManager } from './core/BuildingManager';
import { CombatManager } from './core/CombatManager';
import { playSfx } from './audio/Sfx';
import { musicManager } from './audio/MusicManager';
import { getGameMode, getArmageddonMusic } from './core/GameMode';
import { Airdrop } from './airdrops/Airdrop';
import { Zealot } from './enemies/Zealot';
import { QuizModal } from './ui/QuizModal';
import { PauseModal } from './ui/PauseModal';
import { TutorialModal } from './ui/TutorialModal';
import { DifficultyIndicator } from './ui/DifficultyIndicator';
import { pickRandomQuestion } from './quiz/questions';
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
  private airdrops: Set<Airdrop> = new Set();
  private activeQuiz?: QuizModal;
  private activePauseModal?: PauseModal;
  private activeTutorial?: TutorialModal;
  private tutorialActive = false;
  private isPaused = false;
  private lastPauseTime = 0;
  private readonly PAUSE_COOLDOWN = 350;
  private readonly AIRDROP_QUIZ_REWARD = 1; 
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

  
  private uiCamera!: Phaser.Cameras.Scene2D.Camera; 
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly CAMERA_SCROLL_SPEED = 0.85; 
  private readonly EDGE_SCROLL_MARGIN = 28;     
  private hasPointerMoved = false;              

  
  private resourcePanel!: ResourcePanel;
  private wavePanel!: WavePanel;
  private difficultyIndicator!: DifficultyIndicator;
  private bombSelector!: BombSelector;   
  private buildingSelector!: BuildingSelector;
  private turretSelector!: TurretSelector; 
  private skipPhaseButtonBg!: Phaser.GameObjects.Rectangle;
  private skipPhaseButtonLabel!: Phaser.GameObjects.Text;
  private spawnBossButtonBg!: Phaser.GameObjects.Rectangle;

  public gameState: GameState = new GameState();
  private selectedType: string = 'drill';
  private selectingBomb: boolean = false;
  private pendingBombCell: { gridX: number; gridY: number } | null = null; 
  private bombConfirmMarker?: Phaser.GameObjects.Rectangle;
  private lastDragBuildCell: { gridX: number; gridY: number } | null = null;
  private waveManager!: WaveManager;
  private currentPhase: string = 'gathering';
  private baseIncomeTimer = 0;
  private readonly BASE_INCOME_INTERVAL = 1800;
  private readonly BASE_INCOME_AMOUNT = 10;
  private readonly WAVE_INCOME_INTERVAL = 2000;
  private readonly WAVE_INCOME_AMOUNT = 5;
  private airdropSpawnTimer = 0;
  private nextAirdropSpawnDelay = 0;
  private readonly AIRDROP_LURE_RADIUS_BLOCKS = 15;

  private readonly TILESET_KEY = 'tileset';
  private readonly TILESET_NAME = 'tileset';

  
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('hero', 'src/assets/hero.png');
    this.load.svg('base', 'src/assets/base.svg', { width: 192, height: 192 });
    this.load.svg('drill', 'src/assets/drill.svg', { width: 96, height: 96 });
    this.load.svg('wall', 'src/assets/wall.svg', { width: 96, height: 96 });
    this.load.svg('bomb', 'src/assets/bomb.svg', { width: 96, height: 96 });
    this.load.svg('airdrop', 'src/assets/airdrop.svg', { width: 96, height: 96 });
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
    this.load.image('ant_dead_1', 'ants_assets/ants_sprite_sheet/4/dead/ant_dead_1.png');
    this.load.image('ant_dead_2', 'ants_assets/ants_sprite_sheet/4/dead/ant_dead_2.png');
    this.load.image('ant_dead_3', 'ants_assets/ants_sprite_sheet/4/dead/ant_dead_3.png');
    this.load.image('brute_idle_1', 'ants_assets/ants_sprite_sheet/10/idle/ant_idle_1.png');
    this.load.image('brute_idle_2', 'ants_assets/ants_sprite_sheet/10/idle/ant_idle_2.png');
    this.load.image('brute_idle_3', 'ants_assets/ants_sprite_sheet/10/idle/ant_idle_3.png');
    this.load.image('brute_idle_4', 'ants_assets/ants_sprite_sheet/10/idle/ant_idle_4.png');
    this.load.image('brute_walk_1', 'ants_assets/ants_sprite_sheet/10/walk/ant_walk_1.png');
    this.load.image('brute_walk_2', 'ants_assets/ants_sprite_sheet/10/walk/ant_walk_2.png');
    this.load.image('brute_walk_3', 'ants_assets/ants_sprite_sheet/10/walk/ant_walk_3.png');
    this.load.image('brute_attack_1', 'ants_assets/ants_sprite_sheet/10/attack/ant_attack_1.png');
    this.load.image('brute_attack_2', 'ants_assets/ants_sprite_sheet/10/attack/ant_attack_2.png');
    this.load.image('brute_attack_3', 'ants_assets/ants_sprite_sheet/10/attack/ant_attack_3.png');
    this.load.image('brute_dead_1', 'ants_assets/ants_sprite_sheet/10/dead/ant_dead_1.png');
    this.load.image('brute_dead_2', 'ants_assets/ants_sprite_sheet/10/dead/ant_dead_2.png');
    this.load.image('brute_dead_3', 'ants_assets/ants_sprite_sheet/10/dead/ant_dead_3.png');
    this.load.image('boss_idle_1', 'ants_assets/ants_sprite_sheet/9/idle/ant_idle_1.png');
    this.load.image('boss_idle_2', 'ants_assets/ants_sprite_sheet/9/idle/ant_idle_2.png');
    this.load.image('boss_idle_3', 'ants_assets/ants_sprite_sheet/9/idle/ant_idle_3.png');
    this.load.image('boss_idle_4', 'ants_assets/ants_sprite_sheet/9/idle/ant_idle_4.png');
    this.load.image('boss_walk_1', 'ants_assets/ants_sprite_sheet/9/walk/ant_walk_1.png');
    this.load.image('boss_walk_2', 'ants_assets/ants_sprite_sheet/9/walk/ant_walk_2.png');
    this.load.image('boss_walk_3', 'ants_assets/ants_sprite_sheet/9/walk/ant_walk_3.png');
    this.load.image('boss_attack_1', 'ants_assets/ants_sprite_sheet/9/attack/ant_attack_1.png');
    this.load.image('boss_attack_2', 'ants_assets/ants_sprite_sheet/9/attack/ant_attack_2.png');
    this.load.image('boss_attack_3', 'ants_assets/ants_sprite_sheet/9/attack/ant_attack_3.png');
    this.load.image('boss_dead_1', 'ants_assets/ants_sprite_sheet/9/dead/ant_dead_1.png');
    this.load.image('boss_dead_2', 'ants_assets/ants_sprite_sheet/9/dead/ant_dead_2.png');
    this.load.image('boss_dead_3', 'ants_assets/ants_sprite_sheet/9/dead/ant_dead_3.png');
    this.load.svg('turret-1', 'src/assets/turret-1.svg', { width: 96, height: 96 });
    this.load.svg('turret-2', 'src/assets/turret-2.svg', { width: 96, height: 96 });
    this.load.svg('turret-3', 'src/assets/turret-3.svg', { width: 96, height: 96 });

    
    if (getGameMode() === 'armageddon') {
      const track = getArmageddonMusic();
      this.load.audio(`music-armageddon-${track}`, `music/${track}.mp3`);
    } else {
      this.load.audio('music-main', 'music/main.mp3');
    }
    this.load.audio('music-victory', 'music/victory.mp3');
    this.load.audio('music-defeat', 'music/defeat.mp3');
    this.load.svg('turret-freeze', 'src/assets/turret-freeze.svg', { width: 96, height: 96 });
    
    
    this.load.svg(this.TILESET_KEY, 'src/assets/tileset.svg', { width: this.CELL_SIZE * 6, height: this.CELL_SIZE });

    this.load.svg('tile_empty', 'src/assets/tile-empty.svg', { width: 64, height: 64 });
    this.load.svg('tile_iron', 'src/assets/tile-iron.svg', { width: 64, height: 64 });
    this.load.svg('tile_stone', 'src/assets/tile-stone.svg', { width: 64, height: 64 });
  }

  create() {
    this.gameState = new GameState();
    this.enemies.clear();
    this.airdrops.clear();
    this.gameOverShown = false;
    this.victoryShown = false;
    this.isPaused = false;
    this.lastPauseTime = 0;
    this.selectedType = 'drill';
    this.selectingBomb = false;
    this.pendingBombCell = null;
    this.lastDragBuildCell = null;

    this.calculateGridDimensions();
    this.setupTilemap();
    this.setupTilesetFrames();
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
    this.difficultyIndicator = new DifficultyIndicator(this);
    this.waveManager = new WaveManager();
    this.enemySpawner = new EnemySpawner(this, this.enemies, this.getPlayfieldBounds());
    this.scheduleNextAirdrop();

    
    if (getGameMode() === 'armageddon') {
      this.gameState.resources.iron = 999999;
      this.gameState.resources.stone = 999999;
      this.gameState.resources.gradePoint = 999;
      this.gameState.unlockedTurretLevel = 3;
      this.gameState.freezeTurretUnlocked = true;
      ['dmg_1', 'dmg_2', 'dmg_3', 'rng_1', 'rng_2', 'fr_1', 'fr_2', 'hp_1', 'hp_2'].forEach((id) =>
        this.gameState.turretUpgrades.add(id)
      );
      this.waveManager.enableArmageddon();
      this.enemySpawner.enableArmageddon();
      musicManager.play(getArmageddonMusic());
    }
    
    this.buildingSelector = new BuildingSelector(this, this.gameState, (type, isBomb) => {
      this.turretSelector?.clearSelection();
      this.clearBombPending();
      this.selectedType = type;
      this.selectingBomb = isBomb;
    });

    this.bombSelector = new BombSelector();

    this.turretSelector = new TurretSelector(this, this.gameState, (type: TurretType) => {
      this.clearBombPending();
      this.selectedType = type === 'freeze' ? 'turret_freeze' : `turret_mk${type.replace('mk', '')}`;
      this.selectingBomb = false;
    });
    this.createSkipPhaseButton();
    this.createSpawnBossDebugButton();

    this.waveUpdateHandler = (data) => {
      if (data.phase === 'victory') {
        if (!this.victoryShown) {
          this.showVictoryScreen();
        }
        return;
      }

      const previousPhase = this.currentPhase;
      this.currentPhase = data.phase;

      const mainTrack = getGameMode() === 'armageddon' ? getArmageddonMusic() : 'main';
      if (data.phase === 'wave' && previousPhase !== 'wave') {
        musicManager.play(mainTrack);
        this.enemySpawner.startWave(data.enemiesInWave, data.waveDuration, data.waveNumber);
        this.emitEnemiesRemainingUpdate();
        playSfx(this, 'phase-wave');
      } else if ((data.phase === 'gathering' || data.phase === 'building') && previousPhase !== data.phase) {
        musicManager.play(mainTrack);
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
      for (const airdrop of this.airdrops) airdrop.destroy();
      this.airdrops.clear();
      this.activeQuiz?.destroy();
      this.activeQuiz = undefined;
      this.activePauseModal?.destroy();
      this.activePauseModal = undefined;
      this.activeTutorial?.destroy();
      this.activeTutorial = undefined;
      this.wavePanel?.destroy();
      this.gameState?.destroy();
      musicManager.stop();
    });

    
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        this.togglePause();
      } else if ((event.key === 'Enter' || event.keyCode === 13) && this.activePauseModal) {
        this.quitToMenu();
      }
    });


    this.setupCameraLayers();

    this.tutorialActive = true;
    this.activeTutorial = new TutorialModal(this, () => {
      this.tutorialActive = false;
      this.activeTutorial = undefined;
    });
    this.assignToHud(this.activeTutorial.getObjects());
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

  private createSpawnBossDebugButton(): void {
    const buttonX = this.LEFT_PANEL_WIDTH / 2;
    const buttonY = this.scale.height - 82;

    this.spawnBossButtonBg = this.add.rectangle(buttonX, buttonY, 188, 32, 0x2a1a24, 0.96)
      .setStrokeStyle(1, 0xff6b7d, 0.95)
      .setDepth(UI_DEPTH + 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(buttonX, buttonY, 'СПАВН БОССА', {
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      fontSize: '13px',
      color: '#ffd4dc',
      fontStyle: 'bold',
      resolution: 2,
    }).setOrigin(0.5).setDepth(UI_DEPTH + 2);

    this.spawnBossButtonBg.on('pointerover', () => {
      this.spawnBossButtonBg.setFillStyle(0x3a2230, 1);
    });
    this.spawnBossButtonBg.on('pointerout', () => {
      this.spawnBossButtonBg.setFillStyle(0x2a1a24, 0.96);
    });
    this.spawnBossButtonBg.on('pointerdown', () => {
      this.enemySpawner.spawnBossDebug();
      playSfx(this, 'ui-click');
    });

    
    const winButtonBg = this.add.rectangle(buttonX, buttonY - 40, 188, 32, 0x1a2a24, 0.96)
      .setStrokeStyle(1, 0x79e6b2, 0.95)
      .setDepth(UI_DEPTH + 1)
      .setInteractive({ useHandCursor: true });

    this.add.text(buttonX, buttonY - 40, 'ПОБЕДА', {
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      fontSize: '13px',
      color: '#d4ffea',
      fontStyle: 'bold',
      resolution: 2,
    }).setOrigin(0.5).setDepth(UI_DEPTH + 2);

    winButtonBg.on('pointerover', () => winButtonBg.setFillStyle(0x223a30, 1));
    winButtonBg.on('pointerout', () => winButtonBg.setFillStyle(0x1a2a24, 0.96));
    winButtonBg.on('pointerdown', () => {
      this.showVictoryScreen();
      playSfx(this, 'ui-click');
    });
  }

  

  private setupCamera(): void {
    const cam = this.cameras.main;
    
    const worldWidth = this.LEFT_PANEL_WIDTH + this.cols * this.CELL_SIZE + this.RIGHT_PANEL_WIDTH;
    const worldHeight = this.rows * this.CELL_SIZE;
    cam.setBounds(0, 0, worldWidth, worldHeight); 
    cam.centerOn(this.getPlayerCenterX(), this.getPlayerCenterY());

    
    
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.scale.on('resize', this.onResize);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;
  }

  
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

  public onObjectAdded = (go: Phaser.GameObjects.GameObject): void => {
    this.uiCamera?.ignore(go);
  };

  
  public assignToHud(target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]): void {
    const list = Array.isArray(target) ? target : [target];
    for (const obj of list) {
      (obj as unknown as { cameraFilter: number }).cameraFilter &= ~this.uiCamera.id; 
      this.cameras.main.ignore(obj);                                                  
      if (obj instanceof Phaser.GameObjects.Container) {
        this.assignToHud(obj.list);
      }
    }
  }

  private onResize = (size: Phaser.Structs.Size): void => {
    this.uiCamera?.setSize(size.width, size.height);
  };

  private updateCamera(delta: number): void {
    const cam = this.cameras.main;
    const speed = this.CAMERA_SCROLL_SPEED * delta;
    let dx = 0;
    let dy = 0;

    
    if (this.cursors.left.isDown || this.wasd.A.isDown) dx -= speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) dx += speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) dy -= speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) dy += speed;

    
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

  
  private isPointerOverPanel(pointer: Phaser.Input.Pointer): boolean {
    return pointer.x < this.LEFT_PANEL_WIDTH || pointer.x > this.scale.width - this.RIGHT_PANEL_WIDTH;
  }

  
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
        if (r < 0.025) rowData.push(2);                            
        else if (r < 0.075) rowData.push(1);                       
        else if (r < 0.225) rowData.push(3 + Math.floor(Math.random() * 3)); 
        else rowData.push(0);                                      
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

  private setupTilesetFrames(): void {
    const tex = this.textures.get(this.TILESET_KEY);
    if (!tex.has('stone')) {
      tex.add('stone', 0, this.CELL_SIZE * 1, 0, this.CELL_SIZE, this.CELL_SIZE); // tile index 1 = stone
      tex.add('iron',  0, this.CELL_SIZE * 2, 0, this.CELL_SIZE, this.CELL_SIZE); // tile index 2 = iron/ore
    }
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

    if (this.activeQuiz || this.activePauseModal) {
      this.ghost.setVisible(false);
      return;
    }

    
    if (pointer.middleButtonDown()) {
      this.cameras.main.scrollX -= pointer.x - pointer.prevPosition.x;
      this.cameras.main.scrollY -= pointer.y - pointer.prevPosition.y;
      this.ghost.setVisible(false);
      this.lastDragBuildCell = null;
      return;
    }

    if (this.isPointerOverPanel(pointer)) {
      this.ghost.setVisible(false);
      this.lastDragBuildCell = null;
      return;
    }

    const { gridX, gridY } = this.pointerToGrid(pointer);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      this.ghost.setVisible(false);
      this.lastDragBuildCell = null;
      return;
    }

    this.ghost.setVisible(true);
    this.ghost.setPosition(this.getGridOriginX() + gridX * this.CELL_SIZE + 1, gridY * this.CELL_SIZE + 1);
    this.ghost.setFillStyle(this.isOccupied(gridX, gridY) ? this.GHOST_COLOR_BLOCKED : this.GHOST_COLOR_FREE, 0.4);

    
    if (pointer.leftButtonDown() && !this.selectingBomb) {
      if (!this.lastDragBuildCell || this.lastDragBuildCell.gridX !== gridX || this.lastDragBuildCell.gridY !== gridY) {
        this.lastDragBuildCell = { gridX, gridY };
        if (!this.isOccupied(gridX, gridY)) {
          this.turretSelector?.clearSelection();
          this.clearBombPending();
          this.placeBuilding(gridX, gridY);
        }
      }
    } else {
      this.lastDragBuildCell = null;
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.activeQuiz || this.activePauseModal) return;             
    if (pointer.button !== 0) return;        
    if (this.isPointerOverPanel(pointer)) return; 

    const { gridX, gridY } = this.pointerToGrid(pointer);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      this.turretSelector?.clearSelection();
      this.clearBombPending();
      if (this.currentPhase === 'wave') {
        this.player.attackEnemy(this.enemies);
      }
      return;
    }

    this.turretSelector?.clearSelection();

    if (this.selectingBomb) {
      this.handleBombClick(gridX, gridY);
    } else {
      this.clearBombPending();
      this.placeBuilding(gridX, gridY);
    }
  }

  
  private handleBombClick(gridX: number, gridY: number): void {
    if (this.pendingBombCell && this.pendingBombCell.gridX === gridX && this.pendingBombCell.gridY === gridY) {
      this.clearBombPending();
      this.placeBomb(gridX, gridY);
      return;
    }

    if (this.isOccupied(gridX, gridY)) {
      playSfx(this, 'ui-deny');
      return;
    }

    this.setBombPending(gridX, gridY);
    playSfx(this, 'ui-click');
  }

  private setBombPending(gridX: number, gridY: number): void {
    this.pendingBombCell = { gridX, gridY };
    const x = this.getGridOriginX() + gridX * this.CELL_SIZE + 1;
    const y = gridY * this.CELL_SIZE + 1;

    if (!this.bombConfirmMarker) {
      this.bombConfirmMarker = this.add
        .rectangle(0, 0, this.CELL_SIZE - 2, this.CELL_SIZE - 2, 0xff6b3c, 0.3)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0xffb052, 1)
        .setDepth(101);
      this.tweens.add({
        targets: this.bombConfirmMarker,
        alpha: { from: 0.5, to: 1 },
        duration: 340,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    this.bombConfirmMarker.setPosition(x, y).setVisible(true);
  }

  private clearBombPending(): void {
    this.pendingBombCell = null;
    this.bombConfirmMarker?.setVisible(false);
  }

  placeBuilding(gridX: number, gridY: number): void {
    if (this.isOccupied(gridX, gridY)) {
      playSfx(this, 'ui-deny');
      return;
    }

    if (this.selectedType.startsWith('turret_mk') || this.selectedType === 'turret_freeze') {
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
    const isFreeze = this.selectedType === 'turret_freeze';
    const level = isFreeze ? 0 : Number(this.selectedType.replace('turret_mk', ''));
    const cost = isFreeze ? this.gameState.getFreezeTurretBuildCost() : this.gameState.getTurretBuildCost();
    if ((!isFreeze && (!Number.isFinite(level) || level <= 0 || level > 3)) || this.gameState.resources.iron < cost) {
      playSfx(this, 'ui-deny');
      return;
    }

    this.gameState.resources.iron -= cost;
    this.gameState.recordTurretBuilt();

    const worldX = this.getWorldXFromGrid(gridX);
    const worldY = gridY * this.CELL_SIZE + this.CELL_SIZE / 2;
    const turretType: TurretType = isFreeze ? 'freeze' : (`mk${level}` as TurretType);
    this.buildingManager.addTurret(this.getGridKey(gridX, gridY), createTurret(this, worldX, worldY, turretType, this.gameState));
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
        enemy.takeDamage(50);
      }
      this.buildingManager.removeBomb(bombKey);
    });
    this.buildingManager.addBomb(bombKey, bomb);
    playSfx(this, 'build');
  }

  private isOccupied(gridX: number, gridY: number): boolean {
    const key = this.getGridKey(gridX, gridY);
    return this.buildingManager.isOccupied(key) || this.isPlayerCell(gridX, gridY) || this.isAirdropCell(gridX, gridY);
  }

  private isAirdropCell(gridX: number, gridY: number): boolean {
    for (const airdrop of this.airdrops) {
      const airdropGridX = this.getGridXFromWorld(airdrop.sprite.x);
      const airdropGridY = Math.floor(airdrop.sprite.y / this.CELL_SIZE);
      if (airdropGridX === gridX && airdropGridY === gridY) {
        return true;
      }
    }
    return false;
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
    if (this.isPaused || this.tutorialActive || this.victoryShown || this.gameOverShown) return;

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
    this.updateAirdrops(delta);

    this.player.update(delta);

    this.bombSelector.updateAffordability();

    const deadEnemies = this.combatManager.update(
      delta,
      this.enemies,
      this.buildingManager.getAttackables(),
      this.player,
      this.getOpeningAirdrops()
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
    this.difficultyIndicator.update();
    this.buildingSelector.update();
    this.turretSelector.update();
  }

  private updateBaseIncome(delta: number): void {
    if (this.currentPhase === 'gameover' || this.currentPhase === 'victory') return;

    const isWave = this.currentPhase === 'wave';
    const isArmageddon = getGameMode() === 'armageddon';
    const interval = isArmageddon ? 100 : isWave ? this.WAVE_INCOME_INTERVAL : this.BASE_INCOME_INTERVAL;
    const amount = isArmageddon ? 5000 : isWave ? this.WAVE_INCOME_AMOUNT : this.BASE_INCOME_AMOUNT;

    this.baseIncomeTimer += delta;
    if (this.baseIncomeTimer < interval) return;

    this.baseIncomeTimer = 0;
    eventBus.emit('resource-mined', { type: 'iron', amount: amount });
    eventBus.emit('resource-mined', { type: 'stone', amount: amount });
  }

  private updateAirdrops(delta: number): void {
    for (const airdrop of this.airdrops) {
      airdrop.update(delta);
    }

    if (this.currentPhase !== 'wave' || this.airdrops.size > 0) {
      return;
    }

    this.airdropSpawnTimer += delta;
    if (this.airdropSpawnTimer < this.nextAirdropSpawnDelay) return;

    this.spawnAirdrop();
    this.scheduleNextAirdrop();
  }

  private scheduleNextAirdrop(): void {
    this.airdropSpawnTimer = 0;
    this.nextAirdropSpawnDelay = Phaser.Math.Between(15000, 25000);
  }

  private spawnAirdrop(): void {
    const position = this.findFreeAirdropCell();
    if (!position) return;

    const worldX = this.getWorldXFromGrid(position.gridX);
    const worldY = position.gridY * this.CELL_SIZE + this.CELL_SIZE / 2;
    const airdrop = new Airdrop(
      this,
      worldX,
      worldY,
      this.AIRDROP_LURE_RADIUS_BLOCKS * this.CELL_SIZE,
      (drop) => this.openAirdropQuiz(drop)
    );

    this.airdrops.add(airdrop);
    this.showFloatingText(worldX, worldY - 36, 'Аирдроп!');
  }

  private findFreeAirdropCell(): { gridX: number; gridY: number } | null {
    const playerLeft = this.getPlayerLeftCell();
    const playerTop = this.getPlayerTopCell();

    for (let attempt = 0; attempt < 80; attempt++) {
      const gridX = Phaser.Math.Between(2, this.cols - 3);
      const gridY = Phaser.Math.Between(2, this.rows - 3);
      const distanceToPlayer = Phaser.Math.Distance.Between(gridX, gridY, playerLeft + 1, playerTop + 1);

      if (distanceToPlayer < 8) continue;
      if (this.isOccupied(gridX, gridY)) continue;

      return { gridX, gridY };
    }

    return null;
  }

  private finishAirdrop(airdrop: Airdrop): void {
    this.clearAirdropTargets(airdrop);
    this.airdrops.delete(airdrop);
    airdrop.destroy();
  }

  
  private openAirdropQuiz(airdrop: Airdrop): void {
    if (this.activeQuiz) return; 
    this.clearAirdropTargets(airdrop);

    const question = pickRandomQuestion();
    const modal = new QuizModal(this, question, (correct) => this.resolveAirdropQuiz(airdrop, correct));
    this.assignToHud(modal.getObjects()); 

    this.activeQuiz = modal;
  }

  
  private resolveAirdropQuiz(airdrop: Airdrop, correct: boolean): void {
    this.activeQuiz?.destroy();
    this.activeQuiz = undefined;

    const x = airdrop.sprite.x;
    const y = airdrop.sprite.y;
    this.finishAirdrop(airdrop);

    if (this.gameOverShown || this.victoryShown) return;

    if (correct) {
      eventBus.emit('resource-mined', { type: 'gradePoint', amount: this.AIRDROP_QUIZ_REWARD });
      this.showFloatingText(x, y - 36, `+${this.AIRDROP_QUIZ_REWARD} очк. исследования`);
      playSfx(this, 'unlock');
    } else {
      const ant = new Zealot(this, x, y);
      this.enemies.add(ant);
      this.showFloatingText(x, y - 36, 'Неверно! Муравей!');
      playSfx(this, 'ui-deny');
    }
  }

  private clearAirdropTargets(airdrop: Airdrop): void {
    for (const enemy of this.enemies) {
      if (enemy.getAttackTarget() === airdrop) {
        enemy.clearTarget();
      }
    }
  }

  private getOpeningAirdrops(): Airdrop[] {
    return Array.from(this.airdrops).filter((airdrop) => airdrop.isOpening && airdrop.isAlive);
  }

  private showFloatingText(x: number, y: number, text: string): void {
    const textObj = this.add.text(x, y, text, {
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      fontSize: '15px',
      color: '#ffcf73',
      fontStyle: 'bold',
      resolution: 2,
    }).setOrigin(0.5).setDepth(40);

    this.tweens.add({
      targets: textObj,
      y: y - 22,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.easeOut',
      onComplete: () => textObj.destroy(),
    });
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

  private togglePause(): void {
    if (this.gameOverShown || this.victoryShown) return;

    if (this.activePauseModal) {
      this.resumeGame();
      return;
    }

    const now = performance.now();
    if (now - this.lastPauseTime < this.PAUSE_COOLDOWN) return;
    this.lastPauseTime = now;

    this.isPaused = true;
    const modal = new PauseModal(
      this,
      () => this.quitToMenu(),
      () => this.resumeGame()
    );
    this.assignToHud(modal.getObjects());
    this.activePauseModal = modal;
  }

  private resumeGame(): void {
    this.isPaused = false;
    this.activePauseModal?.destroy();
    this.activePauseModal = undefined;
  }

  private quitToMenu(): void {
    this.activePauseModal?.destroy();
    this.activePauseModal = undefined;
    this.scene.start('MenuScene');
  }

  private showVictoryScreen(): void {
    if (this.victoryShown) return;

    musicManager.play('victory');
    this.victoryShown = true;
    this.enemySpawner.stopWave();
    this.currentPhase = 'victory';

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    
    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x05080f, 0.72)
      .setDepth(1000)
      .setScrollFactor(0);

    
    this.add.rectangle(cx, cy, 480, 280, 0x0f1a2c, 0.98)
      .setStrokeStyle(2, 0x79e6b2)
      .setDepth(1001)
      .setScrollFactor(0);

    
    const title = this.add.text(cx, cy - 60, 'ПОБЕДА!', {
      fontSize: '48px',
      color: '#79e6b2',
      fontStyle: 'bold',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);

    this.tweens.add({
      targets: title,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1
    });

    this.add.text(cx, cy + 20, `Все ${this.waveManager.getCurrentWave()} волн пройдены`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);

    this.add.text(cx, cy + 80, 'Нажмите Enter для меню', {
      fontSize: '18px',
      color: '#aabbcc',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    }).setOrigin(0.5).setDepth(1002).setScrollFactor(0);

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start('MenuScene');
    });
  }

  private showGameOverScreen(): void {
    if (this.gameOverShown) return;

    musicManager.play('defeat');
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

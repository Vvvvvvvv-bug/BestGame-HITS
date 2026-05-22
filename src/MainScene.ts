import Phaser from 'phaser';
import { GameState } from './core/GameState';
import { Building } from './buildings/Building';
import { ResourcePanel } from './ui/ResourcePanel';
import { BuildingSelector } from './ui/BuildingSelector';
import { createBuilding } from './buildings/BuildingFactory';
import { WaveManager } from './core/WaveManager';
import { WavePanel } from './ui/WavePanel';
import { Enemy } from './enemies/Enemy';
import { EnemySpawner } from './enemies/EnemySpawner';
import { eventBus } from './core/EventBus';
import { Player } from './player/Player';
import { BombSelector } from './ui/BombSelector';
import { TurretSelector } from './ui/TurretSelector'; 
import { Bomb } from './buildings/Bomb';
import { Turret } from './buildings/Turret';
import { Drill } from './buildings/Drill';
import { BUILDING_CONFIGS } from './core/BuildingConfigs';
import { UI_COLORS, UI_DEPTH } from './ui/uiTheme';
export default class MainScene extends Phaser.Scene {
  private readonly CELL_SIZE = 32;
  private readonly LEFT_PANEL_WIDTH = 224;
  private readonly RIGHT_PANEL_WIDTH = 256; 

  private readonly GHOST_COLOR_FREE = 0xffffff;
  private readonly GHOST_COLOR_BLOCKED = 0xff0000;

  private ghost!: Phaser.GameObjects.Rectangle;
  private buildings: Map<string, Building> = new Map();
  private bombs: Map<string, Bomb> = new Map();
  private turrets: Map<string, Turret> = new Map();
  private enemies: Set<Enemy> = new Set();
  private enemySpawner!: EnemySpawner;
  private player!: Player;
  private playerHealthFill!: Phaser.GameObjects.Rectangle;
  private playerHealthText!: Phaser.GameObjects.Text;
  private gameOverShown: boolean = false;
  private victoryShown: boolean = false;

  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;

  private cols = 0;
  private rows = 0;

  // UI компоненты
  private resourcePanel!: ResourcePanel;
  private wavePanel!: WavePanel;
  private bombSelector!: BombSelector;   
  private buildingSelector!: BuildingSelector;
  private turretSelector!: TurretSelector; 

  public gameState: GameState = new GameState();
  private selectedType: string = 'drill';
  private selectingBomb: boolean = false;
  private waveManager!: WaveManager;
  private currentPhase: string = 'gathering';

  private readonly TILESET_KEY = 'tileset';
  private readonly TILESET_NAME = 'tileset';

  // Список твоих 5 пулеметов для внутренней логики апгрейдов, если понадобится
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('hero', 'src/assets/hero.png');
    this.load.svg('player', 'src/assets/player.svg', { width: 64, height: 64 });
    this.load.svg('drill', 'src/assets/drill.svg', { width: 48, height: 48 });
    this.load.svg('wall', 'src/assets/wall.svg', { width: 48, height: 48 });
    this.load.svg('bomb', 'src/assets/bomb.svg', { width: 48, height: 48 });
    this.load.svg('enemy', 'src/assets/enemy.svg', { width: 44, height: 44 });
    this.load.svg('turret-1', 'src/assets/turret-1.svg', { width: 48, height: 48 });
    this.load.svg('turret-2', 'src/assets/turret-2.svg', { width: 48, height: 48 });
    this.load.svg('turret-3', 'src/assets/turret-3.svg', { width: 48, height: 48 });
    this.load.svg('turret-4', 'src/assets/turret-4.svg', { width: 48, height: 48 });
    this.load.svg('turret-5', 'src/assets/turret-5.svg', { width: 48, height: 48 });
    this.load.svg(this.TILESET_KEY, 'src/assets/tileset.svg', { width: 96, height: 32 });
    
    this.load.svg('tile_empty', 'src/assets/tile-empty.svg', { width: 32, height: 32 });
    this.load.svg('tile_iron', 'src/assets/tile-iron.svg', { width: 32, height: 32 });
    this.load.svg('tile_stone', 'src/assets/tile-stone.svg', { width: 32, height: 32 });
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

    eventBus.on('wave-update', (data: { phase: string; enemiesInWave: number; waveNumber: number; waveDuration: number }) => {
      if (data.phase === 'victory') {
        if (!this.victoryShown) {
          this.showVictoryScreen();
        }
        return;
      }

      if (data.phase === 'wave' && this.currentPhase !== 'wave') {
        this.enemySpawner.startWave(data.enemiesInWave, data.waveDuration);
        this.emitEnemiesRemainingUpdate();
        this.currentPhase = 'wave';
      } else if (data.phase !== 'wave' && this.currentPhase === 'wave') {
        this.enemySpawner.stopWave();
        this.currentPhase = data.phase;
      }
    });
  }

  private calculateGridDimensions(): void {
    const { width, height } = this.scale;
    this.cols = Math.floor((width - this.LEFT_PANEL_WIDTH - this.RIGHT_PANEL_WIDTH) / this.CELL_SIZE);
    this.rows = Math.floor(height / this.CELL_SIZE);
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

    const x = this.getGridOriginX() + this.cols * this.CELL_SIZE;
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
        if (r < 0.05) rowData.push(2); 
        else if (r < 0.15) rowData.push(1); 
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
    const gridX = this.getGridXFromWorld(pointer.x);
    const gridY = Math.floor(pointer.y / this.CELL_SIZE);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      this.ghost.setVisible(false);
      return;
    }

    this.ghost.setVisible(true);
    this.ghost.setPosition(this.getGridOriginX() + gridX * this.CELL_SIZE + 1, gridY * this.CELL_SIZE + 1);
    this.ghost.setFillStyle(this.isOccupied(gridX, gridY) ? this.GHOST_COLOR_BLOCKED : this.GHOST_COLOR_FREE, 0.4);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.button !== 0) return;

    const gridX = this.getGridXFromWorld(pointer.x);
    const gridY = Math.floor(pointer.y / this.CELL_SIZE);

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
    if (this.isOccupied(gridX, gridY)) return;

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

    if (this.selectedType === 'drill' && !resourceToMine) return; 

    const cost = this.selectedType === 'drill' ? this.gameState.getDrillCost() : BUILDING_CONFIGS[this.selectedType as keyof typeof BUILDING_CONFIGS]?.cost;
    if (!cost || !this.gameState.spendCost(cost)) return;

    const worldX = this.getWorldXFromGrid(gridX);
    const worldY = gridY * this.CELL_SIZE + this.CELL_SIZE / 2;

    const building = createBuilding(this.selectedType, this, worldX, worldY, resourceToMine);
    this.buildings.set(this.getGridKey(gridX, gridY), building);
    if (this.selectedType === 'drill') this.gameState.recordDrillBuilt();
    this.ghost.setFillStyle(this.GHOST_COLOR_BLOCKED, 0.4);
  }

  private placeTurret(gridX: number, gridY: number): void {
    const level = Number(this.selectedType.replace('turret_mk', ''));
    const cost = this.gameState.getTurretBuildCost();
    if (!Number.isFinite(level) || level <= 0 || this.gameState.resources.iron < cost) return;

    this.gameState.resources.iron -= cost;
    this.gameState.recordTurretBuilt();

    const worldX = this.getWorldXFromGrid(gridX);
    const worldY = gridY * this.CELL_SIZE + this.CELL_SIZE / 2;
    this.turrets.set(this.getGridKey(gridX, gridY), new Turret(this, worldX, worldY, level));
    this.ghost.setFillStyle(this.GHOST_COLOR_BLOCKED, 0.4);
  }

  placeBomb(gridX: number, gridY: number): void {
    if (this.isOccupied(gridX, gridY)) return;

    const cost = BUILDING_CONFIGS.bomb.cost;
    if (this.gameState.resources.iron < cost.iron || this.gameState.resources.stone < cost.stone) return;
    this.gameState.resources.iron -= cost.iron;
    this.gameState.resources.stone -= cost.stone;

    const worldX = this.getWorldXFromGrid(gridX);
    const worldY = gridY * this.CELL_SIZE + this.CELL_SIZE / 2;

    const bomb = new Bomb(this, worldX, worldY, (activatedBomb) => {
      const affected = activatedBomb.getEnemiesInRadius(this.enemies);
      for (const enemy of affected) {
        if (enemy.takeDamage(50)) { 
          this.enemies.delete(enemy);
          enemy.destroy();
        }
      }
      for (const [key, b] of this.bombs.entries()) {
        if (b === activatedBomb) {
          this.bombs.delete(key);
          break;
        }
      }
    });
    this.bombs.set(this.getGridKey(gridX, gridY), bomb);
  }

  private isOccupied(gridX: number, gridY: number): boolean {
    const key = this.getGridKey(gridX, gridY);
    return this.buildings.has(key) || this.bombs.has(key) || this.turrets.has(key) || this.isPlayerCell(gridX, gridY);
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
    this.waveManager.update(delta);
    this.wavePanel.updateProgress(this.waveManager.getPhaseProgress());
    this.enemySpawner.update(delta);

    for (const building of this.buildings.values()) {
      if (building instanceof Drill) {
        building.allowGain = this.currentPhase !== 'wave';
      }
      building.update(delta);
    }

    for (const turret of this.turrets.values()) {
      turret.update(delta, this.enemies);
    }

    this.player.update(delta);
    
    this.bombSelector.updateAffordability();

    for (const bomb of this.bombs.values()) {
      bomb.update(delta);
    }

    const deadEnemies: Enemy[] = [];
    for (const enemy of this.enemies) {
      if (enemy['targetX'] === null || enemy['targetY'] === null || !enemy['attackTarget']) {
        const nearestBuilding = this.findNearestBuilding(enemy);
        const nearestTarget = this.findNearestTarget(enemy, nearestBuilding);
        
        if (nearestTarget) {
          if (nearestTarget === this.player) {
            enemy.setTarget(this.player.sprite.x, this.player.sprite.y);
            enemy.setAttackTarget(this.player);
          } else {
            enemy.setTarget((nearestTarget as Building).sprite.x, (nearestTarget as Building).sprite.y);
            enemy.setAttackTarget(nearestTarget);
          }
        }
      }
      
      enemy.update(delta);
      if (enemy.healthPoints <= 0) deadEnemies.push(enemy);
    }

    for (const enemy of deadEnemies) {
      this.enemies.delete(enemy);
      enemy.destroy();
    }
    
    const destroyedBuildings: string[] = [];
    for (const [key, building] of this.buildings.entries()) {
      if (building.healthPoints <= 0) {
        destroyedBuildings.push(key);
        building.destroy();
      }
    }
    for (const key of destroyedBuildings) this.buildings.delete(key);

    this.updatePlayerHealthBar();
    if (this.player.healthPoints <= 0) {
      this.showGameOverScreen();
      return;
    }

    this.completeWaveIfCleared();
    this.emitEnemiesRemainingUpdate();
    this.resourcePanel.update(this.gameState.resources);
    this.buildingSelector.update();
    this.turretSelector.update();
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

  private findNearestTarget(enemy: Enemy, nearestBuilding: Building | null): Building | Player | null {
    const playerDist = this.getDistance(enemy.sprite.x, enemy.sprite.y, this.player.sprite.x, this.player.sprite.y);
    const buildingDist = nearestBuilding ? 
      this.getDistance(enemy.sprite.x, enemy.sprite.y, nearestBuilding.sprite.x, nearestBuilding.sprite.y) : 
      Infinity;

    return playerDist < buildingDist ? this.player : nearestBuilding;
  }

  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  private findNearestBuilding(enemy: Enemy): Building | null {
    let nearest: Building | null = null;
    let minDistance = Infinity;

    for (const building of this.buildings.values()) {
      const distance = this.getDistance(enemy.sprite.x, enemy.sprite.y, building.sprite.x, building.sprite.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = building;
      }
    }
    return nearest;
  }

  private showVictoryScreen(): void {
    if (this.victoryShown) return;

    this.victoryShown = true;
    this.enemySpawner.stopWave();
    this.currentPhase = 'victory';

    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(1000);

    const textObj = this.add.text(this.scale.width / 2, this.scale.height / 2, 'ПОБЕДА!', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001);

    this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, `Все ${this.waveManager.getCurrentWave()} волн пройдены`, {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(1001);

    this.tweens.add({
      targets: textObj,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1
    });
  }

  private showGameOverScreen(): void {
    if (this.gameOverShown) return;

    this.gameOverShown = true;
    this.enemySpawner.stopWave();
    this.waveManager.setGameOver();
    this.currentPhase = 'gameover';

    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.72).setDepth(1000);
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'ПОРАЖЕНИЕ', {
      fontSize: '46px',
      color: '#ff6b7d',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1001);
  }
}

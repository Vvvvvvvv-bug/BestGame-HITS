import Phaser from 'phaser';
import { GameState } from './core/GameState';
import { Building } from './buildings/Building';
import { ResourcePanel } from './ui/ResourcePanel';
import { BuildingSelector } from './ui/BuildingSelector';
import { createBuilding } from './buildings/BuildingFactory';
import { WaveManager } from './core/WaveManager';
import { WavePanel } from './ui/WavePanel';
import { Enemy } from './enemies/Enemy';
import { Zealot } from './enemies/Zealot';

export default class MainScene extends Phaser.Scene {
  private readonly CELL_SIZE = 32;
  private readonly GHOST_COLOR_FREE = 0xffffff;
  private readonly GHOST_COLOR_BLOCKED = 0xff0000;

  private ghost!: Phaser.GameObjects.Rectangle;
  private buildings: Map<string, Building> = new Map();
  private enemies: Set<Enemy> = new Set();

  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;

  private cols = 0;
  private rows = 0;

  private resourcePanel!: ResourcePanel;
  private wavePanel!: WavePanel;
  public gameState: GameState = new GameState();
  private selectedType: string = 'drill';
  private waveManager!: WaveManager;

  private readonly TILESET_KEY = 'tiles';
  private readonly TILESET_NAME = 'tiles';

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.generateTilesetTexture();
    this.generateBuildingSpritesheet();
    this.generateEnemySpritesheet();
  }

  private generateTilesetTexture(): void {
    const TILE = this.CELL_SIZE;
    const rt = this.add.renderTexture(0, 0, TILE * 3, TILE);
    const g = this.add.graphics();

    g.clear();
    g.fillStyle(0x1a1a2e);
    g.fillRect(0, 0, TILE, TILE);
    g.lineStyle(1, 0x16213e, 0.5);
    g.strokeRect(2, 2, TILE - 4, TILE - 4);
    g.lineStyle(2, 0x0f3460, 0.3);
    g.strokeRect(0, 0, TILE, TILE);
    rt.draw(g, 0, 0);

    g.clear();
    g.fillStyle(0x4e4e50);
    g.fillRoundedRect(6, 6, TILE - 12, TILE - 12, 4);
    g.fillStyle(0x950740);
    g.fillCircle(TILE / 2, TILE / 2, 4);
    rt.draw(g, TILE, 0);

    g.clear();
    g.fillStyle(0x1a1a2e);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(0x4cc9f0);
    g.fillTriangle(16, 4, 4, 28, 28, 28);
    g.lineStyle(2, 0x480ca8, 0.8);
    g.strokeTriangle(16, 4, 4, 28, 28, 28);
    rt.draw(g, TILE * 2, 0);

    rt.saveTexture(this.TILESET_KEY);
    g.destroy();
    rt.destroy();
  }

  private generateBuildingSpritesheet(): void {
    const TILE = this.CELL_SIZE;
    const rt = this.add.renderTexture(0, 0, TILE * 2, TILE);
    const g = this.add.graphics();

    g.clear();
    g.lineStyle(2, 0x000000, 1);
    g.fillStyle(0x533483);
    g.fillRoundedRect(4, 4, TILE - 8, TILE - 8, 2);
    g.strokeRoundedRect(4, 4, TILE - 8, TILE - 8, 2);
    g.fillStyle(0xe94560);
    g.fillCircle(TILE / 2, TILE / 2, 6);
    rt.draw(g, 0, 0);

    g.clear();
    g.lineStyle(2, 0x000000, 1);
    g.fillStyle(0x16213e);
    g.fillRect(2, 2, TILE - 4, TILE - 4);
    g.strokeRect(2, 2, TILE - 4, TILE - 4);
    g.lineStyle(1, 0x0f3460);
    g.moveTo(2, TILE / 2);
    g.lineTo(TILE - 2, TILE / 2);
    g.strokePath();
    rt.draw(g, TILE, 0);

    rt.saveTexture('buildings');
    g.destroy();
    rt.destroy();

    this.textures.get('buildings').add('drill', 0, 0, 0, TILE, TILE);
    this.textures.get('buildings').add('wall', 0, TILE, 0, TILE, TILE);
  }

  private generateEnemySpritesheet(): void {
    const TILE = this.CELL_SIZE;
    const rt = this.add.renderTexture(0, 0, TILE, TILE);
    const g = this.add.graphics();

    // Зилот - красный враг
    g.clear();
    g.lineStyle(2, 0x000000, 1);
    g.fillStyle(0xff3333);
    g.fillCircle(TILE / 2, TILE / 2, TILE / 3);
    g.fillStyle(0xffff00);
    g.fillCircle(TILE / 2 - 4, TILE / 2 - 4, 2);
    g.fillCircle(TILE / 2 + 4, TILE / 2 - 4, 2);
    g.strokeCircle(TILE / 2, TILE / 2, TILE / 3);
    rt.draw(g, 0, 0);

    rt.saveTexture('enemies');
    g.destroy();
    rt.destroy();

    this.textures.get('enemies').add('zealot', 0, 0, 0, TILE, TILE);
  }

  create() {
    this.calculateGridDimensions();
    this.setupTilemap();
    this.setupGhost();
    this.setupInput();
    this.resourcePanel = new ResourcePanel(this);
    this.wavePanel = new WavePanel(this);
    this.waveManager = new WaveManager();
    new BuildingSelector(this, (type) => {
      this.selectedType = type;
    });
  }

  private calculateGridDimensions(): void {
    const PANEL_WIDTH = 100;
    const { width, height } = this.scale;
    this.cols = Math.floor((width - PANEL_WIDTH) / this.CELL_SIZE);
    this.rows = Math.floor(height / this.CELL_SIZE);
  }

  private setupTilemap(): void {
    const data: number[][] = [];
    for (let row = 0; row < this.rows; row++) {
      const rowData: number[] = [];
      for (let col = 0; col < this.cols; col++) {
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

    const tileset = this.map.addTilesetImage(
      this.TILESET_NAME,
      this.TILESET_KEY,
      this.CELL_SIZE,
      this.CELL_SIZE,
      0,
      0
    );

    if (!tileset) throw new Error('Tileset failed to load');
    this.tileset = tileset;

    const layer = this.map.createLayer(0, this.tileset, 0, 0);
    if (!layer) throw new Error('Layer failed to create');
    this.groundLayer = layer;
  }

  private setupGhost(): void {
    this.ghost = this.add.rectangle(0, 0, this.CELL_SIZE - 2, this.CELL_SIZE - 2, this.GHOST_COLOR_FREE, 0.4);
    this.ghost.setOrigin(0, 0);
    this.ghost.setVisible(false);
    this.ghost.setDepth(100);
  }

  private setupInput(): void {
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerdown', this.handlePointerDown, this);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const gridX = Math.floor(pointer.x / this.CELL_SIZE);
    const gridY = Math.floor(pointer.y / this.CELL_SIZE);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      this.ghost.setVisible(false);
      return;
    }

    this.ghost.setVisible(true);
    this.ghost.setPosition(gridX * this.CELL_SIZE + 1, gridY * this.CELL_SIZE + 1);
    this.ghost.setFillStyle(this.isOccupied(gridX, gridY) ? this.GHOST_COLOR_BLOCKED : this.GHOST_COLOR_FREE, 0.4);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.button !== 0) return;

    const gridX = Math.floor(pointer.x / this.CELL_SIZE);
    const gridY = Math.floor(pointer.y / this.CELL_SIZE);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) return;

    this.placeBuilding(gridX, gridY);
  }

  placeBuilding(gridX: number, gridY: number): void {
  if (this.isOccupied(gridX, gridY)) return;

  const tile = this.groundLayer.getTileAt(gridX, gridY);
  let resourceToMine: 'iron' | 'stone' | undefined = undefined;

  if (tile) {
    if (tile.index === 1) resourceToMine = 'stone'; 
    else if (tile.index === 2) resourceToMine = 'iron';
  }

  if (this.selectedType === 'drill' && !resourceToMine) {
    return; 
  }

  const worldX = gridX * this.CELL_SIZE + 1;
  const worldY = gridY * this.CELL_SIZE + 1;

  const building = createBuilding(this.selectedType, this, worldX, worldY, resourceToMine);
  this.buildings.set(this.getGridKey(gridX, gridY), building);
  this.ghost.setFillStyle(this.GHOST_COLOR_BLOCKED, 0.4);
}

  private isOccupied(gridX: number, gridY: number): boolean {
    return this.buildings.has(this.getGridKey(gridX, gridY));
  }

  private getGridKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`;
  }

  update(_time: number, delta: number): void {
    this.waveManager.update(delta);
    this.wavePanel.updateProgress(this.waveManager.getPhaseProgress());

    for (const building of this.buildings.values()) {
      building.update(delta);
    }

    for (const enemy of this.enemies) {
      enemy.update(delta);
    }

    this.resourcePanel.update(this.gameState.resources);
  }
}
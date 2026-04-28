import Phaser from 'phaser';

interface Building {
  gridX: number;
  gridY: number;
  type: string;
  sprite: Phaser.GameObjects.Rectangle;
}

export default class MainScene extends Phaser.Scene {
  private readonly CELL_SIZE = 32;
  private readonly GRID_COLOR = 0x444444;
  private readonly GHOST_COLOR_FREE = 0xffffff;
  private readonly GHOST_COLOR_BLOCKED = 0xff0000;
  private readonly BUILDING_COLOR = 0x00aaff;

  private ghost!: Phaser.GameObjects.Rectangle;
  private buildings: Map<string, Building> = new Map();
  private gridGraphics!: Phaser.GameObjects.Graphics;

  private cols = 0;
  private rows = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.calculateGridDimensions();
    this.setupGrid();
    this.setupGhost();
    this.setupInput();
  }

  private calculateGridDimensions(): void {
    const { width, height } = this.scale;
    this.cols = Math.floor(width / this.CELL_SIZE);
    this.rows = Math.floor(height / this.CELL_SIZE);
  }

  private setupGrid(): void {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, this.GRID_COLOR, 0.5);

    const width = this.cols * this.CELL_SIZE;
    const height = this.rows * this.CELL_SIZE;

    for (let x = 0; x <= width; x += this.CELL_SIZE) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += this.CELL_SIZE) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(width, y);
    }

    this.gridGraphics.strokePath();
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
    this.ghost.setPosition(
      gridX * this.CELL_SIZE + 1,
      gridY * this.CELL_SIZE + 1
    );

    const occupied = this.isOccupied(gridX, gridY);
    const color = occupied ? this.GHOST_COLOR_BLOCKED : this.GHOST_COLOR_FREE;
    this.ghost.setFillStyle(color, 0.4);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.button !== 0) return;

    const gridX = Math.floor(pointer.x / this.CELL_SIZE);
    const gridY = Math.floor(pointer.y / this.CELL_SIZE);

    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      return;
    }

    this.placeBuilding(gridX, gridY, 'turret');
  }

  private placeBuilding(gridX: number, gridY: number, type: string): void {
    if (this.isOccupied(gridX, gridY)) {
      return;
    }

    const worldX = gridX * this.CELL_SIZE + 1;
    const worldY = gridY * this.CELL_SIZE + 1;

    const sprite = this.add.rectangle(
      worldX,
      worldY,
      this.CELL_SIZE - 2,
      this.CELL_SIZE - 2,
      this.BUILDING_COLOR
    );
    sprite.setOrigin(0, 0);
    sprite.setDepth(10);

    const building: Building = {
      gridX,
      gridY,
      type,
      sprite,
    };

    const key = this.getGridKey(gridX, gridY);
    this.buildings.set(key, building);

    this.updateGhostColor(gridX, gridY);
  }

  private isOccupied(gridX: number, gridY: number): boolean {
    const key = this.getGridKey(gridX, gridY);
    return this.buildings.has(key);
  }

  private getGridKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`;
  }

  private updateGhostColor(gridX: number, gridY: number): void {
    const occupied = this.isOccupied(gridX, gridY);
    const color = occupied ? this.GHOST_COLOR_BLOCKED : this.GHOST_COLOR_FREE;
    this.ghost.setFillStyle(color, 0.4);
  }
}

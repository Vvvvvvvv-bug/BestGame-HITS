import { Zealot } from './Zealot';
import { BruteAnt } from './BruteAnt';
import { BossAnt } from './BossAnt';
import { Enemy } from './Enemy';

export class EnemySpawner {
  private scene: Phaser.Scene;
  private enemies: Set<Enemy>;
  private bounds: { left: number; right: number; top: number; bottom: number };
  private spawnTimer: number = 0;
  private spawnInterval: number = 2000; // Появляется враг каждые 2 секунды
  private totalToSpawn: number = 0;
  private spawned: number = 0;
  private isActive: boolean = false;
  private bossOnlyWave: boolean = false;

  constructor(
    scene: Phaser.Scene,
    enemies: Set<Enemy>,
    bounds: { left: number; right: number; top: number; bottom: number }
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.bounds = bounds;
  }

  public startWave(enemyCount: number, duration: number, waveNumber: number = 0): void {
    this.bossOnlyWave = waveNumber === 4;
    this.totalToSpawn = this.bossOnlyWave ? 1 : enemyCount;
    this.spawned = 0;
    this.isActive = true;
    this.spawnTimer = 0;
    
    // Рассчитываем интервал появления врагов
    const countForInterval = this.totalToSpawn;
    this.spawnInterval = countForInterval > 0 ? Math.max(500, duration / countForInterval) : 0;

    if (this.totalToSpawn > 0) {
      this.spawnEnemy();
    }
  }

  public update(delta: number): void {
    if (!this.isActive) return;

    this.spawnTimer += delta;

    if (this.spawnTimer >= this.spawnInterval && this.spawned < this.totalToSpawn) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }
  }

  private spawnEnemy(): void {
    const spawnPos = this.getRandomSpawnPosition();
    if (this.bossOnlyWave) {
      const boss = new BossAnt(this.scene, spawnPos.x, spawnPos.y);
      this.enemies.add(boss);
      this.spawned++;
      this.isActive = false;
      return;
    }

    const heavyChance = 0.18;
    const enemy =
      Math.random() < heavyChance
        ? new BruteAnt(this.scene, spawnPos.x, spawnPos.y)
        : new Zealot(this.scene, spawnPos.x, spawnPos.y);
    this.enemies.add(enemy);
    this.spawned++;

    if (this.spawned >= this.totalToSpawn) {
      this.isActive = false;
    }
  }

  private getRandomSpawnPosition(): { x: number; y: number } {
    const side = Math.floor(Math.random() * 4);
    const offset = 20;

    switch (side) {
      case 0: // Сверху
        return {
          x: Phaser.Math.Between(this.bounds.left, this.bounds.right),
          y: this.bounds.top - offset
        };
      case 1: // Снизу
        return {
          x: Phaser.Math.Between(this.bounds.left, this.bounds.right),
          y: this.bounds.bottom + offset
        };
      case 2: // Слева
        return {
          x: this.bounds.left - offset,
          y: Phaser.Math.Between(this.bounds.top, this.bounds.bottom)
        };
      case 3: // Справа
      default:
        return {
          x: this.bounds.right + offset,
          y: Phaser.Math.Between(this.bounds.top, this.bounds.bottom)
        };
    }
  }

  public stopWave(): void {
    this.isActive = false;
  }

  public isSpawning(): boolean {
    return this.isActive;
  }

  public getSpawnedCount(): number {
    return this.spawned;
  }

  public getRemainingToSpawn(): number {
    return Math.max(0, this.totalToSpawn - this.spawned);
  }

  public spawnBossDebug(): void {
    const spawnPos = this.getRandomSpawnPosition();
    const boss = new BossAnt(this.scene, spawnPos.x, spawnPos.y);
    this.enemies.add(boss);
  }
}

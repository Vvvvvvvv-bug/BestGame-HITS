import { EXPLOSIVE_CONFIG } from '../core/BuildingConfigs';
import { Enemy } from '../enemies/Enemy';
import type { Attackable } from '../core/Attackable';

export class Bomb implements Attackable {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  scene: Phaser.Scene;
  lastDetonatedTime: number = 0;
  canDetonate: boolean = true;
  healthPoints: number = 1;
  private onDetonate: (bomb: Bomb) => void;
  private baseScale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, onDetonate: (bomb: Bomb) => void) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.onDetonate = onDetonate;

    this.sprite = scene.add.sprite(x, y, 'bomb');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(15);
    this.sprite.setDisplaySize(30, 30); // SVG 96px -> 30px (под клетку)
    this.baseScale = this.sprite.scaleX;
    this.sprite.setInteractive({ useHandCursor: true });

    this.sprite.on('pointerdown', () => {
      this.detonate();
    });
  }

  detonate(): void {
    if (!this.canDetonate) return;

    this.canDetonate = false;
    this.lastDetonatedTime = 0;

    // Сообщаем сцене о взрыве, чтобы она нанесла урон врагам
    this.onDetonate(this);

    // Визуальный эффект
    this.scene.tweens.add({
      targets: this.sprite,
      scale: this.baseScale * 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.sprite.destroy();
      }
    });

    // Рисуем взрыв
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xFF6B00, 0.6);
    graphics.fillCircle(this.x, this.y, EXPLOSIVE_CONFIG.radius);
    graphics.setDepth(25);
    
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        graphics.destroy();
      }
    });
  }

  getEnemiesInRadius(enemies: Set<Enemy>): Enemy[] {
    const affected: Enemy[] = [];

    for (const enemy of enemies) {
      const dx = enemy.sprite.x - this.x;
      const dy = enemy.sprite.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= EXPLOSIVE_CONFIG.radius) {
        affected.push(enemy);
      }
    }

    return affected;
  }

  update(delta: number): void {
    if (!this.canDetonate) {
      this.lastDetonatedTime += delta;
      if (this.lastDetonatedTime >= EXPLOSIVE_CONFIG.cooldown) {
        this.canDetonate = true;
        this.sprite.setAlpha(1);
      } else {
        // Показываем кд через альфу
        this.sprite.setAlpha(0.5 + 0.5 * (this.lastDetonatedTime / EXPLOSIVE_CONFIG.cooldown));
      }
    }
  }

  takeDamage(amount: number): boolean {
    this.healthPoints -= amount;
    return this.healthPoints <= 0;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

import { BOMB_CONFIG } from '../core/BuildingConfigs';
import { Enemy } from '../enemies/Enemy';

export class Bomb {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  scene: Phaser.Scene;
  lastDetonatedTime: number = 0;
  canDetonate: boolean = true;
  private onDetonate: (bomb: Bomb) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onDetonate: (bomb: Bomb) => void) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.onDetonate = onDetonate;

    this.sprite = scene.add.sprite(x, y, 'bombs', 'bomb');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setDepth(15);
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
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.sprite.destroy();
      }
    });

    // Рисуем взрыв
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xFF6B00, 0.6);
    graphics.fillCircle(this.x, this.y, BOMB_CONFIG.radius);
    
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

      if (distance <= BOMB_CONFIG.radius) {
        affected.push(enemy);
      }
    }

    return affected;
  }

  update(delta: number): void {
    if (!this.canDetonate) {
      this.lastDetonatedTime += delta;
      if (this.lastDetonatedTime >= BOMB_CONFIG.cooldown) {
        this.canDetonate = true;
        this.sprite.setAlpha(1);
      } else {
        // Показываем кд через альфу
        this.sprite.setAlpha(0.5 + 0.5 * (this.lastDetonatedTime / BOMB_CONFIG.cooldown));
      }
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

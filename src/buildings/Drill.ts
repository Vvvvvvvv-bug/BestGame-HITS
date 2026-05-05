import { BUILDING_CONFIGS } from '../core/BuildingConfigs';
import { eventBus } from '../core/EventBus';
import { Building } from './Building';

export class Drill extends Building {
  private timer: number = 0;
  private resourceType: 'iron' | 'stone' | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, resourceType?: 'iron' | 'stone') {
    super(scene, x, y, 'drill', BUILDING_CONFIGS.drill.healthPoints);
    this.resourceType = resourceType;
  }

  public update(delta: number): void {
    if (!this.resourceType) return; 

    this.timer += delta;
    if (this.timer >= 1000) {
      eventBus.emit('resource-mined', { type: this.resourceType, amount: 50 });
      this.timer = 0;

      this.sprite.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 80,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    }
  }

  public onPlace(): void {}
}
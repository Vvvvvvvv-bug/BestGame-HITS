import { BOMB_CONFIG } from '../core/BuildingConfigs';
import { GameState } from '../core/GameState';

export class BombSelector {
  private button: Phaser.GameObjects.Container;
  private priceText: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, gameState: GameState, onBombSelect: () => void) {

    const startX = scene.scale.width - 90;
    
    const container = scene.add.container(startX, 180 + 80);
    
    const bg = scene.add.rectangle(0, 0, 80, 70, 0x222233)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x444466);
    
    const icon = scene.add.sprite(0, -10, 'bombs', 'bomb').setScale(1.2);
    
    const label = scene.add.text(0, 15, 'БОМБА', { 
      fontSize: '12px', 
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.priceText = scene.add.text(0, 28, `${BOMB_CONFIG.cost}`, {
      fontSize: '10px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, icon, label, this.priceText]);
    this.button = container;

    bg.on('pointerdown', () => {
      const cost = BOMB_CONFIG.cost;
      const totalResources = gameState.resources.iron + gameState.resources.stone;
      
      if (cost <= totalResources) {
        // Вычитаем ресурсы
        const ironCost = Math.min(cost, gameState.resources.iron);
        const stoneCost = cost - ironCost;
        gameState.resources.iron -= ironCost;
        gameState.resources.stone -= stoneCost;
        
        this.select();
        onBombSelect();
      }
    });

    bg.on('pointerover', () => bg.setStrokeStyle(2, 0x00d2ff));
    bg.on('pointerout', () => bg.setStrokeStyle(2, 0x444466));
  }

  private select(): void {
    const bg = this.button.first as Phaser.GameObjects.Rectangle;
    bg.setStrokeStyle(3, 0x00d2ff);
    bg.setFillStyle(0x333355);
  }

  public updateAffordability(iron: number, stone: number): void {
    const totalResources = iron + stone;
    const cost = BOMB_CONFIG.cost;

    if (cost > totalResources) {
      this.priceText.setColor('#ff6b6b'); // Красный
    } else {
      this.priceText.setColor('#FFD700'); // Золотой
    }
  }
}

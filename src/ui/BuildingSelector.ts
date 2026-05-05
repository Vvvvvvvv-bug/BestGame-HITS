export class BuildingSelector {
  private buttons: Map<string, Phaser.GameObjects.Container> = new Map();
  private selectedType: string = 'drill';

  constructor(scene: Phaser.Scene, onSelect: (type: string) => void) {
    const types = [
      { id: 'drill', name: 'БУР' },
      { id: 'wall', name: 'СТЕНА' }
    ];

    const startX = scene.scale.width - 90;
    
    types.forEach((type, index) => {
      const container = scene.add.container(startX, 100 + index * 80);
      
      const bg = scene.add.rectangle(0, 0, 80, 70, 0x222233)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x444466);
      
      const icon = scene.add.sprite(0, -10, 'buildings', type.id).setScale(1.2);
      
      const label = scene.add.text(0, 20, type.name, { 
    fontSize: '12px', 
    fontFamily: 'Arial',
    color: '#ffffff',
    fontStyle: 'bold'
}).setOrigin(0.5);

      container.add([bg, icon, label]);
      this.buttons.set(type.id, container);

      bg.on('pointerdown', () => {
        this.select(type.id);
        onSelect(type.id);
      });

      bg.on('pointerover', () => bg.setStrokeStyle(2, 0x00d2ff));
      bg.on('pointerout', () => {
        if (this.selectedType !== type.id) bg.setStrokeStyle(2, 0x444466);
      });
    });

    this.select('drill');
  }

  private select(type: string) {
    this.selectedType = type;
    this.buttons.forEach((container, id) => {
      const bg = container.first as Phaser.GameObjects.Rectangle;
      if (id === type) {
        bg.setStrokeStyle(3, 0x00d2ff);
        bg.setFillStyle(0x333355);
      } else {
        bg.setStrokeStyle(2, 0x444466);
        bg.setFillStyle(0x222233);
      }
    });
  }
}
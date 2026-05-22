import { BUILDING_CONFIGS, formatCost } from '../core/BuildingConfigs';
import { GameState } from '../core/GameState';
import { createHudPanel, TEXT_STYLE, UI_COLORS, UI_DEPTH } from './uiTheme';

export class BuildingSelector {
  private buttons: Map<string, Phaser.GameObjects.Container> = new Map();
  private costTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private selectedType: string = 'drill';
  private readonly gameState: GameState;
  private readonly PANEL_WIDTH = 256;

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    onSelect: (type: string, isBomb: boolean) => void
  ) {
    this.gameState = gameState;

    const items = [
      { id: 'drill', name: 'БУР', isBomb: false, texture: 'drill' },
      { id: 'wall', name: 'СТЕНА', isBomb: false, texture: 'wall' },
      { id: 'bomb', name: 'БОМБА', isBomb: true, texture: 'bomb' }
    ];

    const centerX = scene.scale.width - this.PANEL_WIDTH / 2;
    const startY = 92;
    const spacing = 76;

    createHudPanel(scene, centerX, 164, 218, 246, 0.88);

    scene.add.text(centerX, 50, 'ПОСТРОЙКИ', {
      ...TEXT_STYLE,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#d9e9f6',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);

    items.forEach((item, index) => {
      const container = scene.add.container(centerX, startY + index * spacing).setDepth(UI_DEPTH + 1);
      
      const bg = scene.add.rectangle(0, 0, 198, 62, UI_COLORS.panelAlt)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(1.5, UI_COLORS.borderMuted);
      
      const icon = scene.add.sprite(-70, -2, item.texture).setDisplaySize(40, 40);
      
      const label = scene.add.text(-34, -18, item.name, { 
        ...TEXT_STYLE,
        fontSize: '13px', 
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      const costLabel = scene.add.text(-34, 6, this.getCostText(item.id), {
        ...TEXT_STYLE,
        fontSize: '12px',
        color: '#9bd9ff',
      }).setOrigin(0, 0.5);

      container.add([bg, icon, label, costLabel]);
      this.buttons.set(item.id, container);
      this.costTexts.set(item.id, costLabel);

      bg.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.setActive(item.id);
        onSelect(item.id, item.isBomb);
      });

      bg.on('pointerover', () => {
        if (this.selectedType !== item.id) {
          bg.setStrokeStyle(2, UI_COLORS.border);
          bg.setFillStyle(UI_COLORS.tile);
        }
      });

      bg.on('pointerout', () => {
        if (this.selectedType !== item.id) {
          bg.setStrokeStyle(1.5, UI_COLORS.borderMuted);
          bg.setFillStyle(UI_COLORS.panelAlt);
        }
      });
    });

    this.setActive('drill');
    this.update();
  }

  public update(): void {
    this.costTexts.forEach((text, id) => {
      text.setText(this.getCostText(id));
      text.setColor(this.canAfford(id) ? '#9bd9ff' : '#ff6b7d');
    });
  }

  private getCostText(id: string): string {
    if (id === 'drill') return formatCost(this.gameState.getDrillCost());
    if (id === 'wall') return formatCost(this.gameState.getWallCost());
    if (id === 'bomb') return formatCost(this.gameState.getBombCost());
    const config = BUILDING_CONFIGS[id as keyof typeof BUILDING_CONFIGS];
    return config ? formatCost(config.cost) : '0';
  }

  private canAfford(id: string): boolean {
    if (id === 'drill') return this.gameState.canAffordCost(this.gameState.getDrillCost());
    if (id === 'wall') return this.gameState.canAffordCost(this.gameState.getWallCost());
    if (id === 'bomb') return this.gameState.canAffordCost(this.gameState.getBombCost());
    return true;
  }

  private setActive(type: string) {
    this.selectedType = type;
    this.buttons.forEach((container, id) => {
      const bg = container.first as Phaser.GameObjects.Rectangle;
      if (id === type) {
        bg.setStrokeStyle(2, UI_COLORS.selected);
        bg.setFillStyle(0x22344a);
      } else {
        bg.setStrokeStyle(1.5, UI_COLORS.borderMuted);
        bg.setFillStyle(UI_COLORS.panelAlt);
      }
    });
  }
}

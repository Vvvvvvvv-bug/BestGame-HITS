import { GameState } from '../core/GameState';
import { TURRET_CONFIGS } from '../core/BuildingConfigs';
import { createHudPanel, TEXT_STYLE, UI_COLORS, UI_DEPTH } from './uiTheme';

export class TurretSelector {
  updateAffordability(): void {
    this.update();
  }
  private buttons: Map<number, Phaser.GameObjects.Container> = new Map();
  private statusTexts: Map<number, Phaser.GameObjects.Text> = new Map();
  private selectedLevel = 0;
  private gameState: GameState;
  private onSelect: (level: number) => void;

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    onSelect: (level: number) => void
  ) {
    this.gameState = gameState;
    this.onSelect = onSelect;
    const panelX = scene.scale.width - 128;
    const startX = panelX - 48;
    const startY = 402;
    const buttonWidth = 86;
    const buttonHeight = 72;

    createHudPanel(scene, panelX, 540, 218, 354, 0.88);

    scene.add.text(panelX, 346, 'ТУРЕЛИ', {
      ...TEXT_STYLE,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#d7e4f2',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);

    TURRET_CONFIGS.forEach((turret, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * (buttonWidth + 10);
      const y = startY + row * (buttonHeight + 12);
      const container = scene.add.container(x, y).setDepth(UI_DEPTH + 1);

      const bg = scene.add.rectangle(0, 0, buttonWidth, buttonHeight, UI_COLORS.panelAlt)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, UI_COLORS.borderMuted);

      const icon = scene.add.sprite(0, -18, `turret-${turret.level}`).setDisplaySize(34, 34);
      const label = scene.add.text(0, 9, turret.name, {
        ...TEXT_STYLE,
        fontSize: '11px',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const status = scene.add.text(0, 26, '', {
        ...TEXT_STYLE,
        fontSize: '10px',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      container.add([bg, icon, label, status]);
      this.buttons.set(turret.level, container);
      this.statusTexts.set(turret.level, status);

      bg.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.handleClick(turret.level);
      });
      bg.on('pointerover', () => bg.setStrokeStyle(2, UI_COLORS.selected));
      bg.on('pointerout', () => {
        if (this.selectedLevel !== turret.level) {
          bg.setStrokeStyle(2, UI_COLORS.borderMuted);
        }
      });
    });

    this.update();
  }

  public clearSelection(): void {
    this.selectedLevel = 0;
    this.update();
  }

  public update(): void {
    const buildCost = this.gameState.getTurretBuildCost();

    this.buttons.forEach((container, level) => {
      const bg = container.first as Phaser.GameObjects.Rectangle;
      const icon = container.getAt(1) as Phaser.GameObjects.Sprite;
      const status = this.statusTexts.get(level);
      const unlocked = level <= this.gameState.unlockedTurretLevel;
      const nextUnlock = level === this.gameState.unlockedTurretLevel + 1;

      bg.setAlpha(unlocked || nextUnlock ? 1 : 0.42);
      icon.setAlpha(unlocked || nextUnlock ? 1 : 0.35);
      bg.setFillStyle(this.selectedLevel === level ? 0x203653 : UI_COLORS.panelAlt);
      bg.setStrokeStyle(this.selectedLevel === level ? 3 : 2, this.selectedLevel === level ? UI_COLORS.selected : UI_COLORS.borderMuted);

      if (!status) return;
      if (unlocked) {
        status.setText(`${buildCost} Fe`);
        status.setColor(this.gameState.resources.iron >= buildCost ? '#FFD166' : '#ff5c7a');
      } else if (nextUnlock) {
        const unlockCost = this.gameState.getTurretUnlockCost(level);
        status.setText(`${unlockCost} Fe`);
        status.setColor(this.gameState.resources.iron >= unlockCost ? '#42f5a7' : '#ff5c7a');
      } else {
        status.setText('ЗАКР');
        status.setColor('#667386');
      }
    });
  }

  private handleClick(level: number): void {
    const unlocked = level <= this.gameState.unlockedTurretLevel;
    if (!unlocked) {
      if (!this.gameState.unlockTurret(level)) return;
    }

    this.selectedLevel = level;
    this.onSelect(level);
    this.update();
  }
}

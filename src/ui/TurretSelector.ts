import { GameState } from '../core/GameState';
import type { TurretType } from '../core/BuildingConfigs';
import { createHudPanel, TEXT_STYLE, UI_COLORS, UI_DEPTH } from './uiTheme';
import { playSfx } from '../audio/Sfx';

type TurretItem = {
  type: TurretType;
  label: string;
  texture: string;
};

const TURRET_ITEMS: TurretItem[] = [
  { type: 'mk1', label: 'Mk I', texture: 'turret-1' },
  { type: 'mk2', label: 'Mk II', texture: 'turret-2' },
  { type: 'mk3', label: 'Mk III', texture: 'turret-3' },
  { type: 'freeze', label: 'Cryo', texture: 'turret-freeze' },
];

export class TurretSelector {
  private buttons: Map<TurretType, Phaser.GameObjects.Container> = new Map();
  private statusTexts: Map<TurretType, Phaser.GameObjects.Text> = new Map();
  private selectedType: TurretType | null = null;
  private gameState: GameState;
  private onSelect: (type: TurretType) => void;
  private scene: Phaser.Scene;

  private treeButton!: Phaser.GameObjects.Rectangle;
  private treePanel?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, gameState: GameState, onSelect: (type: TurretType) => void) {
    this.scene = scene;
    this.gameState = gameState;
    this.onSelect = onSelect;

    const panelX = scene.scale.width - 128;
    const startX = panelX - 48;
    const startY = 404;
    const buttonWidth = 86;
    const buttonHeight = 72;

    createHudPanel(scene, panelX, 540, 218, 354, 0.88);

    scene.add.text(panelX, 346, 'ТУРЕЛИ', {
      ...TEXT_STYLE,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#d7e4f2',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);

    TURRET_ITEMS.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * (buttonWidth + 10);
      const y = startY + row * (buttonHeight + 12);
      const container = scene.add.container(x, y).setDepth(UI_DEPTH + 1);

      const bg = scene.add.rectangle(0, 0, buttonWidth, buttonHeight, UI_COLORS.panelAlt)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, UI_COLORS.borderMuted);

      const icon = scene.add.sprite(0, -18, item.texture).setDisplaySize(34, 34);
      const label = scene.add.text(0, 9, item.label, {
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
      this.buttons.set(item.type, container);
      this.statusTexts.set(item.type, status);

      bg.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.handleClick(item.type);
      });

      bg.on('pointerover', () => bg.setStrokeStyle(2, UI_COLORS.selected));
      bg.on('pointerout', () => {
        if (this.selectedType !== item.type) bg.setStrokeStyle(2, UI_COLORS.borderMuted);
      });
    });

    this.treeButton = scene.add.rectangle(panelX, 690, 180, 30, 0x1c2f48, 0.96)
      .setStrokeStyle(1, UI_COLORS.border)
      .setDepth(UI_DEPTH + 1)
      .setInteractive({ useHandCursor: true });

    scene.add.text(panelX, 690, 'ДРЕВО АПГРЕЙДОВ', {
      ...TEXT_STYLE,
      fontSize: '11px',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 2);

    this.treeButton.on('pointerdown', () => {
      playSfx(this.scene, 'ui-click');
      this.toggleTree();
    });

    this.update();
  }

  updateAffordability(): void {
    this.update();
  }

  clearSelection(): void {
    this.selectedType = null;
    this.update();
  }

  update(): void {
    const buildCost = this.gameState.getTurretBuildCost();
    const freezeCost = this.gameState.getFreezeTurretBuildCost();

    TURRET_ITEMS.forEach((item) => {
      const container = this.buttons.get(item.type);
      const status = this.statusTexts.get(item.type);
      if (!container || !status) return;

      const bg = container.first as Phaser.GameObjects.Rectangle;
      const icon = container.getAt(1) as Phaser.GameObjects.Sprite;
      const unlocked = this.isUnlocked(item.type);

      bg.setAlpha(unlocked ? 1 : 0.4);
      icon.setAlpha(unlocked ? 1 : 0.35);
      bg.setFillStyle(this.selectedType === item.type ? 0x203653 : UI_COLORS.panelAlt);
      bg.setStrokeStyle(this.selectedType === item.type ? 3 : 2, this.selectedType === item.type ? UI_COLORS.selected : UI_COLORS.borderMuted);

      if (!unlocked) {
        status.setText('ЗАКР');
        status.setColor('#667386');
        return;
      }

      const cost = item.type === 'freeze' ? freezeCost : buildCost;
      status.setText(`${cost} Fe`);
      status.setColor(this.gameState.resources.iron >= cost ? '#FFD166' : '#ff5c7a');
    });

    this.refreshTreePanel();
  }

  private handleClick(type: TurretType): void {
    if (!this.isUnlocked(type)) {
      playSfx(this.scene, 'ui-deny');
      return;
    }

    playSfx(this.scene, 'ui-click');
    this.selectedType = type;
    this.onSelect(type);
    this.update();
  }

  private isUnlocked(type: TurretType): boolean {
    if (type === 'mk1') return true;
    if (type === 'mk2') return this.gameState.unlockedTurretLevel >= 2;
    if (type === 'mk3') return this.gameState.unlockedTurretLevel >= 3;
    return this.gameState.freezeTurretUnlocked;
  }

  private toggleTree(): void {
    if (this.treePanel) {
      this.treePanel.destroy(true);
      this.treePanel = undefined;
      return;
    }

    const panelX = this.scene.scale.width - 430;
    const panelY = 140;
    const bg = this.scene.add.rectangle(panelX, panelY, 260, 220, 0x0f1a2c, 0.96)
      .setStrokeStyle(2, UI_COLORS.border)
      .setDepth(UI_DEPTH + 10);

    const title = this.scene.add.text(panelX, panelY - 92, 'ДРЕВО АПГРЕЙДОВ', {
      ...TEXT_STYLE,
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#d7ecff',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 11);

    this.treePanel = this.scene.add.container(0, 0, [bg, title]).setDepth(UI_DEPTH + 10);
    this.refreshTreePanel();
  }

  private refreshTreePanel(): void {
    if (!this.treePanel) return;

    const old = this.treePanel.list.slice(2);
    old.forEach((obj) => obj.destroy());

    const rootX = this.scene.scale.width - 430;
    const startY = 90;

    this.addUpgradeNode(rootX, startY, 'Mk II', this.gameState.getTurretUnlockCost(2), this.gameState.unlockedTurretLevel >= 2, () => this.gameState.unlockTurret(2));
    this.addUpgradeNode(rootX, startY + 58, 'Mk III', this.gameState.getTurretUnlockCost(3), this.gameState.unlockedTurretLevel >= 3, () => this.gameState.unlockTurret(3));
    this.addUpgradeNode(rootX, startY + 116, 'Cryo', this.gameState.getFreezeTurretUnlockCost(), this.gameState.freezeTurretUnlocked, () => this.gameState.unlockFreezeTurret());

    const hint = this.scene.add.text(rootX, startY + 170, 'Открывай тут, строй в панели турелей', {
      ...TEXT_STYLE,
      fontSize: '10px',
      color: '#91a8bf',
    }).setOrigin(0.5).setDepth(UI_DEPTH + 11);
    this.treePanel.add(hint);
  }

  private addUpgradeNode(
    x: number,
    y: number,
    label: string,
    cost: number,
    unlocked: boolean,
    unlockFn: () => boolean
  ): void {
    if (!this.treePanel) return;

    const nodeBg = this.scene.add.rectangle(x, y, 228, 44, unlocked ? 0x1f3a2a : 0x1b2432, 0.98)
      .setStrokeStyle(1, unlocked ? 0x58d88f : UI_COLORS.borderMuted)
      .setDepth(UI_DEPTH + 11);

    const title = this.scene.add.text(x - 78, y - 8, label, {
      ...TEXT_STYLE,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#dff3ff',
    }).setOrigin(0, 0.5).setDepth(UI_DEPTH + 12);

    const status = this.scene.add.text(x - 78, y + 10, unlocked ? 'ОТКРЫТО' : `${cost} Fe`, {
      ...TEXT_STYLE,
      fontSize: '10px',
      color: unlocked ? '#7ae7b6' : (this.gameState.resources.iron >= cost ? '#ffd166' : '#ff6b7d'),
    }).setOrigin(0, 0.5).setDepth(UI_DEPTH + 12);

    this.treePanel.add([nodeBg, title, status]);

    if (unlocked) return;

    nodeBg.setInteractive({ useHandCursor: true });
    nodeBg.on('pointerdown', () => {
      if (!unlockFn()) {
        playSfx(this.scene, 'ui-deny');
        this.update();
        return;
      }
      playSfx(this.scene, 'unlock');
      this.update();
    });
  }
}

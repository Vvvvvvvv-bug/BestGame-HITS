import { WEAPON_CONFIGS } from '../player/Weapon';
import type { WeaponType } from '../player/Weapon';
import { GameState } from '../core/GameState';

export class WeaponShop {
  private buttons: Map<WeaponType, Phaser.GameObjects.Container> = new Map();
  private priceTexts: Map<WeaponType, Phaser.GameObjects.Text> = new Map();
  private ownedWeapons: Set<WeaponType> = new Set(['hand']);
  private selectedWeapon: WeaponType = 'hand';
  private availableWeapons: Set<WeaponType> = new Set(['hand']);
  constructor(scene: Phaser.Scene, gameState: GameState, onWeaponSelect: (type: WeaponType) => void) {
    const startX = 15;
    const startY = 120;
    const buttonWidth = 70;
    const buttonHeight = 80;
    const spacing = 5;

    const weaponTypes: WeaponType[] = ['hand', 'axe', 'pistol'];

    weaponTypes.forEach((type, index) => {
      const x = startX + (buttonWidth + spacing) * index;
      const container = scene.add.container(x, startY);

      // Фон кнопки
      const bg = scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x2a2a3e)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x00d2ff);

      // Иконка оружия
      const icon = scene.add.sprite(0, -15, 'weapons', type).setScale(1.2);

      // Название
      const name = scene.add.text(0, 10, WEAPON_CONFIGS[type].name, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Цена / статус
      const cost = WEAPON_CONFIGS[type].cost;
      const priceText = scene.add.text(0, 28, cost === 0 ? '✓' : `${cost}`, {
        fontSize: '10px',
        color: cost === 0 ? '#90EE90' : '#FFD700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      container.add([bg, icon, name, priceText]);
      this.buttons.set(type, container);
      this.priceTexts.set(type, priceText);

      bg.on('pointerdown', () => {
        if (!this.availableWeapons.has(type)) {
          return; // Оружие недоступно
        }

        const cost = WEAPON_CONFIGS[type].cost;

        // Если уже куплено — просто переключаем
        if (this.ownedWeapons.has(type)) {
          this.select(type);
          onWeaponSelect(type);
          return;
        }

        const totalResources = gameState.resources.iron + gameState.resources.stone;

        if (cost > totalResources) {
          return; // Не хватает ресурсов
        }

        // Вычитаем ресурсы
        const ironCost = Math.min(cost, gameState.resources.iron);
        const stoneCost = cost - ironCost;
        gameState.resources.iron -= ironCost;
        gameState.resources.stone -= stoneCost;

        // Отмечаем как купленное
        this.ownedWeapons.add(type);
        this.updatePriceText(type);

        this.select(type);
        onWeaponSelect(type);
      });

      bg.on('pointerover', () => {
        if (this.availableWeapons.has(type)) {
          if (bg.strokeColor !== 0x00ff00) {
            bg.setStrokeStyle(2, 0x00ff00);
          }
        }
      });

      bg.on('pointerout', () => {
        if (this.selectedWeapon !== type) {
          bg.setStrokeStyle(2, this.availableWeapons.has(type) ? 0x00d2ff : 0x555555);
        }
      });
    });

    this.select('hand');
  }

  public setAvailableWeapons(waveNumber: number): void {
    this.availableWeapons.clear();
    this.availableWeapons.add('hand');

    if (waveNumber >= 2) {
      this.availableWeapons.add('axe');
    }
    if (waveNumber >= 3) {
      this.availableWeapons.add('pistol');
    }

    this.updateVisuals();
  }

  private updateVisuals(): void {
    this.buttons.forEach((container, weaponType) => {
      const bg = container.first as Phaser.GameObjects.Rectangle;
      const icon = container.getAt(1) as Phaser.GameObjects.Sprite;
      
      if (this.availableWeapons.has(weaponType)) {
        bg.setAlpha(1);
        icon.setAlpha(1);
      } else {
        bg.setAlpha(0.3);
        icon.setAlpha(0.3);
      }

      bg.setStrokeStyle(2, this.availableWeapons.has(weaponType) ? 0x00d2ff : 0x555555);
      this.updatePriceText(weaponType);
    });
  }

  private updatePriceText(type: WeaponType): void {
    const text = this.priceTexts.get(type);
    if (!text) return;

    const cost = WEAPON_CONFIGS[type].cost;
    if (this.ownedWeapons.has(type)) {
      text.setText('✓');
      text.setColor('#90EE90');
    } else {
      text.setText(cost === 0 ? '0' : `${cost}`);
      text.setColor(cost === 0 ? '#90EE90' : '#FFD700');
    }
  }

  private select(type: WeaponType): void {
    this.selectedWeapon = type;
    this.buttons.forEach((container, id) => {
      const bg = container.first as Phaser.GameObjects.Rectangle;
      if (id === type) {
        bg.setStrokeStyle(3, 0x00ff00);
        bg.setFillStyle(0x333355);
      } else {
        bg.setStrokeStyle(2, this.availableWeapons.has(id) ? 0x00d2ff : 0x555555);
        bg.setFillStyle(0x2a2a3e);
      }
    });
  }

  public updateAffordability(iron: number, stone: number): void {
    const totalResources = iron + stone;

    this.priceTexts.forEach((text, weaponType) => {
      if (!this.availableWeapons.has(weaponType)) {
        text.setColor('#555555'); // Серый - недоступно
      } else if (this.ownedWeapons.has(weaponType)) {
        text.setColor('#90EE90'); // Зелёный - куплено
      } else {
        const cost = WEAPON_CONFIGS[weaponType].cost;
        if (cost > totalResources) {
          text.setColor('#ff6b6b'); // Красный - не можешь купить
        } else {
          text.setColor('#FFD700'); // Золотой - можно купить
        }
      }
    });
  }
}

import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import MainScene from './MainScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  // antialias:true => SVG-арт сглаживается при даунскейле (96px ассеты в 32px клетках)
  // вместо NEAREST-аляйзинга. roundPixels => спрайты на целых пикселях, без шиммера.
  antialias: true,
  pixelArt: false,
  roundPixels: true,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [MenuScene, MainScene],
  scale: {
    // RESIZE: drawing buffer = реальный размер окна 1:1 (нет CSS-transform-апскейла,
    // который мылил при FIT/ENVELOP). Сцена сама раскладывает grid/панели от scale.width/height.
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoRound: true,
  },
} as Phaser.Types.Core.GameConfig;

new Phaser.Game(config);

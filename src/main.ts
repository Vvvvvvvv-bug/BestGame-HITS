import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import MainScene from './MainScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  
  
  antialias: true,
  pixelArt: false,
  roundPixels: true,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [MenuScene, MainScene],
  scale: {
    
    
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
    autoRound: true,
  },
} as Phaser.Types.Core.GameConfig;

new Phaser.Game(config);

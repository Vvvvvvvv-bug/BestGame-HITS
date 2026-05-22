import Phaser from 'phaser';
import MainScene from './MainScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1248,
  height: 720,
  antialias: true,
  pixelArt: false,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: MainScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);

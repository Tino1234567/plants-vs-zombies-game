import Phaser from 'phaser';
import { audio } from './audio/AudioManager';
import { GAME_HEIGHT, GAME_WIDTH } from './constants';
import { CollectionScene } from './scenes/CollectionScene';
import { GameScene } from './scenes/GameScene';
import { HelpScene } from './scenes/HelpScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { RewardScene } from './scenes/RewardScene';
import { SeedSelectScene } from './scenes/SeedSelectScene';
import { SettingsScene } from './scenes/SettingsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#101810',
  render: {
    antialias: true,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    PreloadScene,
    MainMenuScene,
    LevelSelectScene,
    SeedSelectScene,
    CollectionScene,
    SettingsScene,
    HelpScene,
    GameScene,
    RewardScene,
  ],
};

const game = new Phaser.Game(config);

// Dev-only handles so you can poke at the running game from the browser console
// (or a debugger). Stripped from production builds.
if (import.meta.env.DEV) {
  Object.assign(window, { game, audio });
}

import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { LevelDefinition } from '../levels';
import type { ResourceManager } from '../managers/ResourceManager';

/**
 * Heads-up display: sun counter, level + wave indicator, a control hint and a
 * transient banner used for "a huge wave is approaching!".
 */
export class Hud {
  private readonly sunText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly waveText: Phaser.GameObjects.Text;
  private readonly banner: Phaser.GameObjects.Text;

  private bannerTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, resources: ResourceManager, level: LevelDefinition) {
    this.sunText = scene.add
      .text(690, 40, `Sun: ${resources.sun}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffe066',
        fontStyle: 'bold',
      })
      .setDepth(DEPTH.ui);

    this.levelText = scene.add
      .text(GAME_WIDTH - 18, 22, `${level.name}  \u00b7  ${level.title}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#e8f5e0',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.ui);

    this.waveText = scene.add
      .text(GAME_WIDTH - 18, 52, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#9ff07a',
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.ui);

    this.banner = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '46px',
        color: '#ff6b6b',
        stroke: '#2b0f0f',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.banner)
      .setAlpha(0);

    scene.add
      .text(
        GAME_WIDTH - 18,
        GAME_HEIGHT - 14,
        'Drag a seed onto the lawn \u00b7 click a seed or press 1-6 then click a cell \u00b7 R restarts \u00b7 M menu',
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          color: '#9fb79a',
        },
      )
      .setOrigin(1, 1)
      .setDepth(DEPTH.ui);

    resources.on('changed', (sun: number) => {
      this.sunText.setText(`Sun: ${sun}`);
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.bannerTimer?.remove());
  }

  setWave(wave: number, total: number): void {
    this.waveText.setText(`Wave ${wave} / ${total}`);
  }

  /** Big transient message, e.g. for flag waves. */
  announce(text: string, color = '#ff6b6b', holdMs = 2200): void {
    this.bannerTimer?.remove();

    this.banner.setText(text).setColor(color);

    this.banner.scene.tweens.killTweensOf(this.banner);
    this.banner.scene.tweens.add({
      targets: this.banner,
      alpha: 1,
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: 260,
      ease: 'Back.easeOut',
    });

    this.bannerTimer = this.banner.scene.time.delayedCall(holdMs, () => {
      this.banner.scene.tweens.add({ targets: this.banner, alpha: 0, duration: 320 });
    });
  }
}

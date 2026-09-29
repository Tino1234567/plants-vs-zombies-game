import Phaser from 'phaser';
import { audio } from '../audio/AudioManager';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { Button } from '../ui/Button';

const SECTIONS: Array<{ heading: string; lines: string[] }> = [
  {
    heading: 'Adventure mode',
    lines: [
      'You start with a single Peashooter. That is it.',
      'Clear a level and you are handed the next plant — Sunflower, then Cherry Bomb, Wall-nut, Potato Mine, Snow Pea, Repeater, Threepeater.',
      'Before each level, pick which seeds to carry. Only six fit in the bank.',
      'Cone-heads arrive at 1-3, bucket-heads at 1-5. Levels 1-5 and 1-8 end in a huge wave.',
    ],
  },
  {
    heading: 'Placing plants',
    lines: [
      'Drag a seed card onto the lawn — the outline turns green where it will land.',
      'Or click a seed card (or press 1-6), then click a lawn cell.',
      'A blocked drop does not waste the seed: it stays armed.',
      'Right click or ESC cancels the current selection.',
    ],
  },
  {
    heading: 'Sun is your currency',
    lines: [
      'Sunflowers make sun, and free sun falls from the sky every few seconds.',
      'Click a sun to collect it. Nothing is collected automatically.',
      'Plant Sunflowers early — everything else depends on them.',
      'A zombie reaching your house ends the level. R retries, M returns to the menu.',
    ],
  },
  {
    heading: 'Useful combos',
    lines: [
      'Wall-nut in front of a Peashooter buys it time to keep firing.',
      'Snow Pea slows a whole lane, making it easier for everything else.',
      'Cherry Bomb clears a 3x3 crowd; Potato Mine one-shots whatever steps on it.',
      'Threepeater in the middle lane covers three rows at once.',
    ],
  },
];

/** Static help screen. Purely informational, with a Back button. */
export class HelpScene extends Phaser.Scene {
  constructor() {
    super('help');
  }

  create(): void {
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x101c0d)
      .setOrigin(0, 0)
      .setDepth(DEPTH.lawn);

    this.add
      .text(GAME_WIDTH / 2, 56, 'HOW TO PLAY', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '40px',
        color: '#ffe066',
        stroke: '#2b2016',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.ui);

    const columnWidth = 560;
    const leftX = 70;
    const rightX = GAME_WIDTH / 2 + 30;

    SECTIONS.forEach((section, i) => {
      const x = i % 2 === 0 ? leftX : rightX;
      const y = 130 + Math.floor(i / 2) * 250;

      this.add
        .text(x, y, section.heading, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          color: '#9ff07a',
          fontStyle: 'bold',
        })
        .setDepth(DEPTH.ui);

      this.add
        .text(x, y + 42, section.lines.map((line) => `\u2022  ${line}`).join('\n'), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '17px',
          color: '#e8f5e0',
          wordWrap: { width: columnWidth },
          lineSpacing: 9,
        })
        .setDepth(DEPTH.ui);
    });

    new Button(this, GAME_WIDTH / 2, GAME_HEIGHT - 52, {
      label: '\u25c0   Back to Menu',
      width: 300,
      height: 50,
      fontSize: 20,
      onClick: () => this.goBack(),
    });

    this.input.keyboard?.on('keydown-ESC', () => this.goBack());
    this.input.keyboard?.on('keydown-BACKSPACE', () => this.goBack());

    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  private goBack(): void {
    audio.sfx('click');
    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('menu');
    });
  }
}

import Phaser from 'phaser';
import { BALANCE, DEPTH } from '../constants';
import type { GameContext, PlantDefinition } from '../types';
import { Plant } from './Plant';
import { Sun } from './Sun';

/**
 * Produces a sun every few seconds. The sun must be clicked to be collected
 * (unless you later add auto-collect).
 */
export class Sunflower extends Plant {
  private timer = 0;

  constructor(ctx: GameContext, def: PlantDefinition, col: number, row: number) {
    super(ctx, def, col, row);
    // First sun a little sooner so a fresh sunflower feels useful.
    this.timer = BALANCE.sunflowerSunIntervalMs * 0.4;
  }

  protected onTick(delta: number): void {
    this.timer += delta;
    if (this.timer < BALANCE.sunflowerSunIntervalMs) return;

    this.timer = 0;
    this.produce();

    // Head bob.
    this.ctx.scene.tweens.add({
      targets: this,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 120,
      yoyo: true,
    });
  }

  private produce(): void {
    const x = this.x + Phaser.Math.Between(-10, 10);
    const y = this.y - 8;

    // eslint-disable-next-line no-new
    new Sun(this.ctx.scene, x, y, BALANCE.sunflowerSunValue, (value) => {
      this.ctx.resources.add(value);
    });
  }
}

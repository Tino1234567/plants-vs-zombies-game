import Phaser from 'phaser';
import { audio } from '../audio/AudioManager';
import { BALANCE, DEPTH } from '../constants';
import type { GameContext, PlantDefinition } from '../types';
import { Plant } from './Plant';
import type { Zombie } from './Zombie';

/**
 * Base class for every pea-shooting plant.
 *
 * Behaviour is entirely data-driven from the plant's definition:
 *
 * | field            | meaning                                    |
 * | ---------------- | ------------------------------------------ |
 * | `lanes`          | rows it can hit, relative to its own row    |
 * | `peasPerVolley`  | peas fired per lane, per volley             |
 * | `fireIntervalMs` | delay between volleys                       |
 * | `damage`         | damage per pea                              |
 * | `slow`           | optional slow applied by the pea            |
 *
 * So Peashooter is `[0] x1`, Repeater is `[0] x2`, Snow Pea is `[0] x1 + slow`
 * and Threepeater is `[-1,0,1] x1` — all from `PLANT_DEFS` with no new code.
 */
export abstract class Shooter extends Plant {
  /** Time remaining until the next volley may fire. */
  private cooldown = 700;

  constructor(ctx: GameContext, def: PlantDefinition, col: number, row: number) {
    super(ctx, def, col, row);
  }

  /** Absolute rows this shooter can hit. */
  protected get targetRows(): number[] {
    return this.def.lanes
      ? this.def.lanes.map((offset) => this.row + offset)
      : [this.row];
  }

  protected onTick(delta: number): void {
    this.cooldown -= delta;
    if (this.cooldown > 0) return;
    if (!this.hasTargetAhead()) return;

    this.cooldown = this.def.fireIntervalMs ?? BALANCE.peashooterFireIntervalMs;
    this.fireVolley();
  }

  private hasTargetAhead(): boolean {
    const rows = this.targetRows;

    return this.ctx.zombies.getChildren().some((child) => {
      const zombie = child as Zombie;
      return (
        zombie.active &&
        !zombie.isDead &&
        rows.includes(zombie.row) &&
        zombie.x > this.x - 10
      );
    });
  }

  private fireVolley(): void {
    const peasPerLane = this.def.peasPerVolley ?? 1;

    for (const laneRow of this.targetRows) {
      if (!this.ctx.grid.isInside(0, laneRow)) continue;

      for (let i = 0; i < peasPerLane; i += 1) {
        // Repeater-style bursts are spaced slightly apart.
        this.ctx.scene.time.delayedCall(i * 140, () => this.spawnPea(laneRow));
      }
    }

    this.recoil();
  }

  private spawnPea(laneRow: number): void {
    if (!this.active) return;
    if (!this.ctx.grid.isInside(0, laneRow)) return;

    const y = this.ctx.grid.cellToWorld(this.col, laneRow).y - 14;
    const texture = this.def.projectile ?? 'pea';

    const pea = this.ctx.peas.create(this.x + 26, y, texture) as Phaser.Physics.Arcade.Image;

    pea.setDepth(DEPTH.peas);
    pea.setVelocityX(BALANCE.peaSpeed);
    pea.setData('damage', this.def.damage ?? BALANCE.peaDamage);

    if (this.def.slow) {
      pea.setData('slowFactor', this.def.slow.factor);
      pea.setData('slowMs', this.def.slow.durationMs);
    }

    audio.sfx('shoot');
  }

  private recoil(): void {
    this.ctx.scene.tweens.add({
      targets: this,
      x: this.x - 4,
      duration: 60,
      yoyo: true,
    });
  }
}

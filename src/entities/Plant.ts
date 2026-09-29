import Phaser from 'phaser';
import { DEPTH } from '../constants';
import type { GameContext, PlantDefinition } from '../types';

/**
 * Base class for everything that can be planted on the lawn.
 *
 * Plants are plain `Sprite`s (no physics body) — zombies find their target by
 * asking the `GridManager` which cell they are standing in, which is cheaper
 * and far more predictable than overlap callbacks for a tile game.
 */
export abstract class Plant extends Phaser.GameObjects.Sprite {
  readonly col: number;
  readonly row: number;

  protected readonly ctx: GameContext;
  protected readonly def: PlantDefinition;
  protected hp: number;

  private dying = false;

  constructor(ctx: GameContext, def: PlantDefinition, col: number, row: number) {
    const { x, y } = ctx.grid.cellToWorld(col, row);

    super(ctx.scene, x, y, def.texture);

    this.ctx = ctx;
    this.def = def;
    this.col = col;
    this.row = row;
    this.hp = def.maxHp;

    ctx.scene.add.existing(this);
    this.setDepth(DEPTH.plants);
    this.setOrigin(0.5, 0.5);

    // Small "pop" when planted.
    this.setScale(0.7);
    ctx.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  /** Called every frame by `GameScene` while the plant is alive. */
  tick(delta: number): void {
    if (this.dying || !this.active) return;
    this.onTick(delta);
  }

  /** Subclass behaviour. Called once per frame. */
  protected abstract onTick(delta: number): void;

  takeDamage(amount: number): void {
    if (this.dying || !this.active) return;

    this.hp -= amount;

    this.setTintFill(0xffffff);
    this.ctx.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });

    if (this.hp <= 0) this.kill();
  }

  get isDying(): boolean {
    return this.dying;
  }

  private kill(): void {
    if (this.dying) return;
    this.dying = true;

    this.ctx.grid.removePlant(this.col, this.row, this);

    this.ctx.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 180,
      onComplete: () => this.destroy(),
    });
  }

  override destroy(fromScene?: boolean): void {
    this.ctx.grid.removePlant(this.col, this.row, this);
    super.destroy(fromScene);
  }
}

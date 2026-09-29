import Phaser from 'phaser';
import { audio } from '../audio/AudioManager';
import { DEPTH, ZOMBIE_BARE_TEXTURE } from '../constants';
import type { GridManager } from '../managers/GridManager';
import type { Plant } from './Plant';

export interface ZombieOptions {
  hp: number;
  speed: number;
  /** Damage per second dealt to the plant it is chewing. */
  dps: number;
  /** Headgear hit points, absorbed before `hp`. Defaults to 0. */
  armorHp?: number;
  /** Texture key for the armoured look. Defaults to the plain zombie. */
  texture?: string;
}

/**
 * A zombie walks left down a single lane. When it reaches an occupied cell it
 * stops and chews the plant, dealing continuous damage.
 */
export class Zombie extends Phaser.Physics.Arcade.Sprite {
  readonly row: number;
  readonly speed: number;

  private hp: number;
  private readonly maxHp: number;
  private readonly dps: number;

  /** Headgear hit points. Hits chip this before the body. */
  private armorHp: number;

  private dead = false;
  private bobTween?: Phaser.Tweens.Tween;
  /** Hit-flash timer, so we don't schedule a delayed call per pea. */
  private flash = 0;

  /** Applied by Snow Pea. `slowUntil` is a scene timestamp. */
  private slowFactor = 1;
  private slowUntil = 0;
  /** Cached tint state: 0 = none, 1 = chilled, 2 = hit flash. */
  private tintState = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    row: number,
    private readonly grid: GridManager,
    options: ZombieOptions,
  ) {
    super(scene, x, grid.cellToWorld(0, row).y + 10, options.texture ?? ZOMBIE_BARE_TEXTURE);

    this.row = row;
    this.speed = options.speed;
    this.hp = options.hp;
    this.maxHp = options.hp;
    this.dps = options.dps;
    this.armorHp = options.armorHp ?? 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.zombies);
    this.setOrigin(0.5, 0.5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
  }

  get isDead(): boolean {
    return this.dead;
  }

  get healthRatio(): number {
    return Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
  }

  /** True while the zombie still has headgear on. */
  get hasArmor(): boolean {
    return this.armorHp > 0;
  }

  /** True while a Snow Pea's chill is still in effect. */
  get isSlowed(): boolean {
    return this.scene.time.now < this.slowUntil;
  }

  /** Walk speed after any active chill is taken into account. */
  get currentSpeed(): number {
    return this.isSlowed ? this.speed * this.slowFactor : this.speed;
  }

  /**
   * Chills this zombie. Repeated hits refresh the duration rather than stacking
   * the multiplier, so a lane of Snow Peas cannot freeze it solid.
   */
  applySlow(factor: number, durationMs: number): void {
    if (this.dead || !this.active) return;

    // Refresh the duration on every hit, and keep the strongest factor only
    // while a chill is already active (so it resets after it wears off).
    const alreadySlowed = this.isSlowed;

    this.slowFactor = alreadySlowed ? Math.min(this.slowFactor, factor) : factor;
    this.slowUntil = this.scene.time.now + durationMs;
  }

  /** Starts the idle shuffle animation. */
  walk(): void {
    this.bobTween?.stop();
    this.bobTween = this.scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Called every frame by `GameScene`. */
  tick(delta: number): void {
    if (this.dead || !this.active) return;

    if (this.flash > 0) this.flash -= delta;

    const col = this.grid.worldToCol(this.x);
    const plant = this.grid.getPlant(col, this.row);

    if (plant && plant.active && !plant.isDying) {
      this.eat(plant, delta);
    } else {
      this.setVelocityX(-this.currentSpeed);
    }

    this.updateTint();
  }

  takeDamage(amount: number): void {
    if (this.dead || !this.active) return;

    let remaining = amount;

    // Headgear soaks damage first, and falls off when it is used up.
    if (this.armorHp > 0) {
      const absorbed = Math.min(this.armorHp, remaining);
      this.armorHp -= absorbed;
      remaining -= absorbed;

      if (this.armorHp <= 0) this.shedArmor();
    }

    if (remaining > 0) this.hp -= remaining;

    this.flash = 60;

    if (this.hp <= 0) this.die();
  }

  /** Drops the cone / bucket, leaving an ordinary zombie behind. */
  private shedArmor(): void {
    this.setTexture(ZOMBIE_BARE_TEXTURE);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 90,
      yoyo: true,
    });
  }

  /** Applies the highest-priority visual state, only touching the tint on change. */
  private updateTint(): void {
    const next = this.flash > 0 ? 2 : this.isSlowed ? 1 : 0;
    if (next === this.tintState) return;

    this.tintState = next;

    if (next === 2) this.setTintFill(0xffffff);
    else if (next === 1) this.setTint(0x9fd8ff);
    else this.clearTint();
  }

  private eat(plant: Plant, delta: number): void {
    this.setVelocityX(0);
    plant.takeDamage((this.dps * delta) / 1000);

    // Chewing wobble.
    this.setAngle(Math.sin(this.scene.time.now * 0.03) * 5);
  }

  private die(): void {
    this.dead = true;
    this.bobTween?.stop();
    this.setActive(false);
    audio.sfx('zombieDie');

    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 20,
      angle: 85,
      duration: 450,
      onComplete: () => this.destroy(),
    });
  }

  override destroy(fromScene?: boolean): void {
    this.bobTween?.stop();
    this.bobTween = undefined;
    super.destroy(fromScene);
  }
}

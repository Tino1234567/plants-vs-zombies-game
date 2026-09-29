import Phaser from 'phaser';
import { BALANCE, GAME_WIDTH, ZOMBIE_DEFS } from '../constants';
import { Zombie } from '../entities/Zombie';
import type { LevelDefinition, WaveDefinition } from '../levels';
import type { ZombieType } from '../types';
import type { GridManager } from './GridManager';

export interface WaveHooks {
  /** A wave is about to start spawning. */
  onWaveStart: (wave: number, total: number, isFlag: boolean) => void;
  /** Every wave has been spawned and the lawn is clear. */
  onComplete: () => void;
}

type WaveState = 'idle' | 'resting' | 'spawning' | 'clearing' | 'done';

/** How long we tolerate a straggler before starting the next wave anyway. */
const MAX_GRACE_MS = 14000;

/**
 * Walks a level's wave table.
 *
 * Waves may overlap: the next one starts once its delay has elapsed *or* the
 * lawn is clear, whichever comes first. That keeps the early levels calm while
 * letting the late flag waves pile up the way the original does.
 */
export class WaveManager {
  private waveIndex = -1;
  private queue: ZombieType[] = [];
  private spawnTimer = 0;
  private restTimer = 0;
  private graceMs = 0;
  private state: WaveState = 'idle';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly zombies: Phaser.Physics.Arcade.Group,
    private readonly grid: GridManager,
    private readonly level: LevelDefinition,
    private readonly hooks: WaveHooks,
  ) {}

  get currentWave(): number {
    return Math.max(1, this.waveIndex + 1);
  }

  get totalWaves(): number {
    return this.level.waves.length;
  }

  get isFinished(): boolean {
    return this.state === 'done';
  }

  /** Resets to the start of the level. */
  start(): void {
    this.waveIndex = -1;
    this.queue = [];
    this.spawnTimer = 0;
    this.graceMs = 0;
    this.restTimer = this.level.waves[0]?.delayMs ?? 3000;
    this.state = 'resting';
  }

  /** Immediately stops spawning (used on game over). */
  stop(): void {
    this.state = 'done';
  }

  update(delta: number): void {
    if (this.state === 'idle' || this.state === 'done') return;

    if (this.state === 'resting') {
      this.restTimer -= delta;
      if (this.restTimer > 0) return;

      this.graceMs += delta;
      const lawnIsClear = this.zombies.countActive(true) === 0;

      if (lawnIsClear || this.graceMs >= MAX_GRACE_MS) this.beginWave();
      return;
    }

    if (this.state === 'spawning') {
      this.spawnTimer -= delta;
      if (this.spawnTimer > 0) return;

      const next = this.queue.shift();

      if (next) {
        this.spawnZombie(next);
        this.spawnTimer = this.currentDefinition().gapMs;
      } else {
        this.state = 'clearing';
      }
      return;
    }

    // clearing: the wave is fully spawned, so wait for the lawn to empty.
    if (this.zombies.countActive(true) > 0) return;

    if (this.waveIndex < this.level.waves.length - 1) {
      this.state = 'resting';
      this.graceMs = 0;
      this.restTimer = this.level.waves[this.waveIndex + 1].delayMs;
    } else {
      this.state = 'done';
      this.hooks.onComplete();
    }
  }

  private currentDefinition(): WaveDefinition {
    return this.level.waves[this.waveIndex];
  }

  private beginWave(): void {
    this.waveIndex += 1;
    const definition = this.currentDefinition();

    this.queue = Phaser.Utils.Array.Shuffle(expand(definition.zombies));
    this.spawnTimer = 0;
    this.graceMs = 0;
    this.state = 'spawning';

    this.hooks.onWaveStart(this.waveIndex + 1, this.level.waves.length, Boolean(definition.flag));
  }

  private spawnZombie(type: ZombieType): void {
    const def = ZOMBIE_DEFS[type];
    const row = Phaser.Math.Between(0, this.grid.rows - 1);

    const zombie = new Zombie(this.scene, GAME_WIDTH + 50, row, this.grid, {
      hp: def.hp,
      armorHp: def.armorHp,
      speed: def.speed,
      dps: BALANCE.zombieEatDps,
      texture: def.texture,
    });

    this.zombies.add(zombie);
    zombie.setVelocityX(-def.speed);
    zombie.walk();
  }
}

/** `{ basic: 2, conehead: 1 }` -> `['basic', 'basic', 'conehead']` */
function expand(counts: Partial<Record<ZombieType, number>>): ZombieType[] {
  const out: ZombieType[] = [];

  (Object.keys(counts) as ZombieType[]).forEach((type) => {
    const count = counts[type] ?? 0;
    for (let i = 0; i < count; i += 1) out.push(type);
  });

  return out;
}

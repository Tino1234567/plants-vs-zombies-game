import Phaser from 'phaser';
import { SEED_ORDER } from '../constants';
import { TOTAL_LEVELS, plantsForLevel } from '../levels';
import type { PlantType } from '../types';

/** Adventure progress and run statistics, persisted to localStorage. */
export interface Progress {
  /** Highest level number the player has cleared (0 = none yet). */
  highestCompleted: number;
  /** Levels played. */
  games: number;
  /** Best wave reached in any single level. */
  bestWave: number;
  /** Chosen seeds per level, so the loadout survives a reload. */
  loadouts: Record<string, PlantType[]>;
}

const STORAGE_KEY = 'pvz.progress.v2';

const DEFAULTS: Progress = {
  highestCompleted: 0,
  games: 0,
  bestWave: 0,
  loadouts: {},
};

function readStored(): Partial<Progress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Progress>) : {};
  } catch {
    return {};
  }
}

class ProgressStore extends Phaser.Events.EventEmitter {
  private values: Progress;

  constructor() {
    super();
    this.values = { ...DEFAULTS, ...readStored() };
  }

  get current(): Readonly<Progress> {
    return this.values;
  }

  /* ---------------------------------------------------------------- */
  /*  Level progression                                                */
  /* ---------------------------------------------------------------- */

  /** The highest level the player may enter. */
  get unlockedLevel(): number {
    return Math.min(this.values.highestCompleted + 1, TOTAL_LEVELS);
  }

  isUnlocked(levelId: number): boolean {
    return levelId <= this.unlockedLevel;
  }

  isCompleted(levelId: number): boolean {
    return levelId <= this.values.highestCompleted;
  }

  get completedCount(): number {
    return Math.min(this.values.highestCompleted, TOTAL_LEVELS);
  }

  /** Plants owned right now. */
  get unlockedPlants(): PlantType[] {
    return plantsForLevel(this.unlockedLevel);
  }

  /**
   * Records a finished level. Returns `true` when this clear unlocked the next
   * level, i.e. it was the player's furthest run so far.
   */
  completeLevel(levelId: number, wavesReached: number): boolean {
    this.values.games += 1;

    if (wavesReached > this.values.bestWave) this.values.bestWave = wavesReached;

    const isNew = levelId === this.values.highestCompleted + 1;
    if (isNew) this.values.highestCompleted = Math.min(levelId, TOTAL_LEVELS);

    this.persist();
    this.emit('changed');

    return isNew;
  }

  /** Records a failed attempt. */
  recordAttempt(wavesReached: number): void {
    this.values.games += 1;
    if (wavesReached > this.values.bestWave) this.values.bestWave = wavesReached;

    this.persist();
    this.emit('changed');
  }

  /** Remembers which seeds the player picked for a level. */
  setLoadout(levelId: number, seeds: PlantType[]): void {
    this.values.loadouts[String(levelId)] = [...seeds];
    this.persist();
  }

  getLoadout(levelId: number): PlantType[] | undefined {
    const stored = this.values.loadouts[String(levelId)];
    return stored ? [...stored] : undefined;
  }

  reset(): void {
    this.values = { ...DEFAULTS, loadouts: {} };
    this.persist();
    this.emit('changed');
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values));
    } catch {
      /* keep the values in memory only */
    }
  }
}

export const progress = new ProgressStore();

/** The full plant order, for screens that show locked entries too. */
export const ALL_PLANTS: readonly PlantType[] = SEED_ORDER;

import { SEED_ORDER } from './constants';
import type { PlantType, ZombieType } from './types';

/**
 * A single wave of a level.
 */
export interface WaveDefinition {
  /** Quiet time before this wave starts (ms). */
  readonly delayMs: number;
  /** Gap between individual zombies inside this wave (ms). */
  readonly gapMs: number;
  /** How many of each zombie type to send. */
  readonly zombies: Partial<Record<ZombieType, number>>;
  /** Flag waves trigger the "a huge wave is approaching!" warning. */
  readonly flag?: boolean;
}

/** One adventure level. */
export interface LevelDefinition {
  /** 1-based level number. */
  readonly id: number;
  /** Short display name, e.g. `1-3`. */
  readonly name: string;
  /** Level title shown on cards and in the HUD. */
  readonly title: string;
  /** One-line flavour text for the level card. */
  readonly blurb: string;
  /** Sun the level starts with. */
  readonly startingSun: number;
  /** How often a free sun drops from the sky (ms). */
  readonly skySunIntervalMs: number;
  readonly waves: readonly WaveDefinition[];
}

const wave = (
  delayMs: number,
  gapMs: number,
  zombies: Partial<Record<ZombieType, number>>,
  flag = false,
): WaveDefinition => ({ delayMs, gapMs, zombies, flag });

/**
 * Day 1 of adventure mode: eight levels that ramp up gently.
 *
 * Progression mirrors the original game:
 *  - you begin with a **Peashooter** and nothing else
 *  - every level you clear hands you the next plant in `SEED_ORDER`
 *  - cone-heads appear from `1-3`, bucket-heads from `1-5`
 *  - `1-5` and `1-8` are **flag levels** with a huge final wave
 */
export const LEVELS: readonly LevelDefinition[] = [
  {
    id: 1,
    name: '1-1',
    title: 'Front Lawn',
    blurb: 'One Peashooter. One zombie. Good luck.',
    startingSun: 100,
    skySunIntervalMs: 6000,
    waves: [
      wave(4000, 2600, { basic: 1 }),
      wave(8000, 2400, { basic: 1 }),
      wave(9000, 2000, { basic: 2 }),
    ],
  },
  {
    id: 2,
    name: '1-2',
    title: 'Front Lawn',
    blurb: 'They brought friends this time.',
    startingSun: 75,
    skySunIntervalMs: 6000,
    waves: [
      wave(3000, 2400, { basic: 2 }),
      wave(7000, 2000, { basic: 2 }),
      wave(8000, 1700, { basic: 3 }),
    ],
  },
  {
    id: 3,
    name: '1-3',
    title: 'Front Lawn',
    blurb: 'Someone is wearing a traffic cone.',
    startingSun: 75,
    skySunIntervalMs: 5800,
    waves: [
      wave(3000, 2200, { basic: 2 }),
      wave(6500, 1900, { basic: 2, conehead: 1 }),
      wave(7500, 1600, { basic: 3, conehead: 2 }),
    ],
  },
  {
    id: 4,
    name: '1-4',
    title: 'Front Lawn',
    blurb: 'Cones everywhere. Time to dig in.',
    startingSun: 100,
    skySunIntervalMs: 5600,
    waves: [
      wave(3000, 2000, { basic: 3 }),
      wave(6000, 1800, { basic: 2, conehead: 2 }),
      wave(6500, 1600, { basic: 2, conehead: 2 }),
      wave(7000, 1400, { basic: 3, conehead: 3 }),
    ],
  },
  {
    id: 5,
    name: '1-5',
    title: 'Front Lawn',
    blurb: 'A bucket-head leads the charge.',
    startingSun: 100,
    skySunIntervalMs: 5500,
    waves: [
      wave(3000, 1900, { basic: 3 }),
      wave(6000, 1700, { basic: 2, conehead: 2 }),
      wave(6500, 1600, { basic: 2, conehead: 2 }),
      wave(7000, 1500, { buckethead: 1, basic: 2 }),
      wave(9000, 1100, { basic: 4, conehead: 3, buckethead: 2 }, true),
    ],
  },
  {
    id: 6,
    name: '1-6',
    title: 'Front Lawn',
    blurb: 'Buckets are the new cones.',
    startingSun: 125,
    skySunIntervalMs: 5400,
    waves: [
      wave(3000, 1800, { basic: 3, conehead: 1 }),
      wave(6000, 1600, { basic: 2, conehead: 2 }),
      wave(6500, 1500, { buckethead: 1, conehead: 2 }),
      wave(7000, 1400, { basic: 3, conehead: 2, buckethead: 1 }),
      wave(8000, 1200, { basic: 3, conehead: 3, buckethead: 2 }),
    ],
  },
  {
    id: 7,
    name: '1-7',
    title: 'Front Lawn',
    blurb: 'The lawn is getting crowded.',
    startingSun: 125,
    skySunIntervalMs: 5200,
    waves: [
      wave(3000, 1700, { basic: 3, conehead: 2 }),
      wave(5500, 1500, { basic: 3, conehead: 2 }),
      wave(6000, 1400, { buckethead: 2, conehead: 2 }),
      wave(6500, 1300, { basic: 4, conehead: 3 }),
      wave(7000, 1200, { basic: 3, conehead: 3, buckethead: 2 }),
      wave(9000, 1000, { basic: 5, conehead: 4, buckethead: 3 }, true),
    ],
  },
  {
    id: 8,
    name: '1-8',
    title: 'Front Lawn',
    blurb: 'The last stand. Everything they have.',
    startingSun: 150,
    skySunIntervalMs: 5000,
    waves: [
      wave(3000, 1600, { basic: 4, conehead: 2 }),
      wave(5500, 1400, { basic: 3, conehead: 3 }),
      wave(6000, 1300, { buckethead: 2, conehead: 3 }),
      wave(6500, 1200, { basic: 4, conehead: 3, buckethead: 2 }),
      wave(7000, 1100, { basic: 5, conehead: 4 }),
      wave(7500, 1000, { buckethead: 3, conehead: 4, basic: 3 }),
      wave(10000, 800, { basic: 6, conehead: 5, buckethead: 4 }, true),
    ],
  },
];

export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(id: number): LevelDefinition {
  const index = Math.max(0, Math.min(LEVELS.length - 1, id - 1));
  return LEVELS[index];
}

/**
 * Plants the player owns when starting level `id`.
 *
 * Level 1 gives exactly one plant; each level cleared adds the next.
 */
export function plantsForLevel(id: number): PlantType[] {
  return SEED_ORDER.slice(0, Math.max(1, Math.min(SEED_ORDER.length, id)));
}

/**
 * The plant awarded for clearing level `id`, or `undefined` on the final level.
 */
export function rewardForLevel(id: number): PlantType | undefined {
  return SEED_ORDER[id];
}

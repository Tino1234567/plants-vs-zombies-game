import type { PlantDefinition, PlantType, ZombieDefinition, ZombieType } from './types';

/* -------------------------------------------------------------------------- */
/*  Rendering                                                                 */
/* -------------------------------------------------------------------------- */

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/* -------------------------------------------------------------------------- */
/*  Lawn grid                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The lawn is a 9x5 grid of tiles (like the original game).
 * `originX/originY` is the top-left corner of the grid in world space.
 */
export const GRID = {
  cols: 9,
  rows: 5,
  tileWidth: 110,
  tileHeight: 100,
  originX: 220,
  originY: 150,
} as const;

export const GRID_RIGHT = GRID.originX + GRID.cols * GRID.tileWidth; // 1210
export const GRID_BOTTOM = GRID.originY + GRID.rows * GRID.tileHeight; // 650

/* -------------------------------------------------------------------------- */
/*  Sun economy                                                               */
/* -------------------------------------------------------------------------- */

/** Value of a single sun (sky or sunflower). */
export const SKY_SUN_VALUE = 25;

/* -------------------------------------------------------------------------- */
/*  Balance                                                                   */
/* -------------------------------------------------------------------------- */

export const BALANCE = {
  /** Damage per second while a zombie chews a plant. */
  zombieEatDps: 45,

  peaDamage: 20,
  peaSpeed: 420,
  peashooterFireIntervalMs: 1400,

  sunflowerSunIntervalMs: 8000,
  sunflowerSunValue: 25,
} as const;

/* -------------------------------------------------------------------------- */
/*  Zombie catalogue                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Headgear absorbs damage before the body, and pops off when it breaks —
 * exactly like the original game's cone and bucket.
 */
export const ZOMBIE_DEFS: Record<ZombieType, ZombieDefinition> = {
  basic: { texture: 'zombie', hp: 100, armorHp: 0, speed: 22 },
  conehead: { texture: 'zombie-cone', hp: 100, armorHp: 150, speed: 21 },
  buckethead: { texture: 'zombie-bucket', hp: 100, armorHp: 430, speed: 20 },
};

/** Texture a zombie drops back to once its headgear is gone. */
export const ZOMBIE_BARE_TEXTURE = 'zombie';

/* -------------------------------------------------------------------------- */
/*  Plant catalogue                                                           */
/* -------------------------------------------------------------------------- */

export const PLANT_DEFS: Record<PlantType, PlantDefinition> = {
  sunflower: {
    type: 'sunflower',
    label: 'Sunflower',
    cost: 50,
    cooldownMs: 5000,
    texture: 'sunflower',
    maxHp: 300,
    description:
      'Generates extra sun. Plant these first — every other plant depends on them.',
  },

  peashooter: {
    type: 'peashooter',
    label: 'Peashooter',
    cost: 100,
    cooldownMs: 5000,
    texture: 'peashooter',
    maxHp: 300,
    description: 'Your basic attacker. Fires a single pea down its own lane.',
    lanes: [0],
    peasPerVolley: 1,
    damage: 20,
    fireIntervalMs: 1400,
  },

  wallnut: {
    type: 'wallnut',
    label: 'Wall-nut',
    cost: 50,
    cooldownMs: 20000,
    texture: 'wallnut',
    maxHp: 2000,
    description:
      'A tough shell with 2000 HP. No attack, but it buys your shooters time.',
  },

  potatomine: {
    type: 'potatomine',
    label: 'Potato Mine',
    cost: 25,
    cooldownMs: 20000,
    texture: 'potatomine',
    maxHp: 300,
    description:
      'Cheap and patient. Arms in 4 seconds, then destroys the first zombie to step on it.',
    // Arms after four seconds, then blows up the first zombie to step on it.
    fuseMs: 4000,
    blast: { radius: 90, damage: 1800 },
  },

  snowpea: {
    type: 'snowpea',
    label: 'Snow Pea',
    cost: 175,
    cooldownMs: 5000,
    texture: 'snowpea',
    maxHp: 300,
    description:
      'Fires frozen peas that halve a zombie\u2019s walking speed for 3 seconds.',
    projectile: 'icepea',
    lanes: [0],
    peasPerVolley: 1,
    damage: 20,
    fireIntervalMs: 1400,
    slow: { factor: 0.5, durationMs: 3000 },
  },

  repeater: {
    type: 'repeater',
    label: 'Repeater',
    cost: 200,
    cooldownMs: 6000,
    texture: 'repeater',
    maxHp: 300,
    description: 'Fires two peas per volley, doubling the damage of a Peashooter.',
    lanes: [0],
    peasPerVolley: 2,
    damage: 20,
    fireIntervalMs: 1400,
  },

  threepeater: {
    type: 'threepeater',
    label: 'Threepeater',
    cost: 325,
    cooldownMs: 8000,
    texture: 'threepeater',
    maxHp: 300,
    description:
      'Fires into its own row and the rows above and below. Best planted in the middle lane.',
    lanes: [-1, 0, 1],
    peasPerVolley: 1,
    damage: 20,
    fireIntervalMs: 1600,
  },

  cherrybomb: {
    type: 'cherrybomb',
    label: 'Cherry Bomb',
    cost: 150,
    cooldownMs: 25000,
    texture: 'cherrybomb',
    maxHp: 300,
    description:
      'Explodes shortly after planting, destroying every zombie in the surrounding 3x3 tiles.',
    fuseMs: 1200,
    blast: { radius: 170, damage: 1800 },
  },
};

/**
 * The canonical plant order: **both** the order plants are unlocked and the
 * order they appear in the almanac. Mirrors the original Day levels — you start
 * with a Peashooter and earn one new plant per level.
 */
export const SEED_ORDER: PlantType[] = [
  'peashooter',
  'sunflower',
  'cherrybomb',
  'wallnut',
  'potatomine',
  'snowpea',
  'repeater',
  'threepeater',
];

/** How many seeds fit in the seed bank (the original's Day levels allow six). */
export const SEED_SLOTS = 6;

/* -------------------------------------------------------------------------- */
/*  Depth ordering                                                            */
/* -------------------------------------------------------------------------- */

export const DEPTH = {
  lawn: 0,
  /** Cell preview drawn while a seed is being dragged or armed. */
  dropHighlight: 5,
  plants: 10,
  peas: 15,
  zombies: 20,
  /** Explosion rings and bursts. */
  effects: 30,
  sun: 40,
  ui: 100,
  banner: 200,
  /** Ghost sprite that follows the pointer while dragging a seed. */
  dragGhost: 300,
} as const;

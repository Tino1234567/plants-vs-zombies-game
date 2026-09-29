# Plants vs. Zombies — Phaser 3 + TypeScript starter

A **lane-defense game** in the spirit of *Plants vs. Zombies*. This is a complete,
runnable skeleton with a working playable slice, clean architecture and clear
extension points.

Built with **Phaser 3**, **TypeScript** and **Vite**.

---

## Quick start

From the `plants-vs-zombies` folder:

```bash
npm install
npm run dev
```

Then open the printed URL (defaults to <http://localhost:5173>).

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check, then produce a production bundle in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only, no build |

> **Tip:** open the `plants-vs-zombies` folder directly in VS Code so the
> included `.vscode/launch.json` works — press **F5** to debug the running game
> in Chrome with source maps and breakpoints.

---

## Controls

### Menus

| Input | Action |
| --- | --- |
| Up / Down (or `W` / `S`) | Move the selection |
| Enter / Space | Activate the selected button |
| Left / Right | Adjust a value (volume steppers) |
| `M` | Toggle the background music |
| `ESC` / Backspace | Back to the menu from any sub-screen |
### Playing

| Input | Action |
| --- | --- |
| **Drag a seed card onto the lawn** | Plant it where you drop. The outline is green for a valid cell, red for a blocked one |
| **Press `1`–`8`** | Arm that seed instantly, then click a lawn cell |
| Click a seed card, then click a lawn cell | Alternative click-to-plant path |
| Left click a sun | Collect it |
| Right click or `ESC` | Cancel the current selection |
| `R` | Restart after win/lose |
| `M` | Back to the main menu |

> The IDE's embedded browser can swallow the physical `ESC` key. Backspace and
the on-screen **Back** buttons always work; `ESC` works in a normal browser.

---

## What already works

- 9 × 5 lawn grid with tile-accurate placement
- **Adventure mode: 8 levels** (`1-1` … `1-8`) with their own wave tables, plus a
  level map that tracks what you have cleared
- **Plant unlocking** — you begin with a *single Peashooter* and earn one new
  plant per level cleared, exactly like the original's Day 1
- **"Choose your seeds"** loadout screen before each level, six slots, remembered
- **Zombie variants** — cone-heads (1-3+) and bucket-heads (1-5+). Headgear
  absorbs damage and visibly pops off when it breaks
- **Flag waves** on 1-5 and 1-8 announce a *huge wave*
- **Front end**: main menu, level map, seed chooser, reward screen, Collection
  (almanac), Settings and How to Play, all navigable by mouse or keyboard
- **Music and sound effects** — a two-voice background loop plus ~10 synthesised
  sound effects, generated with the Web Audio API at runtime (**still no audio
  files to ship**)
- **Persisted settings and stats** (localStorage): music/SFX toggles, two volume
  levels, lawn grid guides, best wave and win count
- **Eight plants** (see the table below) driven entirely from `PLANT_DEFS`
- **Three ways to plant** — drag & drop (with a ghost preview and a green/red
  cell outline), click a card then click a cell, or press `1`–`8`
- Seed bank laid out as two rows of four, with sun cost, hotkey label, recharge
  overlay and affordability dimming
- **Zombie** — walks a lane, stops to chew plants, takes pea damage, dies
- **Snow Pea** chills zombies (half speed, and it fires visibly **blue ice peas**)
- **Wall-nut** visibly cracks through three damage states
- **Cherry Bomb** / **Potato Mine** blast a radius and destroy themselves
- Falling "sky sun" on a timer
- Wave manager that gets harder each wave (more, tougher, faster zombies)
- Win after 5 waves, lose if a zombie reaches the house, `R` to restart
- HUD: sun counter, wave counter, control hints
- Procedurally generated placeholder art — **no asset files required**

### Plant roster

Plants unlock in this order — one per level cleared. Level `1-1` gives you only
the Peashooter; clearing `1-1` awards the Sunflower, and so on.

| Key | Plant | Cost | HP | Unlocked by | What it does |
| --- | --- | --- | --- | --- | --- |
| `1` | Peashooter | 100 | 300 | start | One 20-damage pea down its lane |
| `2` | Sunflower | 50 | 300 | clear `1-1` | Produces 25 sun every 8s |
| `3` | Cherry Bomb | 150 | — | clear `1-2` | 1.2s fuse, then a 3×3 blast |
| `4` | Wall-nut | 50 | **2000** | clear `1-3` | Pure blocker; cracks as it takes damage |
| `5` | Potato Mine | 25 | 300 | clear `1-4` | Arms in 4s, then blows up the first zombie on its tile |
| `6` | Snow Pea | 175 | 300 | clear `1-5` | Blue ice pea that halves the target's speed for 3s |
| `7` | Repeater | 200 | 300 | clear `1-6` | Two peas per volley |
| `8` | Threepeater | 325 | 300 | clear `1-7` | Fires into its own row and the rows above/below |

### Level table

| Level | Waves | Starting sun | New zombie | Reward |
| --- | --- | --- | --- | --- |
| `1-1` | 3 | 100 | — | Sunflower |
| `1-2` | 3 | 75 | — | Cherry Bomb |
| `1-3` | 3 | 75 | cone-head | Wall-nut |
| `1-4` | 4 | 100 | — | Potato Mine |
| `1-5` | 5 **(flag)** | 100 | bucket-head | Snow Pea |
| `1-6` | 5 | 125 | — | Repeater |
| `1-7` | 6 **(flag)** | 125 | — | Threepeater |
| `1-8` | 7 **(flag)** | 150 | — | — (Day 1 complete) |

---

## Project structure

```
plants-vs-zombies/
├── index.html                # Vite entry point + page styles
├── vite.config.ts
├── tsconfig.json
├── public/                   # Static files served as-is
├── assets/                   # Your source art/audio (not bundled automatically)
│   ├── images/
│   └── audio/
└── src/
    ├── main.ts               # Phaser game config + bootstrap
    ├── constants.ts          # Grid, economy, plant + zombie catalogues
    ├── levels.ts             # The 8 adventure levels and unlock rules
    ├── types/
    │   └── index.ts          # Shared types + GameContext
    ├── audio/
    │   └── AudioManager.ts   # Procedural BGM loop + synthesised SFX
    ├── state/
    │   ├── settings.ts       # Persisted options (music, volumes, grid)
    │   └── progress.ts       # Persisted stats (best wave, wins, games)
    ├── scenes/
    │   ├── PreloadScene.ts   # Generates textures (swap for real loading)
    │   ├── MainMenuScene.ts  # Title, menu buttons, music toggle, progress
    │   ├── LevelSelectScene.ts# Adventure level map
    │   ├── SeedSelectScene.ts# "Choose your seeds" loadout
    │   ├── GameScene.ts      # The lawn: input, update loop, end conditions
    │   ├── RewardScene.ts    # "You got a new plant!"
    │   ├── CollectionScene.ts# Almanac: every plant + stats + description
    │   ├── SettingsScene.ts  # Toggles, volume steppers, reset
    │   └── HelpScene.ts      # How to play
    ├── entities/
    │   ├── Plant.ts          # Abstract base: hp, damage, death
    │   ├── Shooter.ts        # Data-driven pea shooter (4 plants use this)
    │   ├── Sunflower.ts
    │   ├── Peashooter.ts     # Thin subclasses of Shooter
    │   ├── SnowPea.ts
    │   ├── Repeater.ts
    │   ├── Threepeater.ts
    │   ├── WallNut.ts        # Blocker with three damage states
    │   ├── CherryBomb.ts     # One-shot 3x3 blast
    │   ├── PotatoMine.ts     # Arms, then blasts on contact
    │   ├── createPlant.ts    # PlantType -> class registry
    │   ├── Zombie.ts
    │   └── Sun.ts            # Collectible
    ├── utils/
    │   └── explosion.ts      # Radius damage + burst visuals
    ├── managers/
    │   ├── GridManager.ts    # Cell <-> world maths + occupancy
    │   ├── ResourceManager.ts# Sun economy
    │   └── WaveManager.ts    # Wave pacing and spawning
    └── ui/
        ├── Button.ts         # Menu button: hover / press / keyboard focus
        ├── SeedBank.ts       # Two rows of cards, cooldowns, drag source
        └── Hud.ts            # Sun / wave / hints
```

### Architectural ideas worth keeping

- **`GridManager` is the single source of truth** for the lawn. Nothing else
  computes tile positions by hand.
- **Zombies do not use physics overlap to eat.** They ask the grid what is in
  the cell they are standing in. Cheap, deterministic, no tunneling bugs.
- **Physics is only used for peas vs. zombies** — the one place a projectile
  genuinely needs collision.
- **Drag feedback is driven from the update loop**, not from `pointermove`
  events. Reading the live pointer each frame keeps the ghost exactly under the
  cursor (Phaser's `drag` event reports the previous position).
- **`input.dragDistanceThreshold` is set to 12px** so a plain click stays a
  click and only a deliberate movement starts a drag.
- **A drag that does not land does not punish you.** Dropping on a blocked cell
  or off the lawn leaves the seed armed, so a click that drifted a few pixels
  still behaves like the click you meant.
- **Balance is centralized in `constants.ts`.** Change `BALANCE` and the whole
  game re-tunes.
- **Entities are data-driven** from `PLANT_DEFS`. A whole family can share one
  class: `Shooter` covers Peashooter, Snow Pea, Repeater and Threepeater, which
  differ only in `lanes` / `peasPerVolley` / `damage` / `fireIntervalMs` / `slow`.
- **Audio is synthesised, not loaded.** `AudioManager` schedules a bass + arpeggio
  loop with the standard Web Audio look-ahead pattern. Adding a sound is one
  `case` in `sfx()`; there is nothing to download or license.

---

## Menus, persistence and audio

Four front-end scenes sit in front of the game:

| Scene | Key | Contents |
| --- | --- | --- |
| `MainMenuScene` | `menu` | Adventure, Collection, Settings, How to Play, Quit, music toggle, progress |
| `LevelSelectScene` | `levels` | The level map: cleared / next / locked, with each level's plant reward |
| `SeedSelectScene` | `seeds` | "Choose your seeds" — six slots, saved per level |
| `GameScene` | `game` | The lawn |
| `RewardScene` | `reward` | "You got a new plant!" and the route to the next level |
| `CollectionScene` | `collection` | Almanac: all 8 plants, locked ones greyed with their unlock level |
| `SettingsScene` | `settings` | Music/SFX toggles, volume steppers, grid guides, reset |
| `HelpScene` | `help` | How to play, plus suggested plant combos |

### Where levels live

`src/levels.ts` is the single source of truth:

```ts
LEVELS: LevelDefinition[]      // 8 levels: name, title, blurb, startingSun, skySunIntervalMs, waves
WaveDefinition                 // delayMs, gapMs, zombies: { basic: 2, conehead: 1, flag? }
SEED_ORDER (constants.ts)      // the unlock order — level N gives SEED_ORDER[0..N-1]
rewardForLevel(id)             // SEED_ORDER[id]
plantsForLevel(id)             // SEED_ORDER.slice(0, id)
```

To add a level: append a `LevelDefinition`. Everything else (unlock gating,
rewards, the map) derives from `SEED_ORDER` and `highestCompleted`, so there is
nothing else to wire up. To add a zombie variant: add it to `ZombieType`, give it
an entry in `ZOMBIE_DEFS` (hp / armour / speed / texture), draw its texture, then
reference it from a wave.

### Persistence

Two tiny stores wrap `localStorage` and emit `changed` events:

- `state/settings.ts` → `pvz.settings.v1` (music, volumes, `showGrid`)
- `state/progress.ts` → `pvz.progress.v1` (best wave, wins, games)

Both fall back to in-memory defaults if storage is unavailable (private mode).

### Audio

`audio/AudioManager.ts` builds everything from oscillators:

- **Music** — a 16-step A-minor-pentatonic arpeggio over a triangle-wave bass,
  104 BPM, scheduled ~150ms ahead so it never stutters.
- **SFX** — `click`, `plant`, `sun`, `shoot`, `error`, `explode`, `zombieDie`,
  `win`, `lose`, `unlock`. `shoot` is rate-limited and quiet because peas fire
  constantly.

Browsers block audio until the player interacts, so `audio.unlock()` is called
from the first menu gesture. `settings` changes are pushed straight into the
audio buses, so the volume buttons take effect immediately.

---

## Adding a new plant

A pea-shooting plant needs **no new class at all** — it is pure data:

1. Add the type to `PlantType` in `src/types/index.ts`.
2. Add an entry to `PLANT_DEFS` and list it in `SEED_ORDER` (`src/constants.ts`).
   `lanes` / `peasPerVolley` / `damage` / `fireIntervalMs` / `slow` describe it.
3. Draw its texture in `PreloadScene.createTextures()`.
4. Register it in the `REGISTRY` map in `src/entities/createPlant.ts`.

A plant with new *behaviour* (like the Wall-nut or Cherry Bomb) also gets a
class in `src/entities/` extending `Plant` and implementing `onTick`.

Worked example — a plant that fires two peas into the row above:

```ts
firedup: {
  type: 'firedup', label: 'Firedup', cost: 250, cooldownMs: 7000,
  texture: 'firedup', maxHp: 300,
  lanes: [-1, 0], peasPerVolley: 2, damage: 25, fireIntervalMs: 1800,
},
```

## Adding a new zombie type

1. Extend `Zombie` (or parameterise it further via `ZombieOptions`).
2. Spawn it from `WaveManager.spawnZombie()` based on the current wave.

## Replacing the placeholder art

`PreloadScene` draws everything with `Phaser.Graphics`. To use real sprites:

1. Drop PNGs (or an atlas) into `assets/images/`.
2. In `PreloadScene.preload()`, load them, e.g.
   ```ts
   this.load.setPath('assets/images');
   this.load.image('peashooter', 'peashooter.png');
   ```
   (Vite needs to see the files at build time — either put them in `public/`
   and reference `/images/...`, or `import` them as URLs.)
3. Delete the matching `generateTexture` block, keeping the same texture **key**
   so no other code changes.

---

## Roadmap ideas

- [x] Wall-nut, Cherry Bomb, Snow Pea, Repeater, Threepeater, Potato Mine
- [x] Start screen, almanac, settings, help, procedural music + SFX
- [x] Adventure levels, level map, plant unlocks, seed loadouts, cone/bucket zombies
- [ ] Shovel tool to remove plants
- [ ] Lawn mowers in the leftmost column
- [ ] World 2 with night levels (mushrooms), plus pole-vaulting / newspaper zombies
- [ ] Chomper / Torchwood (Torchwood needs peas to carry a "burning" flag)
- [ ] Sun auto-collect toggle and a per-level high-score board
- [ ] Real music/audio files in place of the generated ones (`assets/audio/`)
- [ ] Mobile touch support (already works via pointer input, needs UI scaling)

---

## Notes

- Phaser is bundled by Vite, so there is no CDN or global script tag needed.
- `scale.mode = FIT` keeps the 1280×720 playfield letterboxed on any screen.
- Everything is destroyed and rebuilt on `scene.restart()`, so pressing `R` is safe.

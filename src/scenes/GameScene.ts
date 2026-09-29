import Phaser from 'phaser';
import { audio } from '../audio/AudioManager';
import {
  BALANCE,
  DEPTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID,
  GRID_RIGHT,
  PLANT_DEFS,
  SKY_SUN_VALUE,
} from '../constants';
import { createPlant } from '../entities/createPlant';
import type { Plant } from '../entities/Plant';
import { Sun } from '../entities/Sun';
import type { Zombie } from '../entities/Zombie';
import { getLevel, type LevelDefinition } from '../levels';
import { GridManager } from '../managers/GridManager';
import { ResourceManager } from '../managers/ResourceManager';
import { WaveManager } from '../managers/WaveManager';
import { progress } from '../state/progress';
import { settings } from '../state/settings';
import type { GameContext, PlantType } from '../types';
import { Hud } from '../ui/Hud';
import { SeedBank } from '../ui/SeedBank';

export interface GameSceneData {
  levelId?: number;
  seeds?: PlantType[];
}

/**
 * The lawn. Owns the world, listens for player input and pumps every manager
 * and entity each frame.
 *
 * Everything level-specific (starting sun, sky-sun rate, wave table, seeds)
 * comes from the `LevelDefinition` passed in by the seed-select screen.
 */
export class GameScene extends Phaser.Scene {
  private grid!: GridManager;
  private resources!: ResourceManager;
  private waves!: WaveManager;
  private peas!: Phaser.Physics.Arcade.Group;
  private zombies!: Phaser.Physics.Arcade.Group;
  private seedBank!: SeedBank;
  private hud!: Hud;

  private ctx!: GameContext;
  private plants: Plant[] = [];

  private level!: LevelDefinition;
  private seeds: PlantType[] = [];

  private selected: PlantType | null = null;
  private draggingType: PlantType | null = null;
  private dragPointer?: Phaser.Input.Pointer;
  private dragGhost!: Phaser.GameObjects.Image;
  private dropHighlight!: Phaser.GameObjects.Rectangle;
  private skySunTimer = 0;
  private finished = false;

  constructor() {
    super('game');
  }

  init(data: GameSceneData): void {
    this.level = getLevel(data.levelId ?? 1);
    this.seeds = data.seeds && data.seeds.length > 0 ? [...data.seeds] : [...progress.unlockedPlants];
  }

  create(): void {
    this.plants = [];
    this.selected = null;
    this.draggingType = null;
    this.dragPointer = undefined;
    this.skySunTimer = 0;
    this.finished = false;

    this.drawBackground();

    this.grid = new GridManager();
    this.resources = new ResourceManager(this.level.startingSun);

    this.peas = this.physics.add.group({ allowGravity: false });
    this.zombies = this.physics.add.group();

    this.ctx = {
      scene: this,
      grid: this.grid,
      resources: this.resources,
      peas: this.peas,
      zombies: this.zombies,
      spawnSun: (x, y) => this.spawnSun(x, y),
    };

    this.physics.add.overlap(this.peas, this.zombies, (peaObj, zombieObj) => {
      const pea = peaObj as unknown as Phaser.Physics.Arcade.Image;
      const zombie = zombieObj as unknown as Zombie;

      if (!pea.active || !zombie.active || zombie.isDead) return;

      zombie.takeDamage((pea.getData('damage') as number | undefined) ?? BALANCE.peaDamage);

      const slowMs = pea.getData('slowMs') as number | undefined;
      if (slowMs) {
        zombie.applySlow((pea.getData('slowFactor') as number | undefined) ?? 0.5, slowMs);
      }

      pea.destroy();
    });

    this.seedBank = new SeedBank(this, this.resources, this.seeds);
    this.seedBank.on('select', (type: PlantType | null) => {
      this.selected = type;
    });
    this.seedBank.on('dragstart', (type: PlantType, pointer: Phaser.Input.Pointer) => {
      this.beginDrag(type, pointer);
    });
    this.seedBank.on('dragend', (_type: PlantType, pointer: Phaser.Input.Pointer) => {
      this.endDrag(pointer);
    });

    // A small movement threshold keeps a plain click a click, while a
    // deliberate drag starts the moment the pointer really moves. 12px is
    // comfortably above hand jitter so clicking a seed never turns into a drag.
    this.input.dragDistanceThreshold = 12;

    this.hud = new Hud(this, this.resources, this.level);

    // Drag feedback: a translucent copy of the plant under the pointer, plus a
    // coloured outline on the cell it would land in.
    this.dragGhost = this.add
      .image(0, 0, PLANT_DEFS.sunflower.texture)
      .setDepth(DEPTH.dragGhost)
      .setAlpha(0.75)
      .setVisible(false);

    this.dropHighlight = this.add
      .rectangle(0, 0, GRID.tileWidth - 10, GRID.tileHeight - 10, 0xffffff, 0.16)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(DEPTH.dropHighlight)
      .setVisible(false);

    this.waves = new WaveManager(this, this.zombies, this.grid, this.level, {
      onWaveStart: (wave, total, isFlag) => {
        this.hud.setWave(wave, total);
        if (isFlag) this.hud.announce('A HUGE WAVE IS APPROACHING!');
      },
      onComplete: () => this.win(),
    });

    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.keyboard?.on('keydown-ESC', () => this.deselect());
    this.input.keyboard?.on('keydown-R', () => {
      if (this.finished) this.scene.restart({ levelId: this.level.id, seeds: this.seeds });
    });
    this.input.keyboard?.on('keydown-M', () => this.scene.start('menu'));

    // Number keys arm a seed without moving the mouse. Press again to cancel.
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      const order = this.seedBank.seedOrder;
      if (!Number.isInteger(index) || index < 0 || index >= order.length) return;

      const type = order[index];
      if (!this.seedBank.isPlantable(type)) {
        this.seedBank.shakeCard(type);
        return;
      }

      this.seedBank.select(this.selected === type ? null : type);
    });

    this.waves.start();

    // Clean up listeners when the scene restarts so nothing accumulates.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.draggingType = null;
      this.dragPointer = undefined;
      this.resources.removeAllListeners();
      this.seedBank.removeAllListeners();
      this.input.removeAllListeners();
      this.input.keyboard?.removeAllListeners();
      this.waves.stop();
    });
  }

  override update(time: number, delta: number): void {
    if (this.finished) return;

    // Move the drag feedback with the live pointer rather than reacting to
    // every pointermove, so the ghost never trails behind the cursor.
    if (this.draggingType && this.dragPointer) {
      const { worldX, worldY } = this.dragPointer;
      this.dragGhost.setPosition(worldX, worldY);
      this.updateDropHighlight(worldX, worldY);
    } else if (this.selected) {
      // Seed armed by click or hotkey: show where it would land.
      const pointer = this.input.activePointer;
      this.updateDropHighlight(pointer.worldX, pointer.worldY);
    } else {
      this.dropHighlight.setVisible(false);
    }

    // Plants
    for (const plant of this.plants) {
      if (plant.active) plant.tick(delta);
    }
    if (this.plants.some((p) => !p.active)) {
      this.plants = this.plants.filter((p) => p.active);
    }

    // Zombies
    this.zombies.getChildren().forEach((child) => {
      const zombie = child as Zombie;
      if (zombie.active) zombie.tick(delta);
    });

    // Projectiles that left the screen
    this.peas.getChildren().forEach((child) => {
      const pea = child as Phaser.Physics.Arcade.Image;
      if (pea.active && pea.x > GAME_WIDTH + 60) pea.destroy();
    });

    // Falling sun
    this.skySunTimer += delta;
    if (this.skySunTimer >= this.level.skySunIntervalMs) {
      this.skySunTimer = 0;
      const col = Phaser.Math.Between(0, GRID.cols - 1);
      this.spawnSun(
        GRID.originX + col * GRID.tileWidth + GRID.tileWidth / 2,
        GRID.originY - 40,
      );
    }

    this.waves.update(delta);
    this.seedBank.update(time);

    this.checkForLoss();
  }

  /* ------------------------------------------------------------------ */
  /*  Input                                                              */
  /* ------------------------------------------------------------------ */

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.finished) return;

    if (pointer.rightButtonDown()) {
      this.deselect();
      return;
    }

    // Don't plant when the player is really clicking a sun.
    const hits = this.input.hitTestPointer(pointer);
    if (hits.some((obj) => obj instanceof Sun)) return;

    if (!this.selected) return;

    const col = this.grid.worldToCol(pointer.worldX);
    const row = this.grid.worldToRow(pointer.worldY);

    if (!this.grid.isInside(col, row)) {
      this.deselect();
      return;
    }

    if (this.tryPlant(this.selected, col, row)) {
      this.deselect();
    }
  }

  private deselect(): void {
    this.seedBank.clearSelection();
  }

  /* ------------------------------------------------------------------ */
  /*  Drag & drop planting                                               */
  /* ------------------------------------------------------------------ */

  private beginDrag(type: PlantType, pointer: Phaser.Input.Pointer): void {
    if (this.finished) return;

    this.draggingType = type;
    this.dragPointer = pointer;
    this.dragGhost.setTexture(PLANT_DEFS[type].texture).setVisible(true);
  }

  private endDrag(pointer: Phaser.Input.Pointer): void {
    const type = this.draggingType;

    this.draggingType = null;
    this.dragPointer = undefined;
    this.dragGhost.setVisible(false);

    if (!type || this.finished) return;

    const planted = this.tryPlant(
      type,
      this.grid.worldToCol(pointer.worldX),
      this.grid.worldToRow(pointer.worldY),
    );

    if (planted) {
      this.deselect();
    } else {
      // The drag did not land. Keep the seed armed so a click that drifted a
      // few pixels (and so became a drag) still behaves like the click the
      // player intended, and so a mis-drop does not leave them with nothing.
      this.seedBank.select(type);
    }
  }

  /** Outlines the cell under the pointer: green when plantable, red when not. */
  private updateDropHighlight(x: number, y: number): void {
    const col = this.grid.worldToCol(x);
    const row = this.grid.worldToRow(y);

    if (!this.grid.isInside(col, row)) {
      this.dropHighlight.setVisible(false);
      return;
    }

    const color = this.grid.getPlant(col, row) ? 0xff6b6b : 0x7cff6b;
    const centre = this.grid.cellToWorld(col, row);

    this.dropHighlight
      .setPosition(centre.x, centre.y)
      .setFillStyle(color, 0.16)
      .setStrokeStyle(3, color, 0.9)
      .setVisible(true);
  }

  /* ------------------------------------------------------------------ */
  /*  World helpers                                                      */
  /* ------------------------------------------------------------------ */

  /** Builds a plant via the registry and registers it on the lawn. */
  private spawnPlant(type: PlantType, col: number, row: number): Plant {
    const plant = createPlant(this.ctx, type, col, row);

    this.grid.setPlant(col, row, plant);
    this.plants.push(plant);

    return plant;
  }

  /**
   * Plants `type` at `col`/`row` when the cell is free and the seed is
   * affordable. Returns `true` only when a plant was actually placed, so
   * callers can decide whether to clear the current selection.
   */
  private tryPlant(type: PlantType, col: number, row: number): boolean {
    if (!this.grid.isInside(col, row)) return false;
    if (this.grid.getPlant(col, row)) return false;

    if (!this.resources.spend(PLANT_DEFS[type].cost)) return false;

    this.spawnPlant(type, col, row);
    this.seedBank.startCooldown(type);
    audio.sfx('plant');

    return true;
  }

  private spawnSun(x: number, y: number): void {
    // eslint-disable-next-line no-new
    new Sun(this, x, y, SKY_SUN_VALUE, (value) => this.resources.add(value));
  }

  private drawBackground(): void {
    const g = this.add.graphics().setDepth(DEPTH.lawn);

    // Base ground
    g.fillStyle(0x1b2a1b, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Alternating lawn stripes
    for (let row = 0; row < GRID.rows; row += 1) {
      g.fillStyle(row % 2 === 0 ? 0x3f8f3a : 0x367f31, 1);
      g.fillRect(
        GRID.originX,
        GRID.originY + row * GRID.tileHeight,
        GRID.cols * GRID.tileWidth,
        GRID.tileHeight,
      );
    }

    // Tile guides (can be switched off in Settings).
    if (settings.current.showGrid) {
      g.lineStyle(1, 0x2c6b28, 0.5);
      for (let col = 0; col <= GRID.cols; col += 1) {
        const x = GRID.originX + col * GRID.tileWidth;
        g.lineBetween(x, GRID.originY, x, GRID.originY + GRID.rows * GRID.tileHeight);
      }
      for (let row = 0; row <= GRID.rows; row += 1) {
        const y = GRID.originY + row * GRID.tileHeight;
        g.lineBetween(GRID.originX, y, GRID_RIGHT, y);
      }
    }

    // House / porch on the left
    g.fillStyle(0x6b4a2a, 1);
    g.fillRect(0, GRID.originY, GRID.originX, GRID.rows * GRID.tileHeight);
    g.fillStyle(0x825c35, 1);
    g.fillRect(0, GRID.originY, GRID.originX - 16, 14);

    // Road on the right, where zombies come from
    g.fillStyle(0x2a2a2f, 1);
    g.fillRect(GRID_RIGHT, 0, GAME_WIDTH - GRID_RIGHT, GAME_HEIGHT);
  }

  /* ------------------------------------------------------------------ */
  /*  End conditions                                                     */
  /* ------------------------------------------------------------------ */

  private checkForLoss(): void {
    for (const child of this.zombies.getChildren()) {
      const zombie = child as Zombie;
      if (zombie.active && !zombie.isDead && zombie.x < GRID.originX - 40) {
        this.lose();
        return;
      }
    }
  }

  private lose(): void {
    if (this.finished) return;
    this.finished = true;
    this.waves.stop();

    progress.recordAttempt(this.waves.currentWave);
    audio.sfx('lose');

    this.showBanner(
      'GAME OVER',
      '#ff6b6b',
      'The zombies ate your brains!   R to retry  \u00b7  M for the menu',
    );
  }

  private win(): void {
    if (this.finished) return;
    this.finished = true;

    const firstClear = progress.completeLevel(this.level.id, this.waves.totalWaves);
    audio.sfx('win');

    // Let the victory sound land before handing over to the reward screen.
    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('reward', { levelId: this.level.id, firstClear });
      });
    });

    this.showBanner(
      'LEVEL COMPLETE!',
      '#9ff07a',
      `${this.level.name} cleared \u2014 all ${this.waves.totalWaves} waves survived.`,
    );
  }

  private showBanner(title: string, color: string, subtitle: string): void {
    this.add
      .rectangle(0, GAME_HEIGHT / 2 - 90, GAME_WIDTH, 180, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setDepth(DEPTH.banner);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, title, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '58px',
        color,
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.banner);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, subtitle, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.banner);
  }
}

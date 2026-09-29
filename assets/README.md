# Source art goes here (PNG, atlas, SVG...).

These files are NOT bundled automatically. Either:

- copy the ones you need into `public/images/` and reference them as
  `/images/name.png`, or
- `import peashooterUrl from '../../assets/images/peashooter.png'` in a scene
  and load it with `this.load.image('peashooter', peashooterUrl)`.

Keep the texture keys used by `src/scenes/PreloadScene.ts`
(`peashooter`, `sunflower`, `zombie`, `pea`, `sun`) so no other code changes.

Put a `.gitkeep` in each subfolder so git tracks them while empty.

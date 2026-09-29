# Audio goes here (.mp3 / .ogg / .wav).

Load in `PreloadScene.preload()`:

```ts
this.load.audio('pea-shoot', ['assets/audio/pea-shoot.ogg', 'assets/audio/pea-shoot.mp3']);
```

Then `this.sound.play('pea-shoot')`.

Most browsers block audio until the player interacts — since the menu requires a
click to start, you are already fine.

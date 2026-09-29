Files in this folder are copied to the build output as-is and served from the
site root (`/`).

Use it for static assets that should never be processed by Vite, e.g.:

- `public/images/peashooter.png` -> load with `this.load.image('peashooter', 'images/peashooter.png')`
- `public/favicon.ico`

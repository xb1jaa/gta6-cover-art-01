[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/xb1jaa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard)
[![reward](https://make.fun/badge/gta6-cover-art-01/xb1jaa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard)

# Vice Cover Studio

An offline web app that turns a photo and a caption into GTA 6-style cover art — the multi-panel poster look with bold caption lettering and a Vice City sunset or neon colour grade — exported as a PNG to share.

Built for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on [make.fun](https://make.fun).

## What it does

- **Any photo**: load your own photos from your machine, one per panel, or fill several panels with one photo. Nothing is uploaded — everything runs in your browser.
- **Crop and position**: pick a panel, drag its photo to move it, scroll to zoom it.
- **Four layouts**: Hero + 3, Four Square, Full Bleed, and Tilted Stack.
- **Four colour grades**: Vice Sunset, Neon Nights, Gold Hour, Midnight.
- **Three letterings**: Block, Neon Script, Stencil.
- **Export PNG** in the common post sizes: 1080 × 1080, 1080 × 1350, and 1920 × 1080.

## Try it

Serve `app/` with any static file server and open `app/index.html` in a desktop browser:

```sh
cd app && python3 -m http.server 8080
```

Then open http://localhost:8080. A sample photo is loaded to start; swap in your own, pick a layout and a grade, write your caption, and export.

## How it works

- `app/index.html` + `app/style.css` — the editor (dark Vice theme).
- `app/src/cover.js` — the cover renderer: panel layouts, cover-fit photo placement with pan/zoom, gradient colour grades, halftone dots, vignette, and the title band, all drawn on canvas.
- `app/src/main.js` — editor wiring: photo inputs, drag/wheel controls, caption, export.
- `app/src/shots.js` — shot mode for screenshots (`?shot=cover` draws one exported cover full-frame; `?shot=editor` shows the editor with a sample photo).
- `app/samples/` — two sample photos made with an image model for make.fun, free to use.
- `main.ts` — the entry program (Node 22): copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the kit's `vendor/makefun-app.ts`.

## Originality

Everything here is our own design. No Rockstar Games logo, wordmark, official artwork, character, or font is used. Lettering uses system fonts only.

## License

MIT — see [LICENSE](LICENSE).

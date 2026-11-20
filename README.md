# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/xb1jaa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard)
[![reward](https://make.fun/badge/gta6-cover-art-01/xb1jaa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An entry for the [make.fun](https://make.fun) bounty [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).

A web app that turns a person's photo and a caption into cover art in the style
of GTA 6's posters — the multi-panel poster look, bold caption lettering and a
Vice City sunset or neon colour grade — and exports it as a PNG to share.

## What it does

- **Multi-panel covers** — four layouts (Hero + two, Four squares, Three
  strips, One photo), each panel filled with the person's own photo or several
  photos, or one photo across every panel.
- **Any photo** — load photos from the machine, then crop and position each
  panel by dragging on the cover, scrolling to zoom, or with the zoom/pan
  sliders. Two sample photos ship with the app so it works with no upload.
- **Caption** — editable title and subtitle, three lettering styles
  (Sunset gradient, Neon pink, Chrome white), top or bottom placement.
- **Colour grades** — Vice Sunset, Neon Night, Palm Dusk, Golden Hour, laid
  over every panel with a vignette.
- **Poster extras** — an outrun sun, a city skyline, palm silhouettes and
  halftone dots, each toggleable.
- **Fast export** — one click exports a PNG in 1080 × 1080, 1080 × 1350 or
  1920 × 1080.

## Run it

The app is plain static files under `app/` — no build step, no network
request. Serve it with any static server and open `app/index.html` in desktop
Chrome:

```sh
python3 -m http.server 8080 --directory app
# open http://localhost:8080
```

Everything runs offline in the browser; photos never leave the machine.

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — the cover engine: panel layouts, colour grades,
  poster decorations and caption lettering, all drawn on canvas.
- `app/src/main.js` — the editor wiring: uploads, drag-to-crop, export.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover`,
  `?shot=editor`).
- `app/samples/` — two sample photos, made for make.fun with an image model
  and free to use.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — the app with a photo loaded, and covers it exported.

## Originality

All art in this entry is original and drawn in code. No Rockstar Games logo,
official artwork, character or font is used.

## License

MIT — see [LICENSE](LICENSE).

# Icewind Dale Interactive Map

A static, GitHub Pages-ready interactive atlas for Icewind Dale. It uses Vite, React, TypeScript, Leaflet, and a local high-resolution map image rendered with `CRS.Simple`, so every marker is stored as an image-pixel coordinate from the top-left corner.

The source map in this repository was detected as `6000 x 4215` pixels and copied to `public/maps/icewind-dale.webp`. The original root image is preserved.

## Features

- Fullscreen pan/zoom Leaflet map using an `ImageOverlay`
- Clickable labeled markers with visible confidence styling
- Right-side lore panel on desktop and bottom drawer on mobile
- Search, category filters, and keyboard shortcut `/` to focus search
- Player-safe default mode with optional persisted `DM Notes`
- Deep links such as `#bryn-shander`
- Coordinate authoring mode via `?debug=1` or the `C` key
- Static build output deployable to GitHub Pages

## Local Setup

```bash
npm install
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173/`.

## Build

```bash
npm run build
```

The production artifact is written to `dist/` with `index.html` at the root.

## Preview

```bash
npm run preview
```

## Lint / Type Check

```bash
npm run lint
```

This runs TypeScript without emitting files.

## Deploy to GitHub Pages

The workflow at `.github/workflows/deploy.yml` builds and deploys the site when changes are pushed to `main`.

In your GitHub repository settings:

1. Open **Settings -> Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or run the workflow manually.

`vite.config.ts` uses `GITHUB_REPOSITORY` in Actions to set the correct base path for project pages, for example `https://<username>.github.io/<repo>/`.

## Editing Markers

All marker content lives in `src/data/locations.ts`. Coordinates are raw image pixels:

```ts
{
  id: "new-location",
  name: "New Location",
  category: "Rime of the Frostmaiden Locations",
  x: 2450,
  y: 1800,
  summary: "One sentence at a glance.",
  lore: "A compact player-safe lore paragraph.",
  hooks: ["A practical DM hook."],
  tags: ["rime", "spoiler"],
  sourceUrls: ["https://www.dndbeyond.com/sources/dnd/idrotf"],
  positionConfidence: "needs-review",
}
```

Use `?debug=1` or press `C` to show the current mouse coordinate. In debug mode, clicking the map copies/logs a coordinate snippet. More detail is in `docs/LOCATION_AUTHORING.md`.

## Lore Sources

The sidebar text is concise original writing, with source links attached per location. Primary references include D&D Beyond's official *Icewind Dale: Rime of the Frostmaiden* source page and Forgotten Realms Wiki overview/location pages.

# Icewind Dale Interactive Map

A static, GitHub Pages-ready interactive atlas for Icewind Dale. It uses Vite, React, TypeScript, Leaflet, and a local high-resolution map image rendered with `CRS.Simple`, so every marker is stored as an image-pixel coordinate from the top-left corner.

The actual displayed map is `public/maps/icewind-dale.webp`, detected as `6000 x 4215` pixels. The original root image is preserved. More detailed annotated maps should be stored only as non-runtime references under `docs/reference/`; they are used for chapter labels and marker refinement, not as the website background.

## Features

- Fullscreen pan/zoom Leaflet map using an `ImageOverlay`
- Lore-first sidebar with overview, history, notable features, adventure relevance, compact DM hooks, and sources
- Player-safe default mode with persisted `DM Notes`; DM Notes reveals adventure spoilers
- Diamond markers for DM/adventure locations
- Category, chapter, and player/DM visibility filters
- Quick presets for Ten-Towns and adventure locations
- Search across names, tags, chapters, lore, features, factions, and hooks
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

All marker content lives in `src/data/locations.ts`. Coordinates are raw pixels on the displayed `6000 x 4215` map:

```ts
{
  id: "new-location",
  name: "New Location",
  category: "Rime of the Frostmaiden Locations",
  x: 2450,
  y: 1800,
  isDmSpoiler: true,
  playerFacing: false,
  chapter: "Chapter 2",
  mapIconType: "adventure-diamond",
  summary: "A spoiler-light public summary.",
  lore: "Original player-safe lore.",
  history: "Regional or historical context.",
  notableFeatures: ["Ruined tower"],
  notablePeopleOrFactions: ["Arcane Brotherhood"],
  adventureRelevance: "Chapter-facing context, kept concise.",
  dmHooks: ["Netherese ruin"],
  dmNotes: "Hidden DM-only planning notes.",
  tags: ["rime", "chapter-2", "spoiler"],
  sourceUrls: ["https://www.dndbeyond.com/sources/dnd/idrotf"],
  positionConfidence: "reference-derived",
}
```

Use `?debug=1` or press `C` to show the current mouse coordinate. In debug mode, clicking the map copies/logs a coordinate snippet. More detail is in `docs/LOCATION_AUTHORING.md`.

## Reference Maps

The website must keep using `public/maps/icewind-dale.webp` as the runtime map. If you have a detailed annotated reference image with chapter labels or diamond adventure icons, place it in `docs/reference/` and use it only to refine data.

The current adventure coordinates marked `reference-derived` were scaled from a `2048 x 1368` reference-coordinate set and should be manually refined with debug mode against the displayed high-resolution map.

## Lore Sources

Sidebar text is original writing grounded in source links stored per location. Primary references include D&D Beyond's official *Icewind Dale: Rime of the Frostmaiden* source page and Forgotten Realms Wiki overview/location pages.

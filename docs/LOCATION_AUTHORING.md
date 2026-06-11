# Location Authoring

This map uses Leaflet with `CRS.Simple`. It is not a GIS map, and marker coordinates are not latitude/longitude. Every marker uses raw image pixels measured from the top-left corner of the source image.

## Image Dimensions

The map file used by the app is:

```text
public/maps/icewind-dale.webp
```

Detected dimensions:

```text
width: 6000 px
height: 4215 px
```

The initial seed coordinates were supplied for an approximate `2048 x 1438` version of the same map, then scaled into the detected `6000 x 4215` image. Future edits should use the debug mode and store the real displayed image coordinates directly.

## Debug Mode

Enable coordinate mode in either of these ways:

```text
http://localhost:5173/?debug=1
```

or press `C` while the map is focused.

In debug mode:

- the current mouse coordinate appears in a small readout
- clicking the map logs a marker snippet to the browser console
- when clipboard permissions allow it, the same snippet is copied automatically

## Coordinate Format

Locations live in `src/data/locations.ts`:

```ts
{
  id: "black-cabin",
  name: "Black Cabin",
  category: "Rime of the Frostmaiden Locations",
  x: 2021,
  y: 1724,
  summary: "A remote ruin where cold, faith, and dangerous invention meet.",
  lore: "Player-safe lore goes here.",
  hooks: ["A practical hook for the DM."],
  tags: ["rime", "ruin", "spoiler"],
  sourceUrls: ["https://www.dndbeyond.com/sources/dnd/idrotf"],
  positionConfidence: "approximate",
}
```

## Position Confidence

Use one of:

- `visible`: the label/place is visible on the map and the dot is placed on it
- `approximate`: the place is known or useful, but the exact point needs table/editor review
- `needs-review`: the marker is intentionally rough and should be refined before player-facing use

Approximate and needs-review markers are styled with dashed/dotted warning rings.

## Categories and Filters

Available categories are defined in `src/types/location.ts` and displayed from `src/data/categories.ts`.

For broad filters such as `Settlements`, `Dungeons / Ruins`, and `DM / Spoiler`, add useful tags too:

```ts
tags: ["settlement", "dungeon", "spoiler"]
```

The filter UI checks both categories and these special tags.

## Lore Guidelines

Keep public lore short and player-safe:

- one sentence summary
- one compact lore paragraph
- two to four DM hooks
- optional `dmNotes` for spoilers, hidden by default
- source links for every entry

Avoid copying long text from books, D&D Beyond, or wikis. Rewrite factual points in your own words.

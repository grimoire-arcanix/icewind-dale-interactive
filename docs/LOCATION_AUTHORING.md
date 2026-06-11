# Location Authoring

This map uses Leaflet with `CRS.Simple`. It is not a GIS map, and marker coordinates are not latitude/longitude. Every marker uses raw image pixels measured from the top-left corner of the displayed source image.

## Runtime Map vs Reference Images

The map file used by the app is:

```text
public/maps/icewind-dale.webp
```

Detected dimensions:

```text
width: 6000 px
height: 4215 px
```

Do not replace that runtime image with annotated reference maps. Store detailed reference images under:

```text
docs/reference/
```

Reference images may contain extra labels, chapter markers, and diamond adventure icons. Use them to improve `src/data/locations.ts`, then refine placement against the runtime map.

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

## Coordinate Confidence

Use one of:

- `visible`: the label/place is visible on the runtime map and the dot is placed on it
- `reference-derived`: the point was scaled from an annotated reference map and still needs runtime-map checking
- `approximate`: the place is known or useful, but the exact point needs table/editor review
- `needs-review`: the marker is intentionally rough and should be refined before player-facing use

Approximate, reference-derived, and needs-review markers are styled differently in the UI.

## Data Fields

Locations live in `src/data/locations.ts`:

```ts
{
  id: "black-cabin",
  name: "Black Cabin",
  category: "Rime of the Frostmaiden Locations",
  x: 2314,
  y: 1541,
  isDmSpoiler: true,
  playerFacing: false,
  chapter: "Chapter 2",
  mapIconType: "adventure-diamond",
  summary: "A lonely cabin ruin associated with dangerous faith and invention.",
  lore: "Player-safe lore goes here.",
  history: "Regional or historical context.",
  notableFeatures: ["Ruined cabin", "Remote ridge"],
  notablePeopleOrFactions: ["Lathander-linked faith"],
  adventureRelevance: "Concise chapter-facing relevance.",
  dmHooks: ["arcane weather anomaly"],
  dmNotes: "Hidden DM-only details.",
  tags: ["rime", "chapter-2", "spoiler"],
  sourceUrls: ["https://www.dndbeyond.com/sources/dnd/idrotf"],
  positionConfidence: "reference-derived",
}
```

### Spoiler Fields

`isDmSpoiler` controls whether a marker is hidden until DM Notes is enabled.

`playerFacing` marks entries whose sidebar text is safe for players by default. Towns, roads, lakes, rivers, and major geography should usually be `true`.

`chapter` is `"Chapter 1"` through `"Chapter 7"` or `null`. Use chapter metadata for Rime of the Frostmaiden structure, not for unrelated geography unless it is directly relevant.

`mapIconType` controls marker shape:

- `town`: town circle marker
- `geography`: subtle geography marker
- `road`: route-style marker
- `adventure-diamond`: DM/adventure diamond marker
- `ruin`, `dungeon`, `other`: fallback special markers

## Spoiler-Safe Writing

For player-facing entries:

- keep lore practical, regional, and spoiler-light
- describe pressure and reputation without revealing hidden villains
- avoid naming late-campaign locations unless the campaign has already revealed them

For DM spoiler entries:

- include a vague public summary
- put chapter mechanics, hidden factions, and major reveals in `dmNotes`
- keep `dmHooks` compact: examples include `duergar infiltration`, `lost treasure`, or `Netherese ruin`

## Sources

Every entry should include source URLs where possible. Use sources for factual grounding, then write original summaries in your own words. Do not paste long text from books, D&D Beyond, or wiki pages.

import type { LocationCategory } from "../types/location";

export const CATEGORY_FILTERS: LocationCategory[] = [
  "Ten-Towns",
  "Geography",
  "Roads & Trails",
  "Rime of the Frostmaiden Locations",
  "Settlements",
  "Dungeons / Ruins",
  "DM / Spoiler",
];

export const CATEGORY_CLASS: Record<LocationCategory, string> = {
  "Ten-Towns": "town",
  Geography: "geography",
  "Roads & Trails": "route",
  "Rime of the Frostmaiden Locations": "rime",
  Settlements: "settlement",
  "Dungeons / Ruins": "dungeon",
  "DM / Spoiler": "spoiler",
};

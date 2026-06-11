import type { LocationCategory, LocationChapter, MapIconType } from "../types/location";

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

export const CHAPTER_FILTERS: LocationChapter[] = [
  "Chapter 1",
  "Chapter 2",
  "Chapter 3",
  "Chapter 4",
  "Chapter 5",
  "Chapter 6",
  "Chapter 7",
];

export const MAP_ICON_CLASS: Record<MapIconType, string> = {
  town: "icon-town",
  geography: "icon-geography",
  road: "icon-road",
  "adventure-diamond": "icon-adventure-diamond",
  ruin: "icon-ruin",
  dungeon: "icon-dungeon",
  other: "icon-other",
};

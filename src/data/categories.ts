import type { LocationCategory, MapIconType } from "../types/location";

export const CATEGORY_CLASS: Record<LocationCategory, string> = {
  Town: "town",
  Geography: "geography",
  "Road / Trail": "route",
  River: "river",
  Lake: "lake",
  "Adventure Location": "rime",
  "Dungeon / Ruin": "dungeon",
  "Faction Site": "faction",
};

export const MAP_ICON_CLASS: Record<MapIconType, string> = {
  town: "icon-town",
  geography: "icon-geography",
  road: "icon-road",
  "adventure-diamond": "icon-adventure-diamond",
  ruin: "icon-ruin",
  dungeon: "icon-dungeon",
  other: "icon-other",
};

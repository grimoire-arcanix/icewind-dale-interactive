export type LocationCategory =
  | "Ten-Towns"
  | "Geography"
  | "Roads & Trails"
  | "Rime of the Frostmaiden Locations"
  | "Settlements"
  | "Dungeons / Ruins"
  | "DM / Spoiler";

export type LocationChapter =
  | "Chapter 1"
  | "Chapter 2"
  | "Chapter 3"
  | "Chapter 4"
  | "Chapter 5"
  | "Chapter 6"
  | "Chapter 7";

export type MapIconType =
  | "town"
  | "geography"
  | "road"
  | "adventure-diamond"
  | "ruin"
  | "dungeon"
  | "other";

export type PositionConfidence = "visible" | "reference-derived" | "approximate" | "needs-review";

export interface LocationEntry {
  id: string;
  name: string;
  category: LocationCategory;
  x: number;
  y: number;
  labelOffset?: {
    x: number;
    y: number;
  };
  isDmSpoiler: boolean;
  playerFacing: boolean;
  chapter: LocationChapter | null;
  mapIconType: MapIconType;
  summary: string;
  lore: string;
  history?: string;
  notableFeatures: string[];
  notablePeopleOrFactions: string[];
  adventureRelevance?: string;
  dmHooks: string[];
  dmNotes?: string;
  tags: string[];
  sourceUrls: string[];
  positionConfidence: PositionConfidence;
}

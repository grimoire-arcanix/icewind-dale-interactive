export type LocationCategory =
  | "Ten-Towns"
  | "Geography"
  | "Roads & Trails"
  | "Rime of the Frostmaiden Locations"
  | "Settlements"
  | "Dungeons / Ruins"
  | "DM / Spoiler";

export type PositionConfidence = "visible" | "approximate" | "needs-review";

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
  summary: string;
  lore: string;
  hooks: string[];
  dmNotes?: string;
  tags: string[];
  sourceUrls: string[];
  positionConfidence: PositionConfidence;
}

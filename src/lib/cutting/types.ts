export type GrainDirection = "free" | "fixed";

export interface CutPart {
  id: string;
  name: string;
  length: number;
  width: number;
  quantity: number;
  grain: GrainDirection;
}

export interface SheetSettings {
  sheetWidth: number;
  sheetHeight: number;
  kerf: number;
  trim: number;
  allowRotation: boolean;
}

export interface PlacedPart {
  partId: string;
  name: string;
  length: number;
  width: number;
  rotated: boolean;
  x: number;
  y: number;
  color: string;
  quantityIndex: number;
}

export interface SheetResult {
  index: number;
  width: number;
  height: number;
  parts: PlacedPart[];
  usedArea: number;
  wasteArea: number;
  wastePercent: number;
}

export interface UnplacedPart {
  partId: string;
  name: string;
  length: number;
  width: number;
  quantity: number;
  reason: string;
}

export interface OptimizeResult {
  sheets: SheetResult[];
  sheetCount: number;
  totalArea: number;
  usedArea: number;
  wasteArea: number;
  wastePercent: number;
  totalParts: number;
  placedParts: number;
  unplaced: UnplacedPart[];
  strategy: string;
  durationMs: number;
}

export interface OptimizeInput {
  parts: CutPart[];
  settings: SheetSettings;
}

export interface Project {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  name: string;
  parts: CutPart[];
  settings: SheetSettings;
  status: "draft" | "optimized";
  result: OptimizeResult | null;
  created_at: string;
  updated_at: string;
}

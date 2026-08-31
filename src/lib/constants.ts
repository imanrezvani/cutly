import type { SheetSettings } from "@/lib/cutting/types";

export interface StandardSheet {
  width: number;
  height: number;
  label: string;
}

export const STANDARD_SHEETS: StandardSheet[] = [
  { width: 2440, height: 1220, label: "۲۴۴۰ × ۱۲۲۰ (کابینت / ام‌دی‌اف)" },
  { width: 2800, height: 2070, label: "۲۸۰۰ × ۲۰۷۰ (ام‌دی‌اف بزرگ)" },
  { width: 3660, height: 1830, label: "۳۶۶۰ × ۱۸۳۰ (صفحه‌کار)" },
];

export const DEFAULT_SETTINGS: SheetSettings = {
  sheetWidth: 2440,
  sheetHeight: 1220,
  kerf: 3.5,
  trim: 10,
  allowRotation: true,
};

export const MIN_KERF = 0;
export const MAX_KERF = 30;
export const MIN_TRIM = 0;
export const MAX_TRIM = 100;
export const MIN_DIMENSION = 20;
export const MAX_DIMENSION = 10000;
export const MAX_PARTS = 300;

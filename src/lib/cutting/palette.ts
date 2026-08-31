export const SHEET_COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0d9488",
  "#db2777",
  "#4f46e5",
  "#ca8a04",
  "#0891b2",
  "#65a30d",
  "#c2410c",
  "#4338ca",
  "#be123c",
  "#475569",
  "#b45309",
  "#059669",
  "#9333ea",
];

export const KERF_LINE_COLOR = "rgba(15, 23, 42, 0.55)";

export function colorForIndex(index: number): string {
  return SHEET_COLORS[index % SHEET_COLORS.length];
}

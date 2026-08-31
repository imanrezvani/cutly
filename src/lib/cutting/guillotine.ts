import { colorForIndex } from "./palette";
import type {
  OptimizeInput,
  OptimizeResult,
  PlacedPart,
  SheetResult,
  UnplacedPart,
} from "./types";

interface Item {
  partId: string;
  name: string;
  length: number;
  width: number;
  grain: "free" | "fixed";
  effW: number;
  effH: number;
  quantityIndex: number;
}

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PlacedResult {
  partId: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  quantityIndex: number;
}

interface PackOutput {
  sheetResults: PlacedResult[][];
  unplacedItems: Item[];
}

type OrderKey = "area" | "longSide" | "perimeter" | "shortSide";

const ORDER_STRATEGIES: Array<{ key: OrderKey; label: string }> = [
  { key: "area", label: "مساحت نزولی" },
  { key: "longSide", label: "ضلع بلند نزولی" },
  { key: "perimeter", label: "محیط نزولی" },
  { key: "shortSide", label: "ضلع کوتاه نزولی" },
];

function sortItems(items: Item[], key: OrderKey): Item[] {
  const copy = [...items];
  const dim = (it: Item) => ({
    l: Math.max(it.length, it.width),
    s: Math.min(it.length, it.width),
  });
  switch (key) {
    case "area":
      return copy.sort((a, b) => b.length * b.width - a.length * a.width);
    case "longSide":
      return copy.sort((a, b) => dim(b).l - dim(a).l);
    case "perimeter":
      return copy.sort(
        (a, b) => 2 * (b.length + b.width) - 2 * (a.length + a.width)
      );
    case "shortSide":
      return copy.sort((a, b) => dim(b).s - dim(a).s);
  }
}

function subtractRect(freeRects: FreeRect[], placed: FreeRect): FreeRect[] {
  const next: FreeRect[] = [];
  for (const fr of freeRects) {
    if (
      placed.x >= fr.x + fr.w ||
      placed.x + placed.w <= fr.x ||
      placed.y >= fr.y + fr.h ||
      placed.y + placed.h <= fr.y
    ) {
      next.push(fr);
      continue;
    }
    if (placed.x > fr.x) {
      next.push({ x: fr.x, y: fr.y, w: placed.x - fr.x, h: fr.h });
    }
    const rightEdge = Math.min(placed.x + placed.w, fr.x + fr.w);
    if (rightEdge < fr.x + fr.w) {
      next.push({ x: rightEdge, y: fr.y, w: fr.x + fr.w - rightEdge, h: fr.h });
    }
    if (placed.y > fr.y) {
      next.push({ x: fr.x, y: fr.y, w: fr.w, h: placed.y - fr.y });
    }
    const bottomEdge = Math.min(placed.y + placed.h, fr.y + fr.h);
    if (bottomEdge < fr.y + fr.h) {
      next.push({ x: fr.x, y: bottomEdge, w: fr.w, h: fr.y + fr.h - bottomEdge });
    }
  }
  const merged: FreeRect[] = [];
  for (const r of next) {
    if (r.w <= 0 || r.h <= 0) continue;
    const contained = merged.some(
      (m) =>
        m.x <= r.x &&
        m.y <= r.y &&
        m.x + m.w >= r.x + r.w &&
        m.y + m.h >= r.y + r.h
    );
    if (!contained) merged.push(r);
  }
  return merged;
}

interface FitResult {
  x: number;
  y: number;
  effW: number;
  effH: number;
  rotated: boolean;
}

function canFit(item: Item, rect: FreeRect, allowRotation: boolean): FitResult | null {
  const plain =
    item.effW <= rect.w && item.effH <= rect.h
      ? { x: rect.x, y: rect.y, effW: item.effW, effH: item.effH, rotated: false }
      : null;
  const rot =
    allowRotation && item.grain === "free" && item.effH <= rect.w && item.effW <= rect.h
      ? { x: rect.x, y: rect.y, effW: item.effH, effH: item.effW, rotated: true }
      : null;

  if (!plain && !rot) return null;

  const candidates = [plain, rot].filter(Boolean) as FitResult[];
  candidates.sort((a, b) => {
    const scoreA = rect.w * rect.h - a.effW * a.effH;
    const scoreB = rect.w * rect.h - b.effW * b.effH;
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.effW - b.effW;
  });
  return candidates[0];
}

function packItems(
  items: Item[],
  sheetW: number,
  sheetH: number,
  allowRotation: boolean
): PackOutput {
  const sheetResults: PlacedResult[][] = [[]];
  const unplacedItems: Item[] = [];
  let freeRects: FreeRect[] = [{ x: 0, y: 0, w: sheetW, h: sheetH }];
  let currentSheet = 0;

  for (const item of items) {
    let placed = false;

    for (let s = currentSheet; s < sheetResults.length; s++) {
      if (s !== currentSheet) {
        freeRects = recomputeFree(sheetW, sheetH, sheetResults[s]);
        currentSheet = s;
      }

      let bestFit: { rect: FreeRect; fit: FitResult } | null = null;
      let bestScore = Infinity;
      for (const rect of freeRects) {
        const fit = canFit(item, rect, allowRotation);
        if (!fit) continue;
        const score = rect.w * rect.h - fit.effW * fit.effH;
        if (score < bestScore) {
          bestScore = score;
          bestFit = { rect, fit };
        }
      }

      if (bestFit) {
        const placedRect: FreeRect = {
          x: bestFit.fit.x,
          y: bestFit.fit.y,
          w: bestFit.fit.effW,
          h: bestFit.fit.effH,
        };
        freeRects = subtractRect(freeRects, placedRect);
        sheetResults[s].push({
          partId: item.partId,
          name: item.name,
          x: bestFit.fit.x,
          y: bestFit.fit.y,
          w: bestFit.fit.rotated ? item.width : item.length,
          h: bestFit.fit.rotated ? item.length : item.width,
          rotated: bestFit.fit.rotated,
          quantityIndex: item.quantityIndex,
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      const newSheet = sheetResults.length;
      sheetResults.push([]);
      freeRects = recomputeFree(sheetW, sheetH, []);
      currentSheet = newSheet;

      const fit = canFit(item, freeRects[0], allowRotation);
      if (!fit) {
        unplacedItems.push(item);
        continue;
      }
      freeRects = subtractRect(freeRects, {
        x: fit.x,
        y: fit.y,
        w: fit.effW,
        h: fit.effH,
      });
      sheetResults[newSheet].push({
        partId: item.partId,
        name: item.name,
        x: fit.x,
        y: fit.y,
        w: fit.rotated ? item.width : item.length,
        h: fit.rotated ? item.length : item.width,
        rotated: fit.rotated,
        quantityIndex: item.quantityIndex,
      });
    }
  }

  return { sheetResults, unplacedItems };
}

function recomputeFree(
  sheetW: number,
  sheetH: number,
  placed: PlacedResult[]
): FreeRect[] {
  let freeRects: FreeRect[] = [{ x: 0, y: 0, w: sheetW, h: sheetH }];
  for (const p of placed) {
    if (p.x < 0) continue;
    freeRects = subtractRect(freeRects, { x: p.x, y: p.y, w: p.w, h: p.h });
  }
  return freeRects;
}

function buildResult(
  items: Item[],
  sheetResults: PlacedResult[][],
  unplacedItems: Item[],
  strategyLabel: string,
  sheetW: number,
  sheetH: number,
  durationMs: number
): OptimizeResult {
  const validPlacements = sheetResults.flat().filter((p) => p.x >= 0);

  const colorMap = new Map<string, string>();
  const orderedIds: string[] = [];
  for (const p of validPlacements) {
    if (!orderedIds.includes(p.partId)) orderedIds.push(p.partId);
  }
  orderedIds.forEach((id, i) => colorMap.set(id, colorForIndex(i)));

  const sheets: SheetResult[] = [];
  let usedArea = 0;

  sheetResults.forEach((placedList, idx) => {
    const parts: PlacedPart[] = [];
    let sheetUsed = 0;
    for (const p of placedList) {
      if (p.x < 0) continue;
      usedArea += p.w * p.h;
      sheetUsed += p.w * p.h;
      parts.push({
        partId: p.partId,
        name: p.name,
        length: p.w,
        width: p.h,
        rotated: p.rotated,
        x: p.x,
        y: p.y,
        color: colorMap.get(p.partId) ?? "#94a3b8",
        quantityIndex: p.quantityIndex,
      });
    }
    if (parts.length === 0) return;
    const sheetArea = sheetW * sheetH;
    sheets.push({
      index: idx,
      width: sheetW,
      height: sheetH,
      parts,
      usedArea: sheetUsed,
      wasteArea: Math.max(0, sheetArea - sheetUsed),
      wastePercent: sheetArea > 0 ? (Math.max(0, sheetArea - sheetUsed) / sheetArea) * 100 : 0,
    });
  });

  const unplaced: UnplacedPart[] = [];
  const grouped = new Map<string, { name: string; length: number; width: number; quantity: number }>();
  for (const it of unplacedItems) {
    const key = it.partId;
    if (!grouped.has(key)) {
      grouped.set(key, { name: it.name, length: it.length, width: it.width, quantity: 0 });
    }
    grouped.get(key)!.quantity += 1;
  }
  for (const [partId, val] of grouped) {
    unplaced.push({
      partId,
      name: val.name,
      length: val.length,
      width: val.width,
      quantity: val.quantity,
      reason: "ابعاد قطعه بزرگ‌تر از فضای قابل‌استفاده ورق است",
    });
  }

  const totalArea = sheets.length * sheetW * sheetH;
  const wasteArea = Math.max(0, totalArea - usedArea);
  const wastePercent = totalArea > 0 ? (wasteArea / totalArea) * 100 : 0;

  return {
    sheets,
    sheetCount: sheets.length,
    totalArea,
    usedArea,
    wasteArea,
    wastePercent,
    totalParts: items.length,
    placedParts: validPlacements.length,
    unplaced,
    strategy: strategyLabel,
    durationMs,
  };
}

export function optimizeCutting(input: OptimizeInput): OptimizeResult {
  const { parts, settings } = input;
  const start = performance.now();

  const usableW = Math.max(1, settings.sheetWidth - 2 * settings.trim);
  const usableH = Math.max(1, settings.sheetHeight - 2 * settings.trim);

  const items: Item[] = [];
  parts.forEach((part, pi) => {
    const effW = part.length + settings.kerf;
    const effH = part.width + settings.kerf;
    const count = Math.max(1, Math.min(part.quantity, 500));
    for (let q = 0; q < count; q++) {
      items.push({
        partId: part.id,
        name: part.name || `قطعه ${pi + 1}`,
        length: part.length,
        width: part.width,
        grain: part.grain,
        effW,
        effH,
        quantityIndex: q,
      });
    }
  });

  let best: OptimizeResult | null = null;

  for (const strategy of ORDER_STRATEGIES) {
    const sorted = sortItems(items, strategy.key);
    const { sheetResults, unplacedItems } = packItems(
      sorted,
      usableW,
      usableH,
      settings.allowRotation
    );
    const candidate = buildResult(
      items,
      sheetResults,
      unplacedItems,
      strategy.label,
      usableW,
      usableH,
      performance.now() - start
    );
    if (
      !best ||
      candidate.sheetCount < best.sheetCount ||
      (candidate.sheetCount === best.sheetCount && candidate.wastePercent < best.wastePercent)
    ) {
      best = candidate;
    }
  }

  const result = best!;
  result.durationMs = performance.now() - start;
  return result;
}

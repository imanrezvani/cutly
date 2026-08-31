import type { SheetResult } from "@/lib/cutting/types";
import { faNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SheetDiagramProps {
  sheet: SheetResult;
  trim: number;
  sheetWidth: number;
  sheetHeight: number;
  className?: string;
  showLabels?: boolean;
}

export function SheetDiagram({
  sheet,
  trim,
  sheetWidth,
  sheetHeight,
  className,
  showLabels = true,
}: SheetDiagramProps) {
  const marginPct = (trim / sheetWidth) * 100;
  const marginTopPct = (trim / sheetHeight) * 100;
  const innerWidth = sheetWidth - 2 * trim;
  const innerHeight = sheetHeight - 2 * trim;

  return (
    <div
      className={cn("relative w-full select-none @container", className)}
      style={{ aspectRatio: `${sheetWidth} / ${sheetHeight}` }}
      dir="ltr"
    >
      <div
        className="absolute inset-0 rounded-sm border-2 border-foreground/70 bg-white"
        style={{ boxShadow: "0 1px 6px rgba(15,23,42,0.15)" }}
      />
      <div
        className="absolute border border-dashed border-foreground/40"
        style={{
          left: `${marginPct}%`,
          top: `${marginTopPct}%`,
          width: `${(innerWidth / sheetWidth) * 100}%`,
          height: `${(innerHeight / sheetHeight) * 100}%`,
        }}
      />
      {sheet.parts.map((p, i) => {
        const left = ((trim + p.x) / sheetWidth) * 100;
        const top = ((trim + p.y) / sheetHeight) * 100;
        const wPct = (p.length / sheetWidth) * 100;
        const hPct = (p.width / sheetHeight) * 100;
        const areaPct = (wPct * hPct) / 100;
        const showName = showLabels && areaPct >= 1.6;
        const showDims = showLabels && areaPct >= 3.4;

        return (
          <div
            key={`${p.partId}-${p.quantityIndex}-${i}`}
            className="absolute flex flex-col items-center justify-center overflow-hidden border border-foreground/25 text-center leading-tight"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${wPct}%`,
              height: `${hPct}%`,
              backgroundColor: p.color,
            }}
            title={`${p.name} — ${faNumber(p.length)}×${faNumber(p.width)}`}
          >
            {showName && (
              <span className="text-foreground w-full px-0.5 font-bold break-all text-[clamp(6px,1.5cqw,13px)]">
                {p.name}
              </span>
            )}
            {showDims && (
              <span className="text-foreground/90 w-full px-0.5 font-medium whitespace-nowrap text-[clamp(5px,1.2cqw,11px)]">
                {faNumber(p.length)} × {faNumber(p.width)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

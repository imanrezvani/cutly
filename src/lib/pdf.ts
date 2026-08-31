import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import type { Project, SheetResult } from "@/lib/cutting/types";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

function fa(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

function dimsText(sheet: SheetResult): string {
  return `ورق ${fa(sheet.index + 1)} — ${fa(sheet.width)}×${fa(sheet.height)} میلی‌متر — ${sheet.parts.length} قطعه`;
}

function sheetToHtml(sheet: SheetResult, trim: number): string {
  const sheetWidth = sheet.width + 2 * trim;
  const sheetHeight = sheet.height + 2 * trim;
  const marginPct = (trim / sheetWidth) * 100;
  const marginTopPct = (trim / sheetHeight) * 100;

  const partsHtml = sheet.parts
    .map((p) => {
      const left = ((trim + p.x) / sheetWidth) * 100;
      const top = ((trim + p.y) / sheetHeight) * 100;
      const wPct = (p.length / sheetWidth) * 100;
      const hPct = (p.width / sheetHeight) * 100;
      const areaPct = (wPct * hPct) / 100;
      const showName = areaPct >= 1.6;
      const showDims = areaPct >= 3.4;
      const fontSize = Math.min(14, Math.max(6, areaPct * 2.2));
      const dimsFont = Math.max(5, fontSize * 0.82);
      return `
        <div style="position:absolute;left:${left}%;top:${top}%;width:${wPct}%;height:${hPct}%;background-color:${p.color};border:1px solid rgba(15,23,42,0.35);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;line-height:1.25;">
          ${showName ? `<div style="font-weight:800;color:#0f172a;font-size:${fontSize}px;white-space:nowrap;max-width:96%;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>` : ""}
          ${showDims ? `<div style="font-weight:500;color:#0f172a;font-size:${dimsFont}px;white-space:nowrap;">${fa(p.length)} × ${fa(p.width)}</div>` : ""}
        </div>`;
    })
    .join("");

  return `
    <div dir="rtl" style="width:${sheetWidth}px;height:${sheetHeight}px;position:relative;border:2px solid #0f172a;border-radius:3px;background:#ffffff;box-sizing:border-box;">
      <div style="position:absolute;left:${marginPct}%;top:${marginTopPct}%;width:${100 - 2 * marginPct}%;height:${100 - 2 * marginTopPct}%;border:1px dashed rgba(15,23,42,0.45);box-sizing:border-box;"></div>
      ${partsHtml}
    </div>`;
}

function reportToHtml(project: Project): string {
  const { result, settings } = project;
  if (!result) return "";

  const legendMap = new Map<string, { name: string; color: string }>();
  for (const sheet of result.sheets) {
    for (const p of sheet.parts) {
      if (!legendMap.has(p.partId)) {
        legendMap.set(p.partId, { name: p.name, color: p.color });
      }
    }
  }

  const legendHtml = [...legendMap.values()]
    .map(
      (l) => `
        <span style="display:inline-flex;align-items:center;gap:6px;margin-left:14px;font-size:11px;color:#334155;">
          <span style="display:inline-block;width:14px;height:14px;background-color:${l.color};border:1px solid rgba(0,0,0,0.2);border-radius:3px;"></span>
          ${l.name}
        </span>`
    )
    .join("");

  const sheetsHtml = result.sheets
    .map(
      (sheet) => `
        <div data-sheet="1" style="margin-top:18px;">
          <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:6px;">${dimsText(sheet)}</div>
          <div style="transform-origin:top right;">${sheetToHtml(sheet, settings.trim)}</div>
        </div>`
    )
    .join("");

  return `
    <div dir="rtl" style="font-family:Vazirmatn, Tahoma, sans-serif;background:#ffffff;color:#0f172a;padding:8px;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1d4ed8;padding-bottom:8px;">
        <div style="font-size:18px;font-weight:800;color:#1d4ed8;">کاتلی — نقشه برش «${project.name}»</div>
        <div style="font-size:11px;color:#64748b;">نسخه چاپ کارگاه · ${fa(result.sheetCount)} ورق · ضایعات ${fa(Math.round(result.wastePercent))}٪</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;margin-top:10px;">${legendHtml}</div>
      <div style="margin-top:4px;font-size:10px;color:#94a3b8;">
        کرِف اره: ${fa(settings.kerf)} میلی‌متر · حاشیه ورق: ${fa(settings.trim)} میلی‌متر · خطچین: مرز فضای قابل‌استفاده
      </div>
      ${sheetsHtml}
    </div>`;
}

export async function exportProjectPdf(project: Project): Promise<void> {
  const html = reportToHtml(project);
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-100000px;top:0;width:auto;height:auto;z-index:-1000;background:#ffffff;";
  container.innerHTML = html;
  document.body.appendChild(container);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 8;
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;

  try {
    const sheetNodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-sheet]")
    );
    const captured = await captureBlocks(sheetNodes);
    let first = true;
    for (const img of captured) {
      if (!first) pdf.addPage();
      first = false;
      const ratio = img.height / img.width;
      let w = contentW;
      let h = w * ratio;
      if (h > contentH) {
        h = contentH;
        w = h / ratio;
      }
      pdf.addImage(img.dataUrl, "PNG", margin, margin + (contentH - h) / 2, w, h);
    }
  } finally {
    container.remove();
  }

  pdf.save(`cutly-${project.name || "project"}.pdf`);
}

async function captureBlocks(
  nodes: HTMLElement[]
): Promise<Array<{ dataUrl: string; width: number; height: number }>> {
  const results: Array<{ dataUrl: string; width: number; height: number }> = [];
  for (const node of nodes) {
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: 1600,
    });
    results.push({
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    });
  }
  return results;
}

export function whatsappShareText(project: Project): string {
  const { result, settings } = project;
  if (!result) return "";
  const lines: string[] = [
    `کاتلی — نقشه برش «${project.name}»`,
    `ورق: ${fa(settings.sheetWidth)}×${fa(settings.sheetHeight)} میلی‌متر`,
    `تعداد ورق: ${fa(result.sheetCount)}`,
    `ضایعات: ${fa(Math.round(result.wastePercent))}٪`,
    `قطعات: ${fa(result.placedParts)} عدد`,
  ];
  result.sheets.forEach((sheet) => {
    lines.push("");
    lines.push(`ورق ${fa(sheet.index + 1)} (${fa(sheet.parts.length)} قطعه):`);
    sheet.parts.forEach((p) => {
      lines.push(`- ${p.name} ${fa(p.length)}×${fa(p.width)}${p.rotated ? " (چرخیده)" : ""}`);
    });
  });
  return lines.join("\n");
}

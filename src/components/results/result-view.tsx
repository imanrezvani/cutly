"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2,
  FileDown,
  Share2,
  Pencil,
  ChevronRight,
  ChevronLeft,
  Layers,
  TriangleAlert,
  Grid2X2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SheetDiagram } from "@/components/sheet-diagram";
import { getProject } from "@/lib/stores/projects";
import { exportProjectPdf, whatsappShareText } from "@/lib/pdf";
import { faNumber, faPercent, toFaDigits } from "@/lib/format";
import type { Project } from "@/lib/cutting/types";
import { toast } from "sonner";

export function ResultView() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let mounted = true;
    getProject(params.id).then((p) => {
      if (mounted) setProject(p ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  const result = project?.result ?? null;
  const sheetCount = result?.sheets.length ?? 0;

  useEffect(() => {
    if (currentSheet >= sheetCount) setCurrentSheet(Math.max(0, sheetCount - 1));
  }, [sheetCount, currentSheet]);

  const legend = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, { name: string; color: string }>();
    for (const sheet of result.sheets) {
      for (const p of sheet.parts) {
        if (!map.has(p.partId)) map.set(p.partId, { name: p.name, color: p.color });
      }
    }
    return [...map.values()];
  }, [result]);

  if (project === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (project === null || !result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-lg font-bold">نتیجه‌ای برای این پروژه ذخیره نشده است</p>
        <Button asChild>
          <Link href={`/projects/${params.id}`}>بازگشت به ویرایش</Link>
        </Button>
      </div>
    );
  }

  const handlePdf = async () => {
    setExporting(true);
    try {
      await exportProjectPdf(project);
      toast.success("نقشه برش دانلود شد");
    } catch (e) {
      console.error(e);
      toast.error("ایجاد PDF ناموفق بود");
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const text = whatsappShareText(project);
      if (navigator.share) {
        try {
          await navigator.share({ title: project.name, text });
          return;
        } catch {
          // fall through to WhatsApp link
        }
      }
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    } finally {
      setSharing(false);
    }
  };

  const sheet = result.sheets[currentSheet];
  const stats = [
    {
      label: "تعداد ورق مصرفی",
      value: toFaDigits(result.sheetCount),
      unit: "ورق",
      icon: Layers,
      color: "text-primary bg-primary/10",
    },
    {
      label: "درصد ضایعات",
      value: faPercent(result.wastePercent),
      unit: "از کل مساحت",
      icon: Grid2X2,
      color: "text-destructive bg-destructive/10",
    },
    {
      label: "مساحت کل",
      value: faNumber(Math.round(result.totalArea).toLocaleString("en-US")),
      unit: "mm²",
      icon: Grid2X2,
      color: "text-success bg-success/10",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon" aria-label="بازگشت به داشبورد">
            <Link href="/dashboard">
              <ChevronRight className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{project.name}</p>
            <p className="text-muted-foreground text-xs">نقشه برش · {result.strategy}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${project.id}`}>
              <Pencil className="size-4" />
              ویرایش
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-3 text-center shadow-sm sm:p-4">
              <span className={`mx-auto mb-2 flex size-9 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="size-5" />
              </span>
              <p className="text-xl font-extrabold sm:text-2xl">{s.value}</p>
              <p className="text-muted-foreground text-[11px] sm:text-xs">{s.label}</p>
              <p className="text-muted-foreground/70 text-[10px]">{s.unit}</p>
            </div>
          ))}
        </div>

        {result.unplaced.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <TriangleAlert className="text-destructive mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-bold text-destructive">برخی قطعات در هیچ ورقی جای نگرفتند</p>
              <ul className="text-destructive/80 mt-1 list-inside">
                {result.unplaced.map((u) => (
                  <li key={u.partId}>
                    {u.name} ({faNumber(u.length)}×{faNumber(u.width)}) — {u.quantity} عدد — {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-bold">
              ورق {toFaDigits(currentSheet + 1)} از {toFaDigits(sheetCount)}
            </h2>
            <span className="text-muted-foreground text-xs">
              {sheet.parts.length} قطعه · ضایعات {faPercent(sheet.wastePercent)}
            </span>
          </div>

          <SheetDiagram
            sheet={sheet}
            trim={project.settings.trim}
            sheetWidth={project.settings.sheetWidth}
            sheetHeight={project.settings.sheetHeight}
          />

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={currentSheet === 0}
              onClick={() => setCurrentSheet((c) => Math.max(0, c - 1))}
            >
              <ChevronRight className="rtl:rotate-0" />
              قبلی
            </Button>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {result.sheets.map((s, i) => (
                <button
                  key={s.index}
                  onClick={() => setCurrentSheet(i)}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    i === currentSheet
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                  aria-label={`ورق ${i + 1}`}
                >
                  {toFaDigits(i + 1)}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentSheet >= sheetCount - 1}
              onClick={() => setCurrentSheet((c) => Math.min(sheetCount - 1, c + 1))}
            >
              بعدی
              <ChevronLeft className="rtl:rotate-0" />
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold">راهنمای رنگ‌ها</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legend.map((l) => (
              <span key={l.name} className="inline-flex items-center gap-2 text-sm">
                <span
                  className="size-3.5 rounded border border-foreground/20"
                  style={{ backgroundColor: l.color }}
                />
                {l.name}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-[11px] leading-5">
            کرِف اره: {faNumber(project.settings.kerf)} میلی‌متر · حاشیه ورق: {faNumber(project.settings.trim)} میلی‌متر ·
            خط‌چین: مرز فضای قابل‌استفاده ورق
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 pb-10 sm:flex-row">
          <Button size="lg" className="flex-1 gap-2" onClick={handlePdf} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" /> : <FileDown className="size-5" />}
            دانلود PDF نقشه برش
          </Button>
          <Button
            size="lg"
            variant="success"
            className="flex-1 gap-2"
            onClick={handleShare}
            disabled={sharing}
          >
            {sharing ? <Loader2 className="animate-spin" /> : <Share2 className="size-5" />}
            اشتراک در واتساپ
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link href={`/projects/${project.id}`}>
              <Pencil className="size-5" />
              بازگشت به ویرایش
            </Link>
          </Button>
        </div>

        {result.unplaced.length > 0 && (
          <p className="text-muted-foreground mb-6 text-center text-xs">
            برای چیدن قطعات جا مانده، سایز ورق را بزرگ‌تر کنید یا ابعاد قطعات را بررسی کنید.
          </p>
        )}

        <div className="text-muted-foreground mb-4 text-center text-xs">
          <Badge variant="secondary">زمان محاسبه: {toFaDigits(Math.round(result.durationMs))} میلی‌ثانیه</Badge>
        </div>
      </main>
    </div>
  );
}

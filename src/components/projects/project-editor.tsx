"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Settings2,
  Wand2,
  Save,
  Loader2,
  RotateCw,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toEnDigits, toFaDigits, faNumber } from "@/lib/format";
import type { CutPart, Project, SheetSettings } from "@/lib/cutting/types";
import { optimizeCutting } from "@/lib/cutting/guillotine";
import {
  createEmptyProject,
  saveProject,
} from "@/lib/stores/projects";
import { STANDARD_SHEETS, MAX_PARTS, MIN_DIMENSION, MAX_DIMENSION } from "@/lib/constants";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function newPart(parts: CutPart[]): CutPart {
  return {
    id: newId(),
    name: `قطعه ${parts.length + 1}`,
    length: 500,
    width: 400,
    quantity: 1,
    grain: "free",
  };
}

function demoParts(): CutPart[] {
  return [
    { id: newId(), name: "بدنه", length: 600, width: 400, quantity: 6, grain: "free" },
    { id: newId(), name: "قفسه", length: 580, width: 280, quantity: 4, grain: "free" },
    { id: newId(), name: "درب", length: 700, width: 350, quantity: 3, grain: "fixed" },
    { id: newId(), name: "کناره", length: 500, width: 200, quantity: 8, grain: "free" },
  ];
}

interface ProjectEditorProps {
  initialProject?: Project | null;
}

export function ProjectEditor({ initialProject }: ProjectEditorProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project>(
    () => initialProject ?? createEmptyProject()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const skipNextSave = useRef(true);

  const update = useCallback((patch: Partial<Project>) => {
    setProject((p) => ({ ...p, ...patch }));
  }, []);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const t = setTimeout(async () => {
      try {
        await saveProject(project);
        setSavedAt(new Date().toISOString());
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [project]);

  const addPart = () => {
    if (project.parts.length >= MAX_PARTS) {
      toast.error(`حداکثر ${toFaDigits(MAX_PARTS)} قطعه مجاز است`);
      return;
    }
    update({ parts: [...project.parts, newPart(project.parts)] });
  };

  const removePart = (id: string) => {
    update({ parts: project.parts.filter((p) => p.id !== id) });
  };

  const updatePart = (id: string, patch: Partial<CutPart>) => {
    update({
      parts: project.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const handleOptimize = async () => {
    if (project.parts.length === 0) {
      toast.error("حداقل یک قطعه به لیست اضافه کنید");
      return;
    }
    const invalid = project.parts.filter(
      (p) =>
        p.length < MIN_DIMENSION ||
        p.width < MIN_DIMENSION ||
        p.quantity < 1 ||
        p.length > MAX_DIMENSION ||
        p.width > MAX_DIMENSION
    );
    if (invalid.length > 0) {
      toast.error("ابعاد برخی قطعات نامعتبر است", {
        description: `${invalid[0].name}: طول و عرض باید بین ${toFaDigits(MIN_DIMENSION)} تا ${toFaDigits(MAX_DIMENSION)} میلی‌متر باشد.`,
      });
      return;
    }
    if (
      project.settings.sheetWidth <= 0 ||
      project.settings.sheetHeight <= 0
    ) {
      toast.error("ابعاد ورق را در تنظیمات بررسی کنید");
      return;
    }
    setOptimizing(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const result = optimizeCutting({
        parts: project.parts,
        settings: project.settings,
      });
      const finalProject = { ...project, status: "optimized" as const, result };
      await saveProject(finalProject);
      router.push(`/projects/${finalProject.id}/result`);
    } catch (e) {
      console.error(e);
      toast.error("محاسبه چیدمان ناموفق بود");
      setOptimizing(false);
    }
  };

  const totalQuantity = project.parts.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} aria-label="بازگشت">
            <ArrowRight className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <Input
              value={project.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="نام پروژه (مثلاً کابینت آشپزخانه)"
              className="border-transparent bg-transparent px-0 text-base font-bold shadow-none focus-visible:border-input focus-visible:bg-background"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {saveError ? (
              <Badge variant="destructive">خطا در ذخیره</Badge>
            ) : savedAt ? (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Save className="size-3" />
                ذخیره شد
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-primary size-5" />
            <h2 className="text-lg font-bold">لیست قطعات</h2>
            <span className="text-muted-foreground text-sm">
              ({faNumber(project.parts.length)} نوع · {faNumber(totalQuantity)} عدد)
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="size-4" />
              تنظیمات ورق
            </Button>
            <Button size="sm" onClick={addPart} className="gap-1">
              <Plus className="size-4" />
              افزودن قطعه
            </Button>
          </div>
        </div>

        {project.parts.length === 0 ? (
          <div className="border-dashed flex flex-col items-center gap-4 rounded-2xl border-2 py-16 text-center">
            <div className="bg-muted flex size-16 items-center justify-center rounded-2xl">
              <ClipboardList className="text-muted-foreground size-8" />
            </div>
            <div>
              <p className="font-semibold">هنوز قطعه‌ای اضافه نشده</p>
              <p className="text-muted-foreground mt-1 text-sm">
                قطعات پروژه خود را به لیست اضافه کنید.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={addPart}>
                <Plus className="size-4" />
                افزودن اولین قطعه
              </Button>
              <Button
                variant="outline"
                onClick={() => update({ parts: demoParts() })}
              >
                <RotateCw className="size-4" />
                استفاده از نمونه
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <PartsTable
                parts={project.parts}
                onUpdate={updatePart}
                onRemove={removePart}
              />
            </div>
            <div className="flex flex-col gap-3 md:hidden">
              {project.parts.map((part, i) => (
                <PartCard
                  key={part.id}
                  part={part}
                  index={i}
                  onUpdate={(patch) => updatePart(part.id, patch)}
                  onRemove={() => removePart(part.id)}
                />
              ))}
            </div>
          </>
        )}

        <div className="mt-8 border-t pt-6">
          <Button
            size="lg"
            className="w-full gap-2 text-base"
            onClick={handleOptimize}
            disabled={optimizing}
          >
            {optimizing ? (
              <>
                <Loader2 className="animate-spin" />
                در حال محاسبه بهترین چیدمان...
              </>
            ) : (
              <>
                <Wand2 className="size-5" />
                تنظیمات و بهینه‌سازی برش
              </>
            )}
          </Button>
          <p className="text-muted-foreground mt-3 text-center text-xs">
            الگوریتم گیلوتین · رعایت کرِف اره و جهت دانه · کمترین تعداد ورق و ضایعات
          </p>
        </div>
      </main>

      <SheetSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={project.settings}
        onChange={(settings) => update({ settings })}
      />

      {optimizing && (
        <div className="bg-background/80 fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
          <Loader2 className="text-primary size-12 animate-spin" />
          <p className="text-lg font-bold">در حال بهینه‌سازی چیدمان برش</p>
          <p className="text-muted-foreground text-sm">
            {toFaDigits(totalQuantity)} قطعه در حال چیدمان روی ورق‌ها...
          </p>
        </div>
      )}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min = 1,
  max = 100000,
  suffix,
  className,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        aria-label={ariaLabel}
        dir="ltr"
        inputMode="numeric"
        value={value === 0 ? "" : String(value)}
        onChange={(e) => {
          const n = Math.max(min, Math.min(max, Number(toEnDigits(e.target.value)) || 0));
          onChange(n);
        }}
        className="pe-8 text-center"
      />
      {suffix && (
        <span className="text-muted-foreground absolute top-1/2 end-3 -translate-y-1/2 text-[10px]">
          {suffix}
        </span>
      )}
    </div>
  );
}

function GrainSelect({
  value,
  onChange,
  allowRotation,
}: {
  value: CutPart["grain"];
  onChange: (g: CutPart["grain"]) => void;
  allowRotation: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CutPart["grain"])}>
      <SelectTrigger className="w-full" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">آزاد {!allowRotation && "(چرخش غیرفعال)"}</SelectItem>
        <SelectItem value="fixed">ثابت (دانه عمودی)</SelectItem>
      </SelectContent>
    </Select>
  );
}

function PartsTable({
  parts,
  onUpdate,
  onRemove,
}: {
  parts: CutPart[];
  onUpdate: (id: string, patch: Partial<CutPart>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-muted-foreground">
            <th className="w-12 px-3 py-3 text-start font-medium">#</th>
            <th className="px-3 py-3 text-start font-medium">نام قطعه</th>
            <th className="w-36 px-3 py-3 text-center font-medium">طول (mm)</th>
            <th className="w-36 px-3 py-3 text-center font-medium">عرض (mm)</th>
            <th className="w-28 px-3 py-3 text-center font-medium">تعداد</th>
            <th className="w-44 px-3 py-3 text-center font-medium">جهت دانه</th>
            <th className="w-12 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {parts.map((part, i) => (
            <tr key={part.id} className="border-t bg-white hover:bg-muted/30">
              <td className="text-muted-foreground px-3 py-2 text-center">
                {faNumber(i + 1)}
              </td>
              <td className="px-3 py-2">
                <Input
                  value={part.name}
                  onChange={(e) => onUpdate(part.id, { name: e.target.value })}
                  aria-label="نام قطعه"
                  className="border-transparent bg-transparent px-1 font-medium shadow-none hover:border-input focus:border-input focus:bg-background"
                />
              </td>
              <td className="px-1 py-2">
                <NumberInput
                  value={part.length}
                  onChange={(n) => onUpdate(part.id, { length: n })}
                  ariaLabel="طول"
                />
              </td>
              <td className="px-1 py-2">
                <NumberInput
                  value={part.width}
                  onChange={(n) => onUpdate(part.id, { width: n })}
                  ariaLabel="عرض"
                />
              </td>
              <td className="px-1 py-2">
                <NumberInput
                  value={part.quantity}
                  onChange={(n) => onUpdate(part.id, { quantity: Math.max(1, n) })}
                  min={1}
                  max={999}
                  ariaLabel="تعداد"
                />
              </td>
              <td className="px-3 py-2">
                <GrainSelect
                  value={part.grain}
                  onChange={(g) => onUpdate(part.id, { grain: g })}
                  allowRotation={false}
                />
              </td>
              <td className="px-2 py-2 text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onRemove(part.id)}
                  aria-label="حذف قطعه"
                >
                  <Trash2 className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PartCard({
  part,
  index,
  onUpdate,
  onRemove,
}: {
  part: CutPart;
  index: number;
  onUpdate: (patch: Partial<CutPart>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-md text-xs font-bold">
          {faNumber(index + 1)}
        </span>
        <Input
          value={part.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          aria-label="نام قطعه"
          className="h-9 flex-1 font-semibold"
        />
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          aria-label="حذف قطعه"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-muted-foreground text-xs">طول (mm)</Label>
          <NumberInput
            value={part.length}
            onChange={(n) => onUpdate({ length: n })}
            ariaLabel="طول"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-muted-foreground text-xs">عرض (mm)</Label>
          <NumberInput
            value={part.width}
            onChange={(n) => onUpdate({ width: n })}
            ariaLabel="عرض"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-muted-foreground text-xs">تعداد</Label>
          <NumberInput
            value={part.quantity}
            onChange={(n) => onUpdate({ quantity: Math.max(1, n) })}
            min={1}
            max={999}
            ariaLabel="تعداد"
          />
        </div>
      </div>
      <div className="mt-2">
        <Label className="text-muted-foreground mb-1 block text-xs">جهت دانه</Label>
        <GrainSelect value={part.grain} onChange={(g) => onUpdate({ grain: g })} allowRotation={false} />
      </div>
    </div>
  );
}

function SheetSettingsDialog({
  open,
  onOpenChange,
  settings,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SheetSettings;
  onChange: (s: SheetSettings) => void;
}) {
  const [sheetMode, setSheetMode] = useState<"standard" | "custom">(
    STANDARD_SHEETS.some((s) => s.width === settings.sheetWidth && s.height === settings.sheetHeight)
      ? "standard"
      : "custom"
  );

  const standardValue = STANDARD_SHEETS.some(
    (s) => s.width === settings.sheetWidth && s.height === settings.sheetHeight
  )
    ? `${settings.sheetWidth}x${settings.sheetHeight}`
    : `${STANDARD_SHEETS[0].width}x${STANDARD_SHEETS[0].height}`;

  const apply = (s: Partial<SheetSettings>) => onChange({ ...settings, ...s });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تنظیمات ورق و برش</DialogTitle>
          <DialogDescription>
            سایز ورق استاندارد ایرانی، کرِف اره و حاشیه را مشخص کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <Label>سایز ورق</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sheetMode === "standard" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSheetMode("standard");
                  const s = STANDARD_SHEETS[0];
                  apply({ sheetWidth: s.width, sheetHeight: s.height });
                }}
              >
                استاندارد
              </Button>
              <Button
                type="button"
                variant={sheetMode === "custom" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setSheetMode("custom")}
              >
                سایز سفارشی
              </Button>
            </div>

            {sheetMode === "standard" ? (
              <Select
                value={standardValue}
                onValueChange={(v) => {
                  const [w, h] = v.split("x").map(Number);
                  apply({ sheetWidth: w, sheetHeight: h });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_SHEETS.map((s) => (
                    <SelectItem key={s.label} value={`${s.width}x${s.height}`}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">طول ورق (mm)</Label>
                  <NumberInput
                    value={settings.sheetWidth}
                    onChange={(n) => apply({ sheetWidth: n })}
                    min={100}
                    max={10000}
                    ariaLabel="طول ورق"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">عرض ورق (mm)</Label>
                  <NumberInput
                    value={settings.sheetHeight}
                    onChange={(n) => apply({ sheetHeight: n })}
                    min={100}
                    max={10000}
                    ariaLabel="عرض ورق"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">کرِف اره (mm)</Label>
              <NumberInput
                value={settings.kerf}
                onChange={(n) => apply({ kerf: Math.min(30, Math.max(0, n)) })}
                min={0}
                max={30}
                ariaLabel="کرف اره"
              />
              <p className="text-muted-foreground text-[11px]">پیش‌فرض ۳٫۵ میلی‌متر</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">حاشیه ورق (mm)</Label>
              <NumberInput
                value={settings.trim}
                onChange={(n) => apply({ trim: Math.min(100, Math.max(0, n)) })}
                min={0}
                max={100}
                ariaLabel="حاشیه ورق"
              />
              <p className="text-muted-foreground text-[11px]">حاشیه همه‌جانبه</p>
            </div>
          </div>

          <div className="bg-muted/60 flex items-center justify-between gap-4 rounded-xl px-4 py-3">
            <div className="flex items-start gap-2">
              <RotateCw className="text-primary mt-0.5 size-5" />
              <div>
                <p className="text-sm font-semibold">اجازه چرخش قطعات</p>
                <p className="text-muted-foreground text-xs">
                  برای قطعات با جهت دانه آزاد، چرخش ۹۰ درجه مجاز است
                </p>
              </div>
            </div>
            <Switch
              checked={settings.allowRotation}
              onCheckedChange={(v) => apply({ allowRotation: v })}
              aria-label="اجازه چرخش قطعات"
            />
          </div>

          <div className="bg-muted/60 rounded-xl px-4 py-3 text-xs leading-6">
            <p className="text-muted-foreground">
              فضای قابل‌استفاده:{" "}
              <span className="text-foreground font-semibold">
                {faNumber(Math.max(0, settings.sheetWidth - 2 * settings.trim))} ×{" "}
                {faNumber(Math.max(0, settings.sheetHeight - 2 * settings.trim))}
              </span>{" "}
              میلی‌متر (پس از حذف حاشیه)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            تایید تنظیمات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

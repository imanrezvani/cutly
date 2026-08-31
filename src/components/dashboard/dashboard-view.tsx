"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Loader2,
  FolderOpen,
  LogOut,
  Pencil,
  Trash2,
  FileDown,
  UserRound,
  BriefcaseBusiness,
  CreditCard,
  Sparkles,
  Lock,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useUser, useProfile } from "@/lib/hooks/use-auth";
import {
  listProjects,
  deleteProject,
} from "@/lib/stores/projects";
import type { Project } from "@/lib/cutting/types";
import { faNumber, faPercent, toFaDigits, toEnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const { profile, reload: reloadProfile } = useProfile(user?.id);

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [tab, setTab] = useState<string>("projects");
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [plan, setPlan] = useState<{ plan: string; status: string } | null>(null);

  const guest = !isSupabaseConfigured;

  const loadProjects = useCallback(async () => {
    const list = await listProjects();
    setProjects(list);
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const status = searchParams.get("checkout");
    if (status === "success") toast.success("اشتراک شما فعال شد");
    if (status === "canceled") toast.info("پرداخت لغو شد");
  }, [searchParams]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase || !user) return;
    supabase
      .from("subscriptions")
      .select("plan,status")
      .maybeSingle()
      .then(({ data }: { data: { plan: string; status: string } | null }) => {
        if (data) setPlan(data);
      });
  }, [user]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCreate = () => {
    router.push(`/projects/new`);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProject(toDelete.id);
      setProjects((ps) => ps?.filter((p) => p.id !== toDelete.id) ?? []);
      toast.success("پروژه حذف شد");
    } catch {
      toast.error("حذف ناموفق بود");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const handleCheckout = async (planId: "monthly" | "yearly") => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        toast.info("پرداخت آنلاین به‌زودی فعال می‌شود", {
          description: data?.error ?? "برای فعال‌سازی پرداخت، لطفاً بعداً مراجعه کنید.",
        });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("اتصال به درگاه پرداخت برقرار نشد");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  const fullName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
      : user?.phone ?? "کاربر مهمان";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label="صفحه اصلی">
            <Logo withText={false} />
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={guest ? "outline" : "secondary"}>
              {guest ? "حالت مهمان" : plan?.plan === "free" ? "پلن رایگان" : plan?.plan === "yearly" ? "اشتراک سالانه" : "اشتراک ماهانه"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      {guest && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="size-4 shrink-0" />
            حالت مهمان: پروژه‌ها فقط در این مرورگر ذخیره می‌شوند. برای ذخیره ابری، با شماره موبایل وارد شوید.
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold">سلام، {fullName}</h1>
          <p className="text-muted-foreground">
            پروژه‌های برش خود را مدیریت کنید و نقشه آماده چاپ بگیرید.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="projects" className="flex-1">
              <FolderOpen className="size-4" />
              پروژه‌ها
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex-1">
              <CreditCard className="size-4" />
              اشتراک
            </TabsTrigger>
            <TabsTrigger value="account" className="flex-1">
              <UserRound className="size-4" />
              حساب
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="pt-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold text-lg">پروژه‌های من</h2>
              <Button onClick={handleCreate}>
                <Plus className="size-4" />
                پروژه جدید
              </Button>
            </div>

            {projects === null ? (
              <div className="flex justify-center py-16">
                <Loader2 className="text-primary size-7 animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="border-dashed flex flex-col items-center gap-4 rounded-2xl border-2 py-16 text-center">
                <div className="bg-muted flex size-16 items-center justify-center rounded-2xl">
                  <FolderOpen className="text-muted-foreground size-8" />
                </div>
                <div>
                  <p className="font-semibold">هنوز پروژه‌ای ندارید</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    اولین پروژه برش خود را بسازید.
                  </p>
                </div>
                <Button onClick={handleCreate}>
                  <Plus className="size-4" />
                  ساخت اولین پروژه
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((p) => (
                  <Card key={p.id} className="gap-4">
                    <CardHeader className="pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="truncate text-base">{p.name || "بدون نام"}</CardTitle>
                        <Badge variant={p.status === "optimized" ? "success" : "outline"}>
                          {p.status === "optimized" ? "بهینه‌شده" : "پیش‌نویس"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {faNumber(p.parts.length)} نوع قطعه · به‌روزرسانی{" "}
                        {new Date(p.updated_at).toLocaleDateString("fa-IR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-2 pb-0">
                      {p.result ? (
                        <div className="flex items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-1">
                            <Layers className="text-primary size-3.5" />
                            {toFaDigits(p.result.sheetCount)} ورق
                          </span>
                          <span className="text-destructive">{faPercent(p.result.wastePercent)} ضایعات</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">هنوز بهینه نشده</span>
                      )}
                      <div className="flex gap-1">
                        {p.status === "optimized" && (
                          <Button asChild variant="ghost" size="icon" aria-label="مشاهده نقشه">
                            <Link href={`/projects/${p.id}/result`}>
                              <FileDown className="size-4" />
                            </Link>
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="icon" aria-label="ویرایش">
                          <Link href={`/projects/${p.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setToDelete(p)}
                          aria-label="حذف"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="billing" className="pt-4">
            <BillingTab
              guest={guest}
              plan={plan}
              loading={checkoutLoading}
              onCheckout={handleCheckout}
            />
          </TabsContent>

          <TabsContent value="account" className="pt-4">
            <AccountTab
              guest={guest}
              profile={profile}
              onSaved={() => {
                reloadProfile();
                toast.success("اطلاعات حساب ذخیره شد");
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف پروژه</DialogTitle>
            <DialogDescription>
              پروژه «{toDelete?.name || "بدون نام"}» برای همیشه حذف می‌شود. این عمل
              قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" />}
              حذف پروژه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillingTab({
  guest,
  plan,
  loading,
  onCheckout,
}: {
  guest: boolean;
  plan: { plan: string; status: string } | null;
  loading: boolean;
  onCheckout: (plan: "monthly" | "yearly") => void;
}) {
  const plans = [
    {
      id: "monthly",
      name: "اشتراک ماهانه",
      price: "۹۹ هزار تومان",
      desc: "ماهانه",
      features: ["پروژه نامحدود", "خروجی PDF با واترمارک کم", "ذخیره ابری"],
      highlight: false,
    },
    {
      id: "yearly",
      name: "اشتراک سالانه",
      price: "۹۹۰ هزار تومان",
      desc: "معادل ۸۳ هزار در ماه",
      features: ["همه امکانات ماهانه", "خروجی PDF کامل", "اولویت پشتیبانی", "ذخیره ابری نامحدود"],
      highlight: true,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">
              {guest ? "حالت مهمان" : plan?.plan === "free" ? "پلن رایگان" : plan?.plan === "yearly" ? "اشتراک سالانه" : "اشتراک ماهانه"}
            </p>
            <p className="text-muted-foreground text-sm">
              {guest
                ? "برای خرید اشتراک، ابتدا با شماره موبایل وارد شوید."
                : plan?.status === "active"
                  ? "اشتراک شما فعال است."
                  : "با اشتراک، امکانات حرفه‌ای کاتلی را فعال کنید."}
            </p>
          </div>
          <Sparkles className="text-primary size-7" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((pl) => (
          <Card
            key={pl.id}
            className={cn(
              "gap-4",
              pl.highlight && "border-primary shadow-md ring-1 ring-primary/30"
            )}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{pl.name}</CardTitle>
                {pl.highlight && <Badge>پیشنهاد کاتلی</Badge>}
              </div>
              <CardDescription>{pl.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-2xl font-extrabold">{pl.price}</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {pl.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="bg-success/15 text-success flex size-5 items-center justify-center rounded-full text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={pl.highlight ? "default" : "outline"}
                disabled={guest || loading}
                onClick={() => onCheckout(pl.id as "monthly" | "yearly")}
              >
                {loading && <Loader2 className="animate-spin" />}
                {guest ? "ابتدا وارد شوید" : `خرید ${pl.name}`}
              </Button>
              <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <Lock className="size-3" />
                پرداخت امن از طریق درگاه ریالی و کارت به کارت
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AccountTab({
  guest,
  profile,
  onSaved,
}: {
  guest: boolean;
  profile: { first_name: string; last_name: string; occupation: string; bank_card_last4: string | null } | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    occupation: profile?.occupation ?? "",
    bank_card_last4: profile?.bank_card_last4 ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      occupation: profile?.occupation ?? "",
      bank_card_last4: profile?.bank_card_last4 ?? "",
    });
  }, [profile]);

  const save = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase || guest) {
      toast.info("برای ذخیره اطلاعات، وارد حساب شوید");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        occupation: form.occupation.trim(),
        bank_card_last4: toEnDigits(form.bank_card_last4).slice(0, 4) || null,
      })
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
    if (error) {
      toast.error("ذخیره ناموفق بود");
    } else {
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تنظیمات حساب</CardTitle>
        <CardDescription>
          {guest
            ? "وارد حساب شوید تا بتوانید اطلاعات خود را ذخیره کنید."
            : "نام، شغل و اطلاعات کارت بانکی خود را مدیریت کنید."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="first_name">نام</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="نام"
              disabled={guest}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="last_name">نام خانوادگی</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              placeholder="نام خانوادگی"
              disabled={guest}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="occupation">شغل</Label>
          <div className="relative">
            <BriefcaseBusiness className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            <Input
              id="occupation"
              value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              placeholder="مثلاً کابینت‌ساز"
              className="pe-10"
              disabled={guest}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="card">چهار رقم آخر کارت بانکی</Label>
          <div className="relative">
            <CreditCard className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            <Input
              id="card"
              dir="ltr"
              inputMode="numeric"
              maxLength={4}
              value={form.bank_card_last4}
              onChange={(e) => setForm({ ...form, bank_card_last4: e.target.value })}
              placeholder="----"
              className="pe-10 text-center tracking-widest"
              disabled={guest}
            />
          </div>
          <p className="text-muted-foreground text-[11px]">
            برای احراز هویت پرداخت (کارت به نام خودتان) استفاده می‌شود. در صورت نیاز،
            مدارک کارت ملی برای پشتیبانی درخواست می‌شود.
          </p>
        </div>

        <Button onClick={save} disabled={saving || guest} className="sm:w-40">
          {saving && <Loader2 className="animate-spin" />}
          ذخیره تغییرات
        </Button>
      </CardContent>
    </Card>
  );
}



"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { toEnDigits, toFaDigits } from "@/lib/format";

function normalizePhone(input: string): string {
  const digits = toEnDigits(input).replace(/\D/g, "");
  if (digits.startsWith("0098")) return `+98${digits.slice(4)}`;
  if (digits.startsWith("98")) return `+98${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+98${digits.slice(1)}`;
  return `+98${digits}`;
}

function isValidPhone(input: string): boolean {
  const digits = toEnDigits(input).replace(/\D/g, "");
  return /^0?9\d{9}$/.test(digits);
}

export function PhoneLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const sendOtp = useCallback(
    async (targetPhone: string) => {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        toast.error("سرویس ورود در دسترس نیست");
        return false;
      }
      const normalized = normalizePhone(targetPhone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: { shouldCreateUser: true },
      });
      if (error) {
        toast.error("ارسال کد ناموفق بود", {
          description: error.message,
        });
        return false;
      }
      setPhone(targetPhone);
      setOtp("");
      setStep("otp");
      setResendIn(60);
      toast.success("کد تأیید ارسال شد", {
        description: `یک کد ۶ رقمی به شماره ${toFaDigits(normalized)} پیامک شد.`,
      });
      return true;
    },
    []
  );

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      toast.error("شماره موبایل معتبر نیست", {
        description: "مثال: ۰۹۱۲۳۴۵۶۷۸۹",
      });
      return;
    }
    setLoading(true);
    await sendOtp(phone);
    setLoading(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("کد ۶ رقمی را کامل وارد کنید");
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowser()!;
    const normalized = normalizePhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: toEnDigits(otp),
      type: "sms",
    });
    if (error) {
      toast.error("کد وارد شده صحیح نیست", { description: error.message });
      setLoading(false);
      return;
    }
    toast.success("ورود موفق بود");
    await routeAfterAuth();
    setLoading(false);
  };

  const routeAfterAuth = async () => {
    const supabase = getSupabaseBrowser()!;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/dashboard");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name,last_name,onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    const done =
      profile && profile.first_name && profile.last_name && profile.onboarded_at;
    router.push(done ? "/dashboard" : "/onboarding");
  };

  if (!isSupabaseConfigured) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>حالت تست (مهمان)</CardTitle>
          <CardDescription>
            سرویس احراز هویت (Supabase) هنوز پیکربندی نشده است. می‌توانید بدون
            ثبت‌نام، در حالت مهمان از همه امکانات استفاده کنید. پروژه‌ها در مرورگر
            ذخیره می‌شوند.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button size="lg" onClick={() => router.push("/dashboard")}>
            ورود به حالت مهمان
            <ArrowLeft className="rtl:rotate-180" />
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            برای فعال‌سازی ورود با شماره موبایل، متغیرهای{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> را
            تنظیم کنید.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {step === "phone"
            ? mode === "signup"
              ? "ساخت حساب کاتلی"
              : "ورود به کاتلی"
            : "تأیید شماره موبایل"}
        </CardTitle>
        <CardDescription>
          {step === "phone"
            ? "شماره موبایل خود را وارد کنید تا کد تأیید برایتان پیامک شود."
            : `کد ۶ رقمی ارسال‌شده به ${toFaDigits(phone)} را وارد کنید.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">شماره موبایل</Label>
              <div className="relative">
                <Phone className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                <Input
                  id="phone"
                  dir="ltr"
                  inputMode="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pe-10 text-center text-lg tracking-widest"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMode("login")}
              >
                ورود
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMode("signup")}
              >
                ثبت‌نام
              </Button>
            </div>

            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              ارسال کد تأیید
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp">کد تأیید</Label>
              <div className="relative">
                <KeyRound className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                <Input
                  id="otp"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) =>
                    setOtp(toEnDigits(e.target.value).replace(/\D/g, ""))
                  }
                  className="pe-10 text-center text-2xl tracking-[0.5em]"
                />
              </div>
            </div>

            <Button type="submit" size="lg" disabled={loading || otp.length < 6}>
              {loading && <Loader2 className="animate-spin" />}
              تأیید و ورود
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("phone")}
              >
                تغییر شماره
              </Button>
              <Button
                type="button"
                variant="link"
                disabled={resendIn > 0}
                onClick={async () => {
                  setLoading(true);
                  await sendOtp(phone);
                  setLoading(false);
                }}
              >
                {resendIn > 0 ? `ارسال مجدد تا ${toFaDigits(resendIn)} ثانیه` : "ارسال مجدد کد"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

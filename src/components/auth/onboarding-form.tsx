"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserRound, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const OCCUPATIONS = [
  "کابینت‌ساز",
  "نجار",
  "تولیدکننده درب و پنجره",
  "صفحه‌بر",
  "طراح داخلی",
  "سایر",
];

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    occupation: "",
  });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase || !isSupabaseConfigured) {
      router.replace("/dashboard");
      return;
    }
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }: { data: { user: User | null } }) => {
        if (!user) {
          router.replace("/login");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name,last_name,occupation,onboarded_at")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.onboarded_at) {
          router.replace("/dashboard");
          return;
        }
        setForm({
          first_name: profile?.first_name ?? "",
          last_name: profile?.last_name ?? "",
          occupation: profile?.occupation ?? "",
        });
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.occupation.trim()) {
      toast.error("لطفاً همه فیلدها را تکمیل کنید");
      return;
    }
    setSaving(true);
    const supabase = getSupabaseBrowser()!;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      router.replace("/login");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        occupation: form.occupation.trim(),
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) {
      toast.error("ذخیره‌سازی ناموفق بود", { description: error.message });
      setSaving(false);
      return;
    }
    toast.success("پروفایل شما تکمیل شد");
    router.replace("/dashboard");
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">تکمیل پروفایل</CardTitle>
        <CardDescription>
          با این اطلاعات در کنار کارشناسان پشتیبانی بهتر در ارتباط خواهید بود.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="text-primary size-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="first_name">نام</Label>
                <div className="relative">
                  <UserRound className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                  <Input
                    id="first_name"
                    placeholder="مثلاً علی"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="pe-10"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="last_name">نام خانوادگی</Label>
                <div className="relative">
                  <UserRound className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                  <Input
                    id="last_name"
                    placeholder="مثلاً رضایی"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="pe-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="occupation">شغل</Label>
              <div className="relative">
                <BriefcaseBusiness className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                <Input
                  id="occupation"
                  list="occupations"
                  placeholder="مثلاً کابینت‌ساز"
                  value={form.occupation}
                  onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                  className="pe-10"
                />
                <datalist id="occupations">
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              تکمیل و ورود به داشبورد
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

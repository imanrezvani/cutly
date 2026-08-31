import Link from "next/link";
import { Scissors, Printer, Smartphone, ShieldCheck, ArrowLeft, Ruler, FileDown } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Scissors,
    title: "کاهش ضایعات ورق",
    description:
      "الگوریتم گیلوتین هوشمند، قطعات را هوشمندانه در کنار هم می‌چیند تا کمترین ورق مصرف شود و ضایعات به حداقل برسد.",
  },
  {
    icon: Printer,
    title: "نقشه آماده چاپ",
    description:
      "خروجی PDF حرفه‌ای با ابعاد دقیق و نام هر قطعه؛ مستقیم به کارگاه بدهید و برش بزنید.",
  },
  {
    icon: Smartphone,
    title: "کار روی موبایل",
    description:
      "در محل کارگاه و حتی کنار دستگاه اره، پروژه‌ها را روی گوشی بسازید و ویرایش کنید.",
  },
  {
    icon: ShieldCheck,
    title: "ذخیره ابری امن",
    description:
      "پروژه‌های شما با احراز هویت و جداسازی کامل داده‌ها، همیشه امن و در دسترس است.",
  },
];

const STEPS = [
  {
    num: "۱",
    title: "قطعات را وارد کنید",
    description: "نام، طول، عرض و تعداد هر قطعه را به سادگی وارد می‌کنید.",
  },
  {
    num: "۲",
    title: "بهینه‌سازی خودکار",
    description: "سیستم بهترین چیدمان برش را با رعایت کرِف اره و جهت دانه محاسبه می‌کند.",
  },
  {
    num: "۳",
    title: "نقشه را چاپ کنید",
    description: "نقشه رنگی به‌همراه ابعاد هر قطعه را دانلود و به کارگاه تحویل می‌دهید.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="کاتلی">
            <Logo />
          </Link>
          <Button asChild variant="outline" size="default">
            <Link href="/login">
              ورود با شماره موبایل
            </Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-32 right-1/2 h-96 w-[42rem] translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-16 pb-20 md:grid-cols-2 md:items-center md:pt-24">
            <div className="text-center md:text-right">
              <span className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium">
                ویژه صنعت کابینت و نجاری ایران
              </span>
              <h1 className="text-foreground text-balance text-4xl leading-[1.15] font-extrabold md:text-5xl">
                برش پنل را
                <span className="text-primary"> هوشمند </span>
                و بدون ضایعات انجام بده
              </h1>
              <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg leading-8 md:mx-0">
                کاتلی با محاسبه هوشمند چیدمان برش، تعداد ورق مصرفی و درصد ضایعات
                را بهینه می‌کند و نقشه آماده چاپ تحویل می‌دهد.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/login">
                    شروع رایگان
                    <ArrowLeft className="rtl:rotate-180" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/login">ورود به حساب</Link>
                </Button>
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                بدون نیاز به کارت بانکی · حالت مهمان برای تست
              </p>
            </div>

            <div className="mx-auto w-full max-w-md md:max-w-none">
              <div className="rounded-2xl border bg-white p-3 shadow-xl">
                <div className="flex items-center justify-between px-3 pb-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Ruler className="size-3.5" />
                    نقشه برش نمونه
                  </span>
                  <span>۲۴۴۰ × ۱۲۲۰</span>
                </div>
                <div
                  className="relative w-full rounded-lg border-2 border-foreground/70 bg-slate-50"
                  style={{ aspectRatio: "2 / 1" }}
                  dir="ltr"
                >
                  {[
                    { x: 0, y: 0, w: 33, h: 32, c: "#2563eb", n: "بدنه", d: "۶۰۰×۴۰۰" },
                    { x: 0, y: 32, w: 33, h: 34, c: "#16a34a", n: "قفسه", d: "۶۰۰×۴۰۰" },
                    { x: 33, y: 0, w: 30, h: 66, c: "#d97706", n: "درب", d: "۶۰۰×۹۰۰" },
                    { x: 63, y: 0, w: 16, h: 40, c: "#dc2626", n: "کناره", d: "۴۰۰×۵۰۰" },
                    { x: 63, y: 40, w: 16, h: 26, c: "#7c3aed", n: "کناره", d: "۴۰۰×۳۰۰" },
                    { x: 79, y: 0, w: 21, h: 66, c: "#0d9488", n: "درب", d: "۴۵۰×۹۰۰" },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className="absolute flex flex-col items-center justify-center overflow-hidden rounded-[2px] text-center"
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.w}%`,
                        height: `${p.h}%`,
                        backgroundColor: p.c,
                      }}
                    >
                      <span className="text-xs font-bold">{p.n}</span>
                      <span className="text-[10px] text-foreground/80">{p.d}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between px-1 text-xs">
                  <span className="text-muted-foreground">۶ قطعه در یک ورق</span>
                  <span className="bg-success/15 text-success inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold">
                    <FileDown className="size-3.5" />
                    ضایعات فقط ۱۲٪
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <h2 className="text-foreground text-center text-3xl font-extrabold">
            چرا کاتلی؟
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center leading-8">
            محاسبه دستی چیدمان برش، وقت‌گیر و پرخطاست. کاتلی این کار را در چند
            ثانیه و با دقت انجام می‌دهد.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col items-start gap-4 pt-6">
                  <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
                    <f.icon className="size-6" />
                  </span>
                  <h3 className="text-lg font-bold">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-7">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-card border-y py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-foreground text-center text-3xl font-extrabold">
              چطور کار می‌کند؟
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.num} className="relative flex flex-col items-center text-center">
                  {i < STEPS.length - 1 && (
                    <span className="text-primary absolute top-8 -left-4 hidden text-2xl md:block">
                      ←
                    </span>
                  )}
                  <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl text-2xl font-extrabold shadow-md">
                    {s.num}
                  </span>
                  <h3 className="text-foreground mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="text-muted-foreground mt-2 max-w-xs leading-7">{s.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button asChild size="lg">
                <Link href="/login">
                  همین حالا شروع کنید — رایگان
                  <ArrowLeft className="rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <Logo withText={false} />
          <p className="text-muted-foreground text-sm">
            کاتلی — بهینه‌ساز هوشمند برش پنل برای کابینت و نجاری
          </p>
          <p className="text-muted-foreground text-xs">© ۱۴۰۴ کاتلی</p>
        </div>
      </footer>
    </div>
  );
}

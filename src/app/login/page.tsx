import type { Metadata } from "next";
import Link from "next/link";
import { PhoneLogin } from "@/components/auth/phone-login";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "ورود | کاتلی",
  description: "ورود یا ثبت‌نام با شماره موبایل در کاتلی",
};

export default function LoginPage() {
  return (
    <main className="bg-muted/40 flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Link href="/" aria-label="بازگشت به صفحه اصلی">
          <Logo />
        </Link>
      </div>
      <div className="w-full max-w-md">
        <PhoneLogin />
      </div>
      <p className="text-muted-foreground mt-6 text-center text-xs leading-6">
        با ورود به کاتلی، <Link href="/login" className="text-primary underline">قوانین استفاده</Link> را می‌پذیرید.
        <br />
        اطلاعات شما با احراز هویت و جداسازی کامل داده‌ها محافظت می‌شود.
      </p>
    </main>
  );
}

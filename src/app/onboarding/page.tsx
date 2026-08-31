import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "تکمیل پروفایل | کاتلی",
  description: "تکمیل اطلاعات حساب کاربری در کاتلی",
};

export default function OnboardingPage() {
  return (
    <main className="bg-muted/40 flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Link href="/" aria-label="بازگشت به صفحه اصلی">
          <Logo />
        </Link>
      </div>
      <div className="w-full max-w-lg">
        <OnboardingForm />
      </div>
    </main>
  );
}

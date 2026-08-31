import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "داشبورد",
  description: "مدیریت پروژه‌های برش پنل در کاتلی",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="bg-primary size-8 animate-spin rounded-full border-2 border-transparent border-t-current" />
        </div>
      }
    >
      <DashboardView />
    </Suspense>
  );
}

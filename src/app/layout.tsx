import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "کاتلی | بهینه‌ساز برش پنل",
    template: "%s | کاتلی",
  },
  description:
    "کاتلی؛ ابزار حرفه‌ای بهینه‌سازی برش پنل برای صنعت کابینت و نجاری. کاهش ضایعات، محاسبه خودکار چیدمان و نقشه آماده چاپ.",
  applicationName: "کاتلی",
  keywords: ["برش پنل", "بهینه‌ساز برش", "کابینت", "نجاری", "نقشه برش"],
  openGraph: {
    title: "کاتلی | بهینه‌ساز برش پنل",
    description:
      "ابزار حرفه‌ای بهینه‌سازی برش پنل برای صنعت کابینت و نجاری. کاهش ضایعات و نقشه آماده چاپ.",
    type: "website",
    locale: "fa_IR",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${vazir.variable} antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

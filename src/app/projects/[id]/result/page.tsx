import type { Metadata } from "next";
import { ResultView } from "@/components/results/result-view";

export const metadata: Metadata = {
  title: "نقشه برش",
  description: "نقشه برش بهینه شده و خروجی PDF در کاتلی",
};

export default function ResultPage() {
  return <ResultView />;
}

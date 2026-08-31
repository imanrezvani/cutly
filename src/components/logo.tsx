import { Scissors, Grid2X2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="bg-primary text-primary-foreground relative inline-flex size-10 items-center justify-center rounded-xl shadow-md">
        <Scissors className="size-5" />
        <Grid2X2 className="absolute -bottom-1 -left-1 size-4 rounded bg-white/20 p-0.5" />
      </span>
      {withText && (
        <span className="text-foreground text-2xl font-extrabold tracking-tight">
          کاتلی
          <span className="text-primary ms-1 text-sm font-semibold align-middle">
            Cutly
          </span>
        </span>
      )}
    </span>
  );
}

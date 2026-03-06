import { Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardLoadingPanelProps = {
  label?: string;
  className?: string;
};

export function DashboardLoadingPanel({
  label = "Loading data...",
  className,
}: DashboardLoadingPanelProps) {
  return (
    <Card
      className={cn(
        "items-center justify-center gap-3 rounded-2xl border-dashed border-border/70 bg-card/80 px-6 py-14 text-center shadow-sm",
        className,
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

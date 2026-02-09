"use client";

import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  title: string;
  actions?: React.ReactNode;
  className?: string;
};

export function DashboardHeader({
  title,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 px-4 py-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="border border-border bg-white text-muted-foreground shadow-sm hover:bg-white" />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {actions}
      </div>
    </header>
  );
}

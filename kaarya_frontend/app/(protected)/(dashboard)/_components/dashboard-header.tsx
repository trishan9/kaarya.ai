"use client";

import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  title: string;
  actions?: React.ReactNode;
  className?: string;
  leadingAction?: React.ReactNode;
  hideSidebarTrigger?: boolean;
};

export function DashboardHeader({
  title,
  actions,
  className,
  leadingAction,
  hideSidebarTrigger = false,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 px-4 py-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {leadingAction ?? (!hideSidebarTrigger ? (
          <SidebarTrigger className="border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent" />
        ) : null)}
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {actions}
      </div>
    </header>
  );
}

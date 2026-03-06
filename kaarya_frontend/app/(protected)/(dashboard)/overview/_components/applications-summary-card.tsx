"use client";

import * as React from "react";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ApplicationsSummaryStatus =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "interview_scheduled"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type ApplicationsSummaryTab = {
  key: string;
  label: string;
  count: number;
  statuses?: ApplicationsSummaryStatus[];
};

export type ApplicationsSummaryMonthOption = {
  key: string;
  label: string;
};

export type ApplicationsSummaryCompany = {
  workspaceId: string;
  workspaceType: "company" | "college";
  name: string;
  logo?: string | null;
  applicationsCount: number;
};

export type ApplicationsSummaryCardProps = {
  total: number;
  delta: number;
  todayCount: number;
  monthLabel: string;
  monthKey: string;
  monthOptions: ApplicationsSummaryMonthOption[];
  tabs: ApplicationsSummaryTab[];
  activeTab: string;
  recentCompanies: ApplicationsSummaryCompany[];
};

export function ApplicationsSummaryCard({
  total,
  delta,
  todayCount,
  monthLabel,
  monthKey,
  monthOptions,
  tabs,
  activeTab,
  recentCompanies,
}: ApplicationsSummaryCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safeMonthOptions = React.useMemo(
    () =>
      monthOptions.map((option, index) => {
        const rawOption =
          option && typeof option === "object"
            ? (option as {
                key?: unknown;
                label?: unknown;
              })
            : null;
        const resolvedKey =
          typeof rawOption?.key === "string" && rawOption.key.trim().length > 0
            ? rawOption.key
            : typeof rawOption?.label === "string" && rawOption.label.trim().length > 0
              ? rawOption.label
              : `month-${index + 1}`;
        const resolvedLabel =
          typeof rawOption?.label === "string" && rawOption.label.trim().length > 0
            ? rawOption.label
            : resolvedKey;

        return {
          id: `${String(resolvedKey)}-${index}`,
          key: String(resolvedKey),
          label: resolvedLabel,
        };
      }),
    [monthOptions],
  );

  const updateFilters = React.useCallback(
    (input: { monthKey?: string; tabKey?: string }) => {
      const nextParams = new URLSearchParams(searchParams?.toString());

      const nextMonthKey = input.monthKey ?? monthKey;
      const nextTabKey = input.tabKey ?? activeTab;
      const selectedTab = tabs.find((tab) => tab.key === nextTabKey) ?? tabs[0];

      if (nextMonthKey) {
        nextParams.set("month", nextMonthKey);
      } else {
        nextParams.delete("month");
      }

      if (selectedTab?.key) {
        nextParams.set("tab", selectedTab.key);
      } else {
        nextParams.delete("tab");
      }

      if (selectedTab?.statuses?.length) {
        nextParams.set("statuses", selectedTab.statuses.join(","));
      } else {
        nextParams.delete("statuses");
      }

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [activeTab, monthKey, pathname, router, searchParams, tabs],
  );

  const deltaLabel = delta >= 0 ? `+${delta}` : `${delta}`;
  const deltaTone =
    delta > 0 ? "text-emerald-500" : delta < 0 ? "text-rose-500" : "text-muted-foreground";

  return (
    <Card className="min-w-0 gap-4 border-border bg-card p-4 shadow-sm dark:bg-[#111824] dark:shadow-none sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Applications Summary
          </h2>
          <p className="text-xs text-muted-foreground">
            Live application pipeline snapshot.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-border bg-muted/70 text-xs font-semibold text-foreground"
            >
              {monthLabel}
              <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Select month</DropdownMenuLabel>
            {safeMonthOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onSelect={() => updateFilters({ monthKey: option.key })}
                className="flex items-center justify-between text-xs"
              >
                {option.label}
                {option.key === monthKey ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => updateFilters({ tabKey: tab.key })}
              className={cn(
                "h-8 rounded-md border border-border px-3 text-xs transition-colors",
                isActive
                  ? "border-transparent bg-primary font-medium text-white"
                  : "bg-card text-muted-foreground hover:border-primary hover:text-primary",
              )}
              aria-pressed={isActive}
              type="button"
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="mb-1 flex flex-wrap items-end gap-3">
          <div className="text-4xl font-semibold text-foreground sm:text-5xl">
            {total}
          </div>
          <div className="mb-1.5 flex items-center -space-x-2.5">
            {recentCompanies.slice(0, 4).map((company) => (
              <span
                key={company.workspaceId}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-background bg-background text-[10px] font-semibold shadow-sm"
              >
                {company.logo ? (
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  company.name.slice(0, 1).toUpperCase()
                )}
              </span>
            ))}
            {recentCompanies.length > 4 ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-background bg-primary/15 text-xs font-semibold text-primary shadow-sm">
                +{recentCompanies.length - 4}
              </span>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          <span className={cn("font-semibold", deltaTone)}>{deltaLabel} </span>
          compared to last month. {todayCount} applications submitted today.
        </p>
      </div>

      {recentCompanies.length > 0 ? (
        <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recently Applied Companies
          </p>
          <div className="flex flex-wrap gap-2">
            {recentCompanies.map((company) => (
              <span
                key={`${company.workspaceId}-${company.workspaceType}`}
                className="rounded-md bg-card px-2 py-1 text-xs text-foreground shadow-sm"
              >
                {company.name} ({company.applicationsCount})
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No applications recorded for this filter yet.
        </p>
      )}
    </Card>
  );
}

"use client";

import * as React from "react";

import { Check, ChevronDown } from "lucide-react";

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

type ApplicationsSummaryCardProps = {
  total: number;
  delta: number;
  monthLabel: string;
  tabs: string[];
  activeTab: string;
  emojis?: string[];
  extraCount?: number;
};

export function ApplicationsSummaryCard({
  total,
  delta,
  monthLabel,
  tabs,
  activeTab,
  emojis = ["🔥", "😍", "🎯", "🚀"],
  extraCount = 8,
}: ApplicationsSummaryCardProps) {
  const [currentTab, setCurrentTab] = React.useState(activeTab);
  const [currentMonth, setCurrentMonth] = React.useState(monthLabel);
  const monthOptions = React.useMemo(() => {
    const defaults = [monthLabel, "October, 2025", "September, 2025"];
    return Array.from(new Set(defaults));
  }, [monthLabel]);

  return (
    <Card className="gap-4 border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Applications Summary
          </h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-border bg-muted/70 text-xs font-semibold text-foreground"
            >
              {currentMonth}
              <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Select month</DropdownMenuLabel>
            {monthOptions.map((option) => (
              <DropdownMenuItem
                key={option}
                onSelect={() => setCurrentMonth(option)}
                className="flex items-center justify-between text-xs"
              >
                {option}
                {option === currentMonth ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const isActive = tab === currentTab;
          return (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={cn(
                "h-8 rounded-md border border-border px-3 text-xs transition-colors cursor-pointer",
                isActive
                  ? "border-transparent bg-primary text-white font-medium"
                  : "bg-white text-muted-foreground hover:border-primary hover:text-primary",
              )}
              aria-pressed={isActive}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-3xl font-semibold text-foreground">{total}</div>
        <div className="flex items-center -space-x-2">
          {emojis.map((emoji) => (
            <span
              key={emoji}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-white text-xs shadow-sm"
            >
              {emoji}
            </span>
          ))}
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-[#e9f2fb] text-[10px] font-semibold text-[#0b67c2] shadow-sm">
            +{extraCount}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-emerald-500">+{delta} </span>
        applications has been sent to the recruiters today, great work, hope the
        best for you!
      </p>
    </Card>
  );
}

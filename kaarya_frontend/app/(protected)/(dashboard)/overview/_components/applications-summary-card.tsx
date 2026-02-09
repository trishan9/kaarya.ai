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
import Image from "next/image";

export type ApplicationsSummaryCardProps = {
  total: number;
  delta: number;
  monthLabel: string;
  monthOptions?: string[];
  tabs: string[];
  activeTab: string;
  logos?: string[];
  extraCount?: number;
};

export function ApplicationsSummaryCard({
  total,
  delta,
  monthLabel,
  monthOptions,
  tabs,
  activeTab,
  logos = [
    "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770473342/kaarya/lnzrl9t7liqdt7pmquxt.png",
    "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770357829/kaarya/tl0x4mtzklebkdsbl50b.png",
    "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770473353/kaarya/acy5rbpegmme5jgree6w.png",
    "https://res.cloudinary.com/dnqet3vq1/image/upload/v1770466148/kaarya/xpn5jf1sxap5ialnqzka.webp",
  ],
  extraCount = 8,
}: ApplicationsSummaryCardProps) {
  const [currentTab, setCurrentTab] = React.useState(activeTab);
  const [currentMonth, setCurrentMonth] = React.useState(monthLabel);
  const availableMonths = React.useMemo(() => {
    if (monthOptions?.length) {
      return monthOptions;
    }

    return [monthLabel];
  }, [monthLabel, monthOptions]);

  return (
    <Card className="min-w-0 gap-4 border-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
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
            {availableMonths.map((option) => (
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

      <div>
        <div className="mb-1 flex flex-wrap items-end gap-3">
          <div className="text-4xl font-semibold text-foreground sm:text-5xl">
            {total}
          </div>
          <div className="mb-1.5 flex items-center -space-x-2.5">
            {logos.map((logo: string) => (
              <span
                key={logo}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white text-xs shadow-sm"
              >
                <Image
                  src={logo}
                  alt={logo}
                  width={32}
                  height={32}
                  className="object-cover rounded-full border border-white shadow-sm h-8 w-8"
                />
              </span>
            ))}
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#e9f2fb] text-xs font-semibold text-[#0b67c2] shadow-sm">
              +{extraCount}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-emerald-500">+{delta} </span>
          applications has been sent to the recruiters today, great work, hope
          the best for you!
        </p>
      </div>
    </Card>
  );
}

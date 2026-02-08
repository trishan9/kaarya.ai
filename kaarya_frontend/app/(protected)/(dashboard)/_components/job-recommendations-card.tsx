"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobCard, type JobCardProps } from "./job-card";

export type JobRecommendationsCardProps = {
  title: string;
  tabs: string[];
  activeTab: string;
  jobsByTab: Record<string, JobCardProps[]>;
  seeAllLabel?: string;
  seeAllHref?: string;
  showToolbar?: boolean;
  sortLabel?: string;
  filterLabel?: string;
  emptyMessage?: string;
  surface?: "card" | "plain";
  gridClassName?: string;
  titleClassName?: string;
  className?: string;
};

export function JobRecommendationsCard({
  title,
  tabs,
  activeTab,
  jobsByTab,
  seeAllLabel,
  seeAllHref,
  showToolbar = false,
  sortLabel = "Sort By",
  filterLabel = "Filter",
  emptyMessage = "No jobs found for this category yet.",
  surface = "card",
  gridClassName,
  titleClassName = "font-semibold text-base leading-tight",
  className,
}: JobRecommendationsCardProps) {
  const availableTabs = React.useMemo(
    () => (tabs.length > 0 ? tabs : Object.keys(jobsByTab)),
    [jobsByTab, tabs],
  );

  const [currentTab, setCurrentTab] = React.useState(() => {
    if (availableTabs.includes(activeTab)) return activeTab;
    return availableTabs[0] ?? "";
  });

  const jobs = jobsByTab[currentTab] ?? [];

  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={cn("text-foreground", titleClassName)}>{title}</h3>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-xs font-semibold text-[#0b67c2]"
          >
            {seeAllLabel ?? "See All"}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {availableTabs.map((tab) => {
            const isActive = tab === currentTab;
            return (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm transition-colors cursor-pointer",
                  isActive
                    ? "border-primary bg-primary font-medium text-white"
                    : "border-[#d8dde4] bg-white text-muted-foreground hover:border-primary hover:text-primary",
                )}
                aria-pressed={isActive}
                type="button"
              >
                {tab}
              </button>
            );
          })}
        </div>

        {showToolbar ? (
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border-[#d8dde4] bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-white"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border-[#d8dde4] bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-white"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {filterLabel}
            </Button>
          </div>
        ) : null}
      </div>

      {jobs.length > 0 ? (
        <div className={cn("grid gap-4 md:grid-cols-2", gridClassName)}>
          {jobs.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d8dde4] p-6 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </>
  );

  if (surface === "plain") {
    return <section className={cn("space-y-4", className)}>{content}</section>;
  }

  return (
    <Card
      className={cn(
        "min-w-0 gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      {content}
    </Card>
  );
}

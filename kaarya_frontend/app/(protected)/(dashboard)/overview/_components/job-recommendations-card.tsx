"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { JobCard, type JobCardProps } from "./job-card";

export type JobRecommendationsCardProps = {
  title?: string;
  seeAllLabel?: string;
  seeAllHref?: string;
  tabs: string[];
  activeTab: string;
  jobs: JobCardProps[];
};

export function JobRecommendationsCard({
  title = "Job Recommendations",
  seeAllLabel = "See All",
  seeAllHref = "/jobs",
  tabs,
  activeTab,
  jobs,
}: JobRecommendationsCardProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = React.useState(activeTab);

  return (
    <Card className="gap-4 border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <button
          className="flex items-center gap-1 text-xs font-semibold text-primary cursor-pointer"
          onClick={() => router.push(seeAllHref)}
        >
          {seeAllLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
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

      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job, index) => (
          <JobCard key={`${job.title}-${job.company}-${index}`} {...job} />
        ))}
      </div>
    </Card>
  );
}

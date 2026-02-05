"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { JobCard } from "./job-card";

type JobRecommendationsCardProps = {
  tabs: string[];
  activeTab: string;
};

export function JobRecommendationsCard({
  tabs,
  activeTab,
}: JobRecommendationsCardProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = React.useState(activeTab);

  return (
    <Card className="gap-4 border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Job Recommendations
        </h3>
        <button
          className="flex items-center gap-1 text-xs font-semibold text-[#0b67c2]"
          onClick={() => router.push("/jobs")}
        >
          See All
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
                "h-8 rounded-md border border-border px-3 text-xs font-semibold transition-colors",
                isActive
                  ? "border-transparent bg-[#0b67c2] text-white"
                  : "bg-white text-muted-foreground hover:border-[#0b67c2] hover:text-[#0b67c2]",
              )}
              aria-pressed={isActive}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <JobCard
          title="Backend Software Engineer"
          company="Kaarya Co. Inc."
          location="Kathmandu, Bagmati"
          type="Full-Time"
          salary="NPR 10,00,000 - NPR 15,00,000"
          badge="Suit You Best!"
          accent="blue"
        />
        <JobCard
          title="Frontend Software Engineer"
          company="Softwarica College of IT & E-commerce"
          location="Kathmandu, Bagmati"
          type="Full-Time"
          salary="NPR 10,00,000 - NPR 15,00,000"
          badge="Suit You Best!"
          accent="green"
        />
      </div>
    </Card>
  );
}

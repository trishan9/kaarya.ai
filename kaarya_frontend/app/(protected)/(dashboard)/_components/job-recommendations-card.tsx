"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronRight, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobCard, type JobCardProps } from "./job-card";

type JobSortValue =
  | "recommended"
  | "newest"
  | "salary_high_to_low"
  | "salary_low_to_high"
  | "title_asc"
  | "company_asc";

type JobFilterState = {
  statusLabel: string[];
  employmentType: string[];
  engagementType: string[];
  location: string[];
};

const DEFAULT_FILTER_STATE: JobFilterState = {
  statusLabel: [],
  employmentType: [],
  engagementType: [],
  location: [],
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function parseSalaryNumbers(salaryRange: string) {
  const parsed = salaryRange
    .match(/[\d,]+/g)
    ?.map((part) => Number.parseInt(part.replaceAll(",", ""), 10))
    .filter((value) => Number.isFinite(value));

  if (!parsed || parsed.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: parsed[0] ?? 0,
    max: parsed[1] ?? parsed[0] ?? 0,
  };
}

function parsePostedHours(postedAt: string | undefined) {
  if (!postedAt) return Number.MAX_SAFE_INTEGER;

  const value = postedAt.trim().toLowerCase();
  if (value.includes("just") || value === "now") return 0;

  const match = value.match(/(\d+)\s*(mo|w|d|h|m)/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];

  if (!Number.isFinite(amount)) return Number.MAX_SAFE_INTEGER;

  if (unit === "h") return amount;
  if (unit === "d") return amount * 24;
  if (unit === "w") return amount * 24 * 7;
  if (unit === "mo") return amount * 24 * 30;
  return amount / 60;
}

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
  onJobBookmarkChange?: (jobId: string, saved: boolean) => void;
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
  onJobBookmarkChange,
}: JobRecommendationsCardProps) {
  const availableTabs = React.useMemo(
    () => (tabs.length > 0 ? tabs : Object.keys(jobsByTab)),
    [jobsByTab, tabs],
  );

  const [currentTab, setCurrentTab] = React.useState(() => {
    if (availableTabs.includes(activeTab)) return activeTab;
    return availableTabs[0] ?? "";
  });

  const [sortBy, setSortBy] = React.useState<JobSortValue>("recommended");
  const [filterState, setFilterState] =
    React.useState<JobFilterState>(DEFAULT_FILTER_STATE);

  const currentTabJobs = React.useMemo(
    () => jobsByTab[currentTab] ?? [],
    [currentTab, jobsByTab],
  );

  const filterOptions = React.useMemo(
    () => ({
      statusLabel: uniqueValues(currentTabJobs.map((job) => job.statusLabel)),
      employmentType: uniqueValues(currentTabJobs.map((job) => job.employmentType)),
      engagementType: uniqueValues(currentTabJobs.map((job) => job.engagementType)),
      location: uniqueValues(currentTabJobs.map((job) => job.location)),
    }),
    [currentTabJobs],
  );

  const activeFilterCount = React.useMemo(
    () =>
      filterState.statusLabel.length +
      filterState.employmentType.length +
      filterState.engagementType.length +
      filterState.location.length,
    [filterState],
  );

  const filteredJobs = React.useMemo(
    () =>
      currentTabJobs.filter((job) => {
        const statusMatch =
          filterState.statusLabel.length === 0 ||
          filterState.statusLabel.includes(job.statusLabel);

        const employmentMatch =
          filterState.employmentType.length === 0 ||
          filterState.employmentType.includes(job.employmentType);

        const engagementMatch =
          filterState.engagementType.length === 0 ||
          filterState.engagementType.includes(job.engagementType);

        const locationMatch =
          filterState.location.length === 0 ||
          filterState.location.includes(job.location);

        return statusMatch && employmentMatch && engagementMatch && locationMatch;
      }),
    [currentTabJobs, filterState],
  );

  const visibleJobs = React.useMemo(() => {
    const jobsToSort = [...filteredJobs];

    if (sortBy === "newest") {
      jobsToSort.sort(
        (a, b) => parsePostedHours(a.postedAt) - parsePostedHours(b.postedAt),
      );
    }

    if (sortBy === "salary_high_to_low") {
      jobsToSort.sort((a, b) => {
        const aSalary = parseSalaryNumbers(a.salaryRange).max;
        const bSalary = parseSalaryNumbers(b.salaryRange).max;
        return bSalary - aSalary;
      });
    }

    if (sortBy === "salary_low_to_high") {
      jobsToSort.sort((a, b) => {
        const aSalary = parseSalaryNumbers(a.salaryRange).min;
        const bSalary = parseSalaryNumbers(b.salaryRange).min;
        return aSalary - bSalary;
      });
    }

    if (sortBy === "title_asc") {
      jobsToSort.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === "company_asc") {
      jobsToSort.sort((a, b) => a.company.localeCompare(b.company));
    }

    return jobsToSort;
  }, [filteredJobs, sortBy]);

  const toggleFilter = React.useCallback(
    (
      key: keyof JobFilterState,
      optionValue: string,
      checked: boolean | "indeterminate",
    ) => {
      setFilterState((prev) => {
        const previousValues = prev[key];
        const nextValues =
          checked === true
            ? [...previousValues, optionValue]
            : previousValues.filter((value) => value !== optionValue);

        return {
          ...prev,
          [key]: nextValues,
        };
      });
    },
    [],
  );

  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={cn("text-foreground", titleClassName)}>{title}</h3>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
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
                onClick={() => {
                  setCurrentTab(tab);
                  setFilterState(DEFAULT_FILTER_STATE);
                }}
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm transition-colors cursor-pointer",
                  isActive
                    ? "border-primary bg-primary font-medium text-white"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-border bg-card px-3 text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort jobs</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as JobSortValue)}
                >
                  <DropdownMenuRadioItem value="recommended">
                    Recommended
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="salary_high_to_low">
                    Salary: High to Low
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="salary_low_to_high">
                    Salary: Low to High
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title_asc">
                    Title: A-Z
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="company_asc">
                    Company: A-Z
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-border bg-card px-3 text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {filterLabel}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Filter jobs</span>
                  <button
                    type="button"
                    className="cursor-pointer text-xs font-medium text-primary"
                    onClick={() => setFilterState(DEFAULT_FILTER_STATE)}
                  >
                    Clear all
                  </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Status
                </DropdownMenuLabel>
                {filterOptions.statusLabel.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={`status-${value}`}
                    checked={filterState.statusLabel.includes(value)}
                    onCheckedChange={(checked) =>
                      toggleFilter("statusLabel", value, checked)
                    }
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Job Type
                </DropdownMenuLabel>
                {filterOptions.employmentType.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={`type-${value}`}
                    checked={filterState.employmentType.includes(value)}
                    onCheckedChange={(checked) =>
                      toggleFilter("employmentType", value, checked)
                    }
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Mode
                </DropdownMenuLabel>
                {filterOptions.engagementType.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={`engagement-${value}`}
                    checked={filterState.engagementType.includes(value)}
                    onCheckedChange={(checked) =>
                      toggleFilter("engagementType", value, checked)
                    }
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Location
                </DropdownMenuLabel>
                {filterOptions.location.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={`location-${value}`}
                    checked={filterState.location.includes(value)}
                    onCheckedChange={(checked) =>
                      toggleFilter("location", value, checked)
                    }
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      {visibleJobs.length > 0 ? (
        <div className={cn("grid gap-4 md:grid-cols-2", gridClassName)}>
          {visibleJobs.map((job) => (
            <JobCard
              key={job.id}
              {...job}
              onBookmarkChange={(jobId, saved) =>
                onJobBookmarkChange?.(jobId, saved)
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
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
        "min-w-0 gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-[#111824] dark:shadow-none sm:p-5",
        className,
      )}
    >
      {content}
    </Card>
  );
}

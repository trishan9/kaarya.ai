"use client";

import * as React from "react";
import { ArrowDownUp, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import {
  InterviewOverallRatingPanel,
  type InterviewOverallRatingPanelProps,
} from "./interview-overall-rating-panel";
import {
  MockInterviewCard,
  type MockInterviewCardProps,
} from "./mock-interview-card";

type InterviewSortValue =
  | "recommended"
  | "popular"
  | "recent"
  | "score_high_to_low"
  | "title_asc"
  | "company_asc";

type InterviewFilterState = {
  categoryLabel: string[];
  attemptStatus: string[];
  company: string[];
};

const DEFAULT_FILTER_STATE: InterviewFilterState = {
  categoryLabel: [],
  attemptStatus: [],
  company: [],
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

export type MockInterviewRecommendationsCardProps = {
  title: string;
  tabs: string[];
  activeTab: string;
  interviewsByTab: Record<string, MockInterviewCardProps[]>;
  showToolbar?: boolean;
  sortLabel?: string;
  filterLabel?: string;
  emptyMessage?: string;
  gridClassName?: string;
  className?: string;
  sidePanelData?: InterviewOverallRatingPanelProps;
  seeAllLabel?: string;
  seeAllHref?: string;
};

export function MockInterviewRecommendationsCard({
  title,
  tabs,
  activeTab,
  interviewsByTab,
  showToolbar = false,
  sortLabel = "Sort By",
  filterLabel = "Filter",
  emptyMessage = "No interviews found for this category yet.",
  gridClassName,
  className,
  sidePanelData,
}: MockInterviewRecommendationsCardProps) {
  const availableTabs = React.useMemo(
    () => (tabs.length > 0 ? tabs : Object.keys(interviewsByTab)),
    [interviewsByTab, tabs],
  );

  const [currentTab, setCurrentTab] = React.useState(() => {
    if (availableTabs.includes(activeTab)) return activeTab;
    return availableTabs[0] ?? "";
  });
  const [sortBy, setSortBy] = React.useState<InterviewSortValue>("recommended");
  const [filterState, setFilterState] =
    React.useState<InterviewFilterState>(DEFAULT_FILTER_STATE);

  const currentTabInterviews = React.useMemo(
    () => interviewsByTab[currentTab] ?? [],
    [currentTab, interviewsByTab],
  );

  const filterOptions = React.useMemo(
    () => ({
      categoryLabel: uniqueValues(
        currentTabInterviews.map((interview) => interview.categoryLabel),
      ),
      attemptStatus: uniqueValues(
        currentTabInterviews.map((interview) => interview.attemptStatus),
      ),
      company: uniqueValues(currentTabInterviews.map((interview) => interview.company)),
    }),
    [currentTabInterviews],
  );

  const activeFilterCount = React.useMemo(
    () =>
      filterState.categoryLabel.length +
      filterState.attemptStatus.length +
      filterState.company.length,
    [filterState],
  );

  const filteredInterviews = React.useMemo(
    () =>
      currentTabInterviews.filter((interview) => {
        const categoryMatch =
          filterState.categoryLabel.length === 0 ||
          filterState.categoryLabel.includes(interview.categoryLabel);

        const attemptMatch =
          filterState.attemptStatus.length === 0 ||
          filterState.attemptStatus.includes(interview.attemptStatus);

        const companyMatch =
          filterState.company.length === 0 ||
          filterState.company.includes(interview.company);

        return categoryMatch && attemptMatch && companyMatch;
      }),
    [currentTabInterviews, filterState],
  );

  const visibleInterviews = React.useMemo(() => {
    const interviewsToSort = [...filteredInterviews];

    if (sortBy === "popular") {
      interviewsToSort.sort((a, b) => b.takenCount - a.takenCount);
    }

    if (sortBy === "recent") {
      interviewsToSort.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
    }

    if (sortBy === "score_high_to_low") {
      interviewsToSort.sort(
        (a, b) => (b.scoreValue ?? Number.NEGATIVE_INFINITY) - (a.scoreValue ?? Number.NEGATIVE_INFINITY),
      );
    }

    if (sortBy === "title_asc") {
      interviewsToSort.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === "company_asc") {
      interviewsToSort.sort((a, b) => a.company.localeCompare(b.company));
    }

    return interviewsToSort;
  }, [filteredInterviews, sortBy]);

  const toggleFilter = React.useCallback(
    (
      key: keyof InterviewFilterState,
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

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-base leading-tight text-foreground">{title}</h3>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {availableTabs.map((tab) => {
            const isActive = tab === currentTab;

            return (
              <button
                key={tab}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setCurrentTab(tab);
                  setFilterState(DEFAULT_FILTER_STATE);
                }}
                className={cn(
                  "h-9 cursor-pointer rounded-lg border px-3 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary font-medium text-white"
                    : "border-[#d8dde4] bg-white text-[#8f949e] hover:border-primary hover:text-primary",
                )}
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
                  className="h-9 rounded-lg border-[#d8dde4] bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-white"
                >
                  <ArrowDownUp className="h-4 w-4" />
                  {sortLabel}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort interviews</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as InterviewSortValue)}
                >
                  <DropdownMenuRadioItem value="recommended">
                    Recommended
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="popular">Most popular</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="recent">Newest</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="score_high_to_low">
                    Score: High to low
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title_asc">
                    Role: A-Z
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
                  className="h-9 rounded-lg border-[#d8dde4] bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-white"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {filterLabel}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Filter interviews</span>
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
                  Category
                </DropdownMenuLabel>
                {filterOptions.categoryLabel.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={`category-${value}`}
                    checked={filterState.categoryLabel.includes(value)}
                    onCheckedChange={(checked) =>
                      toggleFilter("categoryLabel", value, checked)
                    }
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Attempt
                </DropdownMenuLabel>
                {filterOptions.attemptStatus.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={`attempt-${value}`}
                    checked={filterState.attemptStatus.includes(value)}
                    onCheckedChange={(checked) =>
                      toggleFilter("attemptStatus", value, checked)
                    }
                  >
                    {value === "attempted" ? "Attempted" : "Not attempted"}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Company
                </DropdownMenuLabel>
                {filterOptions.company.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={`company-${value}`}
                    checked={filterState.company.includes(value)}
                    onCheckedChange={(checked) => toggleFilter("company", value, checked)}
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={cn("grid gap-4 md:grid-cols-2", gridClassName)}>
          {visibleInterviews.length > 0 ? (
            visibleInterviews.map((interview) => (
              <MockInterviewCard key={interview.id} {...interview} />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#d8dde4] p-6 text-sm text-muted-foreground md:col-span-2">
              {emptyMessage}
            </div>
          )}
        </div>

        {sidePanelData ? (
          <InterviewOverallRatingPanel {...sidePanelData} className="h-fit" />
        ) : null}
      </div>
    </section>
  );
}

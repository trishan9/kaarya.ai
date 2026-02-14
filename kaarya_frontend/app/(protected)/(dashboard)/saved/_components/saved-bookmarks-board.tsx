"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  JobRecommendationsCard,
  type JobRecommendationsCardProps,
} from "../../_components/job-recommendations-card";
import {
  MockInterviewRecommendationsCard,
  type MockInterviewRecommendationsCardProps,
} from "../../interview-hub/_components/mock-interview-recommendations-card";

type SavedContentType = "jobs" | "interviews";

export type SavedTypeOption = {
  value: SavedContentType;
  label: string;
  count: number;
};

type SavedJobsSection = Pick<
  JobRecommendationsCardProps,
  | "title"
  | "tabs"
  | "activeTab"
  | "jobsByTab"
  | "showToolbar"
  | "sortLabel"
  | "filterLabel"
  | "emptyMessage"
  | "surface"
  | "gridClassName"
>;

type SavedInterviewsSection = Pick<
  MockInterviewRecommendationsCardProps,
  | "title"
  | "tabs"
  | "activeTab"
  | "interviewsByTab"
  | "showToolbar"
  | "sortLabel"
  | "filterLabel"
  | "emptyMessage"
  | "gridClassName"
>;

export type SavedBookmarksBoardProps = {
  title: string;
  description: string;
  searchPlaceholder: string;
  typeOptions: SavedTypeOption[];
  defaultType: SavedContentType;
  jobsSection: SavedJobsSection;
  interviewsSection: SavedInterviewsSection;
};

function filterJobsByQuery(section: SavedJobsSection, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return section.jobsByTab;
  }

  return Object.fromEntries(
    Object.entries(section.jobsByTab).map(([tab, jobs]) => [
      tab,
      jobs.filter((job) =>
        [job.title, job.company, job.location].some((field) =>
          field.toLowerCase().includes(normalizedQuery),
        ),
      ),
    ]),
  );
}

function filterInterviewsByQuery(section: SavedInterviewsSection, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return section.interviewsByTab;
  }

  return Object.fromEntries(
    Object.entries(section.interviewsByTab).map(([tab, interviews]) => [
      tab,
      interviews.filter((interview) =>
        [interview.title, interview.company, interview.categoryLabel].some(
          (field) => field.toLowerCase().includes(normalizedQuery),
        ),
      ),
    ]),
  );
}

function removeItemFromTabMap<T extends { id: string }>(
  recordsByTab: Record<string, T[]>,
  recordId: string,
) {
  return Object.fromEntries(
    Object.entries(recordsByTab).map(([tab, records]) => [
      tab,
      records.filter((record) => record.id !== recordId),
    ]),
  ) as Record<string, T[]>;
}

function countUniqueRecords<T extends { id: string }>(
  recordsByTab: Record<string, T[]>,
) {
  return new Set(
    Object.values(recordsByTab)
      .flat()
      .map((record) => record.id),
  ).size;
}

export function SavedBookmarksBoard({
  title,
  description,
  searchPlaceholder,
  typeOptions,
  defaultType,
  jobsSection,
  interviewsSection,
}: SavedBookmarksBoardProps) {
  const [currentType, setCurrentType] = React.useState<SavedContentType>(defaultType);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [jobsByTab, setJobsByTab] = React.useState(jobsSection.jobsByTab);
  const [interviewsByTab, setInterviewsByTab] = React.useState(
    interviewsSection.interviewsByTab,
  );

  React.useEffect(() => {
    setJobsByTab(jobsSection.jobsByTab);
  }, [jobsSection.jobsByTab]);

  React.useEffect(() => {
    setInterviewsByTab(interviewsSection.interviewsByTab);
  }, [interviewsSection.interviewsByTab]);

  const dynamicTypeOptions = React.useMemo(
    () =>
      typeOptions.map((option) => ({
        ...option,
        count:
          option.value === "jobs"
            ? countUniqueRecords(jobsByTab)
            : countUniqueRecords(interviewsByTab),
      })),
    [interviewsByTab, jobsByTab, typeOptions],
  );

  const jobsSectionState = React.useMemo(
    () => ({ ...jobsSection, jobsByTab }),
    [jobsByTab, jobsSection],
  );
  const interviewsSectionState = React.useMemo(
    () => ({ ...interviewsSection, interviewsByTab }),
    [interviewsByTab, interviewsSection],
  );

  const filteredJobsByTab = React.useMemo(
    () => filterJobsByQuery(jobsSectionState, searchQuery),
    [jobsSectionState, searchQuery],
  );
  const filteredInterviewsByTab = React.useMemo(
    () => filterInterviewsByQuery(interviewsSectionState, searchQuery),
    [interviewsSectionState, searchQuery],
  );

  const handleJobBookmarkChange = React.useCallback(
    (jobId: string, saved: boolean) => {
      if (saved) return;
      setJobsByTab((prev) => removeItemFromTabMap(prev, jobId));
    },
    [],
  );

  const handleInterviewBookmarkChange = React.useCallback(
    (interviewId: string, saved: boolean) => {
      if (saved) return;
      setInterviewsByTab((prev) => removeItemFromTabMap(prev, interviewId));
    },
    [],
  );

  return (
    <section className="space-y-4 rounded-2xl border border-[#ececf0] bg-[#fcfdff] p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Tabs
        value={currentType}
        onValueChange={(value) => setCurrentType(value as SavedContentType)}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="grid h-9 w-full grid-cols-2 rounded-lg bg-muted/70 p-1 sm:w-[280px]">
            {dynamicTypeOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="h-7 rounded-md px-3 text-xs"
              >
                {option.label} ({option.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="relative w-full min-w-[240px] sm:ml-auto sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 rounded-lg border-[#d8dde4] bg-white pl-9"
            />
          </div>
        </div>

        <TabsContent value="jobs" className="outline-none">
          <JobRecommendationsCard
            title={jobsSection.title}
            tabs={jobsSection.tabs}
            activeTab={jobsSection.activeTab}
            jobsByTab={filteredJobsByTab}
            showToolbar={jobsSection.showToolbar}
            sortLabel={jobsSection.sortLabel}
            filterLabel={jobsSection.filterLabel}
            emptyMessage={jobsSection.emptyMessage}
            surface={jobsSection.surface}
            gridClassName={jobsSection.gridClassName}
            onJobBookmarkChange={handleJobBookmarkChange}
          />
        </TabsContent>

        <TabsContent value="interviews" className="outline-none">
          <MockInterviewRecommendationsCard
            title={interviewsSection.title}
            tabs={interviewsSection.tabs}
            activeTab={interviewsSection.activeTab}
            interviewsByTab={filteredInterviewsByTab}
            showToolbar={interviewsSection.showToolbar}
            sortLabel={interviewsSection.sortLabel}
            filterLabel={interviewsSection.filterLabel}
            emptyMessage={interviewsSection.emptyMessage}
            gridClassName={interviewsSection.gridClassName}
            onInterviewBookmarkChange={handleInterviewBookmarkChange}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}

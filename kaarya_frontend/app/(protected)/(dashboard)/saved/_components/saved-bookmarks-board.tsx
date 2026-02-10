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

  const filteredJobsByTab = React.useMemo(
    () => filterJobsByQuery(jobsSection, searchQuery),
    [jobsSection, searchQuery],
  );
  const filteredInterviewsByTab = React.useMemo(
    () => filterInterviewsByQuery(interviewsSection, searchQuery),
    [interviewsSection, searchQuery],
  );

  return (
    <section className="space-y-4">
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
          <TabsList className="h-auto w-fit gap-2 bg-transparent p-0">
            {typeOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="h-9 rounded-lg border border-[#d8dde4] bg-white px-3 text-sm text-[#8f949e] data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {option.label}
                <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-[10px] data-[state=active]:bg-white/20">
                  {option.count}
                </span>
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
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}

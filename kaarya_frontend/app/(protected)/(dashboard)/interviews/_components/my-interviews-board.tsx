"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MockInterviewCardProps } from "../../interview-hub/_components/mock-interview-card";
import { listMyInterviewSessions } from "@/lib/actions/interview-actions";

type InterviewSortValue =
  | "recently_created"
  | "popular"
  | "score_high_to_low"
  | "title_asc"
  | "company_asc";

type InterviewFilterState = {
  categoryLabel: string[];
  attemptStatus: string[];
};

const DEFAULT_FILTER_STATE: InterviewFilterState = {
  categoryLabel: [],
  attemptStatus: [],
};

export type CreateInterviewField = {
  id: string;
  label: string;
  placeholder: string;
  type?: "text" | "number";
  required?: boolean;
};

export type MyInterviewsBoardProps = {
  title: string;
  description: string;
  tabs: string[];
  activeTab: string;
  interviewsByTab: Record<string, MockInterviewCardProps[]>;
  showToolbar?: boolean;
  sortLabel?: string;
  filterLabel?: string;
  emptyMessage?: string;
  gridClassName?: string;
  sidePanelData?: unknown;
  createButtonLabel: string;
  createDialogTitle?: string;
  createDialogDescription?: string;
  createFields?: CreateInterviewField[];
  notesLabel?: string;
  notesPlaceholder?: string;
  saveDraftLabel?: string;
  publishLabel?: string;
};

const uniqueValues = (values: string[]) => Array.from(new Set(values));

const toStatusBadgeClassName = (status: MockInterviewCardProps["attemptStatus"]) =>
  status === "attempted"
    ? "bg-emerald-100 text-emerald-700 border-transparent"
    : "bg-blue-100 text-blue-700 border-transparent";

type AttemptRow = {
  id: string;
  status: string;
  createdAt: string;
  score: number | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const withReturnTo = (path: string, returnTo: string) =>
  `${path}${path.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(returnTo)}`;

export function MyInterviewsBoard({
  title,
  description,
  tabs,
  activeTab,
  interviewsByTab,
  sortLabel = "Sort By",
  filterLabel = "Filter",
  emptyMessage = "No interviews found for this view.",
  createButtonLabel,
}: MyInterviewsBoardProps) {
  const availableTabs = React.useMemo(
    () => (tabs.length > 0 ? tabs : Object.keys(interviewsByTab)),
    [interviewsByTab, tabs],
  );

  const [currentTab, setCurrentTab] = React.useState(() => {
    if (availableTabs.includes(activeTab)) return activeTab;
    return availableTabs[0] ?? "";
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] =
    React.useState<InterviewSortValue>("recently_created");
  const [filterState, setFilterState] =
    React.useState<InterviewFilterState>(DEFAULT_FILTER_STATE);
  const [selectedInterviewId, setSelectedInterviewId] = React.useState<string | null>(
    null,
  );
  const [attemptsByInterview, setAttemptsByInterview] = React.useState<
    Record<string, AttemptRow[]>
  >({});
  const [attemptLoading, setAttemptLoading] = React.useState(false);

  const allInterviews = React.useMemo(
    () => Object.values(interviewsByTab).flat(),
    [interviewsByTab],
  );
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
    }),
    [currentTabInterviews],
  );

  const activeFilterCount = React.useMemo(
    () => filterState.categoryLabel.length + filterState.attemptStatus.length,
    [filterState],
  );

  const filteredInterviews = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return currentTabInterviews.filter((interview) => {
      const queryMatch =
        query.length === 0 ||
        interview.title.toLowerCase().includes(query) ||
        interview.company.toLowerCase().includes(query) ||
        interview.categoryLabel.toLowerCase().includes(query);
      const categoryMatch =
        filterState.categoryLabel.length === 0 ||
        filterState.categoryLabel.includes(interview.categoryLabel);
      const attemptMatch =
        filterState.attemptStatus.length === 0 ||
        filterState.attemptStatus.includes(interview.attemptStatus);

      return queryMatch && categoryMatch && attemptMatch;
    });
  }, [currentTabInterviews, filterState, searchQuery]);

  const visibleInterviews = React.useMemo(() => {
    const interviews = [...filteredInterviews];

    if (sortBy === "popular") {
      interviews.sort((a, b) => b.takenCount - a.takenCount);
    }
    if (sortBy === "score_high_to_low") {
      interviews.sort(
        (a, b) =>
          (b.scoreValue ?? Number.NEGATIVE_INFINITY) -
          (a.scoreValue ?? Number.NEGATIVE_INFINITY),
      );
    }
    if (sortBy === "title_asc") {
      interviews.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === "company_asc") {
      interviews.sort((a, b) => a.company.localeCompare(b.company));
    }
    if (sortBy === "recently_created") {
      interviews.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
    }

    return interviews;
  }, [filteredInterviews, sortBy]);

  const selectedInterview = React.useMemo(
    () => allInterviews.find((interview) => interview.id === selectedInterviewId) ?? null,
    [allInterviews, selectedInterviewId],
  );
  const selectedAttempts = selectedInterviewId
    ? (attemptsByInterview[selectedInterviewId] ?? [])
    : [];

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

  React.useEffect(() => {
    let cancelled = false;
    const loadAttempts = async () => {
      if (!selectedInterviewId) return;
      if (attemptsByInterview[selectedInterviewId]) return;

      setAttemptLoading(true);
      try {
        const response = await listMyInterviewSessions(selectedInterviewId, {
          page: 1,
          size: 3,
        });
        const rows = Array.isArray(response?.data?.sessions)
          ? (response.data.sessions as Array<any>)
              .map((session) => ({
                id: String(session.id),
                status: String(session.status ?? "unknown"),
                createdAt: String(session.createdAt ?? session.updatedAt ?? ""),
                score:
                  typeof session?.evaluation?.totalScore === "number"
                    ? Math.round(session.evaluation.totalScore)
                    : null,
              }))
              .filter((session) => session.id)
          : [];

        if (cancelled) return;
        setAttemptsByInterview((prev) => ({
          ...prev,
          [selectedInterviewId]: rows,
        }));
      } catch {
        if (cancelled) return;
        setAttemptsByInterview((prev) => ({
          ...prev,
          [selectedInterviewId]: [],
        }));
      } finally {
        if (!cancelled) {
          setAttemptLoading(false);
        }
      }
    };

    void loadAttempts();
    return () => {
      cancelled = true;
    };
  }, [attemptsByInterview, selectedInterviewId]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-tight text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
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
                    : "border-border bg-card text-[#8f949e] hover:border-primary hover:text-primary",
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <Button asChild className="h-9 rounded-lg bg-primary text-white hover:bg-primary/90">
          <Link href="/interviews/create">
            <Plus className="h-4 w-4" />
            {createButtonLabel}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search interview title, company, or category..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-9 rounded-lg border-border bg-card pl-9"
          />
        </div>

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
            <DropdownMenuLabel>Sort interviews</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(value) => setSortBy(value as InterviewSortValue)}
            >
              <DropdownMenuRadioItem value="recently_created">
                Recently created
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="popular">Most popular</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="score_high_to_low">
                Score: High to low
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="title_asc">Role: A-Z</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="company_asc">Company: A-Z</DropdownMenuRadioItem>
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
              Attempt Status
            </DropdownMenuLabel>
            {filterOptions.attemptStatus.map((value) => (
              <DropdownMenuCheckboxItem
                key={`status-${value}`}
                checked={filterState.attemptStatus.includes(value)}
                onCheckedChange={(checked) =>
                  toggleFilter("attemptStatus", value, checked)
                }
              >
                {value === "attempted" ? "Attempted" : "Not attempted"}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="min-w-0 gap-0 rounded-2xl border border-border bg-card p-0 shadow-sm">
        {visibleInterviews.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Interview</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>My Score</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleInterviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell className="w-[320px] max-w-[320px]">
                    <div className="flex min-w-[240px] items-center gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-bold text-white",
                          interview.logoUrl ? "bg-card p-1 text-transparent" : "bg-primary",
                          interview.logoClassName,
                        )}
                      >
                        {interview.logoUrl ? (
                          <Image
                            src={interview.logoUrl}
                            alt={`${interview.company} logo`}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-md object-contain"
                            unoptimized
                          />
                        ) : (
                          interview.logoText
                        )}
                      </span>
                      <div className="min-w-0 max-w-[250px]">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {interview.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {interview.company}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="rounded-md border-transparent bg-blue-100 text-blue-700"
                    >
                      {interview.categoryLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[11px] font-semibold",
                        toStatusBadgeClassName(interview.attemptStatus),
                      )}
                    >
                      {interview.attemptStatus === "attempted"
                        ? "Attempted"
                        : "Not Attempted"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {interview.createdAtLabel.replace("Created on: ", "")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {interview.takenCount}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {typeof interview.scoreValue === "number"
                      ? `${interview.scoreValue}/100`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-md border-border bg-card px-3 text-xs"
                        onClick={() => setSelectedInterviewId(interview.id)}
                      >
                        View
                      </Button>
                      {interview.primaryActionHref ? (
                        <Button
                          asChild
                          variant="outline"
                          className="h-8 rounded-md border-border bg-card px-3 text-xs"
                        >
                          <Link href={interview.primaryActionHref}>
                            {interview.primaryActionLabel}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </Card>

      <Sheet
        open={Boolean(selectedInterviewId)}
        onOpenChange={(open) => !open && setSelectedInterviewId(null)}
      >
        <SheetContent side="right" className="w-full p-0 sm:max-w-[560px]">
          {selectedInterview ? (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle className="text-lg font-semibold leading-none tracking-tight text-foreground">
                  Interview Details
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4 overflow-y-auto bg-[#f7f8fa] px-4 py-4">
                <div className="rounded-xl bg-linear-to-r from-[#1477b8] to-[#0066a8] p-4 text-white">
                  <p className="text-xs text-white/85">{selectedInterview.company}</p>
                  <p className="mt-1 text-lg font-semibold">{selectedInterview.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-card/20 px-2 py-1">
                      {selectedInterview.categoryLabel}
                    </span>
                    <span className="rounded-md bg-card/20 px-2 py-1">
                      {selectedInterview.takenCount} attempts
                    </span>
                    <span className="rounded-md bg-card/20 px-2 py-1">
                      {selectedInterview.scoreLabel}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">Description</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedInterview.description}
                  </p>
                </div>

                {selectedInterview.stackTechnologies?.length ? (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm font-semibold text-foreground">Tech Stack</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedInterview.stackTechnologies.map((tech) => (
                        <span
                          key={tech.id}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/35 px-2.5 py-1 text-xs text-foreground"
                        >
                          <Image
                            src={tech.iconUrl}
                            alt={tech.name}
                            width={14}
                            height={14}
                            className="h-3.5 w-3.5 object-contain"
                            unoptimized
                          />
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Recent Attempts (Last 3)
                    </p>
                    <Badge variant="outline">{selectedAttempts.length}</Badge>
                  </div>

                  {attemptLoading ? (
                    <p className="mt-2 text-sm text-muted-foreground">Loading attempts...</p>
                  ) : selectedAttempts.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {selectedAttempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-semibold uppercase text-foreground">
                              {attempt.status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(attempt.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {typeof attempt.score === "number"
                                ? `${attempt.score}/100`
                                : "-/100"}
                            </Badge>
                            <Button asChild variant="outline" className="h-7 rounded-md px-2 text-xs">
                              <Link
                                href={withReturnTo(
                                  `/interviews/sessions/${attempt.id}/feedback`,
                                  "/interviews",
                                )}
                              >
                                Feedback
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No attempts found for this interview yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-border bg-card px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {selectedInterview.primaryActionHref ? (
                    <Button asChild className="h-9 rounded-md">
                      <Link href={selectedInterview.primaryActionHref}>
                        {selectedInterview.primaryActionLabel}
                      </Link>
                    </Button>
                  ) : null}
                  {selectedInterview.secondaryActionHref &&
                  selectedInterview.secondaryActionLabel ? (
                    <Button asChild variant="outline" className="h-9 rounded-md">
                      <Link href={selectedInterview.secondaryActionHref}>
                        {selectedInterview.secondaryActionLabel}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}


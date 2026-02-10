"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, ExternalLink, Search, SlidersHorizontal } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortValue =
  | "recently_updated"
  | "recently_applied"
  | "company_asc"
  | "status_pipeline";

type FilterState = {
  statusLabel: string[];
  workMode: string[];
};

const DEFAULT_FILTER_STATE: FilterState = {
  statusLabel: [],
  workMode: [],
};

const STATUS_ORDER: Record<MyApplicationRecord["status"], number> = {
  applied: 1,
  under_review: 2,
  shortlisted: 3,
  interview_scheduled: 4,
  offer_received: 5,
  rejected: 6,
  withdrawn: 7,
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function statusBadgeClassName(tone: MyApplicationRecord["statusTone"]) {
  if (tone === "success") {
    return "bg-emerald-100 text-emerald-600 border-transparent";
  }

  if (tone === "warning") {
    return "bg-amber-100 text-amber-700 border-transparent";
  }

  if (tone === "destructive") {
    return "bg-rose-100 text-rose-600 border-transparent";
  }

  if (tone === "info") {
    return "bg-blue-100 text-blue-700 border-transparent";
  }

  return "bg-neutral-100 text-muted-foreground border-transparent";
}

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "interview_scheduled"
  | "offer_received"
  | "rejected"
  | "withdrawn";

export type MyApplicationRecord = {
  id: string;
  roleTitle: string;
  company: string;
  logoText: string;
  logoClassName?: string;
  status: ApplicationStatus;
  statusLabel: string;
  statusTone: "neutral" | "info" | "warning" | "success" | "destructive";
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  employmentType: "Full-Time" | "Part-Time" | "Internship" | "Contract";
  salaryRange: string;
  nextStepLabel: string;
  appliedAtLabel: string;
  appliedAtTimestamp: number;
  updatedAtLabel: string;
  updatedAtTimestamp: number;
  jobHref: string;
};

export type MyApplicationsBoardProps = {
  title: string;
  description: string;
  tabs: string[];
  activeTab: string;
  applicationsByTab: Record<string, MyApplicationRecord[]>;
  emptyMessage?: string;
  sortLabel?: string;
  filterLabel?: string;
  searchPlaceholder?: string;
};

export function MyApplicationsBoard({
  title,
  description,
  tabs,
  activeTab,
  applicationsByTab,
  emptyMessage = "No applications found for this view.",
  sortLabel = "Sort By",
  filterLabel = "Filter",
  searchPlaceholder = "Search by role, company, or location...",
}: MyApplicationsBoardProps) {
  const availableTabs = React.useMemo(
    () => (tabs.length > 0 ? tabs : Object.keys(applicationsByTab)),
    [applicationsByTab, tabs],
  );

  const [currentTab, setCurrentTab] = React.useState(() => {
    if (availableTabs.includes(activeTab)) return activeTab;
    return availableTabs[0] ?? "";
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortValue>("recently_updated");
  const [filterState, setFilterState] =
    React.useState<FilterState>(DEFAULT_FILTER_STATE);

  const currentTabApplications = React.useMemo(
    () => applicationsByTab[currentTab] ?? [],
    [applicationsByTab, currentTab],
  );

  const filterOptions = React.useMemo(
    () => ({
      statusLabel: uniqueValues(
        currentTabApplications.map((application) => application.statusLabel),
      ),
      workMode: uniqueValues(
        currentTabApplications.map((application) => application.workMode),
      ),
    }),
    [currentTabApplications],
  );

  const activeFilterCount = React.useMemo(
    () => filterState.statusLabel.length + filterState.workMode.length,
    [filterState],
  );

  const filteredApplications = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return currentTabApplications.filter((application) => {
      const queryMatch =
        query.length === 0 ||
        application.roleTitle.toLowerCase().includes(query) ||
        application.company.toLowerCase().includes(query) ||
        application.location.toLowerCase().includes(query);

      const statusMatch =
        filterState.statusLabel.length === 0 ||
        filterState.statusLabel.includes(application.statusLabel);

      const workModeMatch =
        filterState.workMode.length === 0 ||
        filterState.workMode.includes(application.workMode);

      return queryMatch && statusMatch && workModeMatch;
    });
  }, [currentTabApplications, filterState, searchQuery]);

  const visibleApplications = React.useMemo(() => {
    const applications = [...filteredApplications];

    if (sortBy === "recently_applied") {
      applications.sort((a, b) => b.appliedAtTimestamp - a.appliedAtTimestamp);
    }

    if (sortBy === "company_asc") {
      applications.sort((a, b) => a.company.localeCompare(b.company));
    }

    if (sortBy === "status_pipeline") {
      applications.sort((a, b) => {
        const orderDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (orderDiff !== 0) return orderDiff;
        return b.updatedAtTimestamp - a.updatedAtTimestamp;
      });
    }

    if (sortBy === "recently_updated") {
      applications.sort((a, b) => b.updatedAtTimestamp - a.updatedAtTimestamp);
    }

    return applications;
  }, [filteredApplications, sortBy]);

  const toggleFilter = React.useCallback(
    (
      key: keyof FilterState,
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
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-tight text-foreground">
          {title}
        </h3>
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
                    : "border-[#d8dde4] bg-white text-[#8f949e] hover:border-primary hover:text-primary",
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-[240px] sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-9 rounded-lg border-[#d8dde4] bg-white pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg border-[#d8dde4] bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-white"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sort applications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortValue)}
              >
                <DropdownMenuRadioItem value="recently_updated">
                  Recently updated
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="recently_applied">
                  Recently applied
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status_pipeline">
                  Pipeline stage
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
                <span>Filter applications</span>
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
                Work mode
              </DropdownMenuLabel>
              {filterOptions.workMode.map((value) => (
                <DropdownMenuCheckboxItem
                  key={`work-mode-${value}`}
                  checked={filterState.workMode.includes(value)}
                  onCheckedChange={(checked) =>
                    toggleFilter("workMode", value, checked)
                  }
                >
                  {value}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="min-w-0 gap-0 rounded-2xl border border-[#ececf0] bg-white p-0 shadow-sm">
        {visibleApplications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead>Compensation</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleApplications.map((application) => {
                const resolvedJobHref =
                  application.jobHref !== "/jobs"
                    ? application.jobHref
                    : `/jobs/${application.id}`;

                return (
                  <TableRow key={application.id}>
                  <TableCell>
                    <div className="flex min-w-[220px] items-center gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
                          "bg-primary",
                          application.logoClassName,
                        )}
                      >
                        {application.logoText}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">
                          {application.roleTitle}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {application.company} - {application.location}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {application.workMode} - {application.employmentType}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[11px] font-semibold",
                        statusBadgeClassName(application.statusTone),
                      )}
                    >
                      {application.statusLabel}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {application.appliedAtLabel}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {application.updatedAtLabel}
                  </TableCell>

                  <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                    {application.nextStepLabel}
                  </TableCell>

                  <TableCell className="text-xs font-medium text-foreground">
                    {application.salaryRange}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="outline"
                      className="h-8 rounded-md border-[#d8dde4] bg-white px-3 text-xs"
                    >
                      <Link href={resolvedJobHref}>
                        View Job
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d8dde4] p-6 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </Card>
    </section>
  );
}

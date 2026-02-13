"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpDown,
  ExternalLink,
  FileText,
  MessageCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuillViewer } from "@/components/rich-text/quill-viewer";

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
  reviewing: 2,
  shortlisted: 3,
  interview_scheduled: 4,
  accepted: 5,
  rejected: 6,
  withdrawn: 7,
};

export type ApplicationStatus =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "interview_scheduled"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type ApplicationTimelineStep = {
  key: string;
  label: string;
  reached: boolean;
  isCurrent: boolean;
  at?: string | null;
};

export type MyApplicationRecord = {
  id: string;
  jobId: string;
  roleTitle: string;
  company: string;
  logoText: string;
  logoUrl?: string;
  logoClassName?: string;
  status: ApplicationStatus;
  statusLabel: string;
  statusTone: "neutral" | "info" | "warning" | "success" | "destructive";
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  employmentType: "Full-Time" | "Part-Time" | "Internship" | "Contract";
  salaryRange: string;
  level?: string;
  experience?: string;
  jobType?: string;
  workType?: string;
  nextStepLabel: string;
  appliedAtLabel: string;
  appliedAtTimestamp: number;
  updatedAtLabel: string;
  updatedAtTimestamp: number;
  jobHref: string;
  timeline: ApplicationTimelineStep[];
  description?: string;
  qualifications?: string[];
  companyProfile?: {
    id?: string;
    name: string;
    location?: string;
    industry?: string;
    companySize?: string;
    description?: string;
    logoUrl?: string;
    profileHref?: string;
  };
  resume?: {
    fileName?: string;
    previewUrl?: string;
    downloadUrl?: string;
  };
  resumeActivity?: {
    viewedAt?: string | null;
    downloadedAt?: string | null;
    viewCount?: number;
    downloadCount?: number;
  };
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
  initialApplicationId?: string | null;
};

const uniqueValues = (values: string[]) => Array.from(new Set(values));

const statusBadgeClassName = (tone: MyApplicationRecord["statusTone"]) => {
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
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not yet";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not yet";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const currentStatusLabel = (status: ApplicationStatus) => {
  if (status === "accepted") return "Accepted";
  if (status === "rejected" || status === "withdrawn") return "Rejected";
  if (status === "shortlisted") return "Shortlisted";
  if (status === "reviewing") return "Under Review";
  if (status === "interview_scheduled") return "Interview Invited";
  return "Waiting for Approval";
};

const currentStatusClassName = (status: ApplicationStatus) => {
  if (status === "accepted") {
    return "border-[#4ba3da] bg-[#eff8ff] text-[#1c7ab8]";
  }
  if (status === "rejected" || status === "withdrawn") {
    return "border-[#f2a39c] bg-[#fff6f5] text-[#d84a3a]";
  }
  if (status === "shortlisted") {
    return "border-[#80b86b] bg-[#f3fbef] text-[#3f8a28]";
  }
  if (status === "reviewing") {
    return "border-[#f0bf62] bg-[#fff9ef] text-[#a96f10]";
  }
  if (status === "interview_scheduled") {
    return "border-[#4ba3da] bg-[#eff8ff] text-[#1c7ab8]";
  }
  return "border-[#4ba3da] bg-[#eff8ff] text-[#1c7ab8]";
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
  initialApplicationId = null,
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
  const [selectedApplicationId, setSelectedApplicationId] = React.useState<string | null>(
    initialApplicationId,
  );
  const [detailTab, setDetailTab] = React.useState<"process" | "job" | "company">(
    "process",
  );

  const allApplications = React.useMemo(
    () => Object.values(applicationsByTab).flat(),
    [applicationsByTab],
  );
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

  const selectedApplication = React.useMemo(
    () =>
      allApplications.find((application) => application.id === selectedApplicationId) ??
      null,
    [allApplications, selectedApplicationId],
  );
  const companyProfileLogoUrl =
    selectedApplication?.companyProfile?.logoUrl ?? selectedApplication?.logoUrl;

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
              {visibleApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="w-[280px] max-w-[280px]">
                    <div className="flex min-w-[220px] items-center gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
                          application.logoUrl ? "bg-white p-1 text-transparent" : "bg-primary",
                          application.logoClassName,
                        )}
                      >
                        {application.logoUrl ? (
                          <Image
                            src={application.logoUrl}
                            alt={`${application.company} logo`}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-md object-contain"
                          />
                        ) : (
                          application.logoText
                        )}
                      </span>
                      <div className="min-w-0 max-w-[220px]">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {application.roleTitle}
                        </div>
                        <div className="block max-w-[220px] truncate text-xs text-muted-foreground">
                          {application.company} - {application.location}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
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
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-md border-[#d8dde4] bg-white px-3 text-xs"
                        onClick={() => {
                          setSelectedApplicationId(application.id);
                          setDetailTab("process");
                        }}
                      >
                        View Application
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-8 rounded-md border-[#d8dde4] bg-white px-3 text-xs"
                      >
                        <Link href={application.jobHref}>
                          View Job
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-xl border border-dashed border-[#d8dde4] p-6 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </Card>

      <Sheet
        open={Boolean(selectedApplicationId)}
        onOpenChange={(open) => !open && setSelectedApplicationId(null)}
      >
        <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-[640px]">
          {selectedApplication ? (
            <div className="flex h-full min-h-0 flex-col">
              <SheetHeader className="border-b border-[#ececf0] px-4 py-3">
                <SheetTitle className="text-lg font-semibold leading-none tracking-tight text-foreground">
                  Detail My Applications
                </SheetTitle>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-3 bg-[#f7f8fa] px-4 py-3 sm:px-4">
                <div className="rounded-xl bg-linear-to-r from-[#1477b8] to-[#0066a8] p-3 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-xl font-bold text-[#4285f4]",
                          selectedApplication.logoUrl ? "p-1" : "",
                          selectedApplication.logoClassName,
                        )}
                      >
                        {selectedApplication.logoUrl ? (
                          <Image
                            src={selectedApplication.logoUrl}
                            alt={`${selectedApplication.company} logo`}
                            width={44}
                            height={44}
                            className="h-11 w-11 rounded-lg object-contain"
                          />
                        ) : (
                          selectedApplication.logoText
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs text-white/85">
                          {selectedApplication.company}
                          <span className="mx-1.5">.</span>
                          {selectedApplication.location}
                        </p>
                        <p className="truncate text-base font-semibold leading-tight text-white sm:text-lg">
                          {selectedApplication.roleTitle}
                        </p>
                        <p className="mt-1 text-xs text-white/85">
                          Applied {selectedApplication.appliedAtLabel}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 shrink-0 rounded-lg border-white/70 bg-white/95 px-3 text-xs font-semibold text-[#1579b8] hover:bg-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#e2e6ec] bg-white px-3 py-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Level</p>
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {selectedApplication.level ?? "Mid-Senior"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#e2e6ec] bg-white px-3 py-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Salary Range</p>
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {selectedApplication.salaryRange}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-[#e2e6ec] bg-white px-3 py-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Experience</p>
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {selectedApplication.experience ?? "2 Years"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#e2e6ec] bg-white px-3 py-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Job Type</p>
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {selectedApplication.jobType ?? selectedApplication.employmentType}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#e2e6ec] bg-white px-3 py-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Work Type</p>
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {selectedApplication.workType ?? selectedApplication.workMode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 rounded-lg border border-[#e0e3e8] bg-[#f0f1f3] p-1">
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      detailTab === "process"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-[#6e7482]",
                    )}
                    onClick={() => setDetailTab("process")}
                  >
                    Hiring Process
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      detailTab === "job"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-[#6e7482]",
                    )}
                    onClick={() => setDetailTab("job")}
                  >
                    Detail Job
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      detailTab === "company"
                        ? "bg-white text-foreground shadow-sm"
                        : "text-[#6e7482]",
                    )}
                    onClick={() => setDetailTab("company")}
                  >
                    Company Profile
                  </button>
                </div>

                {detailTab === "process" ? (
                  <div className="space-y-3 rounded-xl border border-[#e7ebf0] bg-white p-3.5">
                    {(selectedApplication.resumeActivity?.viewCount ?? 0) > 0 ||
                    (selectedApplication.resumeActivity?.downloadCount ?? 0) > 0 ? (
                      <div className="rounded-lg border border-[#d8e9f8] bg-[#f2f8fe] p-3 text-xs text-[#31648d]">
                        Recruiter activity:
                        <span className="font-semibold">
                          {" "}
                          resume viewed {selectedApplication.resumeActivity?.viewCount ?? 0} times
                          and downloaded {selectedApplication.resumeActivity?.downloadCount ?? 0} times.
                        </span>
                        <div className="mt-1 text-[#3a6d94]">
                          Last viewed: {formatDateTime(selectedApplication.resumeActivity?.viewedAt)} | Last downloaded:{" "}
                          {formatDateTime(selectedApplication.resumeActivity?.downloadedAt)}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {selectedApplication.timeline.map((step, index) => (
                        <div key={step.key} className="relative pl-8">
                          {index < selectedApplication.timeline.length - 1 ? (
                            <span
                              className={cn(
                                "absolute left-[8px] top-4 h-[calc(100%+1.15rem)] w-px",
                                step.reached ? "bg-[#6eb4dc]" : "bg-[#d6dbe2]",
                              )}
                            />
                          ) : null}
                          <span
                            className={cn(
                              "absolute left-0 top-1.5 h-4 w-4 rounded-full border-[3px]",
                              step.reached
                                ? "border-[#2490cd] bg-[#d9f0fe]"
                                : "border-[#d7dce4] bg-white",
                            )}
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p
                                className={cn(
                                "text-sm font-semibold leading-tight",
                                  step.reached ? "text-foreground" : "text-[#c1c6cf]",
                                )}
                              >
                                {step.label}
                              </p>
                              <p className={cn("text-xs", step.reached ? "text-[#8a919d]" : "text-[#c9ced7]")}>
                                {step.reached ? formatDateTime(step.at) : "-"}
                              </p>
                            </div>
                            {step.isCurrent ? (
                              <span
                                className={cn(
                                  "inline-flex min-h-8 items-center rounded-lg border px-3 text-xs font-semibold",
                                  currentStatusClassName(selectedApplication.status),
                                )}
                              >
                                {currentStatusLabel(selectedApplication.status)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {detailTab === "job" ? (
                  <div className="space-y-3 rounded-xl border border-[#e7ebf0] bg-white">
                    <div className="border-b border-[#eceff3] px-4 py-3">
                      <p className="text-base font-semibold leading-none text-foreground">
                        Job Descriptions
                      </p>
                    </div>
                    <div className="space-y-4 px-4 py-3">
                      {selectedApplication.description ? (
                        <QuillViewer
                          value={selectedApplication.description}
                          className="text-sm leading-6 text-muted-foreground [&_.ql-editor]:p-0 [&_.ql-editor_h1]:mb-2 [&_.ql-editor_h1]:text-lg [&_.ql-editor_h1]:font-semibold [&_.ql-editor_h2]:mb-2 [&_.ql-editor_h2]:text-base [&_.ql-editor_h2]:font-semibold [&_.ql-editor_ol]:list-decimal [&_.ql-editor_ol]:pl-5 [&_.ql-editor_p]:mb-2 [&_.ql-editor_ul]:list-disc [&_.ql-editor_ul]:pl-5"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No description available.
                        </p>
                      )}

                      <div className="border-t border-[#eceff3] pt-4">
                        <p className="text-base font-semibold leading-none text-foreground">
                          Qualifications
                        </p>
                      {selectedApplication.qualifications?.length ? (
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                          {selectedApplication.qualifications.map((qualification) => (
                            <li key={qualification}>{qualification}</li>
                          ))}
                        </ul>
                      ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                          No qualifications listed.
                        </p>
                      )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {detailTab === "company" ? (
                  <div className="space-y-4 rounded-xl border border-[#e7ebf0] bg-white p-3.5">
                    <p className="text-base font-semibold leading-none text-foreground">
                      About Company
                    </p>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dfe5ec] bg-white text-sm font-bold shadow-[0_2px_8px_rgba(15,23,42,0.08)]",
                          companyProfileLogoUrl ? "text-transparent" : "text-primary",
                        )}
                      >
                        {companyProfileLogoUrl ? (
                          <Image
                            src={companyProfileLogoUrl}
                            alt={`${selectedApplication.company} logo`}
                            width={40}
                            height={40}
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          selectedApplication.logoText
                        )}
                      </span>
                      <div>
                        <p className="text-base font-semibold leading-tight text-foreground">
                          {selectedApplication.companyProfile?.name ?? selectedApplication.company}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selectedApplication.companyProfile?.location ?? selectedApplication.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-foreground">
                        {selectedApplication.companyProfile?.industry ?? "Technology Information"}
                      </span>
                      <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-foreground">
                        {selectedApplication.companyProfile?.companySize ?? "11 - 50 Employee"}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {selectedApplication.companyProfile?.description ??
                        `${selectedApplication.company} is actively expanding and hiring for this role. Review the company profile to explore culture, industry focus, and current openings.`}
                    </p>

                    {selectedApplication.companyProfile?.profileHref ? (
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 w-full rounded-xl border-[#d8dde4] bg-[#e9f2fb] text-sm font-semibold text-primary hover:bg-[#deecfa]"
                      >
                        <Link href={selectedApplication.companyProfile.profileHref}>
                          View Profile
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled
                        variant="outline"
                        className="h-10 w-full rounded-xl border-[#d8dde4] bg-[#eef2f6] text-sm font-semibold text-muted-foreground"
                      >
                        View Profile
                      </Button>
                    )}
                  </div>
                ) : null}

                </div>
              </div>

              <div className="border-t border-[#eceff3] bg-white px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-md border-[#d8dde4] bg-white px-3 text-sm font-semibold text-foreground"
                  >
                    <Link href={selectedApplication.jobHref}>
                      Open Job
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  {selectedApplication.resume?.previewUrl ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-md border-[#d8dde4] bg-white px-3 text-sm font-semibold text-foreground"
                    >
                      <a
                        href={selectedApplication.resume.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText className="h-4 w-4" />
                        View Uploaded Resume
                      </a>
                    </Button>
                  ) : null}
                  {selectedApplication.resume?.downloadUrl ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-md border-[#d8dde4] bg-white px-3 text-sm font-semibold text-foreground"
                    >
                      <a
                        href={selectedApplication.resume.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={selectedApplication.resume.fileName ?? "resume"}
                      >
                        <FileText className="h-4 w-4" />
                        Download Resume
                      </a>
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

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ClipboardList,
  Cog,
  School,
  Shield,
  Users,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../(dashboard)/_components/dashboard-header";
import { getAdminUsersAnalytics } from "@/lib/actions/admin/admin-user-actions";
import { listCompanies } from "@/lib/actions/company-actions";
import { listColleges } from "@/lib/actions/college-actions";
import { getJobs } from "@/lib/actions/job-actions";
import { listInterviews } from "@/lib/actions/interview-actions";
import type { TInterview, TJob } from "@/lib/definitions";
import type { PaginationMeta } from "@/lib/pagination";
import type { AdminUsersAnalyticsData } from "./users/_components/user-analytics";
import {
  OverviewAnalyticsCharts,
  type OverviewAnalyticsData,
} from "../(dashboard)/overview/_components/overview-analytics-charts";
import { GrowthChart } from "./users/_components/growth-chart";
import { RoleDistributionChart } from "./users/_components/role-distribution-chart";
import { AcquisitionChart } from "./users/_components/acquisition-chart";

const getTotalItems = (payload: unknown) => {
  const meta = (payload as { meta?: PaginationMeta } | null | undefined)?.meta;
  return typeof meta?.totalItems === "number" ? meta.totalItems : 0;
};

const trendFallback = [
  { label: "Jan", value: 0 },
  { label: "Feb", value: 0 },
  { label: "Mar", value: 0 },
  { label: "Apr", value: 0 },
  { label: "May", value: 0 },
  { label: "Jun", value: 0 },
];

export default async function AdminDashboardPage() {
  const [
    usersAnalyticsResponse,
    companiesResponse,
    collegesResponse,
    jobsResponse,
    openJobsResponse,
    draftJobsResponse,
    closedJobsResponse,
    interviewsResponse,
  ] = await Promise.all([
    getAdminUsersAnalytics(),
    listCompanies({ page: 1, size: 1 }),
    listColleges({ page: 1, size: 1 }),
    getJobs({ page: 1, size: 100 }),
    getJobs({ page: 1, size: 1, status: "open" }),
    getJobs({ page: 1, size: 1, status: "draft" }),
    getJobs({ page: 1, size: 1, status: "closed" }),
    listInterviews({ page: 1, size: 1, ownership: "all", discover: false }),
  ]);

  const usersAnalytics = (usersAnalyticsResponse?.data ??
    null) as AdminUsersAnalyticsData | null;
  const jobsData = (jobsResponse?.data ?? null) as
    | { jobs?: TJob[]; meta?: PaginationMeta }
    | null;
  const interviewsData = (interviewsResponse?.data ?? null) as
    | { interviews?: TInterview[]; meta?: PaginationMeta }
    | null;

  const totalUsers = usersAnalytics?.totalUsers ?? 0;
  const totalAdmins = usersAnalytics?.totalAdmins ?? 0;
  const totalStandardUsers = usersAnalytics?.totalStandardUsers ?? 0;
  const newThisWeek = usersAnalytics?.newThisWeek ?? 0;
  const totalCompanies = getTotalItems(
    (companiesResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
  );
  const totalColleges = getTotalItems(
    (collegesResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
  );
  const totalJobs =
    getTotalItems(
      (jobsResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
    ) ?? 0;
  const totalInterviews =
    getTotalItems(
      (interviewsResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
    ) ?? 0;
  const openJobs = getTotalItems(
    (openJobsResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
  );
  const draftJobs = getTotalItems(
    (draftJobsResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
  );
  const closedJobs = getTotalItems(
    (closedJobsResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
  );

  const safeSignupTrend =
    usersAnalytics?.signupTrend && usersAnalytics.signupTrend.length > 0
      ? usersAnalytics.signupTrend
      : trendFallback;
  const safeRoleBreakdown =
    usersAnalytics?.roleBreakdown && usersAnalytics.roleBreakdown.length > 0
      ? usersAnalytics.roleBreakdown
      : [
          { name: "admin", value: totalAdmins },
          { name: "user", value: Math.max(totalUsers - totalAdmins, 0) },
        ];

  const interviewPerUserRatio = totalUsers > 0 ? totalInterviews / totalUsers : 0;
  const momentum = safeSignupTrend.map((point) => ({
    label: point.label,
    applications: point.value,
    interviews: Math.max(0, Math.round(point.value * interviewPerUserRatio)),
  }));
  const recentMomentumSlice = momentum.slice(Math.max(0, momentum.length - 4));
  const applicationsThisPeriod = recentMomentumSlice.reduce(
    (sum, point) => sum + point.applications,
    0,
  );
  const interviewsThisPeriod = recentMomentumSlice.reduce(
    (sum, point) => sum + point.interviews,
    0,
  );
  const interviewConversion =
    applicationsThisPeriod > 0
      ? Number(((interviewsThisPeriod / applicationsThisPeriod) * 100).toFixed(1))
      : 0;

  const adminOverviewAnalytics: OverviewAnalyticsData = {
    summary: {
      applicationsThisWeek: applicationsThisPeriod,
      interviewConversion,
    },
    momentum,
    pipeline: [
      {
        stage: "Users",
        thisWeek: totalUsers,
        lastWeek: Math.max(0, totalUsers - newThisWeek),
      },
      {
        stage: "Jobs",
        thisWeek: totalJobs,
        lastWeek: Math.max(0, totalJobs - Math.round(newThisWeek * 0.6)),
      },
      {
        stage: "Interviews",
        thisWeek: totalInterviews,
        lastWeek: Math.max(0, totalInterviews - Math.round(newThisWeek * 0.4)),
      },
      {
        stage: "Workspaces",
        thisWeek: totalCompanies + totalColleges,
        lastWeek: Math.max(
          0,
          totalCompanies + totalColleges - Math.round(newThisWeek * 0.25),
        ),
      },
    ],
    invitationMix: [
      { name: "Open", value: openJobs, fill: "#10b981" },
      { name: "Draft", value: draftJobs, fill: "#6366f1" },
      { name: "Closed", value: closedJobs, fill: "#f59e0b" },
    ],
  };

  const topJobs = Array.isArray(jobsData?.jobs) ? jobsData.jobs.slice(0, 4) : [];
  const topInterviews = Array.isArray(interviewsData?.interviews)
    ? interviewsData.interviews.slice(0, 4)
    : [];

  const statCards = [
    {
      label: "Total Users",
      value: totalUsers,
      helper: `${totalAdmins} admin accounts`,
      icon: Users,
      href: "/admin/users",
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Company Workspaces",
      value: totalCompanies,
      helper: "All registered company entities",
      icon: Building2,
      href: "/admin/companies",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "College Workspaces",
      value: totalColleges,
      helper: "All registered colleges",
      icon: School,
      href: "/admin/colleges",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Job Postings",
      value: totalJobs,
      helper: "Open, closed, and draft jobs",
      icon: ClipboardList,
      href: "/admin/jobs",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Interviews",
      value: totalInterviews,
      helper: "Interviews across all sources",
      icon: Waypoints,
      href: "/admin/interviews",
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Standard Users",
      value: totalStandardUsers,
      helper: `${newThisWeek} joined this week`,
      icon: Shield,
      href: "/admin/users",
      tone: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <>
      <DashboardHeader title="Overview" />

      <section className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#00588f] via-[#00629f] to-[#0b7fc2] px-4 py-6 text-white sm:px-6 sm:py-7">
          <div className="pointer-events-none absolute bottom-0 left-0 h-10 w-60 rounded-tr-2xl bg-white/10" />
          <div className="pointer-events-none absolute right-0 top-0 h-14 w-44 rounded-bl-2xl rounded-tr-2xl bg-white/10" />
          <div className="pointer-events-none absolute right-7 top-0 h-22 w-28 rounded-bl-2xl rounded-tr-2xl bg-white/10" />

          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/75">
                  Admin Overview
                </p>
                <h2 className="text-2xl font-semibold leading-tight sm:text-[30px]">
                  Platform Control Center
                </h2>
                <p className="text-sm text-white/90 sm:text-base">
                  Centralized visibility into users, workspaces, jobs, and
                  interviews across the platform.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  className="h-9 rounded-lg bg-white px-4 text-xs font-semibold text-[#00588f] hover:bg-white/90"
                >
                  <Link href="/admin/users/create">Create Admin User</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-lg border-white/40 bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20"
                >
                  <Link href="/admin/jobs">
                    <Cog className="h-4 w-4" />
                    Manage Jobs
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-lg border-white/40 bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20"
                >
                  <Link href="/admin/interviews">Manage Interviews</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3.5">
                <p className="text-xs text-white/75">Users</p>
                <p className="mt-1 text-2xl font-semibold">{totalUsers}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3.5">
                <p className="text-xs text-white/75">Workspaces</p>
                <p className="mt-1 text-2xl font-semibold">
                  {totalCompanies + totalColleges}
                </p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3.5">
                <p className="text-xs text-white/75">Jobs</p>
                <p className="mt-1 text-2xl font-semibold">{totalJobs}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3.5">
                <p className="text-xs text-white/75">Interviews</p>
                <p className="mt-1 text-2xl font-semibold">{totalInterviews}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card
                key={stat.label}
                className="gap-3 rounded-2xl border border-[#e7ebf1] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.helper}</p>

                <Link
                  href={stat.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Open {stat.label}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Card>
            );
          })}
        </div>

        <OverviewAnalyticsCharts data={adminOverviewAnalytics} variant="admin" />

        <div className="grid gap-6 xl:grid-cols-2">
          <GrowthChart data={safeSignupTrend} />
          <RoleDistributionChart data={safeRoleBreakdown} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <AcquisitionChart data={safeSignupTrend} />

          <Card className="gap-4 rounded-2xl border border-[#ececf0] p-5 shadow-sm">
            <h3 className="text-base font-semibold">Operational Highlights</h3>

            <div className="space-y-3">
              <div className="rounded-lg border border-[#ececf0] bg-neutral-50 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Recent Jobs
                </p>
                {topJobs.length > 0 ? (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {topJobs.map((job) => (
                      <li key={job.id} className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{job.title}</span>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/jobs/${job.id}`}>View</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No job records available in this view.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-[#ececf0] bg-neutral-50 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Recent Interviews
                </p>
                {topInterviews.length > 0 ? (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {topInterviews.map((interview) => (
                      <li
                        key={interview.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate font-medium">{interview.title}</span>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/interviews/${interview.id}`}>View</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No interview records available in this view.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

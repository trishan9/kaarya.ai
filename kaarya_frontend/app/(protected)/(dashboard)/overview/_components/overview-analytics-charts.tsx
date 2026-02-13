"use client";

import * as React from "react";
import { Activity, BriefcaseBusiness, MailCheck } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type MomentumPoint = {
  label: string;
  applications: number;
  interviews: number;
};

export type PipelinePoint = {
  stage: string;
  thisWeek: number;
  lastWeek: number;
};

export type InvitationMixPoint = {
  name: string;
  value: number;
  fill?: string;
};

export type OverviewAnalyticsData = {
  summary: {
    applicationsThisWeek: number;
    interviewConversion: number;
  };
  momentum: MomentumPoint[];
  pipeline: PipelinePoint[];
  invitationMix: InvitationMixPoint[];
};

type OverviewAnalyticsVariant = "candidate" | "recruiter";

const DEFAULT_ANALYTICS_DATA: OverviewAnalyticsData = {
  summary: {
    applicationsThisWeek: 139,
    interviewConversion: 43.2,
  },
  momentum: [
    { label: "Mon", applications: 14, interviews: 6 },
    { label: "Tue", applications: 19, interviews: 8 },
    { label: "Wed", applications: 16, interviews: 7 },
    { label: "Thu", applications: 24, interviews: 11 },
    { label: "Fri", applications: 21, interviews: 10 },
    { label: "Sat", applications: 18, interviews: 8 },
    { label: "Sun", applications: 27, interviews: 12 },
  ],
  pipeline: [
    { stage: "Applied", thisWeek: 124, lastWeek: 110 },
    { stage: "Screening", thisWeek: 79, lastWeek: 68 },
    { stage: "Interview", thisWeek: 42, lastWeek: 34 },
    { stage: "Offer", thisWeek: 16, lastWeek: 11 },
  ],
  invitationMix: [
    { name: "Accepted", value: 58, fill: "#10b981" },
    { name: "Pending", value: 27, fill: "#f59e0b" },
    { name: "Declined", value: 15, fill: "#ef4444" },
  ],
};

const trendConfig = {
  applications: {
    label: "Applications",
    color: "#0891b2",
  },
  interviews: {
    label: "Interviews",
    color: "#f97316",
  },
} satisfies ChartConfig;

const funnelConfig = {
  thisWeek: {
    label: "This week",
    color: "#0ea5a5",
  },
  lastWeek: {
    label: "Last week",
    color: "#6366f1",
  },
} satisfies ChartConfig;

const invitationMixConfig = {
  accepted: {
    label: "Accepted",
    color: "#10b981",
  },
  pending: {
    label: "Pending",
    color: "#f59e0b",
  },
  declined: {
    label: "Declined",
    color: "#ef4444",
  },
} satisfies ChartConfig;

const analyticsCopy: Record<
  OverviewAnalyticsVariant,
  {
    momentumTitle: string;
    momentumDescription: string;
    primaryLabel: string;
    secondaryLabel: string;
    pipelineTitle: string;
    pipelineDescription: string;
    mixTitle: string;
    mixDescription: string;
    mixFooter: (total: number) => string;
  }
> = {
  candidate: {
    momentumTitle: "Application Momentum",
    momentumDescription: "Weekly activity overview with interview conversion trend.",
    primaryLabel: "This Week Applications",
    secondaryLabel: "Interview Conversion",
    pipelineTitle: "Application Progress",
    pipelineDescription: "Week-over-week progress by hiring stage.",
    mixTitle: "Invitation Responses",
    mixDescription: "Response status distribution for recent invites.",
    mixFooter: (total) =>
      `Based on ${total} invitations from the last 30 days.`,
  },
  recruiter: {
    momentumTitle: "Hiring Momentum",
    momentumDescription:
      "Weekly applicant flow and interview throughput for your workspace.",
    primaryLabel: "New Applicants",
    secondaryLabel: "Interview Rate",
    pipelineTitle: "Pipeline Health",
    pipelineDescription: "Week-over-week movement across core hiring stages.",
    mixTitle: "Role Status Mix",
    mixDescription: "Open, draft, and closed role distribution.",
    mixFooter: (total) => `Calculated from ${total} tracked roles this week.`,
  },
};

type OverviewAnalyticsChartsProps = {
  data?: OverviewAnalyticsData;
  variant?: OverviewAnalyticsVariant;
};

export function OverviewAnalyticsCharts({
  data = DEFAULT_ANALYTICS_DATA,
  variant = "candidate",
}: OverviewAnalyticsChartsProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const copy = analyticsCopy[variant];

  React.useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const totalInvitations = data.invitationMix.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const mixValueSuffix = variant === "candidate" ? "%" : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card className="min-w-0 gap-4 border-border bg-linear-to-br from-white via-[#f7fbff] to-[#eef5fb] p-4 shadow-sm sm:p-5 lg:row-span-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">
              {copy.momentumTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {copy.momentumDescription}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-white/80 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">
              {copy.primaryLabel}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {data.summary.applicationsThisWeek}
            </div>
          </div>
          <div className="rounded-lg bg-white/80 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">
              {copy.secondaryLabel}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {data.summary.interviewConversion.toFixed(1)}%
            </div>
          </div>
        </div>

        <ChartContainer
          config={trendConfig}
          className="h-[230px] w-full sm:h-[280px] lg:h-72"
        >
          <AreaChart
            data={data.momentum}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="applicationsGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-applications)"
                  stopOpacity={0.34}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-applications)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient
                id="interviewsGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-interviews)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-interviews)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.2}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={isMobile ? 6 : 10}
              className="text-xs"
            />
            <YAxis
              hide={isMobile}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend
              content={<ChartLegendContent className="flex-wrap" />}
            />
            <Area
              type="monotone"
              dataKey="applications"
              stroke="var(--color-applications)"
              fill="url(#applicationsGradient)"
              strokeWidth={2.6}
              dot={
                isMobile ? false : { r: 3, fill: "var(--color-applications)" }
              }
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="interviews"
              stroke="var(--color-interviews)"
              fill="url(#interviewsGradient)"
              strokeWidth={2.3}
              dot={isMobile ? false : { r: 3, fill: "var(--color-interviews)" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      </Card>

      <Card className="min-w-0 gap-4 border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              {copy.pipelineTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {copy.pipelineDescription}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f1fb] text-primary">
            <BriefcaseBusiness className="h-4 w-4" />
          </div>
        </div>

        <ChartContainer
          config={funnelConfig}
          className="h-[220px] w-full sm:h-52"
        >
          <BarChart
            data={data.pipeline}
            margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            barCategoryGap={isMobile ? 10 : 18}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.2}
            />
            <XAxis
              dataKey="stage"
              tickLine={false}
              axisLine={false}
              tickMargin={isMobile ? 4 : 8}
              className="text-xs"
              interval={0}
            />
            <YAxis
              hide={isMobile}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <ChartLegend
              content={<ChartLegendContent className="flex-wrap" />}
            />
            <Bar
              dataKey="thisWeek"
              fill="var(--color-thisWeek)"
              radius={[8, 8, 0, 0]}
              maxBarSize={isMobile ? 18 : 24}
            />
            <Bar
              dataKey="lastWeek"
              fill="var(--color-lastWeek)"
              radius={[8, 8, 0, 0]}
              maxBarSize={isMobile ? 18 : 24}
            />
          </BarChart>
        </ChartContainer>
      </Card>

      <Card className="min-w-0 gap-4 border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              {copy.mixTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {copy.mixDescription}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f1fb] text-primary">
            <MailCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="grid items-center gap-4 sm:grid-cols-[130px_minmax(0,1fr)]">
          <ChartContainer
            config={invitationMixConfig}
            className="h-[120px] w-full sm:h-32"
          >
            <PieChart>
              <Pie
                data={data.invitationMix}
                dataKey="value"
                nameKey="name"
                innerRadius={36}
                outerRadius={58}
                paddingAngle={4}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {data.invitationMix.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill ?? "#64748b"} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            </PieChart>
          </ChartContainer>

          <div className="space-y-2">
            {data.invitationMix.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.fill ?? "#64748b" }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">
                  {item.value}
                  {mixValueSuffix}
                </span>
              </div>
            ))}
            <div className="pt-2 text-[11px] text-muted-foreground">
              {copy.mixFooter(totalInvitations)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

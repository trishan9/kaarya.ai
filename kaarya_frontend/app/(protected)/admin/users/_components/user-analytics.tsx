"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

import { TUser } from "@/lib/definitions";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

export function AdminUsersAnalytics({ users }: { users: TUser[] }) {
  const totalUsers = users.length;
  const totalAdmins = users.filter((user) => user.role === "admin").length;
  const totalStandardUsers = totalUsers - totalAdmins;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newThisWeek = users.filter((user) => {
    if (!user.createdAt) return false;
    const createdAt = new Date(user.createdAt);
    return !Number.isNaN(createdAt.valueOf()) && createdAt >= sevenDaysAgo;
  }).length;

  const roleBreakdown = [
    { name: "admin", value: totalAdmins },
    { name: "user", value: totalStandardUsers },
  ];

  const now = new Date();
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const trendBuckets = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = monthFormatter.format(date);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label,
      value: 0,
    };
  });

  users.forEach((user) => {
    if (!user.createdAt) return;
    const createdAt = new Date(user.createdAt);
    if (Number.isNaN(createdAt.valueOf())) return;
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
    const bucket = trendBuckets.find((item) => item.key === key);
    if (bucket) {
      bucket.value += 1;
    }
  });

  const signupTrend = trendBuckets.map(({ label, value }) => ({
    label,
    value,
  }));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total users", value: totalUsers },
            { label: "Admins", value: totalAdmins },
            { label: "Standard users", value: totalStandardUsers },
            { label: "New this week", value: newThisWeek },
          ].map((item) => (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardDescription>Signups (last 6 months)</CardDescription>
              <CardTitle>Growth trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Users",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-64 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={signupTrend}
                    margin={{ left: -10, right: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorUsers"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-value)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-value)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-value)"
                      fill="url(#colorUsers)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Users by role</CardDescription>
              <CardTitle>Role distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  admin: {
                    label: "Admin",
                    color: "hsl(var(--chart-1))",
                  },
                  user: {
                    label: "User",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-64 w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleBreakdown}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={4}
                    >
                      {roleBreakdown.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="mt-4 space-y-2 text-sm">
                {roleBreakdown.map((role, index) => (
                  <div
                    key={role.name}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize text-muted-foreground">
                        {role.name}
                      </span>
                    </span>
                    <span className="font-medium">{role.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>Monthly breakdown</CardDescription>
            <CardTitle>User acquisition</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Users",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-56 w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signupTrend} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[12, 12, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

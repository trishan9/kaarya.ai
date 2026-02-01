"use client";

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
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { Users } from "lucide-react";

interface RoleDistributionChartProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

export function RoleDistributionChart({
  data,
}: RoleDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardDescription>Users by role</CardDescription>
            <CardTitle className="text-xl">Role Distribution</CardTitle>
          </div>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
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
          className="h-72 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={5}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {data.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-6 space-y-3">
          {data.map((role, index) => {
            const percentage = total > 0 ? ((role.value / total) * 100).toFixed(1) : "0";
            return (
              <div
                key={role.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                  <span className="text-sm font-medium capitalize">
                    {role.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {percentage}%
                  </span>
                  <span className="text-sm font-semibold w-8 text-right">
                    {role.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


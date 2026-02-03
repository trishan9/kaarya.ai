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
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface AcquisitionChartProps {
  data: { label: string; value: number }[];
}

export function AcquisitionChart({ data }: AcquisitionChartProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardDescription>Monthly breakdown</CardDescription>
            <CardTitle className="text-xl">User Acquisition</CardTitle>
          </div>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Users",
              color: "hsl(var(--chart-4))",
            },
          }}
          className="h-64 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.2}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[8, 8, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


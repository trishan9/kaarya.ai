"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, UserPlus, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalUsers: number;
  totalAdmins: number;
  totalStandardUsers: number;
  newThisWeek: number;
}

const stats = [
  {
    label: "Total Users",
    value: "totalUsers",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Admins",
    value: "totalAdmins",
    icon: Shield,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Standard Users",
    value: "totalStandardUsers",
    icon: Users,
    color: "text-green-600 dark:text-green-400",
  },
  {
    label: "New This Week",
    value: "newThisWeek",
    icon: UserPlus,
    color: "text-orange-600 dark:text-orange-400",
  },
] as const;

export function StatsCards({
  totalUsers,
  totalAdmins,
  totalStandardUsers,
  newThisWeek,
}: StatsCardsProps) {
  const values = {
    totalUsers,
    totalAdmins,
    totalStandardUsers,
    newThisWeek,
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.value} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{values[stat.value]}</div>
              {stat.value === "newThisWeek" && newThisWeek > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Growing
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


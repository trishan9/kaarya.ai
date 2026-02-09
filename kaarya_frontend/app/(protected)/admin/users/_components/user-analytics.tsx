"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { StatsCards } from "./stats-cards";
import { GrowthChart } from "./growth-chart";
import { RoleDistributionChart } from "./role-distribution-chart";
import { AcquisitionChart } from "./acquisition-chart";

export type AdminUsersAnalyticsData = {
  totalUsers: number;
  totalAdmins: number;
  totalStandardUsers: number;
  newThisWeek: number;
  roleBreakdown: { name: string; value: number }[];
  signupTrend: { label: string; value: number }[];
};

export function AdminUsersAnalytics({
  data,
}: {
  data: AdminUsersAnalyticsData;
}) {
  const { totalUsers, totalAdmins, totalStandardUsers, newThisWeek } = data;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <StatsCards
          totalUsers={totalUsers}
          totalAdmins={totalAdmins}
          totalStandardUsers={totalStandardUsers}
          newThisWeek={newThisWeek}
        />

        <div className="gap-6 lg:grid-cols-2 hidden lg:grid">
          <GrowthChart data={data.signupTrend} />
          <RoleDistributionChart data={data.roleBreakdown} />
        </div>

        <AcquisitionChart data={data.signupTrend} />
      </div>
    </TooltipProvider>
  );
}

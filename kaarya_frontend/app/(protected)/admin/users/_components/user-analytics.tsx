"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { TUser } from "@/lib/definitions";
import { StatsCards } from "./stats-cards";
import { GrowthChart } from "./growth-chart";
import { RoleDistributionChart } from "./role-distribution-chart";
import { AcquisitionChart } from "./acquisition-chart";

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
        <StatsCards
          totalUsers={totalUsers}
          totalAdmins={totalAdmins}
          totalStandardUsers={totalStandardUsers}
          newThisWeek={newThisWeek}
        />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <GrowthChart data={signupTrend} />
          <RoleDistributionChart data={roleBreakdown} />
        </div>

        <AcquisitionChart data={signupTrend} />
      </div>
    </TooltipProvider>
  );
}

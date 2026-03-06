import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "./_components/overview-header-actions";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted/70 ${className}`} />;
}

function MetricCardSkeleton() {
  return (
    <Card className="gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-[#111824] dark:shadow-none">
      <Block className="h-3 w-24" />
      <Block className="h-8 w-16" />
      <Block className="h-3 w-32" />
    </Card>
  );
}

function SideCardSkeleton() {
  return (
    <Card className="gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-[#111824] dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Block className="h-4 w-28" />
          <Block className="h-3 w-24" />
        </div>
        <Block className="h-10 w-10 rounded-full" />
      </div>
      <Block className="h-12 w-24" />
      <div className="space-y-2">
        <Block className="h-3 w-full" />
        <Block className="h-3 w-5/6" />
      </div>
      <div className="space-y-2">
        <Block className="h-3 w-28" />
        <Block className="h-3 w-full" />
        <Block className="h-3 w-4/5" />
      </div>
      <Block className="h-10 w-full rounded-lg" />
    </Card>
  );
}

function RecommendationCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="space-y-3">
        <Block className="h-4 w-32" />
        <Block className="h-3 w-24" />
        <Block className="h-3 w-20" />
        <Block className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader title="Overview" actions={<OverviewHeaderActions />} />

        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <Card className="gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-[#111824] dark:shadow-none">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <Block className="h-5 w-44" />
                    <Block className="h-3 w-64 max-w-full" />
                  </div>
                  <div className="flex gap-2">
                    <Block className="h-8 w-20 rounded-md" />
                    <Block className="h-8 w-20 rounded-md" />
                    <Block className="h-8 w-20 rounded-md" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Card className="gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-[#111824] dark:shadow-none">
                  <Block className="h-5 w-32" />
                  <Block className="h-3 w-40" />
                  <div className="space-y-3 pt-2">
                    <Block className="h-10 w-full rounded-lg" />
                    <Block className="h-10 w-full rounded-lg" />
                    <Block className="h-10 w-4/5 rounded-lg" />
                  </div>
                </Card>

                <Card className="gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-[#111824] dark:shadow-none">
                  <Block className="h-5 w-32" />
                  <Block className="h-3 w-44" />
                  <div className="space-y-3 pt-2">
                    <Block className="h-16 w-full rounded-xl" />
                    <Block className="h-16 w-full rounded-xl" />
                  </div>
                </Card>
              </div>

              <Card className="gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-[#111824] dark:shadow-none">
                <div className="space-y-2">
                  <Block className="h-5 w-40" />
                  <Block className="h-3 w-56 max-w-full" />
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                  <div className="flex min-h-[260px] items-end gap-3 rounded-xl border border-border/60 p-4">
                    <Block className="h-24 flex-1 rounded-lg" />
                    <Block className="h-36 flex-1 rounded-lg" />
                    <Block className="h-48 flex-1 rounded-lg" />
                    <Block className="h-32 flex-1 rounded-lg" />
                    <Block className="h-56 flex-1 rounded-lg" />
                    <Block className="h-40 flex-1 rounded-lg" />
                  </div>
                  <div className="space-y-3 rounded-xl border border-border/60 p-4">
                    <Block className="h-4 w-32" />
                    <Block className="h-20 w-full rounded-xl" />
                    <Block className="h-20 w-full rounded-xl" />
                    <Block className="h-20 w-full rounded-xl" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="min-w-0 flex h-full flex-col gap-4">
              <SideCardSkeleton />
              <SideCardSkeleton />
              <SideCardSkeleton />
            </div>
          </div>

          <Card className="gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm dark:bg-[#111824] dark:shadow-none">
            <div className="space-y-2">
              <Block className="h-5 w-40" />
              <Block className="h-3 w-60 max-w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <RecommendationCardSkeleton />
              <RecommendationCardSkeleton />
              <RecommendationCardSkeleton />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

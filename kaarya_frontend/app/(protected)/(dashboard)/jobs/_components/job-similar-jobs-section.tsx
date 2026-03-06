import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { JobCard, type JobCardProps } from "../../_components/job-card";

export type JobSimilarJobsSectionProps = {
  title: string;
  seeAllLabel: string;
  seeAllHref: string;
  jobs: JobCardProps[];
};

export function JobSimilarJobsSection({
  title,
  seeAllLabel,
  seeAllHref,
  jobs,
}: JobSimilarJobsSectionProps) {
  return (
    <Card className="gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm dark:bg-[#111824] dark:shadow-none sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {seeAllLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {jobs.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
          No similar jobs available right now.
        </div>
      )}
    </Card>
  );
}

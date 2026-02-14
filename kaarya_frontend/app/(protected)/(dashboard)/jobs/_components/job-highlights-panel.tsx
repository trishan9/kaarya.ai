import { Card } from "@/components/ui/card";

export type JobHighlightsPanelProps = {
  levelLabel: string;
  level: string;
  experienceLabel: string;
  experience: string;
  jobTypeLabel: string;
  jobType: string;
  workTypeLabel: string;
  workType: string;
  salaryRangeLabel: string;
  salaryRange: string;
};

function HighlightItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ececf0] bg-white p-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function JobHighlightsPanel({
  levelLabel,
  level,
  experienceLabel,
  experience,
  jobTypeLabel,
  jobType,
  workTypeLabel,
  workType,
  salaryRangeLabel,
  salaryRange,
}: JobHighlightsPanelProps) {
  return (
    <Card className="gap-3 rounded-2xl border border-[#ececf0] bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <HighlightItem label={levelLabel} value={level} />
        <HighlightItem label={experienceLabel} value={experience} />
        <HighlightItem label={jobTypeLabel} value={jobType} />
        <HighlightItem label={workTypeLabel} value={workType} />
      </div>

      <div className="rounded-xl border border-[#ececf0] bg-white p-4 text-center">
        <p className="text-xs text-muted-foreground">{salaryRangeLabel}</p>
        <p className="mt-1 text-base font-semibold text-foreground">{salaryRange}</p>
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type InterviewOverallRatingPanelProps = {
  title: string;
  rating: number;
  badgeLabel: string;
  description: string;
  suggestionTitle: string;
  suggestionBody: string;
  className?: string;
};

export function InterviewOverallRatingPanel({
  title,
  rating,
  badgeLabel,
  description,
  suggestionTitle,
  suggestionBody,
  className,
}: InterviewOverallRatingPanelProps) {
  return (
    <Card
      className={cn(
        "min-w-0 gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <h3 className="font-semibold text-foreground">{title}</h3>

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-3xl font-semibold text-rose-500 sm:text-4xl">{rating}%</div>
        <span className="rounded-md bg-[#ffe7ed] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#ff2c55]">
          {badgeLabel}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{description}</p>

      <div className="rounded-xl bg-[#eef5fb] px-4 py-3">
        <div className="mb-1 text-sm font-semibold text-[#0b67c2]">{suggestionTitle}</div>
        <p className="text-xs text-muted-foreground">{suggestionBody}</p>
      </div>
    </Card>
  );
}

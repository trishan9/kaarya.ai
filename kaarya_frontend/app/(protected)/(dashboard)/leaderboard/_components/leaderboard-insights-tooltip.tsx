import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TLeaderboardRow } from "@/lib/definitions";

type LeaderboardInsightsTooltipProps = {
  row: TLeaderboardRow;
  triggerClassName?: string;
};

export const LeaderboardInsightsTooltip = ({
  row,
  triggerClassName,
}: LeaderboardInsightsTooltipProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Show performance details for ${row.student.name ?? "candidate"}`}
          className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm text-current transition-opacity hover:opacity-100 ${triggerClassName ?? "opacity-80"}`}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="end" className="w-72 p-3 text-xs">
        <p className="mb-2 text-sm font-semibold">
          {row.student.name ?? "Candidate"}: performance details
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <span className="text-slate-300">Level</span>
          <span>{row.level}</span>
          <span className="text-slate-300">Profile updates</span>
          <span>{row.profileUpdates}</span>
          <span className="text-slate-300">Job views</span>
          <span>{row.jobViews}</span>
          <span className="text-slate-300">Saved jobs</span>
          <span>{row.jobsSaved}</span>
          <span className="text-slate-300">Saved interviews</span>
          <span>{row.interviewsSaved}</span>
          <span className="text-slate-300">Applications submitted</span>
          <span>{row.applicationsSubmitted}</span>
          <span className="text-slate-300">Interview scheduled</span>
          <span>{row.interviewScheduled}</span>
          <span className="text-slate-300">Resumes created</span>
          <span>{row.resumesCreated}</span>
          <span className="text-slate-300">Resumes saved</span>
          <span>{row.resumesSaved}</span>
          <span className="text-slate-300">Interviews taken</span>
          <span>{row.interviewsTaken}</span>
          <span className="text-slate-300">Scored interviews</span>
          <span>{row.interviewScoreEntries}</span>
          <span className="text-slate-300">Avg interview</span>
          <span>{row.averageInterviewScore}/100</span>
          <span className="text-slate-300">Best interview</span>
          <span>{row.bestInterviewScore}/100</span>
          <span className="text-slate-300">ATS scans</span>
          <span>{row.atsScans}</span>
          <span className="text-slate-300">Avg ATS</span>
          <span>{row.averageAtsScore}/100</span>
          <span className="text-slate-300">Best ATS</span>
          <span>{row.bestAtsScore}/100</span>
          <span className="text-slate-300">Applications</span>
          <span>{row.applications}</span>
          <span className="text-slate-300">Shortlisted</span>
          <span>{row.shortlisted}</span>
          <span className="text-slate-300">Accepted</span>
          <span>{row.accepted}</span>
          <span className="text-slate-300">Rejected</span>
          <span>{row.rejected}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

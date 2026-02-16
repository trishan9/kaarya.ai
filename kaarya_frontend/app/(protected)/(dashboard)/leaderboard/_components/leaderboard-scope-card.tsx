import Link from "next/link";
import { ChevronDown, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TLeaderboardScope } from "@/lib/definitions";

type LeaderboardScopeCardProps = {
  activeScope: TLeaderboardScope;
  isCandidateRole: boolean;
  isRecruiterRole: boolean;
  isCollegeRole: boolean;
  rowsCount: number;
  selectedCollegeId?: string;
  selectedCollegeName?: string | null;
  leaderboardWorkspaceName?: string;
  buildScopeHref: (nextScope: TLeaderboardScope) => string;
};

export const LeaderboardScopeCard = ({
  activeScope,
  isCandidateRole,
  isRecruiterRole,
  isCollegeRole,
  rowsCount,
  selectedCollegeId,
  selectedCollegeName,
  leaderboardWorkspaceName,
  buildScopeHref,
}: LeaderboardScopeCardProps) => {
  const boardName =
    activeScope === "college"
      ? `${selectedCollegeName ?? leaderboardWorkspaceName ?? "College"} board`
      : "All candidates board";

  return (
    <Card className="gap-4 rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            Rank is decided by <span className="font-bold">K-Rank</span>.
          </p>
          <p className="text-xs text-slate-600">
            K-Rank = (XP x quality factor) + (Score x 2). Better Score makes
            more of your XP count.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isCandidateRole ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 rounded-lg text-xs">
                  {activeScope === "college" ? "College board" : "Global board"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href={buildScopeHref("global")}>Global leaderboard</Link>
                </DropdownMenuItem>
                {selectedCollegeId ? (
                  <DropdownMenuItem asChild>
                    <Link href={buildScopeHref("college")}>
                      College leaderboard
                    </Link>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {isRecruiterRole ? (
            <Badge variant="secondary">Global leaderboard</Badge>
          ) : null}
          {isCollegeRole ? <Badge variant="secondary">College leaderboard</Badge> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <Trophy className="h-4 w-4 text-slate-700" />
        <span>{boardName}</span>
        <Badge variant="secondary">{rowsCount} shown</Badge>
      </div>
    </Card>
  );
};

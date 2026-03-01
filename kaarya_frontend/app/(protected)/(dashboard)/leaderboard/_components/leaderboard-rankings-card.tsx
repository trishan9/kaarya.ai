import Link from "next/link";
import { Check, ChevronDown, Crown, Flame, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TLeaderboardData,
  TLeaderboardRow,
  TLeaderboardScope,
} from "@/lib/definitions";
import { initials, totalPoints } from "../_lib/leaderboard-utils";
import { LeaderboardInsightsTooltip } from "./leaderboard-insights-tooltip";

type LeaderboardRankingsCardProps = {
  activeScope: TLeaderboardScope;
  isCandidateRole: boolean;
  isRecruiterRole: boolean;
  isCollegeRole: boolean;
  selectedCollegeId?: string;
  rowsCount: number;
  buildScopeHref: (nextScope: TLeaderboardScope) => string;
  topThree: TLeaderboardRow[];
  spotlightRows: TLeaderboardRow[];
  rankingRows: TLeaderboardRow[];
  currentUserId?: string;
  meta?: TLeaderboardData["meta"];
  buildPageHref: (nextPage: number) => string;
};

const podiumTone = (rank: number) => {
  if (rank === 1) {
    return {
      card: "border-sky-400/40 bg-slate-950",
      accentBar: "bg-sky-400",
      ring: "ring-sky-300/70",
      label: "Champion",
      icon: Crown,
      iconClass: "text-sky-300",
      totalClass: "text-sky-300",
    };
  }

  if (rank === 2) {
    return {
      card: "border-indigo-300/35 bg-slate-950",
      accentBar: "bg-indigo-300",
      ring: "ring-indigo-200/70",
      label: "Runner-up",
      icon: Medal,
      iconClass: "text-indigo-200",
      totalClass: "text-indigo-200",
    };
  }

  return {
    card: "border-emerald-300/35 bg-slate-950",
    accentBar: "bg-emerald-300",
    ring: "ring-emerald-200/70",
    label: "3rd Place",
    icon: Medal,
    iconClass: "text-emerald-200",
    totalClass: "text-emerald-200",
  };
};

export const LeaderboardRankingsCard = ({
  activeScope,
  isCandidateRole,
  isRecruiterRole,
  isCollegeRole,
  selectedCollegeId,
  rowsCount,
  buildScopeHref,
  topThree,
  spotlightRows,
  rankingRows,
  currentUserId,
  meta,
  buildPageHref,
}: LeaderboardRankingsCardProps) => {
  return (
    <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">All Rankings</p>
          <p className="text-xs text-muted-foreground">{rowsCount} shown</p>
        </div>

        <div className="flex items-center gap-2">
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
                  <Link
                    href={buildScopeHref("global")}
                    className="flex items-center justify-between"
                  >
                    <span>Global leaderboard</span>
                    {activeScope === "global" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : null}
                  </Link>
                </DropdownMenuItem>
                {selectedCollegeId ? (
                  <DropdownMenuItem asChild>
                    <Link
                      href={buildScopeHref("college")}
                      className="flex items-center justify-between"
                    >
                      <span>College leaderboard</span>
                      {activeScope === "college" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {isRecruiterRole ? (
            <p className="text-xs text-muted-foreground">Global leaderboard</p>
          ) : null}
          {isCollegeRole ? (
            <p className="text-xs text-muted-foreground">College leaderboard</p>
          ) : null}
        </div>
      </div>

      {topThree.length > 0 ? (
        <div className="mb-2">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Top 3</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {spotlightRows.map((row) => {
              const tone = podiumTone(row.rank);
              const Icon = tone.icon;
              const isChampion = row.rank === 1;
              const isCurrentUser = currentUserId === row.student.id;

              return (
                <Card
                  key={`podium-${row.student.id}-${row.rank}`}
                  className={`relative overflow-hidden rounded-2xl border p-4 ${tone.card} ${isChampion ? "md:-translate-y-3" : ""}`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 ${tone.accentBar}`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <Badge className="bg-card/10 text-white hover:bg-accent/10">
                      #{row.rank}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {isCurrentUser ? (
                        <Badge className="bg-indigo-600 text-white">You</Badge>
                      ) : null}
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                        <Icon className={`h-4 w-4 ${tone.iconClass}`} />
                        {tone.label}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <Avatar className={`h-11 w-11 ring-2 ${tone.ring}`}>
                      <AvatarImage
                        src={row.student.photo ?? undefined}
                        alt={row.student.name ?? "Candidate"}
                      />
                      <AvatarFallback>
                        {initials(row.student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {row.student.name ?? "Candidate"}
                      </p>
                      <p className="text-xs text-slate-300">
                        Level {row.level}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-white/10 bg-card/5 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-slate-300">
                        XP
                      </p>
                      <p className="text-sm font-bold text-cyan-200">
                        {row.xp}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-card/5 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-slate-300">
                        Score
                      </p>
                      <p className="text-sm font-bold text-white">
                        {row.score}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-card/5 px-2 py-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] uppercase tracking-wide text-slate-300">
                          K-Rank
                        </p>
                        <LeaderboardInsightsTooltip
                          row={row}
                          triggerClassName="text-slate-300 opacity-70 hover:opacity-100"
                        />
                      </div>
                      <p className={`text-sm font-bold ${tone.totalClass}`}>
                        {totalPoints(row)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {rankingRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {topThree.length > 0
            ? "No more players below top 3 right now."
            : "No players to show right now."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {rankingRows.map((row, index) => {
            const isCurrentUser = currentUserId === row.student.id;
            const isLast = index === rankingRows.length - 1;
            return (
              <div
                key={`${row.student.id}-${row.rank}`}
                className={`flex flex-wrap items-center justify-between gap-3 px-3 py-2 ${
                  isCurrentUser ? "bg-primary/5" : "bg-card"
                } ${!isLast ? "border-b border-border" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-8 text-center text-sm font-semibold text-foreground">
                    #{row.rank}
                  </div>

                  <Avatar className="h-9 w-9 ring-1 ring-slate-200">
                    <AvatarImage
                      src={row.student.photo ?? undefined}
                      alt={row.student.name ?? "Candidate"}
                    />
                    <AvatarFallback>
                      {initials(row.student.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {row.student.name ?? "Candidate"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Level {row.level}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
                  {isCurrentUser ? (
                    <span className="font-medium text-primary">You</span>
                  ) : null}
                  <span>
                    XP{" "}
                    <span className="font-semibold text-foreground">
                      {row.xp}
                    </span>
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span>
                    Score{" "}
                    <span className="font-semibold text-foreground">
                      {row.score}
                    </span>
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span className="inline-flex items-center gap-1">
                    K-Rank{" "}
                    <span className="font-semibold text-foreground">
                      {totalPoints(row)}
                    </span>
                    <LeaderboardInsightsTooltip
                      row={row}
                      triggerClassName="text-muted-foreground"
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta ? (
        <>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                className="h-8 rounded-lg text-xs"
                disabled={!meta.hasPrevPage}
              >
                <Link href={buildPageHref(Math.max(1, meta.page - 1))}>
                  Previous
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-8 rounded-lg text-xs"
                disabled={!meta.hasNextPage}
              >
                <Link href={buildPageHref(meta.page + 1)}>Next</Link>
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </Card>
  );
};


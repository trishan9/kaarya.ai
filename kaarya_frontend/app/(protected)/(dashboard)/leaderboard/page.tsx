import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../_components/dashboard-header";
import { getCurrentUser } from "@/lib/dal";
import { getLeaderboard, listCollegeWorkspaces } from "@/lib/actions/college-actions";
import {
  Role,
  TLeaderboardData,
  TLeaderboardScope,
  TLeaderboardRow,
} from "@/lib/definitions";
import {
  extractCollegeWorkspaces,
  extractWorkspaceRows,
  resolveCollegeWorkspace,
} from "@/lib/workspaces";

type LeaderboardPageProps = {
  searchParams?: Promise<{
    scope?: string;
    workspace?: string;
    page?: string;
    size?: string;
  }>;
};

const normalizeScope = (value?: string): TLeaderboardScope =>
  value === "college" ? "college" : "global";

const normalizePage = (value?: string, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const params = await searchParams;
  const page = normalizePage(params?.page, 1);
  const size = normalizePage(params?.size, 20);
  const requestedWorkspaceId =
    typeof params?.workspace === "string" ? params.workspace : undefined;

  const canUseCollegeScope =
    user?.role === Role.USER ||
    user?.role === Role.STUDENT ||
    user?.role === Role.COLLEGE;

  const workspaceResponse = canUseCollegeScope
    ? await listCollegeWorkspaces({ page: 1, size: 50 })
    : null;
  const collegeWorkspaces = extractCollegeWorkspaces(
    extractWorkspaceRows(workspaceResponse),
  );

  const selectedWorkspace = resolveCollegeWorkspace({
    workspaces: collegeWorkspaces,
    requestedId: requestedWorkspaceId,
  });
  const selectedCollegeId = selectedWorkspace?.college?.id;

  const requestedScope = normalizeScope(params?.scope);
  const scope: TLeaderboardScope =
    requestedScope === "college" && canUseCollegeScope && selectedCollegeId
      ? "college"
      : "global";

  const leaderboardResponse = await getLeaderboard({
    scope,
    collegeId: scope === "college" ? selectedCollegeId : undefined,
    page,
    size,
  });

  const leaderboardData = (leaderboardResponse?.data ?? null) as TLeaderboardData | null;
  const rows = Array.isArray(leaderboardData?.rows)
    ? (leaderboardData?.rows as TLeaderboardRow[])
    : [];
  const activeScope = leaderboardData?.scope ?? scope;

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader title="Leaderboard" />

        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <Card className="gap-3 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Compare outcomes across applications and interview progress.
                </p>
                <p className="text-xs text-muted-foreground">
                  Switch between global rankings and your college workspace ranking.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  variant={activeScope === "global" ? "default" : "outline"}
                  className="h-8 rounded-lg text-xs"
                >
                  <Link href="/leaderboard?scope=global">Global</Link>
                </Button>
                {canUseCollegeScope && selectedCollegeId ? (
                  <Button
                    asChild
                    variant={activeScope === "college" ? "default" : "outline"}
                    className="h-8 rounded-lg text-xs"
                  >
                    <Link
                      href={`/leaderboard?scope=college&workspace=${encodeURIComponent(selectedCollegeId)}`}
                    >
                      College
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            {canUseCollegeScope && collegeWorkspaces.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {collegeWorkspaces.map((workspace) => {
                  const isActive = workspace.college?.id === selectedCollegeId;
                  return (
                    <Button
                      key={workspace.membershipId}
                      asChild
                      variant={isActive ? "default" : "outline"}
                      className="h-8 rounded-lg text-xs"
                    >
                      <Link
                        href={`/leaderboard?scope=${activeScope}&workspace=${encodeURIComponent(workspace.college.id)}`}
                      >
                        {workspace.college.name ?? "College"}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[#d8dde4] bg-neutral-50 px-3 py-2 text-xs text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>
                {activeScope === "college"
                  ? `College scope: ${selectedWorkspace?.college.name ?? leaderboardData?.workspace?.name ?? "Selected workspace"}`
                  : "Global scope: all candidates"}
              </span>
              <Badge variant="secondary">{rows.length} rows</Badge>
            </div>
          </Card>

          <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No leaderboard data available for this scope yet.
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => (
                  <div
                    key={`${row.student.id}-${row.rank}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf0] bg-neutral-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        #{row.rank} {row.student.name ?? "Student"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.applications} applications - {row.interviewScheduled} interviews -{" "}
                        {row.accepted} accepted
                      </p>
                    </div>
                    <Badge variant="secondary">{row.score} pts</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

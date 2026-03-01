import { redirect } from "next/navigation";
import { DashboardHeader } from "../_components/dashboard-header";
import { getCurrentUser } from "@/lib/dal";
import {
  getLeaderboard,
  listCollegeWorkspaces,
} from "@/lib/actions/college-actions";
import {
  Role,
  TLeaderboardData,
  TLeaderboardRow,
  TLeaderboardScope,
} from "@/lib/definitions";
import {
  extractCollegeWorkspaces,
  extractWorkspaceRows,
  resolveCollegeWorkspace,
} from "@/lib/workspaces";
import { LeaderboardGuideCard } from "./_components/leaderboard-guide-card";
import { LeaderboardRankingsCard } from "./_components/leaderboard-rankings-card";
import {
  XP_PER_LEVEL,
  normalizePage,
  normalizeScope,
  resolveRankingGroups,
} from "./_lib/leaderboard-utils";

type LeaderboardPageProps = {
  searchParams?: Promise<{
    scope?: string;
    workspace?: string;
    page?: string;
    size?: string;
  }>;
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

  const isCandidateRole =
    user?.role === Role.USER || user?.role === Role.STUDENT;
  const isCollegeRole = user?.role === Role.COLLEGE;
  const isRecruiterRole = user?.role === Role.RECRUITER;
  const canUseCollegeScope = isCandidateRole || isCollegeRole;

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
  const scope: TLeaderboardScope = isCollegeRole
    ? "college"
    : requestedScope === "college" && isCandidateRole && selectedCollegeId
      ? "college"
      : "global";

  const leaderboardResponse = await getLeaderboard({
    scope,
    collegeId: scope === "college" ? selectedCollegeId : undefined,
    page,
    size,
  });

  const leaderboardData = (leaderboardResponse?.data ??
    null) as TLeaderboardData | null;
  const rows = Array.isArray(leaderboardData?.rows)
    ? (leaderboardData?.rows as TLeaderboardRow[])
    : [];
  const activeScope = leaderboardData?.scope ?? scope;
  const me = leaderboardData?.me ?? null;
  const meta = leaderboardData?.meta;
  const currentPage = meta?.page ?? page;

  const { topThree, rankingRows, spotlightRows } = resolveRankingGroups(
    rows,
    currentPage,
  );

  const buildPageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    query.set("scope", activeScope);
    if (activeScope === "college" && selectedCollegeId) {
      query.set("workspace", selectedCollegeId);
    }
    query.set("page", String(nextPage));
    query.set("size", String(size));
    return `/leaderboard?${query.toString()}`;
  };
  const buildScopeHref = (nextScope: TLeaderboardScope) => {
    const query = new URLSearchParams();
    query.set("scope", nextScope);
    if (nextScope === "college" && selectedCollegeId) {
      query.set("workspace", selectedCollegeId);
    }
    query.set("page", "1");
    query.set("size", String(size));
    return `/leaderboard?${query.toString()}`;
  };

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <DashboardHeader title="Leaderboard" />

        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <LeaderboardRankingsCard
            activeScope={activeScope}
            isCandidateRole={isCandidateRole}
            isRecruiterRole={isRecruiterRole}
            isCollegeRole={isCollegeRole}
            selectedCollegeId={selectedCollegeId}
            rowsCount={rows.length}
            buildScopeHref={buildScopeHref}
            topThree={topThree}
            spotlightRows={spotlightRows}
            rankingRows={rankingRows}
            currentUserId={me?.student.id}
            meta={meta}
            buildPageHref={buildPageHref}
          />

          <LeaderboardGuideCard xpPerLevel={XP_PER_LEVEL} />
        </div>
      </div>
    </div>
  );
}




import { TLeaderboardRow, TLeaderboardScope } from "@/lib/definitions";

const LEADERBOARD_WEIGHTS = {
  xp: 1,
  score: 2,
} as const;

export const XP_PER_LEVEL = 250;

export const normalizeScope = (value?: string): TLeaderboardScope =>
  value === "college" ? "college" : "global";

export const normalizePage = (value?: string, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const scoreToXpMultiplier = (score: number) => {
  if (score >= 80) return 1;
  if (score >= 60) return 0.9;
  if (score >= 40) return 0.75;
  if (score >= 20) return 0.55;
  if (score >= 1) return 0.35;
  return 0.2;
};

export const totalPoints = (input: {
  total?: number;
  xp: number;
  score: number;
}) => {
  if (Number.isFinite(input.total)) {
    return Math.max(0, Math.round(input.total as number));
  }

  const xpMultiplier = scoreToXpMultiplier(input.score);
  return Math.max(
    0,
    Math.round(
      input.xp * LEADERBOARD_WEIGHTS.xp * xpMultiplier +
        input.score * LEADERBOARD_WEIGHTS.score,
    ),
  );
};

export const initials = (value?: string | null) =>
  (value ?? "U")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export const resolveRankingGroups = (rows: TLeaderboardRow[], currentPage: number) => {
  const topThree = currentPage === 1 ? rows.slice(0, 3) : [];
  const rankingRows = currentPage === 1 ? rows.slice(3) : rows;

  const first = topThree.find((row) => row.rank === 1);
  const second = topThree.find((row) => row.rank === 2);
  const third = topThree.find((row) => row.rank === 3);
  const spotlightRows = [second, first, third].filter(
    (row): row is TLeaderboardRow => Boolean(row),
  );

  return {
    topThree,
    rankingRows,
    spotlightRows,
  };
};

import type { TLeaderboardRow } from "@/lib/definitions";
import {
  XP_PER_LEVEL,
  initials,
  normalizePage,
  normalizeScope,
  resolveRankingGroups,
  totalPoints,
} from "@/app/(protected)/(dashboard)/leaderboard/_lib/leaderboard-utils";

const row = (rank: number, score = 50, xp = 100): TLeaderboardRow =>
  ({
    rank,
    total: 0,
    xp,
    score,
    level: Math.max(1, Math.floor(xp / XP_PER_LEVEL)),
    applications: 0,
    interviewScheduled: 0,
    accepted: 0,
    shortlisted: 0,
    rejected: 0,
    profileUpdates: 0,
    jobViews: 0,
    jobsSaved: 0,
    interviewsSaved: 0,
    applicationsSubmitted: 0,
    interviewsTaken: 0,
    interviewsCompleted: 0,
    resumesCreated: 0,
    resumesSaved: 0,
    atsScans: 0,
    bestInterviewScore: 0,
    averageInterviewScore: 0,
    reliableInterviewScore: 0,
    interviewScoreEntries: 0,
    bestAtsScore: 0,
    averageAtsScore: 0,
    atsScoreEntries: 0,
    student: {
      id: `s-${rank}`,
      name: `Student ${rank}`,
    },
  }) as TLeaderboardRow;

describe("leaderboard utils", () => {
  it("normalizes scope and page values", () => {
    expect(normalizeScope()).toBe("global");
    expect(normalizeScope("college")).toBe("college");
    expect(normalizeScope("something-else")).toBe("global");

    expect(normalizePage("3")).toBe(3);
    expect(normalizePage("-1", 9)).toBe(9);
    expect(normalizePage("NaN", 4)).toBe(4);
  });

  it("computes total points with and without explicit total", () => {
    expect(totalPoints({ total: 777, xp: 20, score: 10 })).toBe(777);
    expect(totalPoints({ total: -10, xp: 20, score: 10 })).toBe(0);

    expect(totalPoints({ xp: 100, score: 85 })).toBe(270);
    expect(totalPoints({ xp: 100, score: 65 })).toBe(220);
    expect(totalPoints({ xp: 100, score: 45 })).toBe(165);
    expect(totalPoints({ xp: 100, score: 25 })).toBe(105);
    expect(totalPoints({ xp: 100, score: 5 })).toBe(45);
    expect(totalPoints({ xp: 100, score: 0 })).toBe(20);
  });

  it("generates initials correctly", () => {
    expect(initials("John Doe")).toBe("JD");
    expect(initials(" jane ")).toBe("J");
    expect(initials("")).toBe("U");
    expect(initials(null)).toBe("U");
  });

  it("resolves ranking groups for first page and non-first page", () => {
    const rows = [row(1), row(2), row(3), row(4), row(5)];

    const pageOne = resolveRankingGroups(rows, 1);
    expect(pageOne.topThree.map((item) => item.rank)).toEqual([1, 2, 3]);
    expect(pageOne.rankingRows.map((item) => item.rank)).toEqual([4, 5]);
    expect(pageOne.spotlightRows.map((item) => item.rank)).toEqual([2, 1, 3]);

    const pageTwo = resolveRankingGroups(rows, 2);
    expect(pageTwo.topThree).toEqual([]);
    expect(pageTwo.rankingRows).toEqual(rows);
    expect(pageTwo.spotlightRows).toEqual([]);
  });
});

export const XP_PER_LEVEL = 250;

export const GAMIFICATION_XP = {
  PROFILE_UPDATED: 10,
  JOB_VIEWED: 2,
  JOB_SAVED: 5,
  INTERVIEW_SAVED: 6,
  JOB_APPLICATION_SUBMITTED: 25,
  APPLICATION_STATUS_SHORTLISTED: 35,
  APPLICATION_STATUS_INTERVIEW_SCHEDULED: 50,
  APPLICATION_STATUS_ACCEPTED: 120,
  APPLICATION_STATUS_REJECTED: 0,
  MOCK_INTERVIEW_STARTED: 8,
  MOCK_INTERVIEW_COMPLETED: 28,
  RESUME_BUILDER_CREATED: 15,
  RESUME_BUILDER_SAVED: 25,
  ATS_SCAN_COMPLETED: 20,
} as const;

export const GAMIFICATION_SCORE = {
  PROFILE_UPDATED: 0,
  JOB_VIEWED: 0,
  JOB_SAVED: 0,
  INTERVIEW_SAVED: 0,
  JOB_APPLICATION_SUBMITTED: 0,
  APPLICATION_STATUS_SHORTLISTED: 20,
  APPLICATION_STATUS_INTERVIEW_SCHEDULED: 28,
  APPLICATION_STATUS_ACCEPTED: 65,
  APPLICATION_STATUS_REJECTED: -14,
  MOCK_INTERVIEW_STARTED: 0,
  MOCK_INTERVIEW_COMPLETED: 4,
  RESUME_BUILDER_CREATED: 0,
  RESUME_BUILDER_SAVED: 0,
  ATS_SCAN_COMPLETED: 2,
} as const;

export const LEADERBOARD_TOTAL_WEIGHTS = {
  XP: 1,
  SCORE: 2,
} as const;

export const SCORE_QUALITY_MULTIPLIER_BANDS: Array<{
  minScore: number;
  multiplier: number;
}> = [
  { minScore: 80, multiplier: 1 },
  { minScore: 60, multiplier: 0.9 },
  { minScore: 40, multiplier: 0.75 },
  { minScore: 20, multiplier: 0.55 },
  { minScore: 1, multiplier: 0.35 },
];

export const INTERVIEW_SCORE_XP_BANDS: Array<{ minScore: number; xp: number }> = [
  { minScore: 90, xp: 80 },
  { minScore: 80, xp: 60 },
  { minScore: 70, xp: 45 },
  { minScore: 60, xp: 30 },
  { minScore: 50, xp: 15 },
];

export const ATS_SCORE_XP_BANDS: Array<{ minScore: number; xp: number }> = [
  { minScore: 90, xp: 60 },
  { minScore: 80, xp: 45 },
  { minScore: 70, xp: 30 },
  { minScore: 60, xp: 20 },
  { minScore: 50, xp: 10 },
];

const SCORE_PENALTY_FLOOR = {
  INTERVIEW: -12,
  ATS: -8,
} as const;

export const resolveXpFromScoreBands = (
  score: number | null | undefined,
  bands: Array<{ minScore: number; xp: number }>,
) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 0;
  }

  for (const band of bands) {
    if (score >= band.minScore) {
      return band.xp;
    }
  }

  return 0;
};

export const resolveInterviewScoreDelta = (score: number | null | undefined) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 0;
  }

  if (score >= 90) return 30;
  if (score >= 80) return 22;
  if (score >= 70) return 15;
  if (score >= 60) return 8;
  if (score >= 50) return 3;
  if (score >= 40) return -6;
  return SCORE_PENALTY_FLOOR.INTERVIEW;
};

export const resolveAtsScoreDelta = (score: number | null | undefined) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 0;
  }

  if (score >= 90) return 22;
  if (score >= 80) return 16;
  if (score >= 70) return 11;
  if (score >= 60) return 6;
  if (score >= 50) return 2;
  if (score >= 40) return -4;
  return SCORE_PENALTY_FLOOR.ATS;
};

export const resolveLevelFromXp = (xp: number | null | undefined) => {
  const safeXp =
    typeof xp === 'number' && Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  return Math.floor(safeXp / XP_PER_LEVEL) + 1;
};

export const resolveLevelProgress = (xp: number | null | undefined) => {
  const safeXp =
    typeof xp === 'number' && Number.isFinite(xp) && xp > 0 ? Math.floor(xp) : 0;
  const currentLevel = resolveLevelFromXp(safeXp);
  const levelFloorXp = (currentLevel - 1) * XP_PER_LEVEL;
  const xpIntoLevel = safeXp - levelFloorXp;

  return {
    level: currentLevel,
    currentXp: safeXp,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    nextLevelAtXp: currentLevel * XP_PER_LEVEL,
  };
};

export const resolveReliableAverageScore = (input: {
  average: number;
  count: number;
  priorAverage?: number;
  priorWeight?: number;
}) => {
  const safeAverage =
    Number.isFinite(input.average) && input.average > 0 ? input.average : 0;
  const safeCount =
    Number.isFinite(input.count) && input.count > 0 ? Math.floor(input.count) : 0;
  const priorAverage =
    Number.isFinite(input.priorAverage) && (input.priorAverage ?? 0) > 0
      ? (input.priorAverage as number)
      : 65;
  const priorWeight =
    Number.isFinite(input.priorWeight) && (input.priorWeight ?? 0) > 0
      ? (input.priorWeight as number)
      : 5;

  return Math.round(
    (safeAverage * safeCount + priorAverage * priorWeight) /
      (safeCount + priorWeight),
  );
};

export const resolveLeaderboardTotal = (input: {
  xp: number | null | undefined;
  score: number | null | undefined;
}) => {
  const safeXp = Number.isFinite(input.xp)
    ? Math.max(0, Math.floor(input.xp as number))
    : 0;
  const safeScore = Number.isFinite(input.score)
    ? Math.floor(input.score as number)
    : 0;
  const xpQualityMultiplier = resolveXpQualityMultiplier(safeScore);

  return Math.max(
    0,
    Math.round(
      safeXp * LEADERBOARD_TOTAL_WEIGHTS.XP * xpQualityMultiplier +
        safeScore * LEADERBOARD_TOTAL_WEIGHTS.SCORE,
    ),
  );
};

export const resolveXpQualityMultiplier = (score: number | null | undefined) => {
  if (!Number.isFinite(score)) {
    return 0.2;
  }

  const safeScore = Math.floor(score as number);
  for (const band of SCORE_QUALITY_MULTIPLIER_BANDS) {
    if (safeScore >= band.minScore) {
      return band.multiplier;
    }
  }

  return 0.2;
};

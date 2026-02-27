import {
  ATS_SCORE_XP_BANDS,
  INTERVIEW_SCORE_XP_BANDS,
  LEADERBOARD_TOTAL_WEIGHTS,
  SCORE_QUALITY_MULTIPLIER_BANDS,
  XP_PER_LEVEL,
  resolveAtsScoreDelta,
  resolveInterviewScoreDelta,
  resolveLeaderboardTotal,
  resolveLevelFromXp,
  resolveLevelProgress,
  resolveReliableAverageScore,
  resolveXpFromScoreBands,
  resolveXpQualityMultiplier,
} from 'src/constants/gamification.constants';

describe('gamification constants', () => {
  it('should resolve xp from score bands and handle invalid scores', () => {
    expect(resolveXpFromScoreBands(undefined, INTERVIEW_SCORE_XP_BANDS)).toBe(0);
    expect(resolveXpFromScoreBands(null, INTERVIEW_SCORE_XP_BANDS)).toBe(0);
    expect(resolveXpFromScoreBands(Number.NaN, INTERVIEW_SCORE_XP_BANDS)).toBe(0);
    expect(resolveXpFromScoreBands(95, INTERVIEW_SCORE_XP_BANDS)).toBe(80);
    expect(resolveXpFromScoreBands(80, INTERVIEW_SCORE_XP_BANDS)).toBe(60);
    expect(resolveXpFromScoreBands(74, INTERVIEW_SCORE_XP_BANDS)).toBe(45);
    expect(resolveXpFromScoreBands(62, INTERVIEW_SCORE_XP_BANDS)).toBe(30);
    expect(resolveXpFromScoreBands(50, INTERVIEW_SCORE_XP_BANDS)).toBe(15);
    expect(resolveXpFromScoreBands(10, INTERVIEW_SCORE_XP_BANDS)).toBe(0);
    expect(resolveXpFromScoreBands(91, ATS_SCORE_XP_BANDS)).toBe(60);
  });

  it('should resolve interview score delta across thresholds', () => {
    expect(resolveInterviewScoreDelta(undefined)).toBe(0);
    expect(resolveInterviewScoreDelta(Number.NaN)).toBe(0);
    expect(resolveInterviewScoreDelta(92)).toBe(30);
    expect(resolveInterviewScoreDelta(85)).toBe(22);
    expect(resolveInterviewScoreDelta(74)).toBe(15);
    expect(resolveInterviewScoreDelta(64)).toBe(8);
    expect(resolveInterviewScoreDelta(55)).toBe(3);
    expect(resolveInterviewScoreDelta(45)).toBe(-6);
    expect(resolveInterviewScoreDelta(20)).toBe(-12);
  });

  it('should resolve ats score delta across thresholds', () => {
    expect(resolveAtsScoreDelta(undefined)).toBe(0);
    expect(resolveAtsScoreDelta(Number.NaN)).toBe(0);
    expect(resolveAtsScoreDelta(92)).toBe(22);
    expect(resolveAtsScoreDelta(85)).toBe(16);
    expect(resolveAtsScoreDelta(73)).toBe(11);
    expect(resolveAtsScoreDelta(64)).toBe(6);
    expect(resolveAtsScoreDelta(55)).toBe(2);
    expect(resolveAtsScoreDelta(45)).toBe(-4);
    expect(resolveAtsScoreDelta(20)).toBe(-8);
  });

  it('should resolve level and level progress', () => {
    expect(XP_PER_LEVEL).toBeGreaterThan(0);
    expect(resolveLevelFromXp(undefined)).toBe(1);
    expect(resolveLevelFromXp(-10)).toBe(1);
    expect(resolveLevelFromXp(0)).toBe(1);
    expect(resolveLevelFromXp(249)).toBe(1);
    expect(resolveLevelFromXp(250)).toBe(2);
    expect(resolveLevelFromXp(501.9)).toBe(3);

    const progress = resolveLevelProgress(501.9);
    expect(progress).toEqual({
      level: 3,
      currentXp: 501,
      xpIntoLevel: 1,
      xpForNextLevel: XP_PER_LEVEL,
      nextLevelAtXp: 750,
    });
  });

  it('should resolve reliable average score with defaults and safe bounds', () => {
    expect(
      resolveReliableAverageScore({
        average: Number.NaN,
        count: Number.NaN,
      }),
    ).toBe(65);

    expect(
      resolveReliableAverageScore({
        average: 90,
        count: 10,
      }),
    ).toBe(82);

    expect(
      resolveReliableAverageScore({
        average: 70,
        count: 2,
        priorAverage: 80,
        priorWeight: 8,
      }),
    ).toBe(78);
  });

  it('should resolve quality multiplier and leaderboard totals', () => {
    expect(SCORE_QUALITY_MULTIPLIER_BANDS.length).toBeGreaterThan(0);
    expect(resolveXpQualityMultiplier(undefined)).toBe(0.2);
    expect(resolveXpQualityMultiplier(Number.NaN)).toBe(0.2);
    expect(resolveXpQualityMultiplier(90)).toBe(1);
    expect(resolveXpQualityMultiplier(65)).toBe(0.9);
    expect(resolveXpQualityMultiplier(40)).toBe(0.75);
    expect(resolveXpQualityMultiplier(20)).toBe(0.55);
    expect(resolveXpQualityMultiplier(1)).toBe(0.35);
    expect(resolveXpQualityMultiplier(0)).toBe(0.2);

    const total = resolveLeaderboardTotal({ xp: 500, score: 80 });
    expect(total).toBe(
      Math.round(
        500 * LEADERBOARD_TOTAL_WEIGHTS.XP * 1 +
          80 * LEADERBOARD_TOTAL_WEIGHTS.SCORE,
      ),
    );
    expect(resolveLeaderboardTotal({ xp: -100, score: 40 })).toBeGreaterThanOrEqual(0);
    expect(resolveLeaderboardTotal({ xp: undefined, score: undefined })).toBe(0);
  });
});


import type { TUser } from "./definitions";

export type RatingCategory = {
  label: string;
  score: number;
  maxScore: number;
};

export type ProfileRatingResult = {
  completion: number;
  rawScore: number;
  tierLabel: string;
  tierColor: string;
  tierBadgeClass: string;
  summaryText: string;
  suggestionBody: string;
  categories: RatingCategory[];
};

const TIER_META: Record<
  string,
  { label: string; color: string; badge: string }
> = {
  elite: {
    label: "ELITE",
    color: "text-emerald-600",
    badge: "bg-emerald-500/10 text-emerald-600",
  },
  expert: {
    label: "ELITE",
    color: "text-emerald-600",
    badge: "bg-emerald-500/10 text-emerald-600",
  },
  strong: {
    label: "STRONG",
    color: "text-violet-600",
    badge: "bg-violet-500/10 text-violet-600",
  },
  good: {
    label: "GOOD",
    color: "text-blue-600",
    badge: "bg-blue-500/10 text-blue-600",
  },
  intermediate: {
    label: "GOOD",
    color: "text-blue-600",
    badge: "bg-blue-500/10 text-blue-600",
  },
  developing: {
    label: "DEVELOPING",
    color: "text-amber-600",
    badge: "bg-amber-500/10 text-amber-600",
  },
  starter: {
    label: "STARTER",
    color: "text-zinc-600",
    badge: "bg-zinc-500/10 text-zinc-600",
  },
  beginner: {
    label: "STARTER",
    color: "text-zinc-600",
    badge: "bg-zinc-500/10 text-zinc-600",
  },
};

function tierFromPercent(pct: number) {
  if (pct >= 90) return "elite";
  if (pct >= 70) return "strong";
  if (pct >= 50) return "good";
  if (pct >= 25) return "developing";
  return "starter";
}

function summaryForPct(pct: number): string {
  if (pct >= 90)
    return "Elite profile! You stand out to recruiters and are ready for top opportunities.";
  if (pct >= 70)
    return "Strong profile. Fill remaining sections to reach Elite status.";
  if (pct >= 50)
    return "Good progress. Complete more sections for stronger recruiter matching.";
  if (pct >= 25)
    return `Your profile is ${pct}% complete. Keep adding details to unlock better recommendations.`;
  return "Complete your profile to improve job recommendations and recruiter visibility.";
}

function suggestionForPct(pct: number): string {
  if (pct >= 90)
    return "Keep your profile up to date and continue improving your resume.";
  if (pct >= 70)
    return "Add certifications, complete your summary, and upload an ATS-optimized resume.";
  if (pct >= 50)
    return "Add experience with bullet points, certifications, and skills to strengthen your profile.";
  if (pct >= 25) return "Add education, experience, and skills to your profile.";
  return "Start by filling out your personal info, adding skills, and uploading a resume.";
}

function buildCategories(user: TUser): RatingCategory[] {
  const profile = user.candidateProfile ?? {};
  const skills = profile.skills ?? [];

  const basicInfo =
    (user.name ? 4 : 0) +
    (user.email ? 2 : 0) +
    (user.photo ? 5 : 0) +
    (profile.headline ? 5 : 0) +
    (profile.summary ? 4 : 0) +
    (profile.phone ? 2 : 0) +
    (profile.location ? 3 : 0);

  const skillsScore =
    (skills.length >= 1 ? 4 : 0) +
    (skills.length >= 3 ? 4 : 0) +
    (skills.length >= 5 ? 3 : 0) +
    (skills.some(
      (s) =>
        typeof s !== "string" &&
        (s.proficiency === "advanced" ||
          s.proficiency === "expert" ||
          s.proficiency === "master"),
    )
      ? 5
      : 0) +
    (new Set(
      skills
        .map((s) => (typeof s !== "string" ? s.category : ""))
        .filter(Boolean),
    ).size >= 2
      ? 3
      : 0) +
    ((profile.preferredRoles?.length ?? 0) >= 1 ? 3 : 0) +
    ((profile.preferredWorkModes?.length ?? 0) >= 1 ? 3 : 0);

  const experienceEdu =
    ((profile.experience?.length ?? 0) >= 1 ? 5 : 0) +
    (profile.experience?.some((e) => e.description && e.description.length > 50)
      ? 5
      : 0) +
    ((profile.education?.length ?? 0) >= 1 ? 5 : 0) +
    (profile.education?.some((e) => e.fieldOfStudy) ? 3 : 0) +
    ((profile.certifications?.length ?? 0) >= 1 ? 4 : 0) +
    (profile.certifications?.some((c) => c.credentialUrl) ? 3 : 0);

  const resumePortfolio =
    (profile.defaultResumeId ? 8 : 0) +
    (profile.linkedinUrl ? 4 : 0) +
    (profile.githubUrl ? 3 : 0) +
    (profile.portfolioUrl ? 3 : 0) +
    ((profile.portfolioLinks?.length ?? 0) >= 1 ? 2 : 0) +
    (profile.salary?.minAmount ? 3 : 0) +
    (profile.salary?.currency ? 2 : 0);

  return [
    { label: "Basic Info", score: basicInfo, maxScore: 25 },
    { label: "Skills & Preferences", score: skillsScore, maxScore: 25 },
    { label: "Experience & Education", score: experienceEdu, maxScore: 25 },
    { label: "Resume & Links", score: resumePortfolio, maxScore: 25 },
  ];
}

export function computeProfileRating(
  user: TUser | null | undefined,
): ProfileRatingResult {
  const fallback: ProfileRatingResult = {
    completion: 0,
    rawScore: 0,
    tierLabel: "STARTER",
    tierColor: "text-zinc-600",
    tierBadgeClass: "bg-zinc-500/10 text-zinc-600",
    summaryText:
      "Complete your profile to improve job recommendations and recruiter visibility.",
    suggestionBody:
      "Start by filling out your personal info, adding skills, and uploading a resume.",
    categories: [],
  };

  if (!user) return fallback;

  if (user.profileRating) {
    const { overall, tier } = user.profileRating;
    const meta = TIER_META[tier] ?? TIER_META.starter;
    const categories = buildCategories(user);

    return {
      completion: overall,
      rawScore: overall,
      tierLabel: meta.label,
      tierColor: meta.color,
      tierBadgeClass: meta.badge,
      summaryText: summaryForPct(overall),
      suggestionBody: suggestionForPct(overall),
      categories,
    };
  }

  const categories = buildCategories(user);
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const totalMax = categories.reduce((sum, c) => sum + c.maxScore, 0);
  const completion =
    totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const tier = tierFromPercent(completion);
  const meta = TIER_META[tier] ?? TIER_META.starter;

  return {
    completion,
    rawScore: totalScore,
    tierLabel: meta.label,
    tierColor: meta.color,
    tierBadgeClass: meta.badge,
    summaryText: summaryForPct(completion),
    suggestionBody: suggestionForPct(completion),
    categories,
  };
}

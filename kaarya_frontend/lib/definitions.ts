export enum Role {
  USER = "user",
  ADMIN = "admin",
  STUDENT = "student",
  COLLEGE = "college",
  RECRUITER = "recruiter",
  FACULTY = "faculty",
}

export type AuthProvider = "email" | "google" | "github";

export type TLinkedAccount = {
  provider: AuthProvider;
  email?: string | null;
  emailVerified?: boolean;
  linkedAt?: string | null;
  lastLoginAt?: string | null;
};

export type TCandidateWorkMode = "remote" | "onsite" | "hybrid";
export type TCandidateSalaryPeriod = "yearly" | "monthly" | "hourly";

export type TSkillProficiency = "beginner" | "intermediate" | "advanced" | "expert" | "master";

export type TSkillProofType =
  | "certification"
  | "github"
  | "youtube"
  | "external_link"
  | "uploaded_file"
  | "portfolio_project";

export type TSkillProofItem = {
  id: string;
  type: TSkillProofType;
  label: string;
  url: string;
  description?: string | null;
};

export type TCandidateSkillItem = {
  id: string;
  name: string;
  category: string;
  proficiency: TSkillProficiency;
  proofs?: TSkillProofItem[];
};

export type TCandidateSalaryExpectation = {
  currency?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  period?: TCandidateSalaryPeriod | null;
  isNegotiable?: boolean;
};

export type TCandidateExperienceItem = {
  id: string;
  jobTitle: string;
  companyName: string;
  location?: string | null;
  employmentType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  currentlyWorking?: boolean;
  description?: string | null;
};

export type TCandidateEducationItem = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  grade?: string | null;
  description?: string | null;
};

export type TCandidateCertificationItem = {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  noExpiry?: boolean;
};

export type TCandidateProfile = {
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  summary?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  preferredRoles?: string[];
  preferredLocations?: string[];
  preferredWorkModes?: TCandidateWorkMode[];
  skills?: TCandidateSkillItem[];
  education?: TCandidateEducationItem[];
  experience?: TCandidateExperienceItem[];
  certifications?: TCandidateCertificationItem[];
  salary?: TCandidateSalaryExpectation;
  defaultResumeId?: string | null;
  portfolioLinks?: string[];
  openToWork?: boolean;
};

export type TProfileRatingSummary = {
  overall: number;
  tier: "beginner" | "developing" | "intermediate" | "strong" | "expert";
};

export type TProfileRatingItem = {
  label: string;
  completed: boolean;
  points: number;
  maxPoints: number;
};

export type TProfileRatingSection = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  items: TProfileRatingItem[];
};

export type TProfileRatingFull = TProfileRatingSummary & {
  sections: TProfileRatingSection[];
};

export type TUser = {
  id: string;
  name: string;
  email?: string | null;
  role: Role;
  provider?: AuthProvider | null;
  linkedAccounts?: TLinkedAccount[];
  linkedProviders?: AuthProvider[];
  photo?: string | null;
  socialId?: string | null;
  candidateProfile?: TCandidateProfile | null;
  profileRating?: TProfileRatingSummary | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TWorkspaceSummary = {
  id: string;
  name: string | null;
  logo: string | null;
  inviteCode?: string | null;
};

export type TRecruiterWorkspace = {
  company: TWorkspaceSummary;
  membershipId: string;
  designation: string | null;
  joinedAt: string | null;
};

export type TCollegeWorkspace = {
  college: TWorkspaceSummary;
  membershipId: string;
  program: string | null;
  year: number | null;
  joinedAt: string | null;
};

export type TWorkspaceMember = {
  id: string;
  recruiterId: string;
  designation: string | null;
  createdAt?: string;
  updatedAt?: string;
  recruiter?: {
    id: string;
    name?: string;
    email?: string | null;
    photo?: string | null;
    role?: Role;
  } | null;
};

export type TStudentWorkspaceMember = {
  id: string;
  studentId: string;
  program: string | null;
  year: number | null;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    name?: string;
    email?: string | null;
    photo?: string | null;
    role?: Role;
  } | null;
};

export type TCompanyWorkspaceMembersResponse = {
  workspace: TWorkspaceSummary;
  members: TWorkspaceMember[];
  meta: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    search: string | null;
  };
};

export type TCollegeWorkspaceMembersResponse = {
  workspace: TWorkspaceSummary;
  members: TStudentWorkspaceMember[];
  meta: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    search: string | null;
  };
};

export type TCollegeMetrics = {
  workspace?: {
    id?: string;
    name?: string;
    logo?: string | null;
  } | null;
  summary?: {
    students?: number;
    applications?: number;
    interviewScheduled?: number;
    accepted?: number;
    rejected?: number;
    openCollegeJobs?: number;
    closedCollegeJobs?: number;
    draftCollegeJobs?: number;
  } | null;
  leaderboard?: TLeaderboardRow[];
};

export type TJobCompany = {
  id: string;
  name: string;
  logo: string | null;
};

export type TJobCollege = {
  id: string;
  name: string;
  logo: string | null;
};

export type TJob = {
  id: string;
  companyId?: string | null;
  collegeId?: string | null;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  engagementType: string;
  workMode: "remote" | "onsite" | "hybrid";
  salaryRange: string;
  requirements: Record<string, unknown>;
  deadline: string;
  status: "open" | "closed" | "draft";
  visibility?: "global" | "college_only";
  workspaceType?: "company" | "college";
  viewsCount: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  company: TJobCompany | null;
  college?: TJobCollege | null;
  hasApplied?: boolean;
  myApplicationId?: string | null;
  myApplicationStatus?: string | null;
  isSaved?: boolean;
};

export type TJobFeed =
  | "all"
  | "for_you"
  | "trending"
  | "last_week"
  | "accepted"
  | "rejected";

export type TLeaderboardScope = "global" | "college";

export type TLeaderboardRow = {
  rank: number;
  total: number;
  xp: number;
  score: number;
  level: number;
  applications: number;
  interviewScheduled: number;
  accepted: number;
  shortlisted: number;
  rejected: number;
  profileUpdates: number;
  jobViews: number;
  jobsSaved: number;
  interviewsSaved: number;
  applicationsSubmitted: number;
  interviewsTaken: number;
  interviewsCompleted: number;
  resumesCreated: number;
  resumesSaved: number;
  atsScans: number;
  bestInterviewScore: number;
  averageInterviewScore: number;
  reliableInterviewScore: number;
  interviewScoreEntries: number;
  bestAtsScore: number;
  averageAtsScore: number;
  atsScoreEntries: number;
  student: {
    id: string;
    name?: string | null;
    photo?: string | null;
    email?: string | null;
  };
};

export type TLeaderboardData = {
  scope: TLeaderboardScope;
  workspace?: {
    id?: string;
    name?: string;
    logo?: string | null;
  } | null;
  rows: TLeaderboardRow[];
  me?: (TLeaderboardRow & {
    progress?: {
      level: number;
      currentXp: number;
      xpIntoLevel: number;
      xpForNextLevel: number;
      nextLevelAtXp: number;
    };
  }) | null;
  meta?: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    search: string | null;
  };
};

export type TInterviewVisibility = "public" | "college_only" | "private";
export type TInterviewStatus = "draft" | "published" | "archived";
export type TInterviewType =
  | "technical"
  | "behavioral"
  | "mixed"
  | "system_design"
  | "custom";

export type TInterviewWorkspace = {
  id: string;
  name: string;
  logo: string | null;
};

export type TInterviewCreator = {
  id: string;
  name?: string;
  email?: string | null;
  role?: Role;
};

export type TInterviewCategoryScore = {
  name: string;
  score: number;
  comment: string;
};

export type TInterviewEvaluation = {
  id: string;
  interviewId: string;
  sessionId: string;
  userId: string;
  totalScore: number;
  categoryScores: TInterviewCategoryScore[];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment?: string | null;
  model?: string | null;
  createdAt: string;
};

export type TInterviewSession = {
  id: string;
  interviewId: string;
  userId: string;
  mode: "web" | "mobile";
  status: "in_progress" | "completed" | "abandoned";
  transcript?: Array<{
    role: "assistant" | "user" | "system";
    content: string;
    timestamp?: string | null;
  }>;
  vapiCallId?: string | null;
  recordingUrl?: string | null;
  durationSeconds?: number | null;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  evaluation?: TInterviewEvaluation | null;
};

export type TInterview = {
  id: string;
  title: string;
  description?: string | null;
  interviewType: TInterviewType;
  role: string;
  level?: string | null;
  techStack: string[];
  questionCount: number;
  durationMinutes: number;
  questions?: Array<{ question: string; order: number }>;
  visibility: TInterviewVisibility;
  status: TInterviewStatus;
  source: "candidate" | "company" | "college";
  companyId?: string | null;
  collegeId?: string | null;
  company?: TInterviewWorkspace | null;
  college?: TInterviewWorkspace | null;
  creator?: TInterviewCreator | null;
  tags: string[];
  instructions?: string | null;
  attemptsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  workspaceType?: "candidate" | "company" | "college";
  hasAttempted?: boolean;
  myLatestSession?: TInterviewSession | null;
  myLatestEvaluation?: TInterviewEvaluation | null;
  myLatestSessionId?: string | null;
  myLatestScore?: number | null;
  isSaved?: boolean;
};

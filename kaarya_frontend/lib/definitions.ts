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
  score: number;
  applications: number;
  interviewScheduled: number;
  accepted: number;
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

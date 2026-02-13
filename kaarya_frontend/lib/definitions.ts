export enum Role {
  USER = "user",
  ADMIN = "admin",
  STUDENT = "student",
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

export type TJobCompany = {
  id: string;
  name: string;
  logo: string | null;
};

export type TJob = {
  id: string;
  companyId: string;
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
  viewsCount: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  company: TJobCompany | null;
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

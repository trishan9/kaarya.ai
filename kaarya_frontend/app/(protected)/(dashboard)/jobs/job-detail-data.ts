import {
  getJobApplications,
  getJobById,
  getJobs,
  getMyApplicationForJob,
} from "@/lib/actions/job-actions";
import { getCompanyById } from "@/lib/actions/company-actions";
import { getCollegeById } from "@/lib/actions/college-actions";
import type { TJob } from "@/lib/definitions";
import type { JobCardProps } from "../_components/job-card";
import { formatRelativeTime } from "@/lib/date/relative-time";

type JobCompanyProfile = {
  id?: string | null;
  name: string;
  location: string;
  industry: string;
  companySize: string;
  description: string;
  logoUrl?: string | null;
  profileHref: string;
};

export type JobDetailPageData = {
  id: string;
  title: string;
  company: string;
  logoText: string;
  logoUrl?: string;
  logoClassName?: string;
  hiringStatusLabel: string;
  hiringStatusTone: "open" | "closed" | "urgent";
  jobStatus: "open" | "closed" | "draft";
  postedAtLabel: string;
  applicantCountLabel: string;
  viewsCountLabel: string;
  locationLabel: string;
  description: string;
  qualifications: string[];
  level: string;
  experience: string;
  jobType: string;
  workType: string;
  salaryRange: string;
  companyProfile: JobCompanyProfile;
  similarJobs: JobCardProps[];
  applyLabel: string;
  applyHref?: string;
  isRecruiterView: boolean;
  workspaceId?: string | null;
  applicants: JobApplicantRecord[];
  myApplicationId?: string | null;
};

export type JobApplicantStatus =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "interview_scheduled"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type JobApplicantRecord = {
  id: string;
  name: string;
  email: string;
  photo?: string;
  status: JobApplicantStatus;
  appliedAtLabel: string;
  interviewScheduledAt?: string;
  interviewNote?: string;
  coverLetter?: string;
  portfolioLinks?: string[];
  resumeFileName?: string;
  resume?: {
    id?: string;
    fileName?: string;
    fileUrl?: string;
    previewUrl?: string;
    downloadUrl?: string;
    mimeType?: string;
    fileSize?: number;
  };
  resumeActivity?: {
    viewedAt?: string;
    downloadedAt?: string;
    viewCount?: number;
    downloadCount?: number;
  };
};

type JobDetailOptions = {
  isRecruiter?: boolean;
  workspaceId?: string | null;
};

const DEFAULT_QUALIFICATIONS = [
  "Strong communication and collaboration skills in cross-functional teams.",
  "Ability to execute independently while keeping product quality high.",
  "Experience handling production changes with ownership and accountability.",
  "Comfort with iterative delivery, ambiguity, and measurable outcomes.",
];

const isObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");

const buildFallbackJobData = (
  jobId: string,
  options?: JobDetailOptions,
): JobDetailPageData => {
  const title = toTitleCase(jobId.replace(/[-_]/g, " ").replace(/^job /, "").trim());
  const company = "Kaarya Partner Company";
  const isRecruiter = Boolean(options?.isRecruiter);
  return {
    id: jobId,
    title: title || "Job Opportunity",
    company,
    logoText: companyInitials(company),
    logoClassName: undefined,
    hiringStatusLabel: "Open Hiring",
    hiringStatusTone: "open",
    jobStatus: "open",
    postedAtLabel: "Recently posted",
    applicantCountLabel: "0 applicants",
    viewsCountLabel: "0 views",
    locationLabel: "Remote",
    description:
      "This listing comes from cached UI data and is not currently mapped to a live API record.",
    qualifications: DEFAULT_QUALIFICATIONS,
    level: "Mid-Level",
    experience: "1+ years",
    jobType: "Full-Time",
    workType: "REMOTE",
    salaryRange: "Compensation not specified",
    companyProfile: {
      id: null,
      name: company,
      location: "Remote",
      industry: "Technology",
      companySize: "Growing team",
      description:
        "The job record is unavailable from the API right now, but related metadata was found locally.",
      logoUrl: null,
      profileHref: "/jobs",
    },
    similarJobs: [],
    applyLabel: isRecruiter ? "Manage Job" : "Apply Now",
    applyHref: isRecruiter ? undefined : `/jobs/${jobId}`,
    isRecruiterView: isRecruiter,
    workspaceId: options?.workspaceId ?? null,
    applicants: [],
    myApplicationId: null,
  };
};

const jobStatusTone = (status?: string): JobDetailPageData["hiringStatusTone"] => {
  if (status === "closed") return "closed";
  if (status === "draft") return "urgent";
  return "open";
};

const jobStatusLabel = (status?: string) => {
  if (status === "closed") return "Closed Hiring";
  if (status === "draft") return "Draft Posting";
  return "Open Hiring";
};

const companyInitials = (companyName?: string | null) => {
  if (!companyName) return "K";
  const parts = companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return parts || companyName.slice(0, 1).toUpperCase();
};

const asString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

const normalizeStatus = (value: unknown): JobApplicantStatus => {
  const normalized = asString(value)?.toLowerCase();
  if (normalized === "under_review") return "reviewing";
  if (normalized === "offer_received") return "accepted";
  if (
    normalized === "reviewing" ||
    normalized === "shortlisted" ||
    normalized === "interview_scheduled" ||
    normalized === "accepted" ||
    normalized === "rejected" ||
    normalized === "withdrawn"
  ) {
    return normalized;
  }

  return "applied";
};

const toDateLabel = (value?: string | null) => {
  const iso = asString(value);
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const parseApplications = (response: any): JobApplicantRecord[] => {
  const rawApplications = Array.isArray(response?.data?.applications)
    ? response.data.applications
    : Array.isArray(response?.data)
      ? response.data
      : [];

  return rawApplications
    .map((raw: any, index: number) => {
      const candidate = raw?.candidate ?? raw?.user ?? raw?.applicant ?? raw?.student;
      const id =
        asString(raw?.id) ??
        asString(raw?._id) ??
        asString(raw?.applicationId) ??
        `application-${index}`;

      const name =
        asString(candidate?.name) ??
        asString(raw?.candidateName) ??
        asString(raw?.name) ??
        "Applicant";
      const email =
        asString(candidate?.email) ??
        asString(raw?.candidateEmail) ??
        asString(raw?.email) ??
        "Not provided";
      const interviewScheduledAt =
        asString(raw?.interviewScheduledAt) ??
        asString(raw?.interviewDate) ??
        asString(raw?.interviewAt);
      const interviewNote =
        asString(raw?.interviewNote) ?? asString(raw?.note) ?? asString(raw?.comment);
      const resumeRaw = raw?.resume ?? raw?.resumeId;
      const resume =
        typeof resumeRaw === "object" && resumeRaw
          ? {
              id:
                asString((resumeRaw as { id?: unknown }).id) ??
                asString((resumeRaw as { _id?: unknown })._id) ??
                undefined,
              fileName:
                asString((resumeRaw as { fileName?: unknown }).fileName) ??
                asString(raw?.resumeFileName) ??
                undefined,
              fileUrl:
                asString((resumeRaw as { fileUrl?: unknown }).fileUrl) ??
                asString((resumeRaw as { url?: unknown }).url) ??
                undefined,
              previewUrl:
                asString((resumeRaw as { previewUrl?: unknown }).previewUrl) ??
                undefined,
              downloadUrl:
                asString((resumeRaw as { downloadUrl?: unknown }).downloadUrl) ??
                undefined,
              mimeType:
                asString((resumeRaw as { mimeType?: unknown }).mimeType) ??
                undefined,
              fileSize:
                typeof (resumeRaw as { fileSize?: unknown }).fileSize === "number"
                  ? (resumeRaw as { fileSize: number }).fileSize
                  : undefined,
            }
          : undefined;

      return {
        id,
        name,
        email,
        photo: asString(candidate?.photo) ?? undefined,
        status: normalizeStatus(raw?.status),
        appliedAtLabel: toDateLabel(raw?.createdAt ?? raw?.appliedAt),
        interviewScheduledAt: interviewScheduledAt ?? undefined,
        interviewNote: interviewNote ?? undefined,
        coverLetter: asString(raw?.coverLetter) ?? undefined,
        portfolioLinks: Array.isArray(raw?.portfolioLinks)
          ? raw.portfolioLinks
              .map((value: unknown) =>
                typeof value === "string" ? value.trim() : "",
              )
              .filter(Boolean)
          : undefined,
        resumeFileName:
          resume?.fileName ?? asString(raw?.resumeFileName) ?? undefined,
        resume,
        resumeActivity:
          raw?.resumeActivity && typeof raw.resumeActivity === "object"
            ? {
                viewedAt:
                  asString(
                    (raw.resumeActivity as { viewedAt?: unknown }).viewedAt,
                  ) ?? undefined,
                downloadedAt:
                  asString(
                    (raw.resumeActivity as { downloadedAt?: unknown }).downloadedAt,
                  ) ?? undefined,
                viewCount:
                  typeof (raw.resumeActivity as { viewCount?: unknown })
                    .viewCount === "number"
                    ? (raw.resumeActivity as { viewCount: number }).viewCount
                    : 0,
                downloadCount:
                  typeof (raw.resumeActivity as { downloadCount?: unknown })
                    .downloadCount === "number"
                    ? (raw.resumeActivity as { downloadCount: number }).downloadCount
                    : 0,
              }
            : undefined,
      };
    })
    .filter((application: JobApplicantRecord | null): application is JobApplicantRecord =>
      Boolean(application?.id),
    );
};

const getQualifications = (job: TJob) => {
  const skills = asStringArray(job.requirements?.skills);
  const qualifications = asStringArray(job.requirements?.qualifications);

  if (qualifications.length > 0) return qualifications;
  if (skills.length > 0) {
    return skills.map((skill) => `Hands-on experience with ${skill}.`);
  }

  return DEFAULT_QUALIFICATIONS;
};

const mapSimilarJobs = (
  jobs: TJob[],
  currentJobId: string,
  options?: JobDetailOptions,
): JobCardProps[] =>
  jobs
    .filter((job) => job.id !== currentJobId)
    .slice(0, 2)
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company?.name ?? "Company",
      statusLabel: jobStatusLabel(job.status),
      statusTone:
        job.status === "closed"
          ? "warning"
          : job.status === "draft"
            ? "info"
            : "success",
      postedAt: formatRelativeTime(job.createdAt, {
        style: "long",
        fallback: "Recently posted",
      }),
      location: job.location || "Remote",
      employmentType: job.employmentType || "Full-Time",
      engagementType: job.engagementType || "Internship",
      salaryRange: job.salaryRange || "Compensation not specified",
      logoText: companyInitials(job.company?.name),
      logoUrl: job.company?.logo ?? undefined,
      extraTags: options?.isRecruiter
        ? [`${job.applicationsCount ?? 0} applicants`, `${job.viewsCount ?? 0} views`]
        : [`${job.applicationsCount ?? 0} applicants`],
      applyLabel: options?.isRecruiter
        ? "Manage Job"
        : job.hasApplied
          ? "View Application"
          : "Apply",
      applyHref: options?.isRecruiter
        ? `/jobs/${job.id}${options.workspaceId ? `?workspace=${options.workspaceId}` : ""}`
        : job.hasApplied
          ? job.myApplicationId
            ? `/applications?application=${job.myApplicationId}`
            : "/applications"
          : `/jobs/${job.id}`,
      showBookmark: !options?.isRecruiter,
    }));

export async function getJobDetailPageData(
  jobId: string,
  options?: JobDetailOptions,
): Promise<JobDetailPageData | null> {
  const isRecruiter = Boolean(options?.isRecruiter);

  if (!isObjectId(jobId)) {
    return buildFallbackJobData(jobId, options);
  }

  const jobResponse = await getJobById(jobId);

  if (!jobResponse?.success || !jobResponse?.data) {
    return buildFallbackJobData(jobId, options);
  }

  const job = jobResponse.data as TJob;
  const isCollegeJob = job.workspaceType === "college" || Boolean(job.collegeId);
  const similarResponse = await getJobs({
    page: 1,
    size: 10,
    feed: "all",
    ...(isCollegeJob
      ? { collegeId: job.collegeId ?? undefined, visibility: "college_only" as const }
      : { companyId: job.companyId ?? undefined }),
    status: "open",
  });
  const similarJobs = Array.isArray(similarResponse?.data?.jobs)
    ? (similarResponse.data.jobs as TJob[])
    : [];
  const applicationsResponse = isRecruiter
    ? await getJobApplications(job.id, { page: 1, size: 100 })
    : null;
  const myApplicationResponse = !isRecruiter
    ? await getMyApplicationForJob(job.id)
    : null;
  const myApplication =
    !isRecruiter && myApplicationResponse?.success ? myApplicationResponse.data : null;
  const myApplicationId =
    asString(myApplication?.id) ??
    asString(job.myApplicationId) ??
    null;
  const hasApplied = Boolean(
    myApplicationId || job.hasApplied || (typeof myApplication?.status === "string" && myApplication.status),
  );

  const companyName = job.company?.name ?? (isCollegeJob ? "College" : "Company");
  const companyId = !isCollegeJob ? (job.company?.id ?? job.companyId ?? null) : null;
  const collegeId = isCollegeJob ? (job.college?.id ?? job.collegeId ?? null) : null;
  const workspaceResponse = isCollegeJob
    ? (collegeId ? await getCollegeById(collegeId) : null)
    : (companyId ? await getCompanyById(companyId) : null);
  const companyData =
    workspaceResponse?.success && workspaceResponse?.data
      ? (workspaceResponse.data as {
          id?: string;
          name?: string;
          location?: string | null;
          industry?: string | null;
          institutionType?: string | null;
          logo?: string | null;
        })
      : null;
  const resolvedCompanyName = asString(companyData?.name) ?? companyName;
  const companyLocation =
    asString(companyData?.location) ??
    asString(job.requirements?.companyLocation) ??
    job.location ??
    "Remote";
  const companyIndustry =
    asString(companyData?.industry) ??
    asString(companyData?.institutionType) ??
    asString(job.requirements?.industry) ??
    (isCollegeJob ? "Educational Institution" : "Technology");
  const companySize = asString(job.requirements?.companySize) ?? "Growing team";
  const companyDescription =
    asString(job.requirements?.companyDescription) ??
    `${resolvedCompanyName} is actively hiring and expanding its team.`;
  const companyLogo =
    asString(companyData?.logo) ?? job.company?.logo ?? null;

  return {
    id: job.id,
    title: job.title,
    company: resolvedCompanyName,
    logoText: companyInitials(resolvedCompanyName),
    logoUrl: companyLogo ?? undefined,
    logoClassName: undefined,
    hiringStatusLabel: jobStatusLabel(job.status),
    hiringStatusTone: jobStatusTone(job.status),
    jobStatus: job.status,
    postedAtLabel: formatRelativeTime(job.createdAt, {
      style: "long",
      fallback: "Recently posted",
    }),
    applicantCountLabel: `${job.applicationsCount ?? 0} applicants`,
    viewsCountLabel: `${job.viewsCount ?? 0} views`,
    locationLabel: job.location || "Remote",
    description: job.description,
    qualifications: getQualifications(job),
    level: asString(job.requirements?.level) ?? "Mid-Level",
    experience: asString(job.requirements?.experience) ?? "1+ years",
    jobType: job.employmentType || "Full-Time",
    workType: job.workMode ? job.workMode.toUpperCase() : "ONSITE",
    salaryRange: job.salaryRange || "Compensation not specified",
    companyProfile: {
      id: companyId ?? null,
      name: resolvedCompanyName,
      location: companyLocation,
      industry: companyIndustry,
      companySize,
      description: companyDescription,
      logoUrl: companyLogo,
      profileHref: companyId
        ? `/companies/${companyId}?from=${encodeURIComponent(`/jobs/${job.id}`)}`
        : collegeId
          ? `/overview?workspace=${collegeId}`
        : `/jobs?search=${encodeURIComponent(resolvedCompanyName)}`,
    },
    similarJobs: mapSimilarJobs(similarJobs, job.id, options),
    applyLabel: isRecruiter
      ? "Manage Job"
      : hasApplied
        ? "View My Application"
        : job.status === "closed"
        ? "Applications Closed"
        : "Apply Now",
    applyHref:
      !isRecruiter && hasApplied
        ? myApplicationId
          ? `/applications?application=${myApplicationId}`
          : "/applications"
        : undefined,
    isRecruiterView: isRecruiter,
    workspaceId: options?.workspaceId ?? null,
    applicants: isRecruiter ? parseApplications(applicationsResponse) : [],
    myApplicationId,
  };
}

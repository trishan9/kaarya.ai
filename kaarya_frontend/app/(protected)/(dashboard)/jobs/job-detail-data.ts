import type { JobCardProps } from "../_components/job-card";

type JobCompanyProfile = {
  name: string;
  location: string;
  industry: string;
  companySize: string;
  description: string;
  profileHref: string;
};

export type JobDetailPageData = {
  id: string;
  title: string;
  company: string;
  logoText: string;
  logoClassName?: string;
  hiringStatusLabel: string;
  hiringStatusTone: "open" | "closed" | "urgent";
  postedAtLabel: string;
  applicantCountLabel: string;
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
};

type JobSeed = Omit<JobDetailPageData, "similarJobs" | "applyLabel">;

const DEFAULT_QUALIFICATIONS = [
  "Bachelor's degree in a relevant discipline or equivalent practical experience.",
  "Strong communication and stakeholder collaboration skills.",
  "Ability to manage priorities, timelines, and quality under deadlines.",
  "Proven ownership mindset with measurable project outcomes.",
  "Comfort with modern digital tools and cross-functional teamwork.",
  "Experience working in iterative product environments with measurable business impact.",
];

const DEFAULT_COMPANY_DESCRIPTION =
  "This organization builds technology products and services for modern teams. It values ownership, collaboration, and practical problem solving.";

const JOB_SEEDS: Record<string, Partial<JobSeed>> = {
  "job-software-engineer-google": {
    title: "Software Engineer",
    company: "Google",
    logoText: "G",
    logoClassName: "bg-white text-[#4285f4] border border-[#d7e1f4]",
    hiringStatusLabel: "Closed Hiring",
    hiringStatusTone: "closed",
    postedAtLabel: "3 days ago",
    applicantCountLabel: "294 applicants",
    locationLabel: "California, United States",
    level: "Mid-Senior",
    experience: "2 Years",
    jobType: "Full-Time",
    workType: "Remote",
    salaryRange: "$2,000 USD - $4,500 USD",
    description:
      "As a Software Engineer at Google, you will design and deliver scalable features, collaborate with product and design teams, and help build high-quality user experiences. You will contribute across architecture, implementation, and continuous improvement while maintaining strong engineering standards. You will also analyze product feedback, optimize performance bottlenecks, and support production reliability with clear technical ownership across releases.",
    qualifications: [
      "Bachelor's degree in Computer Science, Engineering, or a related field.",
      "2+ years of professional software engineering experience.",
      "Solid knowledge of JavaScript/TypeScript and modern web architecture.",
      "Strong understanding of performance, maintainability, and testing.",
      "Experience collaborating in cross-functional product teams.",
    ],
    companyProfile: {
      name: "Google",
      location: "California, United States",
      industry: "Technology",
      companySize: "10k+ Employees",
      description:
        "Google builds products that organize information and make it universally accessible and useful, serving billions of users and businesses worldwide.",
      profileHref: "/jobs",
    },
  },
  "overview-product-engineer": {
    title: "Product Engineer",
    company: "Kaarya Co. Inc.",
    logoText: "K",
    logoClassName: "bg-primary",
    hiringStatusLabel: "Urgent Hiring",
    hiringStatusTone: "urgent",
    postedAtLabel: "5 hours ago",
    applicantCountLabel: "64 applicants",
    locationLabel: "Kathmandu, Bagmati",
    level: "Mid-Level",
    experience: "3 Years",
    jobType: "Full-Time",
    workType: "Hybrid",
    salaryRange: "NPR 12,00,000 - NPR 18,00,000",
    description:
      "As a Product Engineer at Kaarya, you will own features end-to-end from discovery to release. You will work closely with design, data, and operations to launch impactful experiences for candidates and recruiters. You will translate user pain points into robust product solutions, validate outcomes with metrics, and continuously improve delivery speed and quality through practical engineering decisions.",
    companyProfile: {
      name: "Kaarya Co. Inc.",
      location: "Kathmandu, Bagmati",
      industry: "HR Technology",
      companySize: "51 - 200 Employees",
      description:
        "Kaarya builds AI-powered career platforms that help candidates prepare, apply, and grow faster while helping teams hire with confidence.",
      profileHref: "/jobs",
    },
  },
  "saved-job-frontend-platform-openai": {
    title: "Frontend Platform Engineer",
    company: "OpenAI",
    logoText: "O",
    logoClassName: "bg-black",
    hiringStatusLabel: "Open Hiring",
    hiringStatusTone: "open",
    postedAtLabel: "2 days ago",
    applicantCountLabel: "183 applicants",
    locationLabel: "San Francisco, CA",
    level: "Senior",
    experience: "4+ Years",
    jobType: "Full-Time",
    workType: "Hybrid",
    salaryRange: "$170k - $230k",
    description:
      "As a Frontend Platform Engineer, you will improve developer tooling, UI performance, and reusable architecture for product teams. You will partner with engineers across the stack to make frontend delivery more reliable and scalable. You will define frontend standards, modernize shared libraries, and ensure teams can ship faster while preserving accessibility, quality, and maintainability across a growing product surface.",
    companyProfile: {
      name: "OpenAI",
      location: "San Francisco, CA",
      industry: "AI Research",
      companySize: "1k - 5k Employees",
      description:
        "OpenAI develops safe and beneficial AI systems and products that support people, businesses, and communities around the world.",
      profileHref: "/jobs",
    },
  },
};

const SIMILAR_JOBS_POOL: JobCardProps[] = [
  {
    id: "job-software-engineer-google",
    title: "Software Engineer",
    company: "Google",
    statusLabel: "Suit You Best!",
    statusTone: "success",
    postedAt: "3d ago",
    location: "California, USA",
    employmentType: "Full-Time",
    engagementType: "Remote",
    salaryRange: "$90,000 - $120,000",
    logoText: "G",
    logoClassName: "bg-white text-[#4285f4] border border-[#d7e1f4]",
    extraTags: ["+2"],
  },
  {
    id: "job-marketing-manager-creative-minds",
    title: "Marketing Manager",
    company: "Creative Minds Co.",
    statusLabel: "Suit You Best!",
    statusTone: "success",
    postedAt: "3d ago",
    location: "UK, London",
    employmentType: "Internship",
    engagementType: "Remote",
    salaryRange: "£45,000 - £60,000",
    logoText: "C",
    logoClassName: "bg-[#f97316]",
    extraTags: ["+3"],
  },
  {
    id: "job-backend-software-engineer",
    title: "Backend Software Engineer",
    company: "Kaarya Co. Inc.",
    statusLabel: "Suit You Best!",
    statusTone: "success",
    postedAt: "2d ago",
    location: "Kathmandu, Bagmati",
    employmentType: "Full-Time",
    engagementType: "Hybrid",
    salaryRange: "NPR 10,00,000 - NPR 15,00,000",
    logoText: "K",
    logoClassName: "bg-primary",
    extraTags: ["+4"],
  },
  {
    id: "saved-job-mobile-stripe",
    title: "Mobile Engineer",
    company: "Stripe",
    statusLabel: "Still Hiring",
    statusTone: "warning",
    postedAt: "4d ago",
    location: "Dublin, Ireland",
    employmentType: "Full-Time",
    engagementType: "Remote",
    salaryRange: "EUR 95k - EUR 125k",
    logoText: "S",
    logoClassName: "bg-[#635bff]",
    extraTags: ["+2"],
  },
];

const COMPANY_TOKEN_MAP: Record<string, string> = {
  google: "Google",
  kaarya: "Kaarya Co. Inc.",
  openai: "OpenAI",
  stripe: "Stripe",
  anthropic: "Anthropic",
  meta: "Meta",
  netflix: "Netflix",
  amazon: "Amazon",
};

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function inferTitleFromId(jobId: string) {
  const normalized = jobId
    .replace(/^saved-job-/, "")
    .replace(/^overview-/, "")
    .replace(/^job-/, "")
    .replace(/^app-/, "")
    .replace(/-/g, " ");

  return toTitleCase(normalized) || "Project Manager";
}

function inferCompanyFromId(jobId: string) {
  const token = Object.keys(COMPANY_TOKEN_MAP).find((key) => jobId.includes(key));
  if (!token) {
    return "Kaarya Co. Inc.";
  }

  return COMPANY_TOKEN_MAP[token];
}

function hashValue(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildDefaultSeed(jobId: string): JobSeed {
  const inferredTitle = inferTitleFromId(jobId);
  const inferredCompany = inferCompanyFromId(jobId);

  return {
    id: jobId,
    title: inferredTitle,
    company: inferredCompany,
    logoText: inferredCompany.charAt(0).toUpperCase(),
    logoClassName: "bg-primary",
    hiringStatusLabel: "Open Hiring",
    hiringStatusTone: "open",
    postedAtLabel: "3 days ago",
    applicantCountLabel: "120 applicants",
    locationLabel: "California, United States",
    description:
      "In this role, you will collaborate across teams to deliver reliable and high-impact outcomes. You will take ownership from planning to execution and improve systems based on data and feedback. You will partner with stakeholders, break down complex requirements into actionable milestones, and help shape practical technical decisions that strengthen product quality, user satisfaction, and long-term maintainability.",
    qualifications: DEFAULT_QUALIFICATIONS,
    level: "Mid-Senior",
    experience: "2 Years",
    jobType: "Full-Time",
    workType: "Remote",
    salaryRange: "$2,000 USD - $4,500 USD",
    companyProfile: {
      name: inferredCompany,
      location: "California, United States",
      industry: "Technology",
      companySize: "11 - 50 Employees",
      description: DEFAULT_COMPANY_DESCRIPTION,
      profileHref: "/jobs",
    },
  };
}

function buildSimilarJobs(currentJobId: string) {
  const pool = SIMILAR_JOBS_POOL.filter((job) => job.id !== currentJobId);
  if (pool.length === 0) return [];

  const startIndex = hashValue(currentJobId) % pool.length;
  const picked: JobCardProps[] = [];

  for (let offset = 0; offset < pool.length && picked.length < 2; offset += 1) {
    const candidate = pool[(startIndex + offset) % pool.length];
    if (!picked.some((job) => job.id === candidate.id)) {
      picked.push(candidate);
    }
  }

  return picked;
}

export async function getJobDetailPageData(jobId: string): Promise<JobDetailPageData> {
  const fallbackSeed = buildDefaultSeed(jobId);
  const customSeed = JOB_SEEDS[jobId] ?? {};

  const mergedSeed: JobSeed = {
    ...fallbackSeed,
    ...customSeed,
    companyProfile: {
      ...fallbackSeed.companyProfile,
      ...(customSeed.companyProfile ?? {}),
    },
    qualifications: customSeed.qualifications ?? fallbackSeed.qualifications,
  };

  return {
    ...mergedSeed,
    similarJobs: buildSimilarJobs(jobId),
    applyLabel: "Apply Now",
  };
}

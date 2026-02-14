/** Resume builder content shape - same for web and mobile (API-agnostic). */
export type ResumeBuilderPersonalInfo = {
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
};

export type ResumeBuilderExperienceItem = {
  id?: string;
  company?: string | null;
  position?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  currentlyWorking?: boolean;
  bulletPoints?: string[];
};

export type ResumeBuilderEducationItem = {
  id?: string;
  school?: string | null;
  degree?: string | null;
  major?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coursework?: string | null;
};

export type ResumeBuilderProjectItem = {
  id?: string;
  name?: string | null;
  description?: string | null;
  url?: string | null;
  technologies?: string | null;
};

export type ResumeBuilderAchievementItem = {
  id?: string;
  text?: string | null;
};

export type ResumeBuilderContent = {
  personalInfo?: ResumeBuilderPersonalInfo | null;
  professionalSummary?: string | null;
  targetRole?: string | null;
  experience?: ResumeBuilderExperienceItem[];
  education?: ResumeBuilderEducationItem[];
  skills?: string[];
  projects?: ResumeBuilderProjectItem[];
  achievements?: ResumeBuilderAchievementItem[];
};

export const RESUME_BUILDER_TEMPLATE_IDS = [
  'professional',
  'modern',
  'minimal',
  'executive',
] as const;

export type ResumeBuilderTemplateId =
  (typeof RESUME_BUILDER_TEMPLATE_IDS)[number];

/** ATS scan result - compatible with web and Flutter. */
export type AtsScanSuggestion = {
  type: 'good' | 'improve';
  tip: string;
  explanation?: string;
};

export type AtsScanCategory = {
  score: number;
  tips: AtsScanSuggestion[];
};

export type AtsScanResult = {
  overallScore: number;
  ATS: AtsScanCategory;
  toneAndStyle?: AtsScanCategory;
  content?: AtsScanCategory;
  structure?: AtsScanCategory;
  skills?: AtsScanCategory;
};

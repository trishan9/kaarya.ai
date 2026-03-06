export type GeminiGenerationConfig = {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
};

export type BulletsResponse = {
  bullets?: unknown;
  bulletPoints?: unknown;
};

export type SuggestionsResponse = {
  targetRole?: unknown;
  jobTitle?: unknown;
  professionalSummary?: unknown;
  skills?: unknown;
};

export type AtsScanResponse = {
  documentType?: unknown;
  classificationReason?: unknown;
  overallScore?: unknown;
  ATS?: unknown;
  toneAndStyle?: unknown;
  content?: unknown;
  structure?: unknown;
  skills?: unknown;
};

export type InterviewPrepCourseResponse = {
  learningOutcomes?: unknown;
  chapters?: unknown;
  aiModel?: unknown;
  model?: unknown;
};

export type InterviewPrepCourseChapterSection = {
  heading: string;
  subheadings: string[];
  summary: string | null;
  content: string[];
};

export type InterviewPrepCourseChapterVideo = {
  title: string;
  youtubeUrl: string;
  reason: string | null;
};

export type InterviewPrepCourseCoreConcept = {
  concept: string;
  theory: string | null;
  explanation: string | null;
  interviewApplication: string | null;
};

export type InterviewPrepCourseInterviewQuestion = {
  question: string;
  whyAsked: string | null;
  answerFramework: string | null;
  sampleAnswer: string | null;
};

export type InterviewPrepCourseChapter = {
  title: string;
  overview?: string | null;
  estimatedMinutes: number;
  material: string[];
  sections: InterviewPrepCourseChapterSection[];
  learningObjectives: string[];
  coreConcepts: InterviewPrepCourseCoreConcept[];
  interviewQuestions: InterviewPrepCourseInterviewQuestion[];
  practicePrompts: string[];
  youtubeVideos: InterviewPrepCourseChapterVideo[];
};

export type InterviewPrepCourseResult = {
  learningOutcomes: string[];
  chapters: InterviewPrepCourseChapter[];
  aiModel?: string | null;
};

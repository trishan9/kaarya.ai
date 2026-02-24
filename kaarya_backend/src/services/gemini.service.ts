import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { ResourceCourseGenerationMode } from 'src/types/resource-course-generation-mode.enum';
import type { AllConfigType } from 'src/types/config.type';
import type {
  ResumeBuilderContent,
  ResumeBuilderExperienceItem,
  AtsScanCategory,
  AtsScanResult,
} from 'src/types/resume-builder.types';

const ATS_RESPONSE_JSON_SCHEMA = `{
  "documentType": "resume" | "not_resume",
  "classificationReason": string,
  "overallScore": number (0-100),
  "ATS": { "score": number (0-100), "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }] },
  "toneAndStyle": { "score": number, "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }] },
  "content": { "score": number, "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }] },
  "structure": { "score": number, "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }] },
  "skills": { "score": number, "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }] }
}`;

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
];

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_OPENAI_COURSE_MODEL = 'gpt-4o';

type GeminiGenerationConfig = {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
};

type BulletsResponse = {
  bullets?: unknown;
  bulletPoints?: unknown;
};

type SuggestionsResponse = {
  targetRole?: unknown;
  jobTitle?: unknown;
  professionalSummary?: unknown;
  skills?: unknown;
};

type AtsScanResponse = {
  documentType?: unknown;
  classificationReason?: unknown;
  overallScore?: unknown;
  ATS?: unknown;
  toneAndStyle?: unknown;
  content?: unknown;
  structure?: unknown;
  skills?: unknown;
};

type InterviewPrepCourseResponse = {
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

type FallbackChapterTemplate = {
  title: string;
  overview: string;
  learnMaterial: string[];
  interviewMaterial: string[];
  interviewQuestions: InterviewPrepCourseInterviewQuestion[];
  estimatedMinutes?: number;
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private static readonly MODEL_CACHE_TTL_MS = 10 * 60 * 1000;
  private readonly apiKey: string;
  private readonly youtubeApiKey: string;
  private readonly openAIApiKey: string;
  private readonly openAIModel: string;
  private readonly openAICourseModel: string;
  private readonly preferOpenAI: boolean;
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly modelCandidates: string[];
  private discoveredModelNames: Set<string> | null = null;
  private discoveredModelNamesExpiresAt = 0;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.apiKey =
      this.configService.get<string>(CONFIG_KEYS.GEMINI?.API_KEY, {
        infer: true,
      }) || process.env.GEMINI_API_KEY || '';
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim() || '';

    const configuredModel =
      this.configService.get<string>(CONFIG_KEYS.GEMINI.MODEL, {
        infer: true,
      }) ||
      process.env.GEMINI_MODEL ||
      DEFAULT_GEMINI_MODELS[0];
    const configuredFallbackModels =
      this.configService.get<string[]>(CONFIG_KEYS.GEMINI.FALLBACK_MODELS, {
        infer: true,
      }) || this.parseModelList(process.env.GEMINI_FALLBACK_MODELS);

    this.modelCandidates = Array.from(
      new Set(
        [configuredModel, ...configuredFallbackModels, ...DEFAULT_GEMINI_MODELS]
          .map((model) => model.trim())
          .filter(Boolean),
      ),
    );

    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }

    this.openAIApiKey = process.env.OPENAI_API_KEY?.trim() || '';
    this.openAIModel =
      process.env.RESUME_OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
    this.openAICourseModel =
      process.env.RESOURCE_COURSE_OPENAI_MODEL?.trim() ||
      process.env.COURSE_OPENAI_MODEL?.trim() ||
      this.openAIModel ||
      DEFAULT_OPENAI_COURSE_MODEL;
    this.preferOpenAI =
      process.env.RESUME_AI_PROVIDER?.trim()?.toLowerCase() === 'openai';
  }

  private ensureConfigured(): GoogleGenerativeAI {
    if (!this.genAI) {
      throw new ApiError({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Gemini API is not configured. Set GEMINI_API_KEY.',
      });
    }
    return this.genAI;
  }

  private parseModelList(raw?: string): string[] {
    if (!raw) return [];
    return raw
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);
  }

  private getErrorMessage(err: unknown): string {
    return err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : 'AI service error';
  }

  private shouldTryNextModel(message: string): boolean {
    const normalized = message.toLowerCase();

    if (
      normalized.includes('api key') ||
      normalized.includes('api_key') ||
      normalized.includes('permission') ||
      normalized.includes('forbidden') ||
      normalized.includes('unauthorized') ||
      normalized.includes('401') ||
      normalized.includes('403') ||
      normalized.includes('quota') ||
      normalized.includes('billing')
    ) {
      return false;
    }

    return true;
  }

  private cleanJsonText(raw: string): string {
    return raw.replace(/^```json?\s*|\s*```$/g, '').trim();
  }

  private extractFirstJsonObject(raw: string): string | null {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    return raw.slice(start, end + 1).trim();
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => typeof item === 'string')
      .map((item) => this.sanitizeBulletLine(item))
      .filter(Boolean);
  }

  private sanitizeBulletLine(line: string): string {
    return line
      .replace(/^["'`]+|["'`,]+$/g, '')
      .replace(/^\s*(bullets?|bulletpoints?)\s*:\s*/i, '')
      .replace(/^\[\s*|\s*\]$/g, '')
      .replace(/^\s*[-*•\u2022\d.)]+\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sanitizeSuggestionText(
    value: unknown,
    maxLength?: number,
  ): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return undefined;

    if (
      typeof maxLength === 'number' &&
      Number.isFinite(maxLength) &&
      maxLength > 0 &&
      normalized.length > maxLength
    ) {
      return normalized.slice(0, maxLength).trim();
    }

    return normalized || undefined;
  }

  private toStringArrayWithLimit(value: unknown, maxLength: number): string[] {
    return this.toStringArray(value)
      .map((item) => this.sanitizeSuggestionText(item, maxLength))
      .filter((item): item is string => Boolean(item));
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(message));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private isMetaLearningParagraph(text: string): boolean {
    const normalized = text.toLowerCase();
    const metaPhrases = [
      'you should',
      'start by understanding',
      'focus on',
      'practice',
      'interviewer',
      'interviewers',
      'candidate',
      'to prepare',
      'when preparing',
      'study this',
      'learn this',
      'memorize',
      'revision',
      'readiness',
    ];

    return metaPhrases.some((phrase) => normalized.includes(phrase));
  }

  private getWordCount(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  private getMinimumMaterialParagraphs(
    generationMode: ResourceCourseGenerationMode,
  ): number {
    return generationMode === ResourceCourseGenerationMode.LEARN ? 4 : 2;
  }

  private getMinimumQuestionCount(
    generationMode: ResourceCourseGenerationMode,
  ): number {
    return generationMode === ResourceCourseGenerationMode.LEARN ? 2 : 3;
  }

  private isGenericCourseMaterialParagraph(text: string): boolean {
    const normalized = text.toLowerCase();
    const genericPhrases = [
      'this chapter',
      'this section',
      'the reader should',
      'the learner should',
      'should explain',
      'should be understood',
      'needs a mechanism-level explanation',
      'a useful explanation should',
      'becomes valuable when',
      'matters because it changes',
      'the goal is to move from',
      'course description gives the depth target',
      'topic should be',
      'the chapter should still stand on its own',
      'refers to the key ideas, components, and structural decisions',
      'the important question is how',
      'from an engineering perspective',
      'is most useful when theory is connected',
      'covers the core concepts, internal mechanics, and practical implications',
      'aligned to intermediate difficulty',
      'as part of',
      'begins with the underlying concepts',
      'best understood by following the mechanism step by step',
      'also has practical consequences for implementation',
      'for ai engineer responsibilities',
      'for ml engineer responsibilities',
      'for ai researcher responsibilities',
      'should connect the subject',
      'concise technical summary that can be reused in interview answers',
      'the goal is to keep the explanation accurate',
      'helps candidates answer clarifying questions',
    ];

    return (
      this.isMetaLearningParagraph(text) ||
      genericPhrases.some((phrase) => normalized.includes(phrase))
    );
  }

  private isGenericInterviewAnswer(text: string): boolean {
    const normalized = text.toLowerCase();
    const genericAnswerPhrases = [
      'i would describe',
      'in practice, i first clarify',
      'this helped the team reduce rework',
      'i would compare options based on complexity',
      'because interviewers want practical decision making',
      'start with definition -> explain why it matters',
      'compare at least two options',
      'balances performance, maintainability, and delivery speed',
      'this helped the team reduce rework',
      'prioritizing clear interfaces, measurable outcomes, and iterative validation',
      'i usually explain a baseline approach first',
      'long-term maintenance, because interviewers want practical decision making',
    ];

    return genericAnswerPhrases.some((phrase) => normalized.includes(phrase));
  }

  private ensureSentence(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return '';
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }

  private buildTeachingParagraphFromConcept(
    concept: InterviewPrepCourseCoreConcept,
  ): string | null {
    const segments = [
      concept.theory,
      concept.explanation,
      concept.interviewApplication,
    ]
      .filter(Boolean)
      .map((segment) => this.ensureSentence(String(segment)))
      .filter(Boolean);

    if (!segments.length) return null;

    return `${concept.concept}: ${segments.join(' ')}`.trim();
  }

  private buildChapterMaterialFromExistingData(input: {
    title: string;
    overview: string | null;
    directMaterial?: string[];
    sections: InterviewPrepCourseChapterSection[];
    coreConcepts: InterviewPrepCourseCoreConcept[];
    interviewQuestions: InterviewPrepCourseInterviewQuestion[];
  }): string[] {
    const directMaterial = (input.directMaterial ?? [])
      .filter((paragraph) => !this.isGenericCourseMaterialParagraph(paragraph))
      .map((paragraph) => this.sanitizeSuggestionText(paragraph, 1800))
      .filter((paragraph): paragraph is string => Boolean(paragraph));

    const sectionContent = input.sections
      .flatMap((section) => section.content)
      .filter((paragraph) => !this.isGenericCourseMaterialParagraph(paragraph))
      .map((paragraph) => this.sanitizeSuggestionText(paragraph, 1800))
      .filter((paragraph): paragraph is string => Boolean(paragraph));

    const conceptContent = input.coreConcepts
      .map((concept) => this.buildTeachingParagraphFromConcept(concept))
      .map((paragraph) => this.sanitizeSuggestionText(paragraph, 1800))
      .filter((paragraph): paragraph is string => Boolean(paragraph));

    const combined = Array.from(
      new Set([
        ...directMaterial,
        ...sectionContent,
        ...conceptContent,
      ]),
    ).slice(0, 8);

    if (combined.length > 0) {
      return combined;
    }

    return [
      `${input.title} starts with first principles: define the problem it solves, the assumptions it makes, and the core entities it operates on.`,
      input.overview
        ? this.ensureSentence(input.overview)
        : `${input.title} is implemented as a concrete sequence of operations from input representation to output behavior; those operations determine accuracy, efficiency, stability, and scalability trade-offs in production systems.`,
    ];
  }

  private hasWeakCourseMaterial(
    chapters: InterviewPrepCourseChapter[],
    generationMode: ResourceCourseGenerationMode,
  ): boolean {
    if (!chapters.length) return true;

    const minParagraphs = this.getMinimumMaterialParagraphs(generationMode);
    const minWordsPerParagraph =
      generationMode === ResourceCourseGenerationMode.LEARN ? 45 : 25;

    return chapters.some((chapter) => {
      const material = chapter.material ?? [];
      if (material.length < minParagraphs) return true;

      const genericCount = material.filter((paragraph) =>
        this.isGenericCourseMaterialParagraph(paragraph),
      ).length;
      const thinCount = material.filter(
        (paragraph) => this.getWordCount(paragraph) < minWordsPerParagraph,
      ).length;

      return (
        genericCount >= Math.ceil(material.length / 2) ||
        thinCount >= Math.ceil(material.length / 2)
      );
    });
  }

  private hasWeakInterviewAnswers(
    chapters: InterviewPrepCourseChapter[],
    generationMode: ResourceCourseGenerationMode,
  ): boolean {
    if (!chapters.length) return true;

    const minQuestions = this.getMinimumQuestionCount(generationMode);
    const minWordsPerAnswer =
      generationMode === ResourceCourseGenerationMode.LEARN ? 35 : 22;

    return chapters.some((chapter) => {
      const answers = (chapter.interviewQuestions ?? [])
        .map((question) => question.sampleAnswer)
        .filter((answer): answer is string => Boolean(answer));

      if ((chapter.interviewQuestions ?? []).length < minQuestions) return true;
      if (answers.length < minQuestions) return true;

      const genericAnswers = answers.filter((answer) =>
        this.isGenericInterviewAnswer(answer),
      ).length;
      const thinAnswers = answers.filter(
        (answer) => this.getWordCount(answer) < minWordsPerAnswer,
      ).length;

      return (
        genericAnswers >= Math.ceil(answers.length / 2) ||
        thinAnswers >= Math.ceil(answers.length / 2)
      );
    });
  }

  private buildInterviewPrepCoursePrompt(
    input: {
      title: string;
      description?: string | null;
      category: string;
      generationMode: ResourceCourseGenerationMode;
      difficulty: string;
      targetRoles: string[];
      chapterTitles?: string[];
      includeVideoRecommendations: boolean;
      promptContext?: string | null;
      jobDescriptionContext?: string | null;
    },
    normalizedChapterCount: number,
    strictMode = false,
  ) {
    const courseTitle = input.title.trim();
    const courseDescription = input.description?.trim() || 'Not provided';
    const chapterTitleSeed =
      input.chapterTitles && input.chapterTitles.length > 0
        ? input.chapterTitles
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, normalizedChapterCount)
            .join(', ')
        : 'None specified';

    const modeSpecificRules =
      input.generationMode === ResourceCourseGenerationMode.LEARN
        ? `
- This is a LEARN mode course. Break the subject into graceful, topic-specific chapters based on the title and description, not generic placeholders.
- Chapter titles should reflect a natural learning sequence such as foundations, architecture, workflow, optimization, alternatives, failure modes, or applications when relevant to the topic.
- Material paragraphs must directly teach the concept. Start with the subject matter itself, not commentary about the course or chapter.
- Prefer concrete explanations such as definitions, components, formulas, data flow, examples, comparisons, and implementation details.
- The material should be deep enough that the learner can genuinely study the topic from the chapter text alone.
`
        : `
- This is an INTERVIEW_PREP mode course. Keep chapter material more concise and answer-oriented.
- Chapter titles should align to interview needs such as foundations, common questions, trade-offs, system design framing, behavioral framing, and mock explanations.
- Material should still be useful, but it may stay surface-level if that helps answer quality and interview coverage.
`;

    const strictRules = strictMode
      ? `
- The material must read like direct textbook/course prose, not commentary about what the chapter is supposed to do.
- Never write phrases like "this chapter explains", "this topic matters because", "the reader should understand", or "should explain".
- Start paragraphs with the actual subject matter. Example bad style: "Transformers Architecture Core Concepts is a major concept inside Transformers Architecture."
- Example good style: "A transformer encoder layer combines multi-head self-attention with a position-wise feed-forward network, residual connections, and layer normalization."
- If the description mentions alternatives, include a chapter that directly compares the main topic with those alternatives in technical terms.
`
      : '';

    const materialRange =
      input.generationMode === ResourceCourseGenerationMode.LEARN ? '4-6' : '2-4';
    const questionRange =
      input.generationMode === ResourceCourseGenerationMode.LEARN ? '2-3' : '3-4';

    return `You are an expert technical educator creating a course for interview preparation.
Generate a structured, role-aware course as JSON, but prioritize actual teaching over coaching.

Course title: ${courseTitle}
Course description: ${courseDescription}
Category: ${input.category}
Difficulty: ${input.difficulty}
Target roles: ${input.targetRoles.join(', ')}
Number of chapters required: ${normalizedChapterCount}
Preferred chapter titles: ${chapterTitleSeed}
Include chapter video recommendations: ${input.includeVideoRecommendations ? 'yes' : 'no'}
Additional context from user: ${input.promptContext ?? 'none'}
Target job perspective / job description context: ${input.jobDescriptionContext ?? 'none'}

Return ONLY valid JSON with this shape:
{
  "chapters": [
    {
      "title": string,
      "overview": string,
      "estimatedMinutes": number,
      "material": string[],
      "interviewQuestions": [
        {
          "question": string,
          "whyAsked": string,
          "answerFramework": string,
          "sampleAnswer": string
        }
      ]
    }
  ]
}

Rules:
- Provide exactly ${normalizedChapterCount} chapters.
- Chapter titles must be context-specific and should NOT all start with the full course title.
- Chapter titles should avoid repeating the exact course title prefix unless truly required by context.
- Each chapter must include ${materialRange} substantial material paragraphs that directly teach the topic itself.
- Material must explain the concept, components, mechanism, information flow, design trade-offs, implementation implications, and concrete examples where relevant.
- In LEARN mode, each material paragraph should be detailed textbook-style prose (typically 70+ words) and include concrete technical terminology.
- The first material paragraph in each chapter must directly define the chapter concept, not describe what the chapter intends to do.
- At least one material paragraph per chapter must include a concrete example, workflow, or system behavior scenario.
- Do not write coaching language such as "you should learn", "start by understanding", "focus on", "practice", "interviewers ask", or "to prepare".
- Do not return sections, learning objectives, study guides, practice prompts, or tip-style content.
- Each chapter must include ${questionRange} interviewQuestions with high-quality sample answers.
- Interview sample answers must be topic-specific and avoid template phrases like "I would describe", "in practice, I first clarify", or "compare at least two options".
- Course material comes first; interview prep support comes second.
- The primary source of truth is the course title and course description.
- targetRoles and job description context should refine the material, not override the title/description.
- Make the course feel like complete study material, not a thin outline.
- Write the material as if the learner should be able to understand the topic by reading this chapter alone.
- overview must be a direct one-sentence summary of the chapter topic, not a sentence about what the chapter will do.
- Use concise text; no markdown, no code fences, no explanations outside JSON.${modeSpecificRules}${strictRules}
`;
  }

  private clampScore(value: unknown): number {
    const score = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private normalizeAtsTips(value: unknown): AtsScanCategory['tips'] {
    if (!Array.isArray(value)) return [];
    const normalized: AtsScanCategory['tips'] = [];

    for (const tip of value) {
      if (!tip || typeof tip !== 'object') continue;
      const raw = tip as Record<string, unknown>;
      const tipText = this.sanitizeSuggestionText(raw.tip);
      if (!tipText) continue;

      const normalizedType = `${raw.type ?? ''}`.trim().toLowerCase();
      const type: 'good' | 'improve' =
        normalizedType === 'good' ? 'good' : 'improve';
      const explanation = this.sanitizeSuggestionText(raw.explanation);

      if (explanation) {
        normalized.push({
          type,
          tip: tipText,
          explanation,
        });
      } else {
        normalized.push({
          type,
          tip: tipText,
        });
      }
    }

    return normalized;
  }

  private normalizeAtsCategory(
    value: unknown,
    fallbackTip: string,
    fallbackType: 'good' | 'improve' = 'improve',
  ): AtsScanCategory {
    const source = value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};

    const score = this.clampScore(source.score);
    const tips = this.normalizeAtsTips(source.tips);

    if (tips.length > 0) {
      return {
        score,
        tips,
      };
    }

    return {
      score,
      tips: [
        {
          type: fallbackType,
          tip: fallbackTip,
          explanation:
            fallbackType === 'good'
              ? 'This section is acceptable but can still be strengthened for better ATS performance.'
              : 'No detailed feedback returned for this section. Improve clarity and role-specific relevance.',
        },
      ],
    };
  }

  private buildNotResumeAtsResult(reason: string): AtsScanResult {
    const normalizedReason =
      reason.trim() ||
      'This file does not appear to be a resume. Upload a professional resume to run ATS analysis.';

    const notResumeTip = {
      type: 'improve' as const,
      tip: 'This uploaded file is not a resume.',
      explanation: normalizedReason,
    };

    return {
      documentType: 'not_resume',
      classificationReason: normalizedReason,
      overallScore: 0,
      ATS: {
        score: 0,
        tips: [notResumeTip],
      },
      toneAndStyle: {
        score: 0,
        tips: [notResumeTip],
      },
      content: {
        score: 0,
        tips: [notResumeTip],
      },
      structure: {
        score: 0,
        tips: [notResumeTip],
      },
      skills: {
        score: 0,
        tips: [notResumeTip],
      },
    };
  }

  private normalizeAtsScanResult(raw: AtsScanResponse): AtsScanResult {
    const normalizedType = `${raw.documentType ?? ''}`.trim().toLowerCase();
    const classificationReason =
      this.sanitizeSuggestionText(raw.classificationReason) ??
      'This file does not appear to be a resume. Upload a professional resume to run ATS analysis.';

    const isNotResume =
      normalizedType === 'not_resume' ||
      normalizedType === 'not-resume' ||
      normalizedType === 'not resume';

    if (isNotResume) {
      return this.buildNotResumeAtsResult(classificationReason);
    }

    const ATS = this.normalizeAtsCategory(
      raw.ATS,
      'Improve ATS keyword coverage and role alignment for better matching.',
    );
    const toneAndStyle = this.normalizeAtsCategory(
      raw.toneAndStyle,
      'Use concise, professional language and avoid vague statements.',
      'good',
    );
    const content = this.normalizeAtsCategory(
      raw.content,
      'Add measurable impact and role-relevant achievements.',
    );
    const structure = this.normalizeAtsCategory(
      raw.structure,
      'Use clear section headers and consistent formatting for readability.',
      'good',
    );
    const skills = this.normalizeAtsCategory(
      raw.skills,
      'Include skills that directly map to target job requirements.',
    );

    const calculatedOverall = this.clampScore(
      (ATS.score +
        toneAndStyle.score +
        content.score +
        structure.score +
        skills.score) /
        5,
    );
    const explicitOverall = this.clampScore(raw.overallScore);
    const hasExplicitOverall =
      typeof raw.overallScore === 'number' && Number.isFinite(raw.overallScore);

    return {
      documentType: 'resume',
      classificationReason:
        this.sanitizeSuggestionText(raw.classificationReason) ?? undefined,
      overallScore: hasExplicitOverall ? explicitOverall : calculatedOverall,
      ATS,
      toneAndStyle,
      content,
      structure,
      skills,
    };
  }

  private extractQuotedListItems(raw: string): string[] {
    const listMatch = raw.match(
      /(?:bullets?|bulletPoints?)\s*:\s*\[([\s\S]*?)\]/i,
    );
    const source = listMatch?.[1] ?? raw;
    const quotedMatches = Array.from(source.matchAll(/"([^"]+)"|'([^']+)'/g));
    return quotedMatches
      .map((match) => this.sanitizeBulletLine(match[1] || match[2] || ''))
      .filter(Boolean);
  }

  private parseBulletsFromText(text: string): string[] {
    const cleaned = this.cleanJsonText(text);
    const jsonCandidate = this.extractFirstJsonObject(cleaned);
    const candidates = [cleaned, jsonCandidate].filter(
      (candidate): candidate is string => Boolean(candidate),
    );

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as BulletsResponse | string[];
        if (Array.isArray(parsed)) {
          const bullets = this.toStringArray(parsed);
          if (bullets.length > 0) return bullets;
          continue;
        }

        const bullets = this.toStringArray(parsed.bullets);
        if (bullets.length > 0) return bullets;

        const bulletPoints = this.toStringArray(parsed.bulletPoints);
        if (bulletPoints.length > 0) return bulletPoints;
      } catch {
        // Ignore and try other parse strategies.
      }
    }

    const quotedItems = this.extractQuotedListItems(cleaned);
    if (quotedItems.length > 0) return quotedItems;

    // Fallback for models that return plain-text bullet lines instead of JSON.
    const plainTextBullets = cleaned
      .split('\n')
      .map((line) => this.sanitizeBulletLine(line))
      .filter((line) => line.length > 4)
      .filter(
        (line) =>
          !/^(\{|\}|\[|\]|\"?bullets?\"?\s*:?)$/i.test(line) &&
          !/^return only/i.test(line),
      );

    return plainTextBullets;
  }

  private async generateTextWithModelFallback(
    prompt: string,
    generationConfig: GeminiGenerationConfig,
  ): Promise<string> {
    let lastError: unknown = null;

    if (this.preferOpenAI) {
      try {
        const openAIText = await this.generateTextWithOpenAI(
          prompt,
          generationConfig,
        );
        if (openAIText) return openAIText;
      } catch (err) {
        lastError = err;
      }
    }

    try {
      const geminiText = await this.generateTextWithGemini(
        prompt,
        generationConfig,
      );
      if (geminiText) return geminiText;
    } catch (err) {
      lastError = err;
    }

    try {
      const openAIText = await this.generateTextWithOpenAI(
        prompt,
        generationConfig,
      );
      if (openAIText) return openAIText;
    } catch (err) {
      lastError = err;
    }

    if (lastError) throw lastError;
    throw new Error('AI service error');
  }

  private async generateCourseTextWithOpenAIPriority(
    prompt: string,
    generationConfig: GeminiGenerationConfig,
  ): Promise<string> {
    let lastError: unknown = null;

    try {
      const openAIText = await this.generateTextWithOpenAI(
        prompt,
        generationConfig,
        this.openAICourseModel,
      );
      if (openAIText) return openAIText;
    } catch (err) {
      lastError = err;
      this.logger.warn(
        `OpenAI course generation failed (${this.getErrorMessage(err).slice(0, 140)}).`,
      );
    }

    try {
      const geminiText = await this.generateTextWithGemini(
        prompt,
        generationConfig,
      );
      if (geminiText) return geminiText;
    } catch (err) {
      lastError = err;
    }

    if (lastError) throw lastError;
    throw new Error('AI service error');
  }

  private parseInterviewPrepCourseChaptersFromText(
    rawText: string,
    chapterCount: number,
    includeVideoRecommendations: boolean,
  ): InterviewPrepCourseChapter[] {
    const cleaned = this.cleanJsonText(rawText);
    const jsonCandidate = this.extractFirstJsonObject(cleaned);
    const candidates = [jsonCandidate, cleaned].filter(
      (candidate): candidate is string => Boolean(candidate),
    );

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as InterviewPrepCourseResponse;
        const normalized = this.normalizeInterviewPrepCourseChapters(
          parsed.chapters,
          includeVideoRecommendations,
        )
          .slice(0, chapterCount)
          .map((chapter) => ({
            ...chapter,
            youtubeVideos: [] as InterviewPrepCourseChapterVideo[],
          }));

        if (normalized.length > 0) {
          return normalized;
        }
      } catch {
        // Try next parse candidate.
      }
    }

    throw new SyntaxError('Failed to parse course JSON output.');
  }

  private async repairInterviewPrepCourseJson(
    rawText: string,
    expectedChapterCount: number,
  ): Promise<string | null> {
    const truncated = rawText.slice(0, 16000);
    const repairPrompt = `You are a strict JSON repair assistant.
Convert the input into valid JSON only.

Required shape:
{
  "chapters": [
    {
      "title": string,
      "overview": string,
      "estimatedMinutes": number,
      "material": string[],
      "interviewQuestions": [
        {
          "question": string,
          "whyAsked": string,
          "answerFramework": string,
          "sampleAnswer": string
        }
      ]
    }
  ]
}

Requirements:
- Output ONLY valid JSON.
- Preserve content as much as possible from the input.
- Keep exactly ${expectedChapterCount} chapters when possible.
- Do not add markdown or explanations.

Input:
${truncated}`;

    return await this.generateTextWithOpenAI(repairPrompt, {
      temperature: 0,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    }, this.openAICourseModel);
  }

  private async generateTextWithGemini(
    prompt: string,
    generationConfig: GeminiGenerationConfig,
  ): Promise<string> {
    const genAI = this.ensureConfigured();
    const availableModelNames = await this.getAvailableModelNames();
    const candidates = this.resolveModelCandidates(availableModelNames);
    let lastError: unknown = null;

    for (let index = 0; index < candidates.length; index += 1) {
      const modelName = candidates[index];
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig,
        });
        const result = await model.generateContent(prompt);
        const text = result?.response?.text?.() ?? '';
        if (text.trim()) {
          return text.trim();
        }
        lastError = new Error(
          `Gemini model "${modelName}" returned empty content.`,
        );
      } catch (err) {
        lastError = err;
        const message = this.getErrorMessage(err);
        const hasNextModel = index < candidates.length - 1;

        if (hasNextModel && this.shouldTryNextModel(message)) {
          this.logger.warn(
            `Gemini model "${modelName}" failed (${message.slice(0, 140)}). Trying fallback model.`,
          );
          continue;
        }
        break;
      }
    }

    if (lastError) throw lastError;
    throw new Error('Gemini AI service error');
  }

  private async generateTextWithOpenAI(
    prompt: string,
    generationConfig: GeminiGenerationConfig,
    modelName?: string,
  ): Promise<string | null> {
    if (!this.openAIApiKey) return null;

    const openAI = createOpenAI({ apiKey: this.openAIApiKey });

    const result = await generateText({
      model: openAI(modelName || this.openAIModel),
      prompt,
      temperature: generationConfig.temperature,
      maxOutputTokens: generationConfig.maxOutputTokens,
    });

    const text = result.text?.trim();
    return text || null;
  }

  private async getAvailableModelNames(): Promise<Set<string> | null> {
    const now = Date.now();
    if (
      this.discoveredModelNames &&
      this.discoveredModelNamesExpiresAt > now
    ) {
      return this.discoveredModelNames;
    }

    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${this.apiKey}`,
      );
      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as {
        models?: Array<{ name?: string }>;
      };
      const names = new Set(
        (payload.models ?? [])
          .map((model) => (model.name || '').replace(/^models\//, '').trim())
          .filter(Boolean),
      );

      if (!names.size) return null;

      this.discoveredModelNames = names;
      this.discoveredModelNamesExpiresAt =
        now + GeminiService.MODEL_CACHE_TTL_MS;
      return names;
    } catch {
      return null;
    }
  }

  private resolveModelCandidates(
    availableModelNames: Set<string> | null,
  ): string[] {
    if (!availableModelNames?.size) {
      return this.modelCandidates;
    }

    const preferredAvailable = this.modelCandidates.filter((model) =>
      availableModelNames.has(model),
    );

    const dynamicAvailable = Array.from(availableModelNames).filter(
      (model) =>
        model.startsWith('gemini') &&
        model.includes('flash') &&
        !model.includes('image') &&
        !model.includes('tts') &&
        !model.includes('embedding') &&
        !model.includes('robotics') &&
        !model.includes('computer-use'),
    );

    const finalCandidates = Array.from(
      new Set([...preferredAvailable, ...dynamicAvailable]),
    );

    return finalCandidates.length > 0 ? finalCandidates : this.modelCandidates;
  }

  async generateProfessionalSummary(input: {
    targetRole?: string | null;
    professionalSummary?: string | null;
    experience?: ResumeBuilderExperienceItem[];
    education?: ResumeBuilderContent['education'];
    skills?: string[];
  }): Promise<string> {
    const experienceText =
      input.experience
        ?.map(
          (e) =>
            `${e.position || 'N/A'} at ${e.company || 'N/A'}: ${(e.bulletPoints || []).join('; ')}`,
        )
        .join('\n') || 'None';
    const educationText =
      input.education
        ?.map(
          (e) =>
            `${e.degree || 'N/A'} - ${e.school || 'N/A'} (${e.startDate || ''} - ${e.endDate || ''})`,
        )
        .join('\n') || 'None';
    const skillsText = (input.skills || []).join(', ') || 'None';

    const prompt = `You are an expert resume writer. Write a short, ATS-friendly professional summary (3-5 lines) for a resume.

Target role: ${input.targetRole || 'Not specified'}
Existing summary (can refine or replace): ${input.professionalSummary || 'None'}

Experience overview:
${experienceText}

Education:
${educationText}

Skills: ${skillsText}

Return ONLY the professional summary text, no headings or extra text. Keep it concise and keyword-rich for ATS.`;

    try {
      const text = await this.generateTextWithModelFallback(prompt, {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: 'text/plain',
      });
      if (!text?.trim()) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'AI returned an empty summary. Please try again.',
        });
      }
      return text.trim();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const message = this.getErrorMessage(err);
      throw new ApiError({
        statusCode: HttpStatus.BAD_GATEWAY,
        message:
          message.includes('API key') || message.includes('API_KEY')
            ? 'Gemini API is not configured. Set GEMINI_API_KEY in .env.'
            : message.includes('blocked') || message.includes('safety')
              ? 'AI could not generate content for this request. Try different wording.'
              : message.includes('fetching from') || message.includes('404')
                ? 'Configured AI model is unavailable. Check RESUME_AI_PROVIDER, GEMINI_MODEL, or RESUME_OPENAI_MODEL.'
              : `AI summary failed: ${message.slice(0, 120)}`,
      });
    }
  }

  async generateExperienceBullets(input: {
    targetRole?: string | null;
    position?: string | null;
    company?: string | null;
    description: string;
  }): Promise<string[]> {
    const prompt = `You are an expert resume writer. Generate 3-5 ATS-friendly bullet points for this work experience. Use action verbs and quantify where possible.

Target role: ${input.targetRole || 'Not specified'}
Position: ${input.position || 'N/A'}
Company: ${input.company || 'N/A'}

Raw description or context from the user:
${input.description}

Return a JSON object with a single key "bullets" that is an array of strings. Example: {"bullets": ["Point one.", "Point two."]}. Return only valid JSON.`;

    try {
      const text = await this.generateTextWithModelFallback(prompt, {
        temperature: 0.6,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      });
      if (!text?.trim()) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'AI returned empty content. Please try again.',
        });
      }
      const bullets = this.parseBulletsFromText(text);
      if (!bullets.length) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'AI returned an invalid bullet format. Please try again.',
        });
      }
      return bullets.slice(0, 6);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const message = this.getErrorMessage(err);
      throw new ApiError({
        statusCode: HttpStatus.BAD_GATEWAY,
        message:
          message.includes('API key') || message.includes('API_KEY')
            ? 'Gemini API is not configured. Set GEMINI_API_KEY in .env.'
            : message.includes('fetching from') || message.includes('404')
              ? 'Configured AI model is unavailable. Check RESUME_AI_PROVIDER, GEMINI_MODEL, or RESUME_OPENAI_MODEL.'
            : `AI bullets failed: ${message.slice(0, 120)}`,
      });
    }
  }

  async generateResumeSuggestions(input: {
    focus: 'setup' | 'personal' | 'summary' | 'skills';
    targetRole?: string | null;
    personalInfo?: ResumeBuilderContent['personalInfo'] | null;
    professionalSummary?: string | null;
    experience?: ResumeBuilderExperienceItem[];
    education?: ResumeBuilderContent['education'];
    skills?: string[];
  }): Promise<{
    targetRole?: string;
    jobTitle?: string;
    professionalSummary?: string;
    skills?: string[];
  }> {
    const experienceText =
      input.experience
        ?.map(
          (e) =>
            `${e.position || 'N/A'} at ${e.company || 'N/A'} (${e.startDate || ''} - ${e.endDate || ''}): ${(e.bulletPoints || []).join('; ')}`,
        )
        .join('\n') || 'None';
    const educationText =
      input.education
        ?.map(
          (e) =>
            `${e.degree || 'N/A'} - ${e.major || 'N/A'} at ${e.school || 'N/A'} (${e.startDate || ''} - ${e.endDate || ''})`,
        )
        .join('\n') || 'None';
    const skillsText = (input.skills || []).join(', ') || 'None';

    const prompt = `You are an expert resume coach and ATS optimization assistant.
Given resume data, generate smart suggestions for the requested focus area.

Focus: ${input.focus}

Current role target: ${input.targetRole || 'Not specified'}
Current job title/headline: ${input.personalInfo?.jobTitle || 'Not specified'}
Current summary: ${input.professionalSummary || 'Not specified'}
Experience:
${experienceText}

Education:
${educationText}

Skills:
${skillsText}

Return ONLY valid JSON with these optional keys:
{
  "targetRole": string,
  "jobTitle": string,
  "professionalSummary": string,
  "skills": string[]
}

Rules:
- If focus is "setup", prioritize targetRole and jobTitle.
- If focus is "personal", prioritize jobTitle.
- If focus is "summary", return a concise ATS-friendly professionalSummary (3-5 lines).
- If focus is "skills", return 6-12 concrete skill keywords relevant to the profile.
- Keep output concise and realistic.
- Do not include markdown, code fences, or explanations.`;

    try {
      const text = await this.generateTextWithModelFallback(prompt, {
        temperature: 0.5,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      });
      if (!text?.trim()) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'AI returned empty suggestions. Please try again.',
        });
      }

      const cleaned = this.cleanJsonText(text);
      const jsonCandidate = this.extractFirstJsonObject(cleaned) ?? cleaned;
      const parsed = JSON.parse(jsonCandidate) as SuggestionsResponse;

      const targetRole = this.sanitizeSuggestionText(parsed.targetRole);
      const jobTitle = this.sanitizeSuggestionText(parsed.jobTitle);
      const professionalSummary = this.sanitizeSuggestionText(
        parsed.professionalSummary,
      );
      const skills = this.toStringArray(parsed.skills).slice(0, 12);

      return {
        targetRole,
        jobTitle,
        professionalSummary,
        skills: skills.length ? skills : undefined,
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof SyntaxError) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to parse AI suggestions. Please try again.',
        });
      }
      const message = this.getErrorMessage(err);
      throw new ApiError({
        statusCode: HttpStatus.BAD_GATEWAY,
        message:
          message.includes('API key') || message.includes('API_KEY')
            ? 'Gemini API is not configured. Set GEMINI_API_KEY in .env.'
            : message.includes('fetching from') || message.includes('404')
              ? 'Configured AI model is unavailable. Check RESUME_AI_PROVIDER, GEMINI_MODEL, or RESUME_OPENAI_MODEL.'
              : `AI suggestions failed: ${message.slice(0, 120)}`,
      });
    }
  }

  async atsScanResume(input: {
    resumeText: string;
    targetRole?: string | null;
    experienceLevel?: string | null;
    jobDescription?: string | null;
  }): Promise<AtsScanResult> {
    const prompt = `You are an expert in ATS (Applicant Tracking System) and resume analysis.
First determine whether the document is a real professional resume.
If the document is not a resume, you MUST set:
- "documentType": "not_resume"
- "overallScore": 0
- all category scores to 0
- "classificationReason" with a clear explanation
- tips that explicitly say this is not a resume.

If the document is a resume, set "documentType": "resume" and provide strict ATS scoring with actionable feedback.
${input.targetRole ? `Target role: ${input.targetRole}` : ''}
${input.experienceLevel ? `Experience level: ${input.experienceLevel}` : ''}
${input.jobDescription ? `Job description (use for relevance):\n${input.jobDescription.slice(0, 3000)}` : ''}

Resume text:
---
${input.resumeText.slice(0, 12000)}
---

Provide the feedback as a JSON object with this exact structure (all scores 0-100). Be strict: give low scores when there are real issues.
${ATS_RESPONSE_JSON_SCHEMA}

Return only the JSON object, no markdown or extra text.`;

    try {
      const text = await this.generateTextWithModelFallback(prompt, {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      });
      if (!text?.trim()) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'ATS scan returned empty. Please try again.',
        });
      }
      const cleaned = this.cleanJsonText(text);
      const jsonCandidate = this.extractFirstJsonObject(cleaned) ?? cleaned;
      const parsed = JSON.parse(jsonCandidate) as AtsScanResponse;
      return this.normalizeAtsScanResult(parsed);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof SyntaxError) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to parse ATS scan result. Please try again.',
        });
      }
      const message = this.getErrorMessage(err);
      throw new ApiError({
        statusCode: HttpStatus.BAD_GATEWAY,
        message:
          message.includes('API key') || message.includes('API_KEY')
            ? 'Gemini API is not configured. Set GEMINI_API_KEY in .env.'
            : message.includes('fetching from') || message.includes('404')
              ? 'Configured AI model is unavailable. Check RESUME_AI_PROVIDER, GEMINI_MODEL, or RESUME_OPENAI_MODEL.'
            : `ATS scan failed: ${message.slice(0, 120)}`,
      });
    }
  }

  async generateInterviewPrepCourse(input: {
    title: string;
    description?: string | null;
    category: string;
    generationMode: ResourceCourseGenerationMode;
    difficulty: string;
    targetRoles: string[];
    chapterCount: number;
    chapterTitles?: string[];
    includeVideoRecommendations: boolean;
    promptContext?: string | null;
    jobDescriptionContext?: string | null;
  }): Promise<InterviewPrepCourseResult> {
    const normalizedChapterCount = Math.min(
      14,
      Math.max(1, Math.round(input.chapterCount)),
    );

    try {
      const generateChapters = async (
        strictMode: boolean,
      ): Promise<InterviewPrepCourseChapter[]> => {
        const prompt = this.buildInterviewPrepCoursePrompt(
          input,
          normalizedChapterCount,
          strictMode,
        );
        const text = await this.withTimeout(
          this.generateCourseTextWithOpenAIPriority(prompt, {
            temperature: strictMode ? 0.25 : 0.4,
            maxOutputTokens: 6144,
            responseMimeType: 'application/json',
          }),
          50000,
          'AI generation timed out.',
        );
        if (!text?.trim()) {
          throw new ApiError({
            statusCode: HttpStatus.BAD_GATEWAY,
            message: 'AI returned empty course content. Please try again.',
          });
        }

        try {
          return this.parseInterviewPrepCourseChaptersFromText(
            text,
            normalizedChapterCount,
            input.includeVideoRecommendations,
          );
        } catch (parseError) {
          const repaired = await this.repairInterviewPrepCourseJson(
            text,
            normalizedChapterCount,
          );
          if (!repaired) {
            throw parseError;
          }
          return this.parseInterviewPrepCourseChaptersFromText(
            repaired,
            normalizedChapterCount,
            input.includeVideoRecommendations,
          );
        }
      };

      let chapters = await generateChapters(false);
      if (
        this.hasWeakCourseMaterial(chapters, input.generationMode) ||
        this.hasWeakInterviewAnswers(chapters, input.generationMode)
      ) {
        this.logger.warn(
          'Interview prep course output looked weak. Retrying with stricter prompt.',
        );
        chapters = await generateChapters(true);
      }

      if (
        this.hasWeakCourseMaterial(chapters, input.generationMode) ||
        this.hasWeakInterviewAnswers(chapters, input.generationMode)
      ) {
        chapters = await this.refineWeakCourseChapters(input, chapters);
      }

      if (!chapters.length) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'AI returned invalid chapter data. Please try again.',
        });
      }

      return {
        learningOutcomes: [],
        chapters,
        aiModel:
          this.openAIApiKey && this.openAICourseModel
            ? this.openAICourseModel
            : (this.modelCandidates[0] ?? null),
      };
    } catch (err) {
      const message = this.getErrorMessage(err);
      this.logger.warn(
        `Interview prep course generation failed (${message.slice(0, 140)}). Falling back to deterministic course outline.`,
      );
      return await this.buildInterviewPrepCourseFallback({
        ...input,
        chapterCount: normalizedChapterCount,
      });
    }
  }

  private async refineWeakCourseChapters(
    input: {
      title: string;
      description?: string | null;
      category: string;
      generationMode: ResourceCourseGenerationMode;
      difficulty: string;
      targetRoles: string[];
      chapterCount: number;
      chapterTitles?: string[];
      includeVideoRecommendations: boolean;
      promptContext?: string | null;
      jobDescriptionContext?: string | null;
    },
    chapters: InterviewPrepCourseChapter[],
  ): Promise<InterviewPrepCourseChapter[]> {
    if (!chapters.length) return chapters;

    const minMaterialParagraphs = this.getMinimumMaterialParagraphs(
      input.generationMode,
    );
    const minQuestionCount = this.getMinimumQuestionCount(input.generationMode);
    const minMaterialWords =
      input.generationMode === ResourceCourseGenerationMode.LEARN ? 45 : 25;
    const minAnswerWords =
      input.generationMode === ResourceCourseGenerationMode.LEARN ? 35 : 22;

    const weakIndexes = chapters
      .map((chapter, index) => {
        const material = chapter.material ?? [];
        const questions = chapter.interviewQuestions ?? [];
        const answers = questions
          .map((question) => question.sampleAnswer)
          .filter((answer): answer is string => Boolean(answer));

        const genericMaterialCount = material.filter((paragraph) =>
          this.isGenericCourseMaterialParagraph(paragraph),
        ).length;
        const thinMaterialCount = material.filter(
          (paragraph) => this.getWordCount(paragraph) < minMaterialWords,
        ).length;
        const genericAnswerCount = answers.filter((answer) =>
          this.isGenericInterviewAnswer(answer),
        ).length;
        const thinAnswerCount = answers.filter(
          (answer) => this.getWordCount(answer) < minAnswerWords,
        ).length;

        const hasWeakMaterial =
          material.length < minMaterialParagraphs ||
          genericMaterialCount >= Math.ceil(Math.max(1, material.length) / 2) ||
          thinMaterialCount >= Math.ceil(Math.max(1, material.length) / 2);

        const hasWeakAnswers =
          questions.length < minQuestionCount ||
          answers.length < minQuestionCount ||
          genericAnswerCount >= Math.ceil(Math.max(1, answers.length) / 2) ||
          thinAnswerCount >= Math.ceil(Math.max(1, answers.length) / 2);

        return hasWeakMaterial || hasWeakAnswers ? index : -1;
      })
      .filter((index) => index >= 0);

    if (!weakIndexes.length) return chapters;

    const weakChapterPayload = weakIndexes.map((index) => {
      const chapter = chapters[index];
      return {
        chapterNumber: index + 1,
        title: chapter.title,
        overview: chapter.overview ?? null,
        estimatedMinutes: chapter.estimatedMinutes,
        material: (chapter.material ?? []).slice(0, 8),
        interviewQuestions: (chapter.interviewQuestions ?? [])
          .map((question) => ({
            question: question.question,
            whyAsked: question.whyAsked ?? null,
            answerFramework: question.answerFramework ?? null,
            sampleAnswer: question.sampleAnswer ?? null,
          }))
          .slice(0, 8),
      };
    });

    const materialRange =
      input.generationMode === ResourceCourseGenerationMode.LEARN ? '4-6' : '2-4';
    const questionRange =
      input.generationMode === ResourceCourseGenerationMode.LEARN ? '2-3' : '3-4';

    const refinementPrompt = `You are rewriting weak chapters in an AI-generated technical course.
Course title: ${input.title.trim()}
Course description: ${input.description?.trim() || 'Not provided'}
Difficulty: ${input.difficulty}
Target roles: ${input.targetRoles.join(', ')}
Generation mode: ${input.generationMode}
Additional user context: ${input.promptContext?.trim() || 'none'}
Job perspective context: ${input.jobDescriptionContext?.trim() || 'none'}

Weak chapters to rewrite (JSON):
${JSON.stringify(weakChapterPayload)}

Return ONLY valid JSON with this shape:
{
  "chapters": [
    {
      "title": string,
      "overview": string,
      "estimatedMinutes": number,
      "material": string[],
      "interviewQuestions": [
        {
          "question": string,
          "whyAsked": string,
          "answerFramework": string,
          "sampleAnswer": string
        }
      ]
    }
  ]
}

Rules:
- Return exactly ${weakChapterPayload.length} chapters in the same order.
- Keep each chapter title exactly the same as input.
- Keep each chapter aligned to the course title and description, not generic templates.
- Each chapter needs ${materialRange} material paragraphs.
- Material must be direct teaching prose with real technical explanation, not chapter commentary.
- Never write: "this chapter", "the learner should", "should explain", "this topic matters because", "start by understanding", or "for interview preparation".
- LEARN mode must teach definitions, internal mechanics, trade-offs, implementation details, and alternatives with concrete terminology.
- INTERVIEW_PREP mode can be concise, but still must stay technically correct and specific.
- Each chapter needs ${questionRange} interviewQuestions with non-generic sample answers tied to chapter content.
- Sample answers must avoid template phrases like "I would describe", "in practice, I first clarify", or "compare at least two options".
- No markdown, no prose outside JSON.`;

    try {
      const text = await this.withTimeout(
        this.generateCourseTextWithOpenAIPriority(refinementPrompt, {
          temperature: 0.15,
          maxOutputTokens: 6144,
          responseMimeType: 'application/json',
        }),
        50000,
        'AI chapter refinement timed out.',
      );

      if (!text?.trim()) return chapters;

      let refined: InterviewPrepCourseChapter[] = [];
      try {
        refined = this.parseInterviewPrepCourseChaptersFromText(
          text,
          weakIndexes.length,
          input.includeVideoRecommendations,
        );
      } catch (parseError) {
        const repaired = await this.repairInterviewPrepCourseJson(
          text,
          weakIndexes.length,
        );
        if (!repaired) {
          throw parseError;
        }
        refined = this.parseInterviewPrepCourseChaptersFromText(
          repaired,
          weakIndexes.length,
          input.includeVideoRecommendations,
        );
      }

      if (!refined.length) return chapters;

      const merged = [...chapters];
      weakIndexes.forEach((chapterIndex, refinedIndex) => {
        const refinedChapter = refined[refinedIndex];
        if (!refinedChapter) return;
        merged[chapterIndex] = {
          ...merged[chapterIndex],
          ...refinedChapter,
          title: merged[chapterIndex].title,
          youtubeVideos: [] as InterviewPrepCourseChapterVideo[],
        };
      });

      return merged;
    } catch (err) {
      const message = this.getErrorMessage(err);
      this.logger.warn(
        `Chapter refinement failed (${message.slice(0, 140)}). Keeping initial chapters.`,
      );
      return chapters;
    }
  }

  private buildDefaultFallbackQuestions(
    topic: string,
  ): InterviewPrepCourseInterviewQuestion[] {
    return [
      {
        question: `Explain ${topic} in a structured technical way.`,
        whyAsked:
          'Checks whether you can explain mechanism, not only definitions.',
        answerFramework:
          'Definition -> core components -> execution flow -> one practical example -> trade-offs.',
        sampleAnswer:
          `${topic} should be explained by naming the key components and walking through the flow from input to output. A complete answer adds one practical example and closes with trade-offs such as model quality, latency, memory usage, and maintainability.`,
      },
      {
        question: `What are the most important trade-offs in ${topic}?`,
        whyAsked:
          'Evaluates whether you can choose between alternatives under constraints.',
        answerFramework:
          'Compare at least two options using quality, cost, latency, and operational complexity.',
        sampleAnswer:
          `The most important trade-offs are quality versus complexity, compute cost versus latency, and implementation speed versus long-term maintainability. A robust answer compares a strong baseline with a more advanced option and justifies the final choice based on workload constraints.`,
      },
      {
        question: `What common failure modes appear in ${topic}, and how do you debug them?`,
        whyAsked:
          'Assesses practical troubleshooting and production readiness.',
        answerFramework:
          'Symptom -> likely causes -> validation checks -> mitigation.',
        sampleAnswer:
          `Common failures include data leakage, unstable metrics, and mismatch between offline evaluation and production behavior. Debugging starts with split validation, feature drift checks, segment-level error analysis, and ablation of recent pipeline changes before retraining or redesign.`,
      },
    ];
  }

  private async buildInterviewPrepCourseFallback(input: {
    title: string;
    description?: string | null;
    category: string;
    generationMode: ResourceCourseGenerationMode;
    difficulty: string;
    targetRoles: string[];
    chapterCount: number;
    chapterTitles?: string[];
    includeVideoRecommendations: boolean;
    jobDescriptionContext?: string | null;
  }): Promise<InterviewPrepCourseResult> {
    const normalizedChapterCount = Math.min(
      14,
      Math.max(1, Math.round(input.chapterCount)),
    );
    const cleanedChapterTitles = (input.chapterTitles ?? [])
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, normalizedChapterCount);
    const courseFocus = input.title.trim() || input.category;
    const contextBlob = `${input.title} ${input.description ?? ''} ${input.category} ${input.jobDescriptionContext ?? ''}`
      .toLowerCase()
      .trim();
    const mentionsMachineLearning = /(machine learning|\bml\b)/.test(contextBlob);
    const mentionsTraditionalMl =
      /(traditional|classical|tabular|regression|classification|random forest|xgboost|lightgbm|svm|knn|naive bayes)/.test(
        contextBlob,
      );
    const mentionsDeepLearning =
      /(deep learning|neural network|transformer|attention|llm|bert|gpt|cnn|rnn)/.test(
        contextBlob,
      );
    const isTransformerFallback =
      /(transformer|attention|llm|bert|gpt|encoder|decoder|tokenization)/.test(
        contextBlob,
      );
    const isTraditionalMlFallback =
      (mentionsMachineLearning && mentionsTraditionalMl) ||
      (mentionsMachineLearning && !mentionsDeepLearning);

    type FallbackTemplate = {
      title: string;
      overview: string;
      learnMaterial: string[];
      interviewMaterial: string[];
      interviewQuestions: InterviewPrepCourseInterviewQuestion[];
      estimatedMinutes?: number;
    };

    const traditionalMlTemplates: FallbackTemplate[] = [
      {
        title: 'Problem Framing and Data Splits',
        overview:
          'This chapter defines task framing, leakage-safe splits, and baseline strategy for traditional machine learning.',
        learnMaterial: [
          'Traditional machine learning starts by mapping a business question to a formal task such as regression, binary classification, multiclass classification, or clustering. Correct framing determines objective functions, metrics, and model families.',
          'A reliable setup separates training, validation, and test sets. The test split is used once for final reporting; tuning against test data leaks information and produces optimistic performance estimates.',
          'Data issues often dominate algorithm choice. Missing values, label noise, class imbalance, duplicate records, and leakage must be handled before model comparison is trustworthy.',
          'A practical baseline workflow is: define metric, train a simple baseline model, inspect errors by segment, improve features, and then increase model complexity only when baseline limitations are clear.',
        ],
        interviewMaterial: [
          'Start by framing the exact task and objective metric before naming algorithms.',
          'Explain split strategy and leakage checks to show experimental rigor.',
          'Use baseline-first reasoning, then justify why a stronger model is needed.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'problem framing and data splits',
        ),
      },
      {
        title: 'Linear Models: Linear and Logistic Regression',
        overview:
          'This chapter teaches linear-model fundamentals, regularization, and decision boundaries.',
        learnMaterial: [
          'Linear regression predicts a continuous target with y_hat = w^T x + b and is typically optimized by minimizing squared error. Coefficients are interpretable when preprocessing and collinearity are handled carefully.',
          'Logistic regression predicts class probability with p(y=1|x) = sigma(w^T x + b). It is a linear classifier in feature space and works well on many sparse or moderate-dimensional tabular problems.',
          'Regularization improves generalization. L2 penalizes large weights smoothly, while L1 can drive sparse solutions and implicitly perform feature selection.',
          'Linear models struggle with strong nonlinear interactions unless feature transformations are introduced. Interaction terms, polynomial features, or model switching to trees are standard next steps.',
        ],
        interviewMaterial: [
          'Differentiate regression from classification via target type and loss function.',
          'Discuss regularization as a bias-variance control mechanism.',
          'State one clear reason to move from linear models to nonlinear alternatives.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'linear and logistic regression',
        ),
      },
      {
        title: 'Tree-Based Models and Ensembles',
        overview:
          'This chapter covers decision trees, random forests, and gradient boosting for nonlinear tabular data.',
        learnMaterial: [
          'Decision trees split feature space recursively using impurity reduction criteria such as Gini, entropy, or variance reduction. They naturally capture nonlinear interactions without heavy feature engineering.',
          'Single trees are high-variance and can overfit deep branches. Depth limits, minimum leaf size, and pruning are core controls for balancing bias and variance.',
          'Random forests reduce variance by averaging many decorrelated trees trained on bootstrap samples and feature subsampling. They are robust baselines for mixed-type tabular data.',
          'Gradient boosting sequentially corrects residual errors and often delivers higher accuracy than bagging methods. Key levers are learning rate, tree depth, estimator count, and regularization settings.',
        ],
        interviewMaterial: [
          'Compare bagging and boosting clearly and explain when each is preferred.',
          'Mention the most important overfitting controls for tree ensembles.',
          'Use one example where gradient boosting is worth its additional complexity.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'tree-based models and ensembles',
        ),
      },
      {
        title: 'k-NN and Support Vector Machines',
        overview:
          'This chapter explains distance-based and margin-based classifiers with scaling and kernel trade-offs.',
        learnMaterial: [
          'k-nearest neighbors predicts from local neighborhoods defined by a distance metric. It has minimal training cost but can be expensive at inference time when the candidate set is large.',
          'Support vector machines find a maximum-margin separating hyperplane and optimize hinge-based objectives. Margin maximization can improve robustness when classes are reasonably separable.',
          'Kernel SVM enables nonlinear boundaries through implicit feature mapping, but training complexity can become prohibitive as dataset size grows.',
          'Feature scaling is mandatory for both k-NN and SVM because distances and margins are geometry-sensitive. Poor scaling can dominate model behavior more than hyperparameter choice.',
        ],
        interviewMaterial: [
          'Explain why k-NN is inference-heavy while SVM is optimization-heavy.',
          'Discuss when kernel SVM improves quality and when it is not operationally practical.',
          'Highlight scaling and metric selection as first-order decisions.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'k-nearest neighbors and support vector machines',
        ),
      },
      {
        title: 'Probabilistic Models: Naive Bayes and Calibration',
        overview:
          'This chapter introduces probabilistic thinking, Naive Bayes assumptions, and probability calibration.',
        learnMaterial: [
          'Probabilistic classifiers estimate class probabilities, enabling threshold decisions based on business cost rather than fixed labels. This is essential when false-positive and false-negative costs are asymmetric.',
          'Naive Bayes applies Bayes rule with conditional independence assumptions, giving fast and effective baselines on text-like sparse features.',
          'Model variants include Gaussian, Multinomial, and Bernoulli forms depending on feature type. Laplace smoothing prevents zero-probability collapse for unseen events.',
          'Probability quality is separate from ranking quality. Calibration methods are needed when downstream systems consume confidence values directly.',
        ],
        interviewMaterial: [
          'Frame Naive Bayes as a probabilistic baseline with explicit assumptions.',
          'Mention where the independence assumption is violated and what happens.',
          'Include calibration when probabilities drive business decisions.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'naive bayes and probabilistic modeling',
        ),
      },
      {
        title: 'Unsupervised Learning: k-Means and PCA',
        overview:
          'This chapter explains clustering and dimensionality reduction for unlabeled structure discovery.',
        learnMaterial: [
          'k-means partitions points into K clusters by minimizing within-cluster squared distance to centroids. It is efficient but assumes cluster geometry aligned with the selected distance metric.',
          'Initialization quality affects convergence. k-means++ and multiple restarts reduce poor local minima compared with naive random seeding.',
          'Principal component analysis projects data onto orthogonal directions of maximum variance using covariance eigenvectors or singular value decomposition.',
          'Unsupervised outputs require careful interpretation. Cluster IDs are not labels, and high explained variance does not automatically imply downstream predictive usefulness.',
        ],
        interviewMaterial: [
          'State k-means objective and why feature scaling is critical.',
          'Explain PCA as linear projection and what information it discards.',
          'Describe how you validate usefulness for downstream tasks.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'k-means clustering and PCA',
        ),
      },
      {
        title: 'Evaluation, Cross-Validation, and Hyperparameter Search',
        overview:
          'This chapter covers metric design, validation protocols, and tuning strategy.',
        learnMaterial: [
          'Metrics must match business goals. Accuracy can be misleading under class imbalance, where precision, recall, F1, PR-AUC, or ROC-AUC offer better decision visibility.',
          'Cross-validation reduces variance in performance estimates by averaging across folds. Stratified, grouped, or time-based splits should match the data-generation process.',
          'Hyperparameter search strategies include grid, random, and Bayesian optimization. Random search often provides better coverage in high-dimensional spaces at fixed budget.',
          'Threshold tuning and calibration are part of model selection, not post-processing afterthoughts. Production thresholds should be tied to explicit cost or risk constraints.',
        ],
        interviewMaterial: [
          'Lead with metric rationale tied to business impact.',
          'Explain why your split strategy is leakage-safe and representative.',
          'Treat thresholding and calibration as explicit optimization steps.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'model evaluation and hyperparameter tuning',
        ),
      },
      {
        title: 'Feature Engineering, Pipelines, and Monitoring',
        overview:
          'This chapter teaches production-grade feature pipelines and post-deployment model monitoring.',
        learnMaterial: [
          'Feature engineering converts raw signals into informative model inputs through encoding, scaling, aggregation, and interaction design. Feature semantics must be stable across train and inference paths.',
          'Reusable pipelines ensure preprocessing parity between training and production. Without this parity, offline metrics can look strong while online predictions degrade.',
          'Model deployment requires versioning for data schema, transformation logic, model artifact, and evaluation reports so regressions remain traceable.',
          'Monitoring tracks drift, prediction stability, and delayed-label performance. Alerting should map to concrete responses such as retraining, rollback, threshold updates, or feature fixes.',
        ],
        interviewMaterial: [
          'Explain leakage-safe feature transformations and pipeline reproducibility.',
          'List what must be versioned beyond model weights.',
          'Describe a monitoring loop with actionable thresholds.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'feature engineering, pipelines, and monitoring',
        ),
      },
    ];

    const transformerTemplates: FallbackTemplate[] = [
      {
        title: 'Tokenization, Embeddings, and Positional Encoding',
        overview:
          'This chapter explains how text is converted into token vectors with explicit order information.',
        learnMaterial: [
          'Transformers consume token IDs rather than raw text. Tokenization strategy controls vocabulary size, sequence length, and context efficiency.',
          'Embedding layers map token IDs to dense vectors that carry semantic information. These vectors are learned parameters updated during training.',
          'Because attention is permutation-invariant, positional encoding is required to represent order. Absolute and relative schemes make different trade-offs for long contexts.',
          'Tokenizer and context design directly affect latency and memory because attention cost grows quickly with sequence length.',
        ],
        interviewMaterial: [
          'Define tokenization and embeddings first, then explain why position encoding is mandatory.',
          'Connect token length to quadratic attention cost.',
          'Mention one trade-off in tokenizer design.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'tokenization and embedding design in transformers',
        ),
      },
      {
        title: 'Self-Attention and Multi-Head Computation',
        overview:
          'This chapter teaches query-key-value attention, multi-head structure, and scaling behavior.',
        learnMaterial: [
          'Self-attention computes relevance weights from query-key similarity and uses them to aggregate value vectors. This allows each token to incorporate context from other tokens.',
          'Multi-head attention runs multiple projections in parallel so different relation patterns can be captured simultaneously before projection back to model dimension.',
          'The dominant complexity is O(n^2) in sequence length, creating memory and latency pressure for long-context inference.',
          'Attention maps can aid diagnostics but should be combined with ablation and metric-based evaluation before drawing causal conclusions.',
        ],
        interviewMaterial: [
          'Walk through Q, K, V computation in order.',
          'Explain why multi-head attention is used instead of one large head.',
          'Discuss one practical mitigation for long-context cost.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'self-attention and multi-head computation',
        ),
      },
      {
        title: 'Transformer Blocks, Training, and Stability',
        overview:
          'This chapter covers block structure, optimization choices, and common training failures.',
        learnMaterial: [
          'A standard transformer block combines attention with a position-wise feed-forward network, residual paths, and normalization layers.',
          'Training usually relies on AdamW, learning-rate warmup, and large-scale next-token objectives. These choices control convergence speed and stability.',
          'Numerical instability can appear as loss spikes or divergence, especially with long sequences and large batch sizes.',
          'Stability improvements include gradient clipping, regularization, mixed-precision safeguards, and disciplined schedule tuning.',
        ],
        interviewMaterial: [
          'Name the block components and explain their functional roles.',
          'Mention one optimizer and one schedule decision with rationale.',
          'Describe a real training failure pattern and mitigation.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'transformer block training and stability',
        ),
      },
      {
        title: 'Inference, Fine-Tuning, and RAG Trade-offs',
        overview:
          'This chapter explains decoding strategy, domain adaptation, and retrieval-augmented system design.',
        learnMaterial: [
          'Decoding methods such as greedy, beam search, top-k, and nucleus sampling trade reliability against diversity and compute cost.',
          'Fine-tuning approaches range from full-weight updates to parameter-efficient adapters such as LoRA, each with quality and cost implications.',
          'RAG separates knowledge retrieval from generation, improving freshness and attribution when retrieval quality is strong.',
          'System design must balance quality, latency, memory, maintenance complexity, and safety constraints rather than optimizing one metric in isolation.',
        ],
        interviewMaterial: [
          'Contrast decoding methods using quality-versus-latency trade-offs.',
          'Explain when PEFT is preferred over full fine-tuning.',
          'Compare RAG with pure fine-tuning under data-freshness constraints.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'transformer inference and adaptation trade-offs',
        ),
      },
    ];

    const deepLearningTemplates: FallbackTemplate[] = [
      {
        title: 'Neural Network Foundations and Perceptrons',
        overview:
          'This chapter introduces perceptrons, multilayer networks, and nonlinear representation learning.',
        learnMaterial: [
          'A neural network composes linear transformations with nonlinear activations to learn complex mappings from features to targets. Without nonlinearity, stacked layers collapse to a single linear transform.',
          'A perceptron computes a weighted sum plus bias and applies an activation function. Multilayer perceptrons extend this idea to hidden representations that capture interactions difficult for linear models.',
          'Common activations include ReLU, GELU, sigmoid, and tanh. Activation choice influences gradient flow, saturation behavior, and training stability.',
          'Network capacity must match data complexity and regularization strength. Excessive capacity without controls increases overfitting risk even when training loss looks excellent.',
        ],
        interviewMaterial: [
          'Define perceptron and explain why nonlinearity is required.',
          'Describe how hidden layers improve representational power.',
          'Mention one activation trade-off and one overfitting control.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'neural network foundations',
        ),
      },
      {
        title: 'Forward Pass, Loss Functions, and Backpropagation',
        overview:
          'This chapter teaches the optimization mechanics that make neural networks learn.',
        learnMaterial: [
          'The forward pass computes predictions by propagating activations layer by layer. A loss function quantifies prediction error against targets and defines the optimization objective.',
          'Backpropagation applies the chain rule to compute gradients of loss with respect to each parameter efficiently. These gradients indicate how each weight should change to reduce loss.',
          'Gradient descent variants such as SGD, Momentum, Adam, and AdamW update parameters iteratively using mini-batch estimates. Learning rate is the most sensitive hyperparameter for convergence.',
          'Training instability appears as exploding or vanishing gradients, oscillating loss, or divergence. Typical fixes include initialization strategy, normalization layers, gradient clipping, and schedule tuning.',
        ],
        interviewMaterial: [
          'Walk through forward pass, loss, gradient computation, and update step.',
          'Explain chain rule intuition for backpropagation.',
          'Name common failure modes and concrete mitigation actions.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'backpropagation and neural network optimization',
        ),
      },
      {
        title: 'Regularization, Generalization, and Evaluation',
        overview:
          'This chapter covers overfitting controls, validation strategy, and model selection.',
        learnMaterial: [
          'Generalization quality is measured on unseen data, not training loss. A widening train-validation gap usually indicates overfitting.',
          'Regularization techniques include weight decay, dropout, early stopping, data augmentation, and label smoothing. Different methods target variance and calibration in different ways.',
          'Validation design must respect data structure through stratified, grouped, or time-aware splits. Leakage in preprocessing or split logic can invalidate every downstream conclusion.',
          'Model selection should combine metric quality, calibration, latency, and reliability under distribution shifts, not just top-line accuracy.',
        ],
        interviewMaterial: [
          'Describe how you detect and quantify overfitting.',
          'Compare at least two regularization techniques by mechanism.',
          'Explain metric and split choices in relation to deployment constraints.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'neural network regularization and evaluation',
        ),
      },
      {
        title: 'Architectures, Deployment, and Monitoring',
        overview:
          'This chapter explains choosing neural architectures and operating them in production systems.',
        learnMaterial: [
          'Architecture choice depends on data modality and task structure: MLPs for tabular features, CNNs for local spatial patterns, RNN/transformer variants for sequence dependencies.',
          'Deployment planning includes inference latency budgets, model compression, batching strategy, hardware selection, and rollback-safe release patterns.',
          'Robust systems version data schema, preprocessing logic, model artifacts, and evaluation reports to ensure reproducibility and fast incident response.',
          'Monitoring should track input drift, confidence distribution changes, latency regressions, and delayed-label performance so retraining decisions are evidence-driven.',
        ],
        interviewMaterial: [
          'Justify architecture from task and data properties.',
          'Discuss one latency-quality trade-off in production serving.',
          'Outline a monitoring plan with drift and quality alerts.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          'neural network architecture and productionization',
        ),
      },
    ];

    const genericTemplates: FallbackTemplate[] = [
      {
        title: 'Foundations and Core Definitions',
        overview: `This chapter establishes the conceptual base for ${courseFocus}.`,
        learnMaterial: [
          `${courseFocus} should begin with a precise definition of the problem, entities, and assumptions.`,
          'The conceptual model must connect terms to mechanism so each component has a clear operational meaning.',
          'Core decisions should be tied to measurable objectives and workload constraints.',
          'A strong foundation reduces downstream debugging and redesign effort.',
        ],
        interviewMaterial: [
          `Define ${courseFocus} clearly, then move to mechanism and trade-offs.`,
          'Use one practical example that demonstrates real decision pressure.',
          'Close with constraints that change architecture choice.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          `${courseFocus} foundations`,
        ),
      },
      {
        title: 'Architecture and Execution Flow',
        overview: `This chapter explains how ${courseFocus} works from input to output.`,
        learnMaterial: [
          'Execution flow should be described as stages, interfaces, and transformations.',
          'Each stage needs explicit responsibilities and failure signals.',
          'Alternative designs should be compared by quality, latency, cost, and maintainability.',
          'Instrumentation points are part of architecture because they enable reliable operations.',
        ],
        interviewMaterial: [
          'Walk through the end-to-end flow in ordered stages.',
          'Call out one bottleneck and a mitigation plan.',
          'Describe what you would measure in production.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          `${courseFocus} architecture and execution`,
        ),
      },
      {
        title: 'Evaluation, Optimization, and Productionization',
        overview: `This chapter covers how ${courseFocus} is measured, tuned, and operated.`,
        learnMaterial: [
          'Evaluation strategy must reflect real-world risk and decision cost.',
          'Optimization must balance quality gains against compute and operational complexity.',
          'Productionization requires reproducible pipelines, versioning, and rollback safety.',
          'Monitoring closes the loop by detecting drift and regression before major user impact.',
        ],
        interviewMaterial: [
          'Explain metric choice and risk alignment first.',
          'Compare a baseline and improved variant using concrete trade-offs.',
          'Finish with deployment and monitoring safeguards.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          `${courseFocus} evaluation and production`,
        ),
      },
    ];

    const templates = isTransformerFallback
      ? transformerTemplates
      : mentionsDeepLearning
        ? deepLearningTemplates
      : isTraditionalMlFallback
        ? traditionalMlTemplates
        : genericTemplates;

    const chapters: InterviewPrepCourseChapter[] = [];
    for (let index = 0; index < normalizedChapterCount; index += 1) {
      const template = templates[index] ?? {
        title: `${courseFocus} Advanced Topic ${index + 1}`,
        overview: `${courseFocus} advanced topic ${index + 1} deepens technical understanding and trade-off analysis.`,
        learnMaterial: [
          `${courseFocus} advanced topics should connect core theory to implementation details.`,
          'The explanation must cover execution flow, constraints, and failure modes.',
          'Alternative designs should be compared using measurable criteria.',
          'Operational checks and monitoring should be defined before deployment.',
        ],
        interviewMaterial: [
          'Explain the mechanism first, then compare alternatives.',
          'Use one scenario where a different design is objectively better.',
          'Close with diagnostics and mitigation strategy.',
        ],
        interviewQuestions: this.buildDefaultFallbackQuestions(
          `${courseFocus} advanced topic ${index + 1}`,
        ),
      };

      const title = cleanedChapterTitles[index] ?? template.title;

      const material =
        input.generationMode === ResourceCourseGenerationMode.LEARN
          ? template.learnMaterial
          : template.interviewMaterial;

      const youtubeVideos: InterviewPrepCourseChapterVideo[] =
        input.includeVideoRecommendations
          ? []
          : [];

      chapters.push({
        title,
        overview: template.overview,
        estimatedMinutes: template.estimatedMinutes ?? 35,
        material,
        sections: [],
        learningObjectives: [],
        coreConcepts: [],
        interviewQuestions: template.interviewQuestions,
        practicePrompts: [],
        youtubeVideos,
      });
    }

    return {
      learningOutcomes: [],
      chapters: chapters.map((chapter) => ({
        ...chapter,
        youtubeVideos: [],
      })),
      aiModel: null,
    };
  }

  private normalizeInterviewPrepCourseChapters(
    value: unknown,
    includeVideoRecommendations: boolean,
  ): InterviewPrepCourseChapter[] {
    if (!Array.isArray(value)) return [];

    const normalized: InterviewPrepCourseChapter[] = [];

    for (const chapterItem of value) {
      if (!chapterItem || typeof chapterItem !== 'object') continue;
      const chapter = chapterItem as Record<string, unknown>;

      const title = this.sanitizeSuggestionText(chapter.title, 180);
      if (!title) continue;

      const overview = this.sanitizeSuggestionText(chapter.overview, 1500) ?? null;

      const estimatedMinutesRaw =
        typeof chapter.estimatedMinutes === 'number' && Number.isFinite(chapter.estimatedMinutes)
          ? chapter.estimatedMinutes
          : 30;
      const estimatedMinutes = Math.min(
        240,
        Math.max(5, Math.round(estimatedMinutesRaw)),
      );

      const sections: InterviewPrepCourseChapterSection[] = Array.isArray(
        chapter.sections,
      )
        ? chapter.sections
            .map((sectionItem) => {
              if (!sectionItem || typeof sectionItem !== 'object') return null;
              const section = sectionItem as Record<string, unknown>;
              const heading = this.sanitizeSuggestionText(section.heading, 180);
              if (!heading) return null;
              return {
                heading,
                subheadings: this.toStringArrayWithLimit(
                  section.subheadings,
                  220,
                ).slice(0, 6),
                summary: this.sanitizeSuggestionText(section.summary, 1200) ?? null,
                content: this.toStringArrayWithLimit(section.content, 1400).slice(
                  0,
                  5,
                ),
              };
            })
            .filter(
              (
                section,
              ): section is InterviewPrepCourseChapterSection => Boolean(section),
            )
            .slice(0, 6)
        : [];

      const learningObjectives = this.toStringArrayWithLimit(
        chapter.learningObjectives,
        320,
      ).slice(0, 8);

      const coreConcepts: InterviewPrepCourseCoreConcept[] = Array.isArray(
        chapter.coreConcepts,
      )
        ? chapter.coreConcepts
            .map((conceptItem) => {
              if (!conceptItem || typeof conceptItem !== 'object') return null;
              const conceptSource = conceptItem as Record<string, unknown>;
              const concept = this.sanitizeSuggestionText(conceptSource.concept, 200);
              if (!concept) return null;

              return {
                concept,
                theory:
                  this.sanitizeSuggestionText(conceptSource.theory, 2600) ?? null,
                explanation:
                  this.sanitizeSuggestionText(conceptSource.explanation, 2600) ??
                  null,
                interviewApplication:
                  this.sanitizeSuggestionText(
                    conceptSource.interviewApplication,
                    1600,
                  ) ?? null,
              };
            })
            .filter(
              (concept): concept is InterviewPrepCourseCoreConcept =>
                Boolean(concept),
            )
            .slice(0, 8)
        : [];

      const interviewQuestions: InterviewPrepCourseInterviewQuestion[] = Array.isArray(
        chapter.interviewQuestions,
      )
        ? chapter.interviewQuestions
            .map((questionItem) => {
              if (!questionItem || typeof questionItem !== 'object') return null;
              const source = questionItem as Record<string, unknown>;
              const question = this.sanitizeSuggestionText(source.question, 500);
              if (!question) return null;

              return {
                question,
                whyAsked: this.sanitizeSuggestionText(source.whyAsked, 1600) ?? null,
                answerFramework:
                  this.sanitizeSuggestionText(source.answerFramework, 2200) ?? null,
                sampleAnswer:
                  this.sanitizeSuggestionText(source.sampleAnswer, 4200) ?? null,
              };
            })
            .filter(
              (
                question,
              ): question is InterviewPrepCourseInterviewQuestion =>
                Boolean(question),
            )
            .slice(0, 8)
        : [];

      const practicePrompts = this.toStringArrayWithLimit(
        chapter.practicePrompts,
        320,
      ).slice(0, 8);

      const directMaterial = this.toStringArrayWithLimit(chapter.material, 1800).slice(
        0,
        8,
      );

      const youtubeVideos: InterviewPrepCourseChapterVideo[] =
        includeVideoRecommendations
        ? Array.isArray(chapter.youtubeVideos)
          ? chapter.youtubeVideos
              .map((videoItem) => {
                if (!videoItem || typeof videoItem !== 'object') return null;
                const video = videoItem as Record<string, unknown>;
                const videoTitle =
                  this.sanitizeSuggestionText(video.title, 180) ??
                  `Interview prep video for ${title}`;
                const normalizedUrl = this.normalizeYoutubeUrl(
                  this.sanitizeSuggestionText(video.youtubeUrl),
                );

                if (!normalizedUrl) return null;

                return {
                  title: videoTitle,
                  youtubeUrl: normalizedUrl,
                  reason: this.sanitizeSuggestionText(video.reason, 400) ?? null,
                };
              })
              .filter(
                (
                  video,
                ): video is InterviewPrepCourseChapterVideo => Boolean(video),
              )
              .slice(0, 3)
          : []
        : [];

      const normalizedMaterial = this.buildChapterMaterialFromExistingData({
        title,
        overview,
        directMaterial,
        sections,
        coreConcepts,
        interviewQuestions,
      });

      normalized.push({
        title,
        overview,
        estimatedMinutes,
        material: normalizedMaterial,
        sections,
        learningObjectives: learningObjectives,
        coreConcepts: coreConcepts,
        interviewQuestions:
          interviewQuestions.length > 0
            ? interviewQuestions
            : [
                {
                  question: `How would you explain ${title} to a hiring panel?`,
                  whyAsked:
                    'Assesses conceptual clarity and structured communication.',
                  answerFramework:
                    'Definition -> importance -> practical example -> trade-offs.',
                  sampleAnswer:
                    'I would start by defining the concept, then explain where it matters in production systems, followed by a project example and the trade-offs that influenced my decisions.',
                },
              ],
        practicePrompts: practicePrompts,
        youtubeVideos,
      });
    }

    return normalized;
  }

  private async ensureLegitYoutubeRecommendations(
    chapters: InterviewPrepCourseChapter[],
    context: {
      includeVideoRecommendations: boolean;
      category: string;
      targetRoles: string[];
    },
  ): Promise<InterviewPrepCourseChapter[]> {
    if (!context.includeVideoRecommendations) {
      return chapters.map((chapter) => ({
        ...chapter,
        youtubeVideos: [],
      }));
    }

    const roleFocus = context.targetRoles[0] ?? context.category;
    const enrichedChapters = await Promise.all(
      chapters.map(async (chapter) => {
        const verifiedVideos = (
          await Promise.all(
            (chapter.youtubeVideos ?? []).slice(0, 3).map(async (video) => {
              const canonicalUrl = this.normalizeYoutubeUrl(video.youtubeUrl);
              if (!canonicalUrl) return null;
              const isValid = await this.verifyYoutubeUrlExists(canonicalUrl);
              if (!isValid) return null;

              return {
                title:
                  this.sanitizeSuggestionText(video.title, 180) ??
                  'Interview preparation video',
                youtubeUrl: canonicalUrl,
                reason: this.sanitizeSuggestionText(video.reason, 400) ?? null,
              };
            }),
          )
        ).filter(
          (
            video,
          ): video is InterviewPrepCourseChapterVideo => Boolean(video),
        );

        if (verifiedVideos.length >= 2) {
          return {
            ...chapter,
            youtubeVideos: verifiedVideos.slice(0, 3),
          };
        }

        const searchQuery = `${chapter.title} ${roleFocus} interview preparation`;
        const youtubeApiVideos = await this.searchYoutubeVideos(searchQuery, 3);

        const fallbackMerged = [
          ...verifiedVideos,
          ...youtubeApiVideos.filter(
            (candidate) =>
              !verifiedVideos.some((item) => item.youtubeUrl === candidate.youtubeUrl),
          ),
        ].slice(0, 3);

        return {
          ...chapter,
          youtubeVideos: fallbackMerged,
        };
      }),
    );

    return enrichedChapters;
  }

  private normalizeYoutubeUrl(url: string | undefined) {
    const trimmed = url?.trim();
    if (!trimmed) return null;

    const videoId = this.extractYoutubeVideoId(trimmed);
    if (!videoId) return null;
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  private extractYoutubeVideoId(url: string) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('youtu.be')) {
        const id = parsed.pathname.replace('/', '').trim();
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }

      if (host.includes('youtube.com')) {
        const fromQuery = parsed.searchParams.get('v')?.trim();
        if (fromQuery && /^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) {
          return fromQuery;
        }

        const segments = parsed.pathname.split('/').filter(Boolean);
        const isShorts = segments[0] === 'shorts' && segments[1];
        const isEmbed = segments[0] === 'embed' && segments[1];
        const candidate = isShorts ? segments[1] : isEmbed ? segments[1] : null;
        if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
          return candidate;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private async verifyYoutubeUrlExists(url: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: controller.signal },
      );
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async searchYoutubeVideos(query: string, maxResults = 3) {
    if (!this.youtubeApiKey) return [];

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('q', query);
      url.searchParams.set('maxResults', String(Math.max(1, Math.min(5, maxResults))));
      url.searchParams.set('videoEmbeddable', 'true');
      url.searchParams.set('safeSearch', 'moderate');
      url.searchParams.set('key', this.youtubeApiKey);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      let response: Response;
      try {
        response = await fetch(url.toString(), { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) return [];

      const payload = (await response.json()) as {
        items?: Array<{
          id?: { videoId?: string };
          snippet?: { title?: string; channelTitle?: string };
        }>;
      };

      const videos: InterviewPrepCourseChapterVideo[] = [];
      for (const item of payload.items ?? []) {
        const videoId = item.id?.videoId?.trim();
        if (!videoId) continue;

        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const isValid = await this.verifyYoutubeUrlExists(youtubeUrl);
        if (!isValid) continue;

        videos.push({
          title:
            this.sanitizeSuggestionText(item.snippet?.title, 180) ??
            'Interview preparation video',
          youtubeUrl,
          reason: item.snippet?.channelTitle
            ? this.sanitizeSuggestionText(
                `Recommended from ${item.snippet.channelTitle}`,
                400,
              ) ?? 'Recommended by trusted channel.'
            : 'Recommended based on chapter topic relevance.',
        });
      }

      return videos.slice(0, maxResults);
    } catch {
      return [];
    }
  }
}



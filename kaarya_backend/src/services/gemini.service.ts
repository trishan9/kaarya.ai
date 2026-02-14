import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
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

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private static readonly MODEL_CACHE_TTL_MS = 10 * 60 * 1000;
  private readonly apiKey: string;
  private readonly openAIApiKey: string;
  private readonly openAIModel: string;
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

  private sanitizeSuggestionText(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized || undefined;
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
  ): Promise<string | null> {
    if (!this.openAIApiKey) return null;

    const openAI = createOpenAI({ apiKey: this.openAIApiKey });

    const result = await generateText({
      model: openAI(this.openAIModel),
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
}



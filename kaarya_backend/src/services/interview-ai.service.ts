import { HttpStatus, Injectable } from '@nestjs/common';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import z from 'zod';
import { ApiError } from 'src/common/errors/api-error';
import { InterviewType } from 'src/types/interview-type.enum';

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

const FEEDBACK_CATEGORY_NAMES = [
  'Communication Skills',
  'Technical Knowledge',
  'Problem Solving',
  'Role Fit',
  'Confidence and Clarity',
] as const;

const generatedQuestionsSchema = z.object({
  questions: z.array(z.string().trim().min(8)).min(1).max(20),
});

const feedbackSchema = z.object({
  totalScore: z.number().min(0).max(100),
  categoryScores: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        score: z.number().min(0).max(100),
        comment: z.string().trim().min(8),
      }),
    )
    .min(5)
    .max(8),
  strengths: z.array(z.string().trim().min(2)).min(1).max(8),
  areasForImprovement: z.array(z.string().trim().min(2)).min(1).max(8),
  finalAssessment: z.string().trim().min(20),
});

type TGenerateInterviewQuestionsInput = {
  title: string;
  role: string;
  interviewType: InterviewType;
  level?: string | null;
  techStack: string[];
  questionCount: number;
  instructions?: string | null;
};

type TEvaluateInterviewInput = {
  interviewTitle: string;
  role: string;
  interviewType: InterviewType;
  level?: string | null;
  transcript: Array<{
    role: 'assistant' | 'user' | 'system';
    content: string;
  }>;
};

@Injectable()
export class InterviewAIService {
  private resolveModelName() {
    return (
      process.env.INTERVIEW_AI_MODEL?.trim() ||
      process.env.OPENAI_INTERVIEW_MODEL?.trim() ||
      DEFAULT_OPENAI_MODEL
    );
  }

  private getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          'OPENAI_API_KEY is missing. Configure OpenAI key before generating interview content.',
      });
    }

    return createOpenAI({ apiKey });
  }

  private normalizeCategoryName(name: string) {
    const normalized = name.toLowerCase().trim();

    if (normalized.includes('communication')) {
      return 'Communication Skills';
    }
    if (normalized.includes('technical')) {
      return 'Technical Knowledge';
    }
    if (normalized.includes('problem')) {
      return 'Problem Solving';
    }
    if (normalized.includes('role') || normalized.includes('fit')) {
      return 'Role Fit';
    }
    if (normalized.includes('confidence') || normalized.includes('clarity')) {
      return 'Confidence and Clarity';
    }

    return null;
  }

  private normalizeCategoryScores(
    categoryScores: Array<{
      name: string;
      score: number;
      comment: string;
    }>,
    fallbackScore: number,
  ) {
    const byName = new Map<
      string,
      {
        name: string;
        score: number;
        comment: string;
      }
    >();

    categoryScores.forEach((category) => {
      const normalizedName = this.normalizeCategoryName(category.name);
      if (!normalizedName || byName.has(normalizedName)) return;

      byName.set(normalizedName, {
        name: normalizedName,
        score: Math.min(100, Math.max(0, Math.round(category.score))),
        comment: category.comment.trim(),
      });
    });

    return FEEDBACK_CATEGORY_NAMES.map((categoryName) => {
      const existing = byName.get(categoryName);
      if (existing) {
        return existing;
      }

      return {
        name: categoryName,
        score: Math.min(100, Math.max(0, Math.round(fallbackScore))),
        comment:
          'Limited evidence in transcript. Provide more specific examples in answers for stronger evaluation.',
      };
    });
  }

  private resolveAIErrorMessage(error: unknown, fallback: string) {
    if (!error) return fallback;

    const rawMessage =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return '';
              }
            })();
    const message = rawMessage?.trim() || fallback;
    const normalized = message.toLowerCase();

    if (
      normalized.includes('api key') ||
      normalized.includes('permission denied') ||
      normalized.includes('unauthorized') ||
      normalized.includes('incorrect api key')
    ) {
      return `${fallback} Invalid or unauthorized OpenAI API key.`;
    }

    if (
      normalized.includes('quota') ||
      normalized.includes('rate limit') ||
      normalized.includes('429')
    ) {
      return `${fallback} OpenAI quota or rate limit reached.`;
    }

    if (normalized.includes('model') && normalized.includes('not found')) {
      return `${fallback} Configured OpenAI model is unavailable.`;
    }

    return `${fallback} ${message}`;
  }

  async generateInterviewQuestions(input: TGenerateInterviewQuestionsInput) {
    const openai = this.getOpenAIClient();
    const modelName = this.resolveModelName();
    const normalizedTechStack = input.techStack
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const { object } = await generateObject({
        model: openai(modelName),
        schema: generatedQuestionsSchema,
        temperature: 0.4,
        prompt: `
You are creating interview questions for an AI voice mock interview.

Interview title: ${input.title}
Role focus: ${input.role}
Interview style: ${input.interviewType}
Experience level: ${input.level ?? 'not specified'}
Tech stack: ${normalizedTechStack.length ? normalizedTechStack.join(', ') : 'not specified'}
Question count: ${input.questionCount}
Special instructions: ${input.instructions ?? 'none'}

Return exactly ${input.questionCount} questions.
Questions must be spoken naturally by a voice assistant.
Do not include markdown, numbering, or special formatting.
Keep each question concise and clear.
Mix conceptual, practical, and reflective prompts based on the interview style.
Avoid duplicate questions.
`.trim(),
        system:
          'You are an expert recruiter creating concise, high-quality voice interview questions.',
      });

      return object.questions
        .map((question) => question.trim())
        .filter(Boolean)
        .slice(0, input.questionCount);
    } catch (error) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.resolveAIErrorMessage(
          error,
          'Failed to generate interview questions with OpenAI.',
        ),
      });
    }
  }

  async evaluateInterview(input: TEvaluateInterviewInput) {
    const openai = this.getOpenAIClient();
    const modelName = this.resolveModelName();

    const normalizedTranscript = input.transcript
      .map((message) => ({
        role: message.role,
        content: message.content.trim().replace(/\s+/g, ' '),
      }))
      .filter((message) => message.content.length > 0);

    const transcript = normalizedTranscript
      .map((message, index) => `${index + 1}. [${message.role}] ${message.content}`)
      .join('\n');
    const userTurnCount = normalizedTranscript.filter(
      (message) => message.role === 'user',
    ).length;
    const normalizedLevel = input.level?.trim() || 'not specified';
    const levelLower = normalizedLevel.toLowerCase();
    const levelRubric = levelLower.includes('intern') || levelLower.includes('entry')
      ? 'Entry/Intern: Expect fundamentals, learning ability, and clear basic reasoning. Do not penalize lack of advanced architecture depth.'
      : levelLower.includes('senior') || levelLower.includes('lead') || levelLower.includes('staff')
        ? 'Senior/Lead: Expect deep technical judgment, trade-off thinking, ownership mindset, and concrete leadership evidence. Be strict about vague answers.'
        : 'Mid-level: Expect strong practical execution, structured problem-solving, and moderate ownership. Balance fundamentals with applied depth.';

    try {
      const { object } = await generateObject({
        model: openai(modelName),
        schema: feedbackSchema,
        temperature: 0.2,
        prompt: `
You are evaluating a mock interview transcript.

Interview title: ${input.interviewTitle}
Role focus: ${input.role}
Interview style: ${input.interviewType}
Target level: ${normalizedLevel}
Level rubric: ${levelRubric}

Transcript:
${transcript || '(empty transcript)'}

Score the candidate from 0 to 100 and provide category-level evaluation.
Use exactly these category names:
${FEEDBACK_CATEGORY_NAMES.map((name) => `- ${name}`).join('\n')}

Each category comment must:
- Be 1-2 sentences.
- Reference observable evidence from transcript.
- Include one clear improvement action.

Candidate user-turn count: ${userTurnCount}

Be direct, evidence-based, and constructive.
Do not be lenient.
Adjust the score expectation to the stated target level. Do not grade intern and senior candidates using identical standards.
`.trim(),
        system:
          'You are a strict but fair interview evaluator. Return practical hiring-style feedback with clear strengths and improvement plan.',
      });

      const totalScore = Math.min(100, Math.max(0, Math.round(object.totalScore)));
      const categoryScores = this.normalizeCategoryScores(
        object.categoryScores,
        totalScore,
      );

      return {
        totalScore,
        categoryScores,
        strengths: object.strengths.map((strength) => strength.trim()).filter(Boolean),
        areasForImprovement: object.areasForImprovement
          .map((item) => item.trim())
          .filter(Boolean),
        finalAssessment: object.finalAssessment.trim(),
        model: modelName,
      };
    } catch (error) {
      throw new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.resolveAIErrorMessage(
          error,
          'Failed to evaluate interview with OpenAI.',
        ),
      });
    }
  }
}

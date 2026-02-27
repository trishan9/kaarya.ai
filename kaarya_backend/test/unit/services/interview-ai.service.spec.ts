import { ApiError } from 'src/common/errors/api-error';
import { InterviewAIService } from 'src/services/interview-ai.service';
import { InterviewType } from 'src/types/interview-type.enum';

jest.mock('ai', () => ({
  generateObject: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(),
}));

import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

describe('InterviewAIService', () => {
  let service: InterviewAIService;
  let openAIModelFactory: jest.Mock;

  beforeEach(() => {
    service = new InterviewAIService();
    openAIModelFactory = jest.fn().mockReturnValue('openai-model');
    (createOpenAI as jest.Mock).mockReturnValue(openAIModelFactory);
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.INTERVIEW_AI_MODEL;
    delete process.env.OPENAI_INTERVIEW_MODEL;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.INTERVIEW_AI_MODEL;
    delete process.env.OPENAI_INTERVIEW_MODEL;
    jest.clearAllMocks();
  });

  it('should generate interview questions with trimming and max count', async () => {
    (generateObject as jest.Mock).mockResolvedValue({
      object: {
        questions: ['  What is Node.js?  ', 'Explain CAP theorem', ''],
      },
    });

    const result = await service.generateInterviewQuestions({
      title: 'Backend Mock',
      role: 'Backend Engineer',
      interviewType: InterviewType.TECHNICAL,
      level: 'Mid',
      techStack: [' Node.js ', ' TypeScript '],
      questionCount: 2,
      instructions: 'Keep it concise',
    });

    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: 'test-key' });
    expect(openAIModelFactory).toHaveBeenCalledWith('gpt-4o-mini');
    expect(result).toEqual(['What is Node.js?', 'Explain CAP theorem']);
  });

  it('should throw if api key is missing', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      service.generateInterviewQuestions({
        title: 'Backend Mock',
        role: 'Backend Engineer',
        interviewType: InterviewType.TECHNICAL,
        techStack: [],
        questionCount: 2,
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should map generate question errors to informative api errors', async () => {
    (generateObject as jest.Mock).mockRejectedValueOnce(
      new Error('incorrect api key provided'),
    );
    await expect(
      service.generateInterviewQuestions({
        title: 'Backend Mock',
        role: 'Backend Engineer',
        interviewType: InterviewType.TECHNICAL,
        techStack: [],
        questionCount: 2,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('Invalid or unauthorized OpenAI API key'),
    });

    (generateObject as jest.Mock).mockRejectedValueOnce(new Error('429 quota exceeded'));
    await expect(
      service.generateInterviewQuestions({
        title: 'Backend Mock',
        role: 'Backend Engineer',
        interviewType: InterviewType.TECHNICAL,
        techStack: [],
        questionCount: 2,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('quota or rate limit'),
    });

    (generateObject as jest.Mock).mockRejectedValueOnce(
      new Error('model not found'),
    );
    await expect(
      service.generateInterviewQuestions({
        title: 'Backend Mock',
        role: 'Backend Engineer',
        interviewType: InterviewType.TECHNICAL,
        techStack: [],
        questionCount: 2,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('model is unavailable'),
    });
  });

  it('should evaluate interview transcript and normalize category names', async () => {
    process.env.INTERVIEW_AI_MODEL = 'gpt-test-model';
    (generateObject as jest.Mock).mockResolvedValue({
      object: {
        totalScore: 81.6,
        categoryScores: [
          { name: 'communication', score: 80.2, comment: 'Good clarity in answers' },
          { name: 'technical depth', score: 85.4, comment: 'Strong concepts' },
          { name: 'problem solving', score: 77.2, comment: 'Good structure' },
          { name: 'role fit', score: 79.7, comment: 'Relevant examples' },
          { name: 'unknown', score: 50, comment: 'Unknown category' },
        ],
        strengths: [' Strong communication ', 'Good depth'],
        areasForImprovement: ['Give more metrics', 'Reduce filler'],
        finalAssessment: '  Strong candidate with room to improve precision.  ',
      },
    });

    const result = await service.evaluateInterview({
      interviewTitle: 'Backend Mock',
      role: 'Backend Engineer',
      interviewType: InterviewType.TECHNICAL,
      level: 'senior',
      transcript: [
        { role: 'assistant', content: 'Tell me about APIs' },
        { role: 'user', content: '  I built APIs at scale. ' },
      ],
    });

    expect(openAIModelFactory).toHaveBeenCalledWith('gpt-test-model');
    expect(result.totalScore).toBe(82);
    expect(result.categoryScores).toHaveLength(5);
    expect(result.categoryScores.map((item) => item.name)).toEqual([
      'Communication Skills',
      'Technical Knowledge',
      'Problem Solving',
      'Role Fit',
      'Confidence and Clarity',
    ]);
    expect(result.strengths).toEqual(['Strong communication', 'Good depth']);
    expect(result.finalAssessment).toBe(
      'Strong candidate with room to improve precision.',
    );
    expect(result.model).toBe('gpt-test-model');
  });

  it('should map evaluation failures to api errors', async () => {
    (generateObject as jest.Mock).mockRejectedValueOnce('unauthorized');

    await expect(
      service.evaluateInterview({
        interviewTitle: 'Backend Mock',
        role: 'Backend Engineer',
        interviewType: InterviewType.TECHNICAL,
        transcript: [{ role: 'user', content: 'hello' }],
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('Invalid or unauthorized OpenAI API key'),
    });
  });
});


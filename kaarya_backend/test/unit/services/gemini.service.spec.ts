jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(),
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenAI } from '@ai-sdk/openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateText } from 'ai';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import {
  GeminiService,
  InterviewPrepCourseChapter,
} from 'src/services/gemini.service';
import { ResourceCourseGenerationMode } from 'src/types/resource-course-generation-mode.enum';

describe('GeminiService', () => {
  let service: GeminiService;
  let configService: jest.Mocked<ConfigService>;
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  const createService = (
    overrides?: Partial<{
      apiKey: string;
      model: string;
      fallbackModels: string[];
    }>,
  ) => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === CONFIG_KEYS.GEMINI.API_KEY) {
          return overrides?.apiKey;
        }
        if (key === CONFIG_KEYS.GEMINI.MODEL) {
          return overrides?.model ?? 'gemini-custom-model';
        }
        if (key === CONFIG_KEYS.GEMINI.FALLBACK_MODELS) {
          return overrides?.fallbackModels ?? ['gemini-fallback-1'];
        }
        return undefined;
      }),
    } as never;

    service = new GeminiService(configService as never);
    return service;
  };

  const words = (count: number) =>
    Array.from({ length: count }, (_, i) => `token${i + 1}`).join(' ');

  const buildStrongChapter = (
    title = 'Chapter 1',
  ): InterviewPrepCourseChapter => ({
    title,
    overview: 'Strong chapter overview',
    estimatedMinutes: 35,
    material: [
      words(80),
      words(85),
      words(90),
      words(95),
    ],
    sections: [],
    learningObjectives: [],
    coreConcepts: [],
    interviewQuestions: [
      {
        question: 'Question 1?',
        whyAsked: 'Why 1',
        answerFramework: 'Framework 1',
        sampleAnswer: words(50),
      },
      {
        question: 'Question 2?',
        whyAsked: 'Why 2',
        answerFramework: 'Framework 2',
        sampleAnswer: words(55),
      },
      {
        question: 'Question 3?',
        whyAsked: 'Why 3',
        answerFramework: 'Framework 3',
        sampleAnswer: words(60),
      },
    ],
    practicePrompts: [],
    youtubeVideos: [],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'gemini-key',
      GEMINI_FALLBACK_MODELS: 'gemini-fallback-env-a, gemini-fallback-env-b',
      OPENAI_API_KEY: 'openai-key',
      RESUME_OPENAI_MODEL: 'gpt-4o-mini',
      RESOURCE_COURSE_OPENAI_MODEL: 'gpt-4o',
      RESUME_AI_PROVIDER: '',
      YOUTUBE_API_KEY: 'yt-key',
      API_PREFIX: 'api',
    };

    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn(),
    }));

    (createOpenAI as unknown as jest.Mock).mockImplementation(
      () => (modelName: string) => `openai-model:${modelName}`,
    );

    (generateText as unknown as jest.Mock).mockResolvedValue({
      text: ' default generated text ',
    });

    global.fetch = jest.fn() as never;

    createService();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  const expectApiError = (
    error: unknown,
    status: HttpStatus,
    messageIncludes?: string,
  ) => {
    const apiError = error as ApiError;
    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.getStatus()).toBe(status);
    if (messageIncludes) {
      expect(JSON.stringify(apiError.getResponse())).toContain(messageIncludes);
    }
  };

  it('should parse and sanitize model helpers', () => {
    expect((service as any).parseModelList(undefined)).toEqual([]);
    expect((service as any).parseModelList('a, b, ,c')).toEqual(['a', 'b', 'c']);
    expect((service as any).getErrorMessage({ message: 'boom' })).toBe('boom');
    expect((service as any).getErrorMessage('x')).toBe('AI service error');
    expect((service as any).shouldTryNextModel('quota exceeded')).toBe(false);
    expect((service as any).shouldTryNextModel('request timed out')).toBe(true);
  });

  it('should clean JSON wrappers and extract JSON candidate', () => {
    const wrapped = '```json\n{"a":1}\n```';
    expect((service as any).cleanJsonText(wrapped)).toBe('{"a":1}');
    expect((service as any).extractFirstJsonObject('x {"a":1} y')).toBe(
      '{"a":1}',
    );
    expect((service as any).extractFirstJsonObject('missing braces')).toBeNull();
  });

  it('should sanitize bullet lines and string arrays', () => {
    expect((service as any).sanitizeBulletLine('- First point')).toBe(
      'First point',
    );
    expect((service as any).toStringArray([' one ', 1, '* two'])).toEqual([
      'one',
      'two',
    ]);
    expect((service as any).toStringArray('not-array')).toEqual([]);
    expect(
      (service as any).sanitizeSuggestionText('  summary text  ', 7),
    ).toBe('summary');
    expect((service as any).sanitizeSuggestionText('   ')).toBeUndefined();
    expect((service as any).toStringArrayWithLimit([' abc  ', 'def'], 3)).toEqual([
      'abc',
      'def',
    ]);
  });

  it('should honor promise timeout helper', async () => {
    await expect(
      (service as any).withTimeout(Promise.resolve('ok'), 5, 'timeout'),
    ).resolves.toBe('ok');

    jest.useFakeTimers();
    const pending = new Promise<string>(() => undefined);
    const timed = (service as any).withTimeout(pending, 10, 'timed-out');
    jest.advanceTimersByTime(20);
    await expect(timed).rejects.toThrow('timed-out');
    jest.useRealTimers();
  });

  it('should detect generic/meta paragraphs and weak content', () => {
    expect((service as any).isMetaLearningParagraph('You should practice this')).toBe(
      true,
    );
    expect(
      (service as any).isGenericCourseMaterialParagraph(
        'This chapter should explain the concept',
      ),
    ).toBe(true);
    expect(
      (service as any).isGenericInterviewAnswer(
        'In practice, I first clarify and compare at least two options',
      ),
    ).toBe(true);
    expect((service as any).ensureSentence('Ends without period')).toBe(
      'Ends without period.',
    );
    expect((service as any).ensureSentence('Already complete.')).toBe(
      'Already complete.',
    );

    const weakChapters = [
      {
        ...buildStrongChapter('Weak chapter'),
        material: ['thin'],
      },
    ];
    expect(
      (service as any).hasWeakCourseMaterial(
        weakChapters,
        ResourceCourseGenerationMode.LEARN,
      ),
    ).toBe(true);
    expect(
      (service as any).hasWeakInterviewAnswers(
        [
          {
            ...buildStrongChapter('Answers weak'),
            interviewQuestions: [{ question: 'Q', sampleAnswer: 'short' }],
          },
        ],
        ResourceCourseGenerationMode.INTERVIEW_PREP,
      ),
    ).toBe(true);
  });

  it('should build chapter material from existing data with fallback', () => {
    const chapterMaterial = (service as any).buildChapterMaterialFromExistingData({
      title: 'Transformers',
      overview: null,
      directMaterial: ['Detailed mechanism explanation with enough specifics.'],
      sections: [
        {
          heading: 'H1',
          subheadings: [],
          summary: null,
          content: ['A concrete section paragraph with technical detail.'],
        },
      ],
      coreConcepts: [
        {
          concept: 'Attention',
          theory: 'Maps query and key similarity to weights',
          explanation: null,
          interviewApplication: 'Explains context integration in responses',
        },
      ],
      interviewQuestions: [],
    });
    expect(chapterMaterial.length).toBeGreaterThan(0);

    const fallbackMaterial = (service as any).buildChapterMaterialFromExistingData({
      title: 'Fallback Title',
      overview: null,
      directMaterial: ['this chapter should explain'],
      sections: [],
      coreConcepts: [],
      interviewQuestions: [],
    });
    expect(fallbackMaterial[0]).toContain('Fallback Title starts with first principles');
  });

  it('should normalize ATS categories and not-resume output', () => {
    expect((service as any).clampScore(120)).toBe(100);
    expect((service as any).clampScore(-2)).toBe(0);

    const tips = (service as any).normalizeAtsTips([
      { type: 'GOOD', tip: 'Strong keywords', explanation: 'Great mapping' },
      { type: 'improve', tip: '  Add metrics  ' },
      null,
    ]);
    expect(tips).toEqual([
      { type: 'good', tip: 'Strong keywords', explanation: 'Great mapping' },
      { type: 'improve', tip: 'Add metrics' },
    ]);

    const category = (service as any).normalizeAtsCategory(
      {},
      'Fallback tip',
      'good',
    );
    expect(category.tips[0]).toEqual(
      expect.objectContaining({ type: 'good', tip: 'Fallback tip' }),
    );

    const notResume = (service as any).normalizeAtsScanResult({
      documentType: 'not resume',
      classificationReason: 'Not a resume file',
    });
    expect(notResume.documentType).toBe('not_resume');
    expect(notResume.overallScore).toBe(0);

    const resume = (service as any).normalizeAtsScanResult({
      documentType: 'resume',
      overallScore: 88,
      ATS: { score: 85, tips: [{ type: 'good', tip: 'Strong ATS' }] },
      toneAndStyle: { score: 70, tips: [{ type: 'improve', tip: 'Tone' }] },
      content: { score: 65, tips: [{ type: 'improve', tip: 'Content' }] },
      structure: { score: 75, tips: [{ type: 'good', tip: 'Structure' }] },
      skills: { score: 80, tips: [{ type: 'good', tip: 'Skills' }] },
    });
    expect(resume.documentType).toBe('resume');
    expect(resume.overallScore).toBe(88);
  });

  it('should parse bullets from multiple AI response shapes', () => {
    expect(
      (service as any).parseBulletsFromText(
        '{"bullets":["- Built APIs","* Improved latency"]}',
      ),
    ).toEqual(['Built APIs', 'Improved latency']);

    expect(
      (service as any).parseBulletsFromText(
        '{"bulletPoints":["First point","Second point"]}',
      ),
    ).toEqual(['First point', 'Second point']);

    expect(
      (service as any).parseBulletsFromText('bullets: ["X", "Y"]'),
    ).toEqual(['X', 'Y']);

    expect(
      (service as any).parseBulletsFromText('- One plain line\n- Two plain line'),
    ).toEqual(['One plain line', 'Two plain line']);
  });

  it('should generate text with fallback ordering', async () => {
    const openAISpy = jest.spyOn(service as any, 'generateTextWithOpenAI');
    const geminiSpy = jest.spyOn(service as any, 'generateTextWithGemini');

    openAISpy.mockResolvedValueOnce('from-openai');
    geminiSpy.mockResolvedValue('from-gemini');
    (service as any).preferOpenAI = true;
    await expect(
      (service as any).generateTextWithModelFallback('prompt', {}),
    ).resolves.toBe('from-openai');

    openAISpy.mockReset();
    geminiSpy.mockReset();
    openAISpy.mockRejectedValueOnce(new Error('openai down')).mockResolvedValueOnce(
      'openai-second',
    );
    geminiSpy.mockResolvedValueOnce('gemini-win');
    (service as any).preferOpenAI = true;
    await expect(
      (service as any).generateTextWithModelFallback('prompt', {}),
    ).resolves.toBe('gemini-win');

    openAISpy.mockReset();
    geminiSpy.mockReset();
    openAISpy.mockRejectedValue(new Error('openai fail'));
    geminiSpy.mockRejectedValue(new Error('gemini fail'));
    await expect(
      (service as any).generateTextWithModelFallback('prompt', {}),
    ).rejects.toThrow('openai fail');
  });

  it('should prioritize openai for course generation and fallback to gemini', async () => {
    const openAISpy = jest.spyOn(service as any, 'generateTextWithOpenAI');
    const geminiSpy = jest.spyOn(service as any, 'generateTextWithGemini');

    openAISpy.mockResolvedValueOnce('course-openai');
    await expect(
      (service as any).generateCourseTextWithOpenAIPriority('prompt', {}),
    ).resolves.toBe('course-openai');

    openAISpy.mockReset();
    geminiSpy.mockReset();
    openAISpy.mockRejectedValueOnce(new Error('openai course fail'));
    geminiSpy.mockResolvedValueOnce('course-gemini');
    await expect(
      (service as any).generateCourseTextWithOpenAIPriority('prompt', {}),
    ).resolves.toBe('course-gemini');
  });

  it('should call OpenAI SDK and trim generated text', async () => {
    await expect(
      (service as any).generateTextWithOpenAI('hello', {
        temperature: 0.4,
        maxOutputTokens: 100,
      }),
    ).resolves.toBe('default generated text');

    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: 'openai-key' });
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'hello',
        temperature: 0.4,
        maxOutputTokens: 100,
      }),
    );
  });

  it('should return null when OpenAI key is missing', async () => {
    process.env.OPENAI_API_KEY = '';
    createService();
    await expect(
      (service as any).generateTextWithOpenAI('hello', {}),
    ).resolves.toBeNull();
  });

  it('should fetch, cache, and resolve available gemini model names', async () => {
    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [
          { name: 'models/gemini-2.5-flash' },
          { name: 'models/gemini-2.0-flash' },
        ],
      }),
    });

    const first = await (service as any).getAvailableModelNames();
    expect(first).toBeInstanceOf(Set);
    expect(Array.from(first as Set<string>)).toContain('gemini-2.5-flash');
    const second = await (service as any).getAvailableModelNames();
    expect(second).toBe(first);
  });

  it('should resolve candidate models using discovered names', () => {
    const resolved = (service as any).resolveModelCandidates(
      new Set(['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-tts']),
    );
    expect(resolved).toContain('gemini-2.5-flash');
    expect(resolved).toContain('gemini-2.0-flash-lite');
    expect(resolved).not.toContain('gemini-tts');
  });

  it('should generate text with gemini and fallback to next model when retriable', async () => {
    const firstModel = { generateContent: jest.fn().mockRejectedValue(new Error('timeout')) };
    const secondModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => ' gemini-success ',
        },
      }),
    };
    const getGenerativeModel = jest
      .fn()
      .mockReturnValueOnce(firstModel)
      .mockReturnValueOnce(secondModel);

    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel,
    }));
    createService();
    jest.spyOn(service as any, 'getAvailableModelNames').mockResolvedValue(
      new Set(['gemini-custom-model', 'gemini-fallback-1']),
    );

    await expect(
      (service as any).generateTextWithGemini('prompt', {}),
    ).resolves.toBe('gemini-success');
    expect(getGenerativeModel).toHaveBeenCalledTimes(2);
  });

  it('should parse, repair and normalize interview prep chapters', async () => {
    const parsed = (service as any).parseInterviewPrepCourseChaptersFromText(
      '{"chapters":[{"title":"Chapter A","material":["valid material paragraph with depth and technical specifics"],"interviewQuestions":[{"question":"Q?","sampleAnswer":"'
        + words(30)
        + '"}]}]}',
      2,
      false,
    );
    expect(parsed.length).toBe(1);

    jest
      .spyOn(service as any, 'generateTextWithOpenAI')
      .mockResolvedValueOnce('{"chapters":[]}');
    await expect(
      (service as any).repairInterviewPrepCourseJson('broken-json', 2),
    ).resolves.toContain('"chapters"');
  });

  it('should normalize chapters and video recommendations', async () => {
    const normalized = (service as any).normalizeInterviewPrepCourseChapters(
      [
        {
          title: 'Intro',
          overview: 'Overview',
          estimatedMinutes: 12,
          material: ['detailed paragraph about architecture and trade-offs'],
          sections: [
            {
              heading: 'Section',
              subheadings: ['A'],
              summary: 'Summary',
              content: ['section content paragraph with enough detail'],
            },
          ],
          coreConcepts: [
            {
              concept: 'Concept',
              theory: 'Theory line',
              explanation: 'Explanation line',
              interviewApplication: 'Interview line',
            },
          ],
          interviewQuestions: [
            {
              question: 'Why this?',
              whyAsked: 'Reason',
              answerFramework: 'Framework',
              sampleAnswer: words(25),
            },
          ],
          practicePrompts: ['Prompt A'],
          youtubeVideos: [
            {
              title: 'Valid video',
              youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
              reason: 'Helpful',
            },
            {
              title: 'Invalid video',
              youtubeUrl: 'https://example.com/not-youtube',
            },
          ],
        },
      ],
      true,
    );

    expect(normalized[0].title).toBe('Intro');
    expect(normalized[0].youtubeVideos[0].youtubeUrl).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
  });

  it('should enrich youtube recommendations deterministically', async () => {
    const verifySpy = jest
      .spyOn(service as any, 'verifyYoutubeUrlExists')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const searchSpy = jest
      .spyOn(service as any, 'searchYoutubeVideos')
      .mockResolvedValueOnce([
        {
          title: 'Fallback video',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          reason: 'Recommended',
        },
      ]);

    const chapters = [
      {
        ...buildStrongChapter('Videos chapter'),
        youtubeVideos: [
          {
            title: 'Candidate 1',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            reason: 'A',
          },
          {
            title: 'Candidate 2',
            youtubeUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
            reason: 'B',
          },
        ],
      },
    ];

    const result = await (service as any).ensureLegitYoutubeRecommendations(
      chapters,
      {
        includeVideoRecommendations: true,
        category: 'AI',
        targetRoles: ['ML Engineer'],
      },
    );

    expect(verifySpy).toHaveBeenCalled();
    expect(searchSpy).toHaveBeenCalled();
    expect(result[0].youtubeVideos.length).toBeGreaterThan(0);
  });

  it('should normalize and validate youtube urls and ids', () => {
    expect((service as any).extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'dQw4w9WgXcQ',
    );
    expect(
      (service as any).extractYoutubeVideoId(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      ),
    ).toBe('dQw4w9WgXcQ');
    expect(
      (service as any).extractYoutubeVideoId(
        'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      ),
    ).toBe('dQw4w9WgXcQ');
    expect((service as any).normalizeYoutubeUrl('')).toBeNull();
    expect(
      (service as any).normalizeYoutubeUrl('https://youtu.be/dQw4w9WgXcQ'),
    ).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('should verify and search youtube urls through fetch responses', async () => {
    (global.fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'dQw4w9WgXcQ' },
              snippet: { title: 'Valid title', channelTitle: 'Channel A' },
            },
            {
              id: { videoId: '' },
              snippet: { title: 'Invalid title' },
            },
          ],
        }),
      });

    const exists = await (service as any).verifyYoutubeUrlExists(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );
    expect(exists).toBe(true);

    jest
      .spyOn(service as any, 'verifyYoutubeUrlExists')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const videos = await (service as any).searchYoutubeVideos('ai interview', 3);
    expect(videos).toEqual([
      {
        title: 'Valid title',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        reason: 'Recommended from Channel A',
      },
    ]);
  });

  it('should generate professional summary and map failures', async () => {
    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce(' Senior backend engineer summary. ');
    await expect(
      service.generateProfessionalSummary({
        targetRole: 'Backend Engineer',
        professionalSummary: 'old',
      }),
    ).resolves.toBe('Senior backend engineer summary.');

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce('   ');
    await expect(
      service.generateProfessionalSummary({ targetRole: 'Backend Engineer' }),
    ).rejects.toThrow(ApiError);

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockRejectedValueOnce(new Error('API key missing'));
    await service
      .generateProfessionalSummary({ targetRole: 'Backend Engineer' })
      .catch((error) => {
        expectApiError(error, HttpStatus.BAD_GATEWAY, 'Gemini API is not configured');
      });
  });

  it('should generate experience bullets and map parse/errors', async () => {
    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce(
        '{"bullets":["- Built APIs at scale","Improved response time by 45%"]}',
      );
    await expect(
      service.generateExperienceBullets({
        targetRole: 'Backend Engineer',
        position: 'Engineer',
        company: 'Acme',
        description: 'Did backend work',
      }),
    ).resolves.toEqual(['Built APIs at scale', 'Improved response time by 45%']);

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce('   ');
    await expect(
      service.generateExperienceBullets({
        description: 'No result',
      }),
    ).rejects.toThrow(ApiError);

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockRejectedValueOnce(new Error('404 model missing'));
    await service
      .generateExperienceBullets({ description: 'Error path' })
      .catch((error) => {
        expectApiError(error, HttpStatus.BAD_GATEWAY, 'Configured AI model is unavailable');
      });
  });

  it('should generate resume suggestions and handle parse failures', async () => {
    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce(
        '```json\n{"targetRole":" Senior Backend Engineer ","jobTitle":"Principal Engineer","professionalSummary":"  strong summary  ","skills":["Node.js"," TypeScript ",""]}\n```',
      );

    await expect(
      service.generateResumeSuggestions({
        focus: 'skills',
        targetRole: 'Engineer',
      }),
    ).resolves.toEqual({
      targetRole: 'Senior Backend Engineer',
      jobTitle: 'Principal Engineer',
      professionalSummary: 'strong summary',
      skills: ['Node.js', 'TypeScript'],
    });

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce('{not-json');
    await service.generateResumeSuggestions({ focus: 'setup' }).catch((error) => {
      expectApiError(error, HttpStatus.BAD_GATEWAY, 'Failed to parse AI suggestions');
    });
  });

  it('should scan ATS and normalize output with failures mapped', async () => {
    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce(
        '{"documentType":"resume","ATS":{"score":80,"tips":[{"type":"good","tip":"keywords"}]},"toneAndStyle":{"score":70,"tips":[{"type":"improve","tip":"tone"}]},"content":{"score":75,"tips":[{"type":"improve","tip":"content"}]},"structure":{"score":70,"tips":[{"type":"good","tip":"structure"}]},"skills":{"score":65,"tips":[{"type":"improve","tip":"skills"}]}}',
      );
    const result = await service.atsScanResume({ resumeText: 'resume text content' });
    expect(result.documentType).toBe('resume');
    expect(result.overallScore).toBeGreaterThan(0);

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce('{broken');
    await service.atsScanResume({ resumeText: 'bad json' }).catch((error) => {
      expectApiError(error, HttpStatus.BAD_GATEWAY, 'Failed to parse ATS scan result');
    });
  });

  it('should generate interview prep course success path and strict retry path', async () => {
    const strongChapter = buildStrongChapter('Generated Chapter');
    const parseSpy = jest
      .spyOn(service as any, 'parseInterviewPrepCourseChaptersFromText')
      .mockReturnValue([strongChapter]);
    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('{"chapters":[{}]}')
      .mockResolvedValueOnce('{"chapters":[{}]}');
    jest
      .spyOn(service as any, 'hasWeakCourseMaterial')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    jest
      .spyOn(service as any, 'hasWeakInterviewAnswers')
      .mockReturnValue(false);
    jest
      .spyOn(service as any, 'refineWeakCourseChapters')
      .mockResolvedValueOnce([strongChapter]);

    const result = await service.generateInterviewPrepCourse({
      title: 'Transformers for Interviews',
      description: 'Deep learning focus',
      category: 'AI',
      generationMode: ResourceCourseGenerationMode.LEARN,
      difficulty: 'intermediate',
      targetRoles: ['ML Engineer'],
      chapterCount: 1,
      includeVideoRecommendations: false,
    });

    expect(parseSpy).toHaveBeenCalledTimes(2);
    expect(result.chapters.length).toBe(1);
    expect(result.aiModel).toBe('gpt-4o');
  });

  it('should fallback to deterministic interview prep course when generation fails', async () => {
    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockRejectedValue(new Error('ai down'));

    const result = await service.generateInterviewPrepCourse({
      title: 'Traditional Machine Learning Fundamentals',
      description: 'Regression classification random forest',
      category: 'Machine Learning',
      generationMode: ResourceCourseGenerationMode.LEARN,
      difficulty: 'beginner',
      targetRoles: ['ML Engineer'],
      chapterCount: 3,
      includeVideoRecommendations: false,
    });

    expect(result.chapters).toHaveLength(3);
    expect(result.aiModel).toBeNull();
  });

  it('should refine weak chapters and keep titles while merging', async () => {
    const weakChapter = {
      ...buildStrongChapter('Original Title'),
      material: ['short'],
      interviewQuestions: [{ question: 'Q', sampleAnswer: 'short' }],
    };
    const refinedChapter = {
      ...buildStrongChapter('New Title Should Not Override'),
      title: 'New Title Should Not Override',
    };

    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('raw');
    jest
      .spyOn(service as any, 'parseInterviewPrepCourseChaptersFromText')
      .mockReturnValueOnce([refinedChapter]);

    const merged = await (service as any).refineWeakCourseChapters(
      {
        title: 'Course',
        description: 'Desc',
        category: 'AI',
        generationMode: ResourceCourseGenerationMode.INTERVIEW_PREP,
        difficulty: 'intermediate',
        targetRoles: ['Backend Engineer'],
        chapterCount: 1,
        includeVideoRecommendations: false,
      },
      [weakChapter],
    );

    expect(merged[0].title).toBe('Original Title');
    expect(merged[0].material.length).toBeGreaterThan(0);
  });

  it('should build deterministic fallback templates for different contexts', async () => {
    const transformerFallback = await (service as any).buildInterviewPrepCourseFallback({
      title: 'Transformers and Attention',
      description: 'LLM attention mechanisms',
      category: 'AI',
      generationMode: ResourceCourseGenerationMode.LEARN,
      difficulty: 'advanced',
      targetRoles: ['AI Engineer'],
      chapterCount: 2,
      chapterTitles: ['Custom 1', 'Custom 2'],
      includeVideoRecommendations: false,
    });
    expect(transformerFallback.chapters).toHaveLength(2);
    expect(transformerFallback.chapters[0].title).toBe('Custom 1');

    const genericFallback = await (service as any).buildInterviewPrepCourseFallback({
      title: 'Distributed Systems',
      description: 'General backend systems',
      category: 'Backend',
      generationMode: ResourceCourseGenerationMode.INTERVIEW_PREP,
      difficulty: 'intermediate',
      targetRoles: ['Backend Engineer'],
      chapterCount: 3,
      includeVideoRecommendations: true,
    });
    expect(genericFallback.chapters).toHaveLength(3);
    expect(genericFallback.chapters[0].youtubeVideos).toEqual([]);
  });

  it('should build interview prep prompt with strict and mode-specific rules', () => {
    const learnPrompt = (service as any).buildInterviewPrepCoursePrompt(
      {
        title: 'Course',
        description: 'Desc',
        category: 'AI',
        generationMode: ResourceCourseGenerationMode.LEARN,
        difficulty: 'intermediate',
        targetRoles: ['Role A'],
        chapterTitles: ['C1'],
        includeVideoRecommendations: true,
      },
      1,
      true,
    );
    expect(learnPrompt).toContain('This is a LEARN mode course');
    expect(learnPrompt).toContain('Never write phrases like');

    const prepPrompt = (service as any).buildInterviewPrepCoursePrompt(
      {
        title: 'Course',
        description: 'Desc',
        category: 'AI',
        generationMode: ResourceCourseGenerationMode.INTERVIEW_PREP,
        difficulty: 'intermediate',
        targetRoles: ['Role A'],
        includeVideoRecommendations: false,
      },
      2,
      false,
    );
    expect(prepPrompt).toContain('INTERVIEW_PREP mode course');
    expect(prepPrompt).toContain('Provide exactly 2 chapters');
  });

  it('should cover no-config and helper null branches', async () => {
    process.env.GEMINI_API_KEY = '';
    createService({ apiKey: '' });
    expect(() => (service as any).ensureConfigured()).toThrow(ApiError);
    await expect((service as any).getAvailableModelNames()).resolves.toBeNull();

    expect((service as any).ensureSentence('   ')).toBe('');
    expect(
      (service as any).buildTeachingParagraphFromConcept({
        concept: 'X',
        theory: null,
        explanation: null,
        interviewApplication: null,
      }),
    ).toBeNull();
    expect((service as any).normalizeAtsTips([{ type: 'good', tip: '   ' }])).toEqual(
      [],
    );
    expect((service as any).parseBulletsFromText('[1,2,3]')).toEqual([]);
    process.env.GEMINI_API_KEY = 'gemini-key';
  });

  it('should throw generic fallback errors when providers return no content', async () => {
    jest.spyOn(service as any, 'generateTextWithOpenAI').mockResolvedValue(null);
    jest.spyOn(service as any, 'generateTextWithGemini').mockResolvedValue('');
    await expect(
      (service as any).generateTextWithModelFallback('p', {}),
    ).rejects.toThrow('AI service error');

    jest.spyOn(service as any, 'generateTextWithOpenAI').mockResolvedValue(null);
    jest.spyOn(service as any, 'generateTextWithGemini').mockResolvedValue('');
    await expect(
      (service as any).generateCourseTextWithOpenAIPriority('p', {}),
    ).rejects.toThrow('AI service error');
  });

  it('should cover gemini generation empty/non-retriable branches', async () => {
    const getGenerativeModel = jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => '   ' },
      }),
    });
    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel,
    }));
    createService();
    await expect(
      (service as any).generateTextWithGemini('prompt', {}),
    ).rejects.toThrow('returned empty content');

    const twoModels = jest
      .fn()
      .mockReturnValueOnce({
        generateContent: jest.fn().mockRejectedValue(new Error('quota exceeded')),
      })
      .mockReturnValueOnce({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => 'never reached' },
        }),
      });
    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: twoModels,
    }));
    createService();
    await expect(
      (service as any).generateTextWithGemini('prompt', {}),
    ).rejects.toThrow('quota exceeded');
  });

  it('should cover model discovery failure variants and candidate fallback', async () => {
    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({ ok: false });
    await expect((service as any).getAvailableModelNames()).resolves.toBeNull();

    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [] }),
    });
    await expect((service as any).getAvailableModelNames()).resolves.toBeNull();

    (global.fetch as unknown as jest.Mock).mockRejectedValueOnce(new Error('net'));
    await expect((service as any).getAvailableModelNames()).resolves.toBeNull();

    const fallback = (service as any).resolveModelCandidates(null);
    expect(Array.isArray(fallback)).toBe(true);
    expect(fallback.length).toBeGreaterThan(0);
  });

  it('should cover summary/suggestion/ats explicit error branches', async () => {
    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce('Engineer summary');
    await expect(
      service.generateProfessionalSummary({
        targetRole: 'Backend',
        experience: [{ position: 'Dev', company: 'Acme', bulletPoints: ['a'] }],
        education: [{ degree: 'BSc', school: 'College', startDate: '2020', endDate: '2024' }],
        skills: ['Node.js'],
      }),
    ).resolves.toBe('Engineer summary');

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce('[]');
    await expect(
      service.generateExperienceBullets({ description: 'x' }),
    ).rejects.toBeInstanceOf(ApiError);

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce('');
    await expect(
      service.generateResumeSuggestions({
        focus: 'setup',
        experience: [{ position: 'Dev', company: 'Acme', bulletPoints: ['a'] }],
        education: [{ degree: 'BSc', major: 'CS', school: 'College', startDate: '2020', endDate: '2024' }],
      }),
    ).rejects.toBeInstanceOf(ApiError);

    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockResolvedValueOnce('');
    await expect(
      service.atsScanResume({ resumeText: 'resume' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should cover interview-prep parse and refine fallback branches', async () => {
    expect(() =>
      (service as any).parseInterviewPrepCourseChaptersFromText('invalid', 2, false),
    ).toThrow(SyntaxError);

    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('invalid-json');
    jest.spyOn(service as any, 'repairInterviewPrepCourseJson').mockResolvedValueOnce(
      null,
    );
    const fallback = await service.generateInterviewPrepCourse({
      title: 'Course',
      category: 'AI',
      generationMode: ResourceCourseGenerationMode.LEARN,
      difficulty: 'beginner',
      targetRoles: ['Engineer'],
      chapterCount: 1,
      includeVideoRecommendations: false,
    });
    expect(fallback.aiModel).toBeNull();

    const internal = service as any;
    await expect(
      internal.refineWeakCourseChapters(
        {
          title: 'Course',
          category: 'AI',
          generationMode: ResourceCourseGenerationMode.LEARN,
          difficulty: 'beginner',
          targetRoles: ['Engineer'],
          chapterCount: 1,
          includeVideoRecommendations: false,
        },
        [],
      ),
    ).resolves.toEqual([]);

    await expect(
      internal.refineWeakCourseChapters(
        {
          title: 'Course',
          category: 'AI',
          generationMode: ResourceCourseGenerationMode.LEARN,
          difficulty: 'beginner',
          targetRoles: ['Engineer'],
          chapterCount: 1,
          includeVideoRecommendations: false,
        },
        [buildStrongChapter('Strong')],
      ),
    ).resolves.toHaveLength(1);
  });

  it('should cover chapter normalization and youtube helper edge paths', async () => {
    expect((service as any).normalizeInterviewPrepCourseChapters(null, true)).toEqual([]);
    const normalized = (service as any).normalizeInterviewPrepCourseChapters(
      [
        null,
        {
          title: '',
        },
        {
          title: 'Valid',
          sections: [null, { heading: '', content: [] }, { heading: 'H', content: ['x'] }],
          coreConcepts: [null, { concept: '' }, { concept: 'C' }],
          interviewQuestions: [null, { question: '' }, { question: 'Q' }],
          youtubeVideos: [null, { title: 'T', youtubeUrl: 'invalid-url' }],
        },
      ],
      true,
    );
    expect(normalized.length).toBe(1);

    const noVideos = await (service as any).ensureLegitYoutubeRecommendations(
      [buildStrongChapter('No videos')],
      { includeVideoRecommendations: false, category: 'AI', targetRoles: ['ML'] },
    );
    expect(noVideos[0].youtubeVideos).toEqual([]);

    jest.spyOn(service as any, 'verifyYoutubeUrlExists').mockResolvedValue(false);
    jest
      .spyOn(service as any, 'searchYoutubeVideos')
      .mockResolvedValue([{ title: 'F', youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', reason: null }]);
    const enriched = await (service as any).ensureLegitYoutubeRecommendations(
      [
        {
          ...buildStrongChapter('Video edge'),
          youtubeVideos: [{ title: 'Bad', youtubeUrl: 'bad-url', reason: null }],
        },
      ],
      { includeVideoRecommendations: true, category: 'AI', targetRoles: ['ML'] },
    );
    expect(enriched[0].youtubeVideos.length).toBe(1);

    expect((service as any).extractYoutubeVideoId('not-a-url')).toBeNull();
    (global.fetch as unknown as jest.Mock).mockRejectedValueOnce(new Error('net'));
    await expect(
      (service as any).verifyYoutubeUrlExists('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).resolves.toBe(false);
  });

  it('should evaluate weak-content branches beyond early returns', () => {
    const genericParagraph =
      'this chapter should explain concepts and the learner should understand';
    const weakMaterialChapter = {
      ...buildStrongChapter('Weak by generic count'),
      material: [genericParagraph, genericParagraph, words(60), words(65)],
    };
    expect(
      (service as any).hasWeakCourseMaterial(
        [weakMaterialChapter],
        ResourceCourseGenerationMode.LEARN,
      ),
    ).toBe(true);

    const weakAnswersChapter = {
      ...buildStrongChapter('Weak by answer quality'),
      interviewQuestions: [
        { question: 'Q1', sampleAnswer: 'short' },
        { question: 'Q2', sampleAnswer: 'short' },
        { question: 'Q3', sampleAnswer: words(10) },
      ],
    };
    expect(
      (service as any).hasWeakInterviewAnswers(
        [weakAnswersChapter],
        ResourceCourseGenerationMode.INTERVIEW_PREP,
      ),
    ).toBe(true);
  });

  it('should cover model/error edge branches for suggestions and ATS', async () => {
    jest
      .spyOn(service as any, 'generateTextWithModelFallback')
      .mockRejectedValueOnce(new Error('generic failure'))
      .mockRejectedValueOnce(new Error('generic failure 2'));
    await expect(
      service.generateResumeSuggestions({ focus: 'summary' }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      service.atsScanResume({ resumeText: 'resume text' }),
    ).rejects.toBeInstanceOf(ApiError);

    jest.spyOn(service as any, 'resolveModelCandidates').mockReturnValueOnce([]);
    await expect(
      (service as any).generateTextWithGemini('prompt', {}),
    ).rejects.toThrow('Gemini AI service error');
  });

  it('should cover interview-prep repair/rethrow/refinement branches', async () => {
    const chapter = buildStrongChapter('Recovered');

    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('raw-output');
    const parseSpy = jest
      .spyOn(service as any, 'parseInterviewPrepCourseChaptersFromText')
      .mockImplementationOnce(() => {
        throw new SyntaxError('broken');
      })
      .mockImplementationOnce(() => [chapter]);
    jest.spyOn(service as any, 'repairInterviewPrepCourseJson').mockResolvedValueOnce(
      '{"chapters":[{}]}',
    );
    jest.spyOn(service as any, 'hasWeakCourseMaterial').mockReturnValue(false);
    jest.spyOn(service as any, 'hasWeakInterviewAnswers').mockReturnValue(false);
    const repaired = await service.generateInterviewPrepCourse({
      title: 'Course',
      category: 'AI',
      generationMode: ResourceCourseGenerationMode.LEARN,
      difficulty: 'intermediate',
      targetRoles: ['Engineer'],
      chapterCount: 1,
      includeVideoRecommendations: false,
    });
    expect(repaired.chapters).toHaveLength(1);
    expect(parseSpy).toHaveBeenCalledTimes(2);

    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('');
    const emptyFallback = await service.generateInterviewPrepCourse({
      title: 'Course',
      category: 'AI',
      generationMode: ResourceCourseGenerationMode.LEARN,
      difficulty: 'intermediate',
      targetRoles: ['Engineer'],
      chapterCount: 1,
      includeVideoRecommendations: false,
    });
    expect(emptyFallback.aiModel).toBeNull();

    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('{"chapters":[]}');
    jest
      .spyOn(service as any, 'parseInterviewPrepCourseChaptersFromText')
      .mockReturnValueOnce([]);
    jest.spyOn(service as any, 'hasWeakCourseMaterial').mockReturnValue(true);
    jest.spyOn(service as any, 'hasWeakInterviewAnswers').mockReturnValue(true);
    const refineSpy = jest
      .spyOn(service as any, 'refineWeakCourseChapters')
      .mockResolvedValueOnce([]);
    const invalidFallback = await service.generateInterviewPrepCourse({
      title: 'Course',
      category: 'AI',
      generationMode: ResourceCourseGenerationMode.LEARN,
      difficulty: 'intermediate',
      targetRoles: ['Engineer'],
      chapterCount: 1,
      includeVideoRecommendations: false,
    });
    expect(invalidFallback.aiModel).toBeNull();
    refineSpy.mockRestore();

    const weakChapter = {
      ...buildStrongChapter('Weak'),
      material: ['short'],
      interviewQuestions: [{ question: 'Q', sampleAnswer: 'short' }],
    };
    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('raw');
    jest
      .spyOn(service as any, 'parseInterviewPrepCourseChaptersFromText')
      .mockImplementationOnce(() => {
        throw new SyntaxError('parse');
      })
      .mockImplementationOnce(() => [buildStrongChapter('Recovered')]);
    jest
      .spyOn(service as any, 'repairInterviewPrepCourseJson')
      .mockResolvedValueOnce('{"chapters":[{}]}');
    const refined = await (service as any).refineWeakCourseChapters(
      {
        title: 'Course',
        category: 'AI',
        generationMode: ResourceCourseGenerationMode.INTERVIEW_PREP,
        difficulty: 'intermediate',
        targetRoles: ['Engineer'],
        chapterCount: 1,
        includeVideoRecommendations: false,
      },
      [weakChapter],
    );
    expect(Array.isArray(refined)).toBe(true);
    expect(refined[0].title).toBe('Weak');

    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockRejectedValueOnce(new Error('refine failed'));
    const unchanged = await (service as any).refineWeakCourseChapters(
      {
        title: 'Course',
        category: 'AI',
        generationMode: ResourceCourseGenerationMode.INTERVIEW_PREP,
        difficulty: 'intermediate',
        targetRoles: ['Engineer'],
        chapterCount: 1,
        includeVideoRecommendations: false,
      },
      [weakChapter],
    );
    expect(unchanged[0].title).toBe('Weak');
  });

  it('should hit youtube fallback merge and verify catch path', async () => {
    jest.spyOn(service as any, 'verifyYoutubeUrlExists').mockResolvedValue(false);
    jest
      .spyOn(service as any, 'searchYoutubeVideos')
      .mockResolvedValue([
        {
          title: 'Fallback',
          youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          reason: null,
        },
      ]);
    const result = await (service as any).ensureLegitYoutubeRecommendations(
      [
        {
          ...buildStrongChapter('Topic'),
          youtubeVideos: [
            { title: 'Bad URL', youtubeUrl: 'https://example.com/x', reason: null },
          ],
        },
      ],
      { includeVideoRecommendations: true, category: 'AI', targetRoles: ['Engineer'] },
    );
    expect(result[0].youtubeVideos[0].title).toBe('Fallback');

    (global.fetch as unknown as jest.Mock).mockRejectedValueOnce(new Error('oops'));
    await expect(
      (service as any).verifyYoutubeUrlExists('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).resolves.toBe(false);
  });

  it('should cover remaining course-generation and refinement catch paths', async () => {
    jest.spyOn(service as any, 'generateTextWithOpenAI').mockResolvedValueOnce(null);
    jest
      .spyOn(service as any, 'generateTextWithGemini')
      .mockRejectedValueOnce(new Error('gemini course fail'));
    await expect(
      (service as any).generateCourseTextWithOpenAIPriority('prompt', {}),
    ).rejects.toThrow('gemini course fail');

    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('{"chapters":[]}');
    jest
      .spyOn(service as any, 'parseInterviewPrepCourseChaptersFromText')
      .mockReturnValueOnce([]);
    jest.spyOn(service as any, 'hasWeakCourseMaterial').mockReturnValue(false);
    jest.spyOn(service as any, 'hasWeakInterviewAnswers').mockReturnValue(false);
    const noChapters = await service.generateInterviewPrepCourse({
      title: 'Course',
      category: 'AI',
      generationMode: ResourceCourseGenerationMode.LEARN,
      difficulty: 'intermediate',
      targetRoles: ['Engineer'],
      chapterCount: 1,
      includeVideoRecommendations: false,
    });
    expect(noChapters.aiModel).toBeNull();

    const weakChapter = {
      ...buildStrongChapter('Weak'),
      material: ['short'],
      interviewQuestions: [{ question: 'Q', sampleAnswer: 'short' }],
    };
    jest
      .spyOn(service as any, 'generateCourseTextWithOpenAIPriority')
      .mockResolvedValueOnce('raw');
    jest
      .spyOn(service as any, 'parseInterviewPrepCourseChaptersFromText')
      .mockImplementationOnce(() => {
        throw new SyntaxError('broken');
      });
    jest.spyOn(service as any, 'repairInterviewPrepCourseJson').mockResolvedValueOnce(
      null,
    );
    const unchanged = await (service as any).refineWeakCourseChapters(
      {
        title: 'Course',
        category: 'AI',
        generationMode: ResourceCourseGenerationMode.INTERVIEW_PREP,
        difficulty: 'intermediate',
        targetRoles: ['Engineer'],
        chapterCount: 1,
        includeVideoRecommendations: false,
      },
      [weakChapter],
    );
    expect(unchanged[0].title).toBe('Weak');
  });

  it('should execute youtube fallback merge line and fetch-catch verifier', async () => {
    jest
      .spyOn(service as any, 'verifyYoutubeUrlExists')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    jest
      .spyOn(service as any, 'searchYoutubeVideos')
      .mockResolvedValueOnce([
        {
          title: 'Fallback',
          youtubeUrl: 'https://www.youtube.com/watch?v=bbbbbbbbbbb',
          reason: null,
        },
      ]);
    const merged = await (service as any).ensureLegitYoutubeRecommendations(
      [
        {
          ...buildStrongChapter('Topic'),
          youtubeVideos: [
            {
              title: 'Valid',
              youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              reason: null,
            },
            {
              title: 'Invalid',
              youtubeUrl: 'https://www.youtube.com/watch?v=aaaaaaaaaaa',
              reason: null,
            },
          ],
        },
      ],
      { includeVideoRecommendations: true, category: 'AI', targetRoles: ['Engineer'] },
    );
    expect(merged[0].youtubeVideos.length).toBeGreaterThan(0);

    createService();
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as never;
    await expect(
      (service as any).verifyYoutubeUrlExists('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).resolves.toBe(false);
  });

  it('should return verified youtube videos directly when at least two are valid', async () => {
    jest
      .spyOn(service as any, 'verifyYoutubeUrlExists')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    const result = await (service as any).ensureLegitYoutubeRecommendations(
      [
        {
          ...buildStrongChapter('Verified videos'),
          youtubeVideos: [
            {
              title: 'V1',
              youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              reason: null,
            },
            {
              title: 'V2',
              youtubeUrl: 'https://www.youtube.com/watch?v=bbbbbbbbbbb',
              reason: null,
            },
          ],
        },
      ],
      { includeVideoRecommendations: true, category: 'AI', targetRoles: ['Engineer'] },
    );

    expect(result[0].youtubeVideos).toHaveLength(2);
  });

  it('should cover youtube search no-key/not-ok/catch branches', async () => {
    process.env.YOUTUBE_API_KEY = '';
    createService();
    await expect((service as any).searchYoutubeVideos('q')).resolves.toEqual([]);

    process.env.YOUTUBE_API_KEY = 'yt-key';
    createService();
    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({ ok: false });
    await expect((service as any).searchYoutubeVideos('q')).resolves.toEqual([]);

    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: { videoId: 'x' }, snippet: { title: 'Invalid short id' } }],
      }),
    });
    jest.spyOn(service as any, 'verifyYoutubeUrlExists').mockResolvedValue(false);
    await expect((service as any).searchYoutubeVideos('q')).resolves.toEqual([]);

    (global.fetch as unknown as jest.Mock).mockRejectedValueOnce(new Error('net'));
    await expect((service as any).searchYoutubeVideos('q')).resolves.toEqual([]);
  });
});

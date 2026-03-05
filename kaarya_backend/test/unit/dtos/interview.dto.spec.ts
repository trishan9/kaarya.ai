import {
  CompleteInterviewSessionDTO,
  CreateInterviewDTO,
  InterviewListQueryDTO,
  InterviewSessionQueryDTO,
  StartInterviewSessionDTO,
  UpdateInterviewDTO,
  VapiGenerateInterviewDTO,
} from 'src/dtos/interviews/interview.dto';
import { InterviewMode } from 'src/types/interview-mode.enum';
import { InterviewSessionStatus } from 'src/types/interview-session-status.enum';
import { InterviewStatus } from 'src/types/interview-status.enum';
import { InterviewType } from 'src/types/interview-type.enum';
import { InterviewVisibility } from 'src/types/interview-visibility.enum';

describe('Interview DTOs', () => {
  it('should parse create payload with defaults and preprocessors', () => {
    const result = CreateInterviewDTO.parse({
      title: '  Backend mock  ',
      description: '  desc  ',
      interviewType: InterviewType.TECHNICAL,
      role: '  Backend Engineer ',
      level: '  Mid ',
      techStack: [' Node ', ' TS '],
      tags: [' API '],
      generateQuestions: 'true',
      questions: ['Explain API versioning strategy'],
    });

    expect(result.title).toBe('Backend mock');
    expect(result.role).toBe('Backend Engineer');
    expect(result.questionCount).toBe(8);
    expect(result.durationMinutes).toBe(25);
    expect(result.generateQuestions).toBe(true);
    expect(result.tags).toEqual(['API']);
  });

  it('should reject invalid short questions', () => {
    const parsed = CreateInterviewDTO.safeParse({
      title: 'Backend mock',
      interviewType: InterviewType.TECHNICAL,
      role: 'Backend Engineer',
      questions: ['short'],
    });

    expect(parsed.success).toBe(false);
  });

  it('should parse update payload and enforce non-empty body', () => {
    const valid = UpdateInterviewDTO.safeParse({
      title: ' Updated ',
      generateQuestions: 'false',
      questionCount: '12',
      durationMinutes: '40',
      visibility: InterviewVisibility.PUBLIC,
      status: InterviewStatus.PUBLISHED,
    });
    const invalid = UpdateInterviewDTO.safeParse({});

    expect(valid.success).toBe(true);
    expect(valid.data?.generateQuestions).toBe(false);
    expect(valid.data?.questionCount).toBe(12);
    expect(valid.data?.durationMinutes).toBe(40);
    expect(invalid.success).toBe(false);
  });

  it('should parse list query defaults and filters', () => {
    const defaults = InterviewListQueryDTO.parse({});
    const filtered = InterviewListQueryDTO.parse({
      page: '2',
      size: '15',
      search: '  backend ',
      status: InterviewStatus.DRAFT,
      visibility: InterviewVisibility.PRIVATE,
      interviewType: InterviewType.BEHAVIORAL,
      ownership: 'created_by_me',
      discover: 'false',
      sortBy: 'title',
    });

    expect(defaults.page).toBe(1);
    expect(defaults.discover).toBe(true);
    expect(defaults.ownership).toBe('all');
    expect(filtered.search).toBe('backend');
    expect(filtered.discover).toBe(false);
    expect(filtered.sortBy).toBe('title');
  });

  it('should parse start/complete session payloads', () => {
    const startDefault = StartInterviewSessionDTO.parse({});
    const startCustom = StartInterviewSessionDTO.parse({
      mode: InterviewMode.MOBILE,
      metadata: { source: 'web' },
    });
    const complete = CompleteInterviewSessionDTO.parse({
      status: InterviewSessionStatus.COMPLETED,
      transcript: [
        {
          role: 'assistant',
          content: 'Question one',
          timestamp: '2026-02-14T12:00:00.000Z',
        },
      ],
      recordingUrl: '  https://cdn.example.com/rec.mp3 ',
      vapiCallId: '  call-1 ',
      durationSeconds: '300',
      generateEvaluation: 'false',
    });
    const query = InterviewSessionQueryDTO.parse({});

    expect(startDefault).toEqual({ mode: InterviewMode.WEB, metadata: {} });
    expect(startCustom.mode).toBe(InterviewMode.MOBILE);
    expect(complete.generateEvaluation).toBe(false);
    expect(complete.durationSeconds).toBe(300);
    expect(complete.transcript[0].timestamp).toBeInstanceOf(Date);
    expect(query).toEqual({ page: 1, size: 10 });
  });

  it('should parse vapi payload variants and passthrough unknown keys', () => {
    const first = VapiGenerateInterviewDTO.parse({
      title: '  Voice interview ',
      interviewType: InterviewType.TECHNICAL,
      role: '  Backend Engineer ',
      techStack: 'Node, TypeScript',
      tags: '',
      questionCount: '6',
      userId: '507f191e810c19729de860ea',
      extraField: 'kept',
    });
    const second = VapiGenerateInterviewDTO.parse({
      techstack: [' React ', ' Next.js '],
      amount: '8',
      userid: '507f191e810c19729de860eb',
    });

    expect(first.techStack).toEqual(['Node', 'TypeScript']);
    expect(first.tags).toEqual([]);
    expect(first.questionCount).toBe(6);
    expect((first as Record<string, unknown>).extraField).toBe('kept');
    expect(second.techstack).toEqual(['React', 'Next.js']);
    expect(second.amount).toBe(8);
  });
});

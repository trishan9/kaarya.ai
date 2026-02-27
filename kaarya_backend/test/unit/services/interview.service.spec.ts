import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { INTERVIEW_MESSAGES } from 'src/constants/messages.constants';
import { InterviewService } from 'src/services/interview.service';
import { BookmarkEntityType } from 'src/types/bookmark-entity-type.enum';
import { InterviewMode } from 'src/types/interview-mode.enum';
import { InterviewSessionStatus } from 'src/types/interview-session-status.enum';
import { InterviewSource } from 'src/types/interview-source.enum';
import { InterviewStatus } from 'src/types/interview-status.enum';
import { InterviewType } from 'src/types/interview-type.enum';
import { InterviewVisibility } from 'src/types/interview-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('InterviewService', () => {
  const ids = {
    admin: '64b64a2f4f1c2b0012345601',
    recruiter: '64b64a2f4f1c2b0012345602',
    collegeUser: '64b64a2f4f1c2b0012345603',
    student: '64b64a2f4f1c2b0012345604',
    user: '64b64a2f4f1c2b0012345605',
    creator: '64b64a2f4f1c2b0012345606',
    interview: '64b64a2f4f1c2b0012345607',
    session: '64b64a2f4f1c2b0012345608',
    company: '64b64a2f4f1c2b0012345609',
    college: '64b64a2f4f1c2b0012345610',
    evaluation: '64b64a2f4f1c2b0012345611',
  };

  let service: InterviewService;
  let interviewRepository: Record<string, jest.Mock>;
  let bookmarkRepository: Record<string, jest.Mock>;
  let interviewSessionRepository: Record<string, jest.Mock>;
  let aiEvaluationRepository: Record<string, jest.Mock>;
  let companyRepository: Record<string, jest.Mock>;
  let collegeRepository: Record<string, jest.Mock>;
  let collegeService: Record<string, jest.Mock>;
  let recruiterProfileService: Record<string, jest.Mock>;
  let studentService: Record<string, jest.Mock>;
  let userService: Record<string, jest.Mock>;
  let interviewAIService: Record<string, jest.Mock>;
  let gamificationService: Record<string, jest.Mock>;
  const originalEnv = process.env;

  const baseInterview = () => ({
    id: ids.interview,
    title: 'Backend Mock Interview',
    description: 'desc',
    interviewType: InterviewType.TECHNICAL,
    role: 'Backend Engineer',
    level: 'mid',
    techStack: ['Node.js', 'TypeScript'],
    questionCount: 2,
    durationMinutes: 30,
    questions: [{ question: 'Q1', order: 1 }, { question: 'Q2', order: 2 }],
    visibility: InterviewVisibility.PUBLIC,
    status: InterviewStatus.PUBLISHED,
    source: InterviewSource.CANDIDATE,
    companyId: null,
    collegeId: null,
    createdBy: new Types.ObjectId(ids.creator),
    tags: [],
    instructions: null,
    generationMeta: {},
    aiGenerated: false,
    attemptsCount: 0,
  });

  const baseSession = () => ({
    id: ids.session,
    interviewId: new Types.ObjectId(ids.interview),
    userId: new Types.ObjectId(ids.user),
    mode: InterviewMode.WEB,
    status: InterviewSessionStatus.IN_PROGRESS,
    transcript: [],
    createdAt: new Date(),
  });

  const baseEvaluation = () => ({
    id: ids.evaluation,
    interviewId: new Types.ObjectId(ids.interview),
    sessionId: new Types.ObjectId(ids.session),
    userId: new Types.ObjectId(ids.user),
    totalScore: 88,
    categoryScores: { communication: 90 },
    strengths: ['clear structure'],
    areasForImprovement: ['more metrics'],
    finalAssessment: 'Strong performance',
    model: 'gpt-4o-mini',
  });

  const expectApiError = (
    error: unknown,
    status: HttpStatus,
    message?: string,
  ) => {
    const apiError = error as ApiError;
    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.getStatus()).toBe(status);
    if (message) {
      expect(JSON.stringify(apiError.getResponse())).toContain(message);
    }
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      API_PREFIX: 'api',
      BACKEND_DOMAIN: 'https://backend.example.com',
      VAPI_WEB_TOKEN: 'web-token',
      VAPI_INTERVIEW_CREATE_WORKFLOW_ID: 'workflow-1',
      VAPI_WEBHOOK_SECRET: 'secret-123',
      VAPI_WEBHOOK_HEADER_NAME: 'x-vapi-secret',
      INTERVIEW_DYNAMIC_SESSION_QUESTIONS: 'true',
      VAPI_INTERVIEW_MODEL: 'gpt-4o-mini',
    };

    interviewRepository = {
      create: jest.fn().mockImplementation(async (payload) => ({
        id: ids.interview,
        ...payload,
      })),
      findById: jest.fn().mockResolvedValue(baseInterview()),
      findAll: jest.fn().mockResolvedValue({ interviews: [baseInterview()], total: 1 }),
      updateById: jest.fn().mockResolvedValue(baseInterview()),
      deleteById: jest.fn().mockResolvedValue(baseInterview()),
      incrementAttemptsAndTouch: jest.fn().mockResolvedValue(baseInterview()),
    };

    bookmarkRepository = {
      findSavedEntityIds: jest.fn().mockResolvedValue(new Set([ids.interview])),
      upsertByUserAndEntity: jest.fn(),
      deleteByUserAndEntity: jest.fn(),
      findAllByUser: jest.fn(),
    };

    interviewSessionRepository = {
      create: jest.fn().mockResolvedValue(baseSession()),
      findById: jest.fn().mockResolvedValue(baseSession()),
      updateById: jest.fn().mockResolvedValue({
        ...baseSession(),
        status: InterviewSessionStatus.COMPLETED,
      }),
      findAllByInterviewId: jest.fn().mockResolvedValue({
        sessions: [{ ...baseSession(), status: InterviewSessionStatus.COMPLETED }],
        total: 1,
      }),
      findAllByUser: jest.fn().mockResolvedValue({
        sessions: [baseSession()],
        total: 1,
      }),
      findInterviewIdsByUser: jest.fn().mockResolvedValue([ids.interview]),
      countDistinctUsersByInterview: jest.fn().mockResolvedValue(1),
      findLatestByUserAndInterviewIds: jest
        .fn()
        .mockResolvedValue(new Map([[ids.interview, baseSession()]])),
    };

    aiEvaluationRepository = {
      upsertBySessionId: jest.fn().mockResolvedValue(baseEvaluation()),
      findBySessionId: jest.fn().mockResolvedValue(baseEvaluation()),
      getInterviewScoreSummary: jest.fn().mockResolvedValue({
        averageScore: 82,
        highestScore: 88,
        evaluationsCount: 1,
      }),
      findLatestByUserAndInterviewIds: jest
        .fn()
        .mockResolvedValue(new Map([[ids.interview, baseEvaluation()]])),
    };

    companyRepository = {
      findByIds: jest
        .fn()
        .mockResolvedValue([{ id: ids.company, name: 'Acme', logo: null }]),
    };

    collegeRepository = {
      findByIds: jest
        .fn()
        .mockResolvedValue([{ id: ids.college, name: 'Tech College', logo: null }]),
    };

    collegeService = {
      getMyCollege: jest.fn().mockResolvedValue({ college: { id: ids.college } }),
      assertCanManageCollege: jest.fn().mockResolvedValue(undefined),
    };

    recruiterProfileService = {
      resolveWritableCompanyIdForRecruiter: jest.fn().mockResolvedValue(ids.company),
      listRecruiterMemberships: jest
        .fn()
        .mockResolvedValue({ recruiterProfiles: [{ companyId: ids.company }] }),
      assertRecruiterMembership: jest.fn().mockResolvedValue(undefined),
    };

    studentService = {
      listStudentCollegeIds: jest.fn().mockResolvedValue([ids.college]),
    };

    userService = {
      getUserByIdRaw: jest.fn().mockResolvedValue({
        id: ids.user,
        name: 'Candidate',
        email: 'candidate@example.com',
        role: UserRole.USER,
      }),
    };

    interviewAIService = {
      generateInterviewQuestions: jest
        .fn()
        .mockResolvedValue(['Generated Q1', 'Generated Q2']),
      evaluateInterview: jest.fn().mockResolvedValue({
        totalScore: 88,
        categoryScores: { communication: 90 },
        strengths: ['clarity'],
        areasForImprovement: ['conciseness'],
        finalAssessment: 'Strong interview',
        model: 'gpt-4o-mini',
      }),
    };

    gamificationService = {
      awardInterviewStarted: jest.fn().mockResolvedValue(undefined),
      awardInterviewCompleted: jest.fn().mockResolvedValue(undefined),
    };

    service = new InterviewService(
      interviewRepository as never,
      bookmarkRepository as never,
      interviewSessionRepository as never,
      aiEvaluationRepository as never,
      companyRepository as never,
      collegeRepository as never,
      collegeService as never,
      recruiterProfileService as never,
      studentService as never,
      userService as never,
      interviewAIService as never,
      gamificationService as never,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should normalize interview enums and regex helpers', () => {
    expect((service as any).normalizeInterviewType('behavioural')).toBe(
      InterviewType.BEHAVIORAL,
    );
    expect((service as any).normalizeInterviewType('system-design')).toBe(
      InterviewType.SYSTEM_DESIGN,
    );
    expect((service as any).normalizeInterviewType('unknown')).toBe(
      InterviewType.MIXED,
    );
    expect((service as any).normalizeVisibility('college only')).toBe(
      InterviewVisibility.COLLEGE_ONLY,
    );
    expect((service as any).normalizeStatus('archived')).toBe(InterviewStatus.ARCHIVED);
    expect((service as any).normalizeStatus('x')).toBeUndefined();
    expect((service as any).getInterviewTypeLabel(InterviewType.CUSTOM)).toBe(
      'Custom',
    );
    expect((service as any).escapeRegex('a+b*c?')).toBe('a\\+b\\*c\\?');
  });

  it('should cover additional enum normalization and label branches', () => {
    expect((service as any).normalizeInterviewType(undefined)).toBe(
      InterviewType.MIXED,
    );
    expect((service as any).normalizeVisibility('private')).toBe(
      InterviewVisibility.PRIVATE,
    );
    expect((service as any).normalizeVisibility('invalid')).toBeUndefined();
    expect((service as any).normalizeStatus('draft')).toBe(InterviewStatus.DRAFT);
    expect((service as any).normalizeStatus('published')).toBe(
      InterviewStatus.PUBLISHED,
    );
    expect((service as any).getInterviewTypeLabel(InterviewType.BEHAVIORAL)).toBe(
      'Behavioral',
    );
    expect((service as any).getInterviewTypeLabel(InterviewType.MIXED)).toBe(
      'Mixed',
    );
  });

  it('should extract and validate VAPI webhook secrets', () => {
    const secret = service.extractVapiWebhookSecret({
      'x-vapi-secret': '  secret-123  ',
    });
    expect(secret).toBe('secret-123');

    const bearer = service.extractVapiWebhookSecret({
      authorization: 'Bearer token-secret',
    });
    expect(bearer).toBe('token-secret');

    expect(() => service.assertVapiWebhookSecret('secret-123')).not.toThrow();
    expect(() => service.assertVapiWebhookSecret('wrong')).toThrow(ApiError);
  });

  it('should extract webhook secret from array header values', () => {
    const secret = service.extractVapiWebhookSecret({
      'x-vapi-secret': [' array-secret '],
    });
    expect(secret).toBe('array-secret');
    expect(service.extractVapiWebhookSecret({})).toBeUndefined();
  });

  it('should throw if VAPI webhook secret is not configured', () => {
    process.env.VAPI_WEBHOOK_SECRET = '';
    process.env.VAPI_PRIVATE_KEY = '';
    expect(() => service.assertVapiWebhookSecret('x')).toThrow(ApiError);
  });

  it('should provide voice creation config and validate env requirements', async () => {
    const response = await service.getVoiceCreationConfig({
      id: ids.user,
      role: UserRole.USER,
      email: 'candidate@example.com',
    });

    expect(response.vapi.workflowId).toBe('workflow-1');
    expect(response.vapi.variableValues.webhookUrl).toBe(
      'https://backend.example.com/api/v1/interviews/vapi/generate',
    );

    process.env.VAPI_WEB_TOKEN = '';
    await service
      .getVoiceCreationConfig({
        id: ids.user,
        role: UserRole.USER,
        email: 'candidate@example.com',
      })
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.INTERNAL_SERVER_ERROR,
          INTERVIEW_MESSAGES.VAPI_WEB_TOKEN_MISSING,
        ),
      );

    process.env.VAPI_WEB_TOKEN = 'web-token';
    process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID = '';
    process.env.VAPI_WORKFLOW_ID = '';
    await service
      .getVoiceCreationConfig({
        id: ids.user,
        role: UserRole.USER,
        email: 'candidate@example.com',
      })
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.INTERNAL_SERVER_ERROR,
          INTERVIEW_MESSAGES.VAPI_WORKFLOW_MISSING,
        ),
      );
  });

  it('should create interview from VAPI payload and validate required fields', async () => {
    const createSpy = jest
      .spyOn(service, 'createInterview')
      .mockResolvedValue({ ok: true } as never);

    await expect(
      service.createInterviewFromVapiWebhook({
        userId: ids.user,
        role: 'Backend Engineer',
        type: 'technical',
        techstack: ['Node.js', 'Node.js', 'TypeScript'],
      } as never),
    ).resolves.toEqual({ ok: true });
    expect(createSpy).toHaveBeenCalled();

    await expect(
      service.createInterviewFromVapiWebhook({
        userId: ids.user,
        role: 'Backend Engineer',
        questions: [' Q1 ', ' '],
        tags: [' backend ', '  '],
      } as never),
    ).resolves.toEqual({ ok: true });

    await service
      .createInterviewFromVapiWebhook({ role: 'Backend' } as never)
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.BAD_REQUEST,
          INTERVIEW_MESSAGES.VAPI_USER_REQUIRED,
        ),
      );
    await service
      .createInterviewFromVapiWebhook({ userId: ids.user, role: '   ' } as never)
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.BAD_REQUEST,
          INTERVIEW_MESSAGES.VAPI_ROLE_REQUIRED,
        ),
      );
  });

  it('should resolve creation context for all major roles', async () => {
    const adminContext = await (service as any).resolveCreationContext(
      { id: ids.admin, role: UserRole.ADMIN },
      {
        title: 'x',
        role: 'Backend',
        interviewType: InterviewType.TECHNICAL,
        questionCount: 2,
        durationMinutes: 20,
        techStack: [],
        companyId: ids.company,
      },
    );
    expect(adminContext.source).toBe(InterviewSource.COMPANY);

    const recruiterContext = await (service as any).resolveCreationContext(
      { id: ids.recruiter, role: UserRole.RECRUITER },
      {
        title: 'x',
        role: 'Backend',
        interviewType: InterviewType.TECHNICAL,
        questionCount: 2,
        durationMinutes: 20,
        techStack: [],
      },
    );
    expect(recruiterContext.companyId).toBe(ids.company);

    const collegeContext = await (service as any).resolveCreationContext(
      { id: ids.collegeUser, role: UserRole.COLLEGE },
      {
        title: 'x',
        role: 'Backend',
        interviewType: InterviewType.TECHNICAL,
        questionCount: 2,
        durationMinutes: 20,
        techStack: [],
      },
    );
    expect(collegeContext.collegeId).toBe(ids.college);

    await (service as any)
      .resolveCreationContext(
        { id: ids.user, role: UserRole.USER },
        {
          title: 'x',
          role: 'Backend',
          interviewType: InterviewType.TECHNICAL,
          questionCount: 2,
          durationMinutes: 20,
          techStack: [],
          companyId: ids.company,
        },
      )
      .catch((error: unknown) =>
        expectApiError(error, HttpStatus.FORBIDDEN, INTERVIEW_MESSAGES.FORBIDDEN_CREATE),
      );
  });

  it('should resolve recruiter default company id with membership edge cases', async () => {
    recruiterProfileService.listRecruiterMemberships.mockResolvedValueOnce({
      recruiterProfiles: [],
    });
    await expect(
      (service as any).resolveRecruiterDefaultCompanyId(ids.recruiter),
    ).resolves.toBeNull();

    recruiterProfileService.listRecruiterMemberships.mockResolvedValueOnce({
      recruiterProfiles: [{ companyId: ids.company }, { companyId: ids.college }],
    });
    await expect(
      (service as any).resolveRecruiterDefaultCompanyId(ids.recruiter),
    ).resolves.toBeNull();
  });

  it('should build access filters and list accessible college ids', async () => {
    await expect(
      (service as any).buildAccessFilter({ id: ids.admin, role: UserRole.ADMIN }),
    ).resolves.toEqual({});

    const access = await (service as any).buildAccessFilter({
      id: ids.user,
      role: UserRole.USER,
    });
    expect(access.$or).toBeDefined();

    collegeService.getMyCollege.mockRejectedValueOnce(new Error('no workspace'));
    await expect(
      (service as any).listAccessibleCollegeIds({
        id: ids.collegeUser,
        role: UserRole.COLLEGE,
      }),
    ).resolves.toEqual([]);

    await expect(
      (service as any).listAccessibleCollegeIds({
        id: ids.student,
        role: UserRole.STUDENT,
      }),
    ).resolves.toEqual([ids.college]);
  });

  it('should validate access control for interviews', async () => {
    const interview = {
      ...baseInterview(),
      createdBy: new Types.ObjectId(ids.creator),
      status: InterviewStatus.PUBLISHED,
      visibility: InterviewVisibility.COLLEGE_ONLY,
      collegeId: new Types.ObjectId(ids.college),
    };

    await expect(
      (service as any).assertCanAccessInterview(
        { id: ids.admin, role: UserRole.ADMIN },
        interview,
      ),
    ).resolves.toBeUndefined();

    await expect(
      (service as any).assertCanAccessInterview(
        { id: ids.creator, role: UserRole.USER },
        interview,
      ),
    ).resolves.toBeUndefined();

    studentService.listStudentCollegeIds.mockResolvedValueOnce([]);
    await (service as any)
      .assertCanAccessInterview({ id: ids.user, role: UserRole.USER }, interview)
      .catch((error: unknown) =>
        expectApiError(error, HttpStatus.FORBIDDEN, INTERVIEW_MESSAGES.FORBIDDEN_ACCESS),
      );

    await (service as any)
      .assertCanAccessInterview(
        { id: ids.user, role: UserRole.USER },
        {
          ...interview,
          visibility: InterviewVisibility.PRIVATE,
          collegeId: null,
        },
      )
      .catch((error: unknown) =>
        expectApiError(error, HttpStatus.FORBIDDEN, INTERVIEW_MESSAGES.FORBIDDEN_ACCESS),
      );
  });

  it('should validate manage permissions for interviews', async () => {
    await expect(
      (service as any).assertCanManageInterview(
        { id: ids.admin, role: UserRole.ADMIN },
        {
          createdBy: new Types.ObjectId(ids.creator),
          source: InterviewSource.CANDIDATE,
        },
      ),
    ).resolves.toBeUndefined();

    await expect(
      (service as any).assertCanManageInterview(
        { id: ids.recruiter, role: UserRole.RECRUITER },
        {
          createdBy: new Types.ObjectId(ids.creator),
          source: InterviewSource.COMPANY,
          companyId: new Types.ObjectId(ids.company),
        },
      ),
    ).resolves.toBeUndefined();

    await (service as any)
      .assertCanManageInterview(
        { id: ids.user, role: UserRole.USER },
        {
          createdBy: new Types.ObjectId(ids.creator),
          source: InterviewSource.CANDIDATE,
        },
      )
      .catch((error: unknown) =>
        expectApiError(error, HttpStatus.FORBIDDEN, INTERVIEW_MESSAGES.FORBIDDEN_MANAGE),
      );
  });

  it('should build interview list filter with search and ownership variants', async () => {
    const filter = await (service as any).buildInterviewListFilter(
      { id: ids.user, role: UserRole.USER },
      {
        page: 1,
        size: 10,
        search: 'backend.*',
        status: InterviewStatus.PUBLISHED,
        visibility: InterviewVisibility.PUBLIC,
        interviewType: InterviewType.TECHNICAL,
        ownership: 'not_taken',
        companyId: ids.company,
        collegeId: ids.college,
      },
      {
        takenInterviewIds: [ids.interview],
      },
    );
    expect(filter.$and).toBeDefined();
  });

  it('should resolve interview sort keys', () => {
    expect((service as any).resolveInterviewSort('popular')).toEqual({
      attemptsCount: -1,
      createdAt: -1,
      _id: -1,
    });
    expect((service as any).resolveInterviewSort('updated')).toEqual({
      updatedAt: -1,
      _id: -1,
    });
    expect((service as any).resolveInterviewSort('title')).toEqual({
      title: 1,
      createdAt: -1,
      _id: -1,
    });
    expect((service as any).resolveInterviewSort(undefined)).toEqual({
      createdAt: -1,
      _id: -1,
    });
  });

  it('should build company and college maps and saved sets', async () => {
    const companyMap = await (service as any).buildCompanyMap([ids.company, 'invalid']);
    expect(companyMap.get(ids.company)).toEqual({
      id: ids.company,
      name: 'Acme',
      logo: null,
    });

    const collegeMap = await (service as any).buildCollegeMap([ids.college]);
    expect(collegeMap.get(ids.college)?.name).toBe('Tech College');

    const emptySet = await (service as any).buildSavedInterviewIdSet(
      { id: ids.recruiter, role: UserRole.RECRUITER },
      [ids.interview],
    );
    expect(Array.from(emptySet)).toEqual([]);
  });

  it('should create interview and validate generated question constraints', async () => {
    await expect(
      service.createInterview(
        { id: ids.user, role: UserRole.USER },
        {
          title: 'Mock Interview',
          role: 'Backend Engineer',
          interviewType: InterviewType.TECHNICAL,
          questionCount: 2,
          durationMinutes: 20,
          techStack: ['Node.js'],
          questions: [' Custom Q1 ', ''],
        } as never,
      ),
    ).resolves.toBeTruthy();

    interviewAIService.generateInterviewQuestions.mockResolvedValueOnce([]);
    await service
      .createInterview(
        { id: ids.user, role: UserRole.USER },
        {
          title: 'Mock Interview',
          role: 'Backend Engineer',
          interviewType: InterviewType.TECHNICAL,
          questionCount: 2,
          durationMinutes: 20,
          techStack: ['Node.js'],
          generateQuestions: true,
        } as never,
      )
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.BAD_REQUEST,
          INTERVIEW_MESSAGES.QUESTIONS_REQUIRED,
        ),
      );
  });

  it('should list interviews and handle taken_by_me empty state', async () => {
    interviewSessionRepository.findInterviewIdsByUser.mockResolvedValueOnce([]);
    const empty = await service.listInterviews(
      { id: ids.user, role: UserRole.USER },
      { page: 1, size: 10, ownership: 'taken_by_me' } as never,
    );
    expect(empty.interviews).toEqual([]);

    const listed = await service.listInterviews(
      { id: ids.user, role: UserRole.USER },
      { page: 1, size: 10, ownership: 'all' } as never,
    );
    expect(listed.interviews).toHaveLength(1);
    expect(listed.interviews[0]).toEqual(
      expect.objectContaining({ id: ids.interview, isSaved: true }),
    );
  });

  it('should return interview details with creator and session metadata', async () => {
    const result = await service.getInterviewById(
      { id: ids.user, role: UserRole.USER },
      ids.interview,
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: ids.interview,
        creator: expect.objectContaining({ id: ids.user }),
      }),
    );
  });

  it('should update and delete interviews with not-found handling', async () => {
    const updated = await service.updateInterview(
      { id: ids.creator, role: UserRole.USER },
      ids.interview,
      {
        title: 'Updated',
        questions: ['Q1', 'Q2'],
      } as never,
    );
    expect(updated).toEqual(expect.objectContaining({ id: ids.interview }));

    interviewRepository.updateById.mockResolvedValueOnce(null);
    await service
      .updateInterview(
        { id: ids.creator, role: UserRole.USER },
        ids.interview,
        { title: 'Updated' } as never,
      )
      .catch((error) =>
        expectApiError(error, HttpStatus.NOT_FOUND, INTERVIEW_MESSAGES.NOT_FOUND),
      );

    await expect(
      service.deleteInterview({ id: ids.creator, role: UserRole.USER }, ids.interview),
    ).resolves.toBeTruthy();

    interviewRepository.deleteById.mockResolvedValueOnce(null);
    await service
      .deleteInterview({ id: ids.creator, role: UserRole.USER }, ids.interview)
      .catch((error) =>
        expectApiError(error, HttpStatus.NOT_FOUND, INTERVIEW_MESSAGES.NOT_FOUND),
      );
  });

  it('should regenerate questions on update when generateQuestions=true', async () => {
    interviewAIService.generateInterviewQuestions.mockResolvedValueOnce(['Q1', 'Q2']);
    interviewRepository.updateById.mockResolvedValueOnce({
      ...baseInterview(),
      questions: [{ question: 'Q1', order: 1 }],
      questionCount: 2,
      aiGenerated: true,
    } as never);

    await expect(
      service.updateInterview(
        { id: ids.creator, role: UserRole.USER },
        ids.interview,
        { generateQuestions: true, title: 'Updated by AI' } as never,
      ),
    ).resolves.toBeTruthy();
  });

  it('should start interview session and reject invalid role', async () => {
    await service
      .startInterviewSession(
        { id: ids.recruiter, role: UserRole.RECRUITER },
        ids.interview,
        { mode: InterviewMode.WEB } as never,
      )
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.FORBIDDEN,
          INTERVIEW_MESSAGES.SESSION_ROLE_FORBIDDEN,
        ),
      );

    const started = await service.startInterviewSession(
      { id: ids.user, role: UserRole.USER },
      ids.interview,
      { mode: InterviewMode.WEB, metadata: { source: 'unit-test' } } as never,
    );
    expect((started.session as { id?: string } | null)?.id).toBe(ids.session);
    expect(gamificationService.awardInterviewStarted).toHaveBeenCalled();
  });

  it('should complete interview session with evaluation and awards', async () => {
    interviewSessionRepository.findById.mockResolvedValueOnce({
      ...baseSession(),
      userId: new Types.ObjectId(ids.user),
    });
    const completed = await service.completeInterviewSession(
      { id: ids.user, role: UserRole.USER },
      ids.interview,
      ids.session,
      {
        status: InterviewSessionStatus.COMPLETED,
        transcript: [{ role: 'assistant', content: 'Q1' }, { role: 'user', content: 'A1' }],
        generateEvaluation: true,
      } as never,
    );

    expect(completed.evaluation).toEqual(expect.objectContaining({ totalScore: 88 }));
    expect(interviewRepository.incrementAttemptsAndTouch).toHaveBeenCalledWith(
      ids.interview,
      1,
    );
    expect(gamificationService.awardInterviewCompleted).toHaveBeenCalled();
  });

  it('should throw when session update returns null during completion', async () => {
    interviewSessionRepository.findById.mockResolvedValueOnce({
      ...baseSession(),
      userId: new Types.ObjectId(ids.user),
      interviewId: new Types.ObjectId(ids.interview),
    });
    interviewSessionRepository.updateById.mockResolvedValueOnce(null);

    await service
      .completeInterviewSession(
        { id: ids.user, role: UserRole.USER },
        ids.interview,
        ids.session,
        { transcript: [] } as never,
      )
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.NOT_FOUND,
          INTERVIEW_MESSAGES.SESSION_NOT_FOUND,
        ),
      );
  });

  it('should reject complete session on mismatch and ownership rules', async () => {
    interviewSessionRepository.findById.mockResolvedValueOnce({
      ...baseSession(),
      interviewId: new Types.ObjectId(ids.company),
    });
    await service
      .completeInterviewSession(
        { id: ids.user, role: UserRole.USER },
        ids.interview,
        ids.session,
        { transcript: [] } as never,
      )
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.BAD_REQUEST,
          INTERVIEW_MESSAGES.SESSION_MISMATCH,
        ),
      );

    interviewSessionRepository.findById.mockResolvedValueOnce({
      ...baseSession(),
      userId: new Types.ObjectId(ids.creator),
    });
    await service
      .completeInterviewSession(
        { id: ids.user, role: UserRole.USER },
        ids.interview,
        ids.session,
        { transcript: [] } as never,
      )
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.FORBIDDEN,
          INTERVIEW_MESSAGES.SESSION_FORBIDDEN,
        ),
      );
  });

  it('should list my sessions and fetch feedback access control', async () => {
    const listed = await service.listMyInterviewSessions(
      { id: ids.user, role: UserRole.USER },
      ids.interview,
      { page: 1, size: 10 } as never,
    );
    expect(listed.sessions).toHaveLength(1);

    const feedback = await service.getSessionFeedback(
      { id: ids.user, role: UserRole.USER },
      ids.session,
    );
    expect(
      (feedback.evaluation as { totalScore?: number } | null)?.totalScore,
    ).toBe(88);

    interviewSessionRepository.findById.mockResolvedValueOnce({
      ...baseSession(),
      userId: new Types.ObjectId(ids.creator),
    });
    await service
      .getSessionFeedback({ id: ids.user, role: UserRole.USER }, ids.session)
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.FORBIDDEN,
          INTERVIEW_MESSAGES.SESSION_FORBIDDEN,
        ),
      );

    interviewSessionRepository.findById.mockResolvedValueOnce({
      ...baseSession(),
      userId: new Types.ObjectId(ids.user),
    });
    aiEvaluationRepository.findBySessionId.mockResolvedValueOnce(null);
    await service
      .getSessionFeedback({ id: ids.user, role: UserRole.USER }, ids.session)
      .catch((error) =>
        expectApiError(
          error,
          HttpStatus.NOT_FOUND,
          INTERVIEW_MESSAGES.EVALUATION_NOT_FOUND,
        ),
      );
  });

  it('should return analytics and tolerate missing user profile lookup', async () => {
    userService.getUserByIdRaw
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValueOnce({
        id: ids.user,
        name: 'Candidate',
        email: 'candidate@example.com',
        role: UserRole.USER,
      });

    const analytics = await service.getInterviewAnalytics(
      { id: ids.creator, role: UserRole.USER },
      ids.interview,
      { page: 1, size: 10 } as never,
    );
    expect(analytics.summary.totalSessions).toBe(1);
    expect(analytics.recentSessions[0].candidate.id).toBe(ids.user);

    userService.getUserByIdRaw.mockResolvedValueOnce({
      id: ids.user,
      name: 'Candidate Two',
      email: 'candidate2@example.com',
      role: UserRole.USER,
    } as never);
    const analyticsWithUser = await service.getInterviewAnalytics(
      { id: ids.creator, role: UserRole.USER },
      ids.interview,
      { page: 1, size: 10 } as never,
    );
    expect(analyticsWithUser.recentSessions[0].candidate.name).toBe(
      'Candidate Two',
    );
  });

  it('should resolve session questions from AI, baseline, and fallback pools', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.12);

    const dynamic = await (service as any).resolveSessionQuestions({
      title: 'Mock',
      role: 'Backend',
      interviewType: InterviewType.TECHNICAL,
      level: 'mid',
      techStack: ['Node.js'],
      questionCount: 2,
      instructions: 'keep concise',
      questions: [{ question: 'Base1' }, { question: 'Base2' }],
    });
    expect(dynamic).toHaveLength(2);

    interviewAIService.generateInterviewQuestions.mockRejectedValueOnce(
      new Error('ai down'),
    );
    const baseline = await (service as any).resolveSessionQuestions({
      title: 'Mock',
      role: 'Backend',
      interviewType: InterviewType.TECHNICAL,
      level: 'mid',
      techStack: ['Node.js'],
      questionCount: 2,
      instructions: null,
      questions: [{ question: 'Base1' }, { question: 'Base2' }],
    });
    expect(baseline).toHaveLength(2);

    process.env.INTERVIEW_DYNAMIC_SESSION_QUESTIONS = 'false';
    const fallback = await (service as any).resolveSessionQuestions({
      title: 'Mock',
      role: 'Backend',
      interviewType: InterviewType.TECHNICAL,
      level: null,
      techStack: [],
      questionCount: 7,
      instructions: null,
      questions: [],
    });
    expect(fallback.length).toBe(7);
    randomSpy.mockRestore();
  });

  it('should build VAPI assistant payload with bounded defaults', () => {
    const payload = (service as any).buildVapiAssistantPayload({
      role: 'Backend Engineer',
      interviewType: InterviewType.TECHNICAL,
      level: 'senior',
      techStack: ['Node.js'],
      questionCount: 30,
      durationMinutes: 500,
      instructions: 'Focus on scale',
      questions: [{ question: 'Tell me about scale.' }],
    });

    expect(payload.name).toContain('Kaarya Backend Engineer Interviewer');
    expect(payload.maxDurationSeconds).toBe(7320);
    expect(payload.model.messages[0].content).toContain('Ask exactly 20 main questions');
  });

  it('should cover creation/list/access/manage helper edge branches', async () => {
    recruiterProfileService.listRecruiterMemberships.mockResolvedValueOnce({
      recruiterProfiles: [],
    });
    await (service as any)
      .resolveCreationContext(
        { id: ids.recruiter, role: UserRole.RECRUITER },
        {
          title: 'x',
          role: 'Backend',
          interviewType: InterviewType.TECHNICAL,
          questionCount: 2,
          durationMinutes: 20,
          techStack: [],
          companyId: undefined,
        },
      )
      .catch((error: unknown) =>
        expectApiError(
          error,
          HttpStatus.BAD_REQUEST,
          INTERVIEW_MESSAGES.COMPANY_CONTEXT_REQUIRED,
        ),
      );

    const createdByMeFilter = await (service as any).buildInterviewListFilter(
      { id: ids.user, role: UserRole.USER },
      {
        page: 1,
        size: 10,
        ownership: 'created_by_me',
      },
      {},
    );
    expect(createdByMeFilter.$and).toBeDefined();

    const takenByMeFilter = await (service as any).buildInterviewListFilter(
      { id: ids.user, role: UserRole.USER },
      {
        page: 1,
        size: 10,
        ownership: 'taken_by_me',
      },
      { takenInterviewIds: [ids.interview] },
    );
    expect(takenByMeFilter.$and).toBeDefined();

    const emptyFilter = await (service as any).buildInterviewListFilter(
      { id: ids.admin, role: UserRole.ADMIN },
      { page: 1, size: 10, ownership: 'all' },
      {},
    );
    expect(emptyFilter).toEqual({});

    await expect(
      (service as any).listAccessibleCollegeIds({
        id: ids.admin,
        role: UserRole.ADMIN,
      }),
    ).resolves.toEqual([]);
    await expect(
      (service as any).listAccessibleCollegeIds({
        id: ids.collegeUser,
        role: UserRole.COLLEGE,
      }),
    ).resolves.toEqual([ids.college]);
    await expect(
      (service as any).listAccessibleCollegeIds({
        id: ids.recruiter,
        role: UserRole.RECRUITER,
      }),
    ).resolves.toEqual([]);

    await (service as any)
      .assertCanAccessInterview(
        { id: ids.user, role: UserRole.USER },
        {
          id: ids.interview,
          createdBy: new Types.ObjectId(ids.creator),
          status: InterviewStatus.DRAFT,
          visibility: InterviewVisibility.PUBLIC,
        },
      )
      .catch((error: unknown) =>
        expectApiError(error, HttpStatus.FORBIDDEN, INTERVIEW_MESSAGES.FORBIDDEN_ACCESS),
      );

    await expect(
      (service as any).assertCanAccessInterview(
        { id: ids.user, role: UserRole.USER },
        {
          id: ids.interview,
          createdBy: new Types.ObjectId(ids.creator),
          status: InterviewStatus.PUBLISHED,
          visibility: InterviewVisibility.COLLEGE_ONLY,
          collegeId: new Types.ObjectId(ids.college),
        },
      ),
    ).resolves.toBeUndefined();

    await expect(
      (service as any).assertCanManageInterview(
        { id: ids.collegeUser, role: UserRole.COLLEGE },
        {
          createdBy: new Types.ObjectId(ids.creator),
          source: InterviewSource.COLLEGE,
          collegeId: new Types.ObjectId(ids.college),
        },
      ),
    ).resolves.toBeUndefined();

    expect(await (service as any).buildInterviewResponse(null, ids.user)).toBeNull();
    userService.getUserByIdRaw.mockRejectedValueOnce(new Error('missing'));
    const responseWithCreatorFailure = await (service as any).buildInterviewResponse(
      baseInterview(),
      ids.user,
      { includeCreator: true },
    );
    expect(responseWithCreatorFailure.creator).toBeNull();
  });

  it('should validate raw id fetchers for interview/session', async () => {
    await (service as any)
      .getInterviewByIdRaw('invalid-id')
      .catch((error: unknown) =>
        expectApiError(error, HttpStatus.BAD_REQUEST, INTERVIEW_MESSAGES.INVALID_ID),
      );
    await (service as any)
      .getSessionByIdRaw('invalid-id')
      .catch((error: unknown) =>
        expectApiError(
          error,
          HttpStatus.BAD_REQUEST,
          INTERVIEW_MESSAGES.INVALID_SESSION_ID,
        ),
      );

    interviewRepository.findById.mockResolvedValueOnce(null);
    await (service as any)
      .getInterviewByIdRaw(ids.interview)
      .catch((error: unknown) =>
        expectApiError(error, HttpStatus.NOT_FOUND, INTERVIEW_MESSAGES.NOT_FOUND),
      );

    interviewSessionRepository.findById.mockResolvedValueOnce(null);
    await (service as any)
      .getSessionByIdRaw(ids.session)
      .catch((error: unknown) =>
        expectApiError(
          error,
          HttpStatus.NOT_FOUND,
          INTERVIEW_MESSAGES.SESSION_NOT_FOUND,
        ),
      );
  });
});

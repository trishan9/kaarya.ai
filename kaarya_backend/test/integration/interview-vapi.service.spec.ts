import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiError } from 'src/common/errors/api-error';
import { INTERVIEW_MESSAGES } from 'src/constants/messages.constants';
import { InterviewService } from 'src/services/interview.service';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';
import { InterviewType } from 'src/types/interview-type.enum';
import { InterviewVisibility } from 'src/types/interview-visibility.enum';
import { InterviewStatus } from 'src/types/interview-status.enum';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('InterviewService VAPI behavior (integration)', () => {
  let module: TestingModule | undefined;
  let mongo: TestMongo | undefined;
  let interviewService: InterviewService;
  let userService: UserService;

  const initialEnv = {
    vapiToken: process.env.VAPI_WEB_TOKEN,
    vapiWorkflow: process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID,
    vapiWorkflowFallback: process.env.VAPI_WORKFLOW_ID,
    backendDomain: process.env.BACKEND_DOMAIN,
    vapiWebhookSecret: process.env.VAPI_WEBHOOK_SECRET,
    vapiPrivateKey: process.env.VAPI_PRIVATE_KEY,
    vapiWebhookHeaderName: process.env.VAPI_WEBHOOK_HEADER_NAME,
  };

  const expectApiError = async (
    promise: Promise<unknown>,
    status: HttpStatus,
    message: string,
  ) => {
    try {
      await promise;
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(status);
      expect(apiError.getResponse()).toMatchObject({ message });
    }
  };

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    interviewService = module.get(InterviewService);
    userService = module.get(UserService);
  });

  afterEach(async () => {
    process.env.VAPI_WEB_TOKEN = initialEnv.vapiToken;
    process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID = initialEnv.vapiWorkflow;
    process.env.VAPI_WORKFLOW_ID = initialEnv.vapiWorkflowFallback;
    process.env.BACKEND_DOMAIN = initialEnv.backendDomain;
    process.env.VAPI_WEBHOOK_SECRET = initialEnv.vapiWebhookSecret;
    process.env.VAPI_PRIVATE_KEY = initialEnv.vapiPrivateKey;
    process.env.VAPI_WEBHOOK_HEADER_NAME = initialEnv.vapiWebhookHeaderName;
    await clearDatabase();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    if (mongo) {
      await stopInMemoryMongo(mongo);
    }
  });

  it('should extract webhook secret from custom header and bearer fallback', () => {
    process.env.VAPI_WEBHOOK_HEADER_NAME = 'x-custom-vapi-secret';

    const fromCustomHeader = interviewService.extractVapiWebhookSecret({
      'x-custom-vapi-secret': ' custom-secret ',
    });
    expect(fromCustomHeader).toBe('custom-secret');

    const fromBearer = interviewService.extractVapiWebhookSecret({
      authorization: 'Bearer bearer-secret',
    });
    expect(fromBearer).toBe('bearer-secret');
  });

  it('should reject webhook secret when configuration is missing', async () => {
    delete process.env.VAPI_WEBHOOK_SECRET;
    delete process.env.VAPI_PRIVATE_KEY;

    await expectApiError(
      Promise.resolve().then(() => interviewService.assertVapiWebhookSecret('any')),
      HttpStatus.INTERNAL_SERVER_ERROR,
      INTERVIEW_MESSAGES.VAPI_WEBHOOK_SECRET_MISSING,
    );
  });

  it('should reject webhook secret when provided secret is invalid', async () => {
    process.env.VAPI_WEBHOOK_SECRET = 'expected-secret';

    await expectApiError(
      Promise.resolve().then(() =>
        interviewService.assertVapiWebhookSecret('wrong-secret'),
      ),
      HttpStatus.UNAUTHORIZED,
      INTERVIEW_MESSAGES.VAPI_WEBHOOK_UNAUTHORIZED,
    );
  });

  it('should return voice creation config when required env values are set', async () => {
    const user = await userService.createUser({
      name: 'Voice Config User',
      email: 'voice.config.user@example.com',
      role: UserRole.STUDENT,
    });

    process.env.VAPI_WEB_TOKEN = 'vapi-web-token';
    process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID = 'workflow-primary';
    process.env.BACKEND_DOMAIN = 'https://backend.example.com/';
    process.env.VAPI_WEBHOOK_HEADER_NAME = 'x-vapi-secret';

    const config = await interviewService.getVoiceCreationConfig({
      id: user.id,
      role: UserRole.STUDENT,
      email: user.email ?? undefined,
    });

    expect(config).toEqual(
      expect.objectContaining({
        vapi: expect.objectContaining({
          webToken: 'vapi-web-token',
          workflowId: 'workflow-primary',
          variableValues: expect.objectContaining({
            userid: user.id,
            userId: user.id,
            candidateId: user.id,
            useremail: user.email,
            webhookAuthHeaderName: 'x-vapi-secret',
            webhookUrl: 'https://backend.example.com/api/v1/interviews/vapi/generate',
          }),
        }),
      }),
    );
  });

  it('should reject voice creation config when token or workflow is missing', async () => {
    const user = await userService.createUser({
      name: 'Voice Missing User',
      email: 'voice.config.missing@example.com',
      role: UserRole.STUDENT,
    });

    delete process.env.VAPI_WEB_TOKEN;
    delete process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID;
    delete process.env.VAPI_WORKFLOW_ID;

    await expectApiError(
      interviewService.getVoiceCreationConfig({
        id: user.id,
        role: UserRole.STUDENT,
        email: user.email ?? undefined,
      }),
      HttpStatus.INTERNAL_SERVER_ERROR,
      INTERVIEW_MESSAGES.VAPI_WEB_TOKEN_MISSING,
    );

    process.env.VAPI_WEB_TOKEN = 'token-only';
    await expectApiError(
      interviewService.getVoiceCreationConfig({
        id: user.id,
        role: UserRole.STUDENT,
        email: user.email ?? undefined,
      }),
      HttpStatus.INTERNAL_SERVER_ERROR,
      INTERVIEW_MESSAGES.VAPI_WORKFLOW_MISSING,
    );
  });

  it('should reject vapi webhook creation when required payload fields are missing', async () => {
    await expectApiError(
      interviewService.createInterviewFromVapiWebhook({
        role: 'Backend Engineer',
      }),
      HttpStatus.BAD_REQUEST,
      INTERVIEW_MESSAGES.VAPI_USER_REQUIRED,
    );

    const user = await userService.createUser({
      name: 'Missing Role User',
      email: 'missing.role.user@example.com',
      role: UserRole.STUDENT,
    });
    await expectApiError(
      interviewService.createInterviewFromVapiWebhook({
        userId: user.id,
      }),
      HttpStatus.BAD_REQUEST,
      INTERVIEW_MESSAGES.VAPI_ROLE_REQUIRED,
    );
  });

  it('should create candidate interview from vapi webhook with normalized defaults', async () => {
    const user = await userService.createUser({
      name: 'Webhook Creator',
      email: 'webhook.creator@example.com',
      role: UserRole.STUDENT,
    });

    const created = await interviewService.createInterviewFromVapiWebhook({
      userId: user.id,
      role: 'Platform Engineer',
      type: 'system design',
      questionCount: 99,
      durationMinutes: 1,
      visibility: InterviewVisibility.PUBLIC,
      status: InterviewStatus.PUBLISHED,
      generateQuestions: false,
      techstack: ['Node.js', 'MongoDB'],
      tags: ['platform'],
      instructions: 'Keep this practical and scenario based.',
    });
    if (!created) {
      throw new Error('Expected created interview response');
    }

    expect(created).toEqual(
      expect.objectContaining({
        role: 'Platform Engineer',
        interviewType: InterviewType.SYSTEM_DESIGN,
        source: 'candidate',
        visibility: 'public',
        status: 'published',
        durationMinutes: 5,
        questionCount: 20,
      }),
    );
    expect(created.techStack).toEqual(['Node.js', 'MongoDB']);
    expect(created.tags).toEqual(['platform']);
  });
});

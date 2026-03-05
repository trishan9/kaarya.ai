import request from 'supertest';
import {
  BOOKMARK_MESSAGES,
  COMPANY_MESSAGES,
  INTERVIEW_MESSAGES,
  JOB_MESSAGES,
} from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;
const companyBase = `/api/v1/${ROUTES.COMPANY.BASE}`;
const jobBase = `/api/v1/${ROUTES.JOB.BASE}`;
const interviewBase = `/api/v1/${ROUTES.INTERVIEW.BASE}`;
const bookmarkBase = `/api/v1/${ROUTES.BOOKMARK.BASE}`;

describe('Interview + Bookmark routes (e2e)', () => {
  let context: E2EApp;
  let recruiterToken = '';
  let outsiderRecruiterToken = '';
  let studentToken = '';
  let secondStudentToken = '';
  let recruiterId = '';
  let studentId = '';
  let companyId = '';
  let interviewId = '';
  let secondInterviewId = '';
  let jobId = '';
  let sessionId = '';

  const initialEnv = {
    vapiToken: process.env.VAPI_WEB_TOKEN,
    vapiWorkflow: process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID,
    vapiWebhookSecret: process.env.VAPI_WEBHOOK_SECRET,
    vapiWebhookHeaderName: process.env.VAPI_WEBHOOK_HEADER_NAME,
  };

  const signupAndLogin = async (input: {
    name: string;
    email: string;
    role: 'recruiter' | 'student';
  }) => {
    const httpServer = context.app.getHttpServer();
    const signupResponse = await request(httpServer)
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: input.name,
        email: input.email,
        password: 'Password123',
        confirmPassword: 'Password123',
        role: input.role,
      })
      .expect(200);

    const loginResponse = await request(httpServer)
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: input.email,
        password: 'Password123',
      })
      .expect(200);

    return {
      id: signupResponse.body.data.id as string,
      token: loginResponse.body.data.accessToken as string,
    };
  };

  beforeAll(async () => {
    context = await createE2EApp();

    const recruiter = await signupAndLogin({
      name: 'Interview Recruiter',
      email: 'interview.recruiter.e2e@example.com',
      role: 'recruiter',
    });
    recruiterToken = recruiter.token;
    recruiterId = recruiter.id;

    const student = await signupAndLogin({
      name: 'Interview Student',
      email: 'interview.student.e2e@example.com',
      role: 'student',
    });
    studentToken = student.token;
    studentId = student.id;

    const secondStudent = await signupAndLogin({
      name: 'Second Student',
      email: 'interview.second.student.e2e@example.com',
      role: 'student',
    });
    secondStudentToken = secondStudent.token;

    const outsiderRecruiter = await signupAndLogin({
      name: 'Outsider Recruiter',
      email: 'interview.outsider.recruiter.e2e@example.com',
      role: 'recruiter',
    });
    outsiderRecruiterToken = outsiderRecruiter.token;
  });

  afterAll(async () => {
    process.env.VAPI_WEB_TOKEN = initialEnv.vapiToken;
    process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID = initialEnv.vapiWorkflow;
    process.env.VAPI_WEBHOOK_SECRET = initialEnv.vapiWebhookSecret;
    process.env.VAPI_WEBHOOK_HEADER_NAME = initialEnv.vapiWebhookHeaderName;
    await closeE2EApp(context);
  });

  it('should create recruiter workspace, interview, and job', async () => {
    const httpServer = context.app.getHttpServer();

    const createCompanyResponse = await request(httpServer)
      .post(companyBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        name: 'Interview Workspace',
        industry: 'Technology',
      })
      .expect(200);

    expect(createCompanyResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.CREATE_SUCCESS,
      }),
    );
    companyId = createCompanyResponse.body.data.id;
    expect(companyId).toBeTruthy();

    const createInterviewResponse = await request(httpServer)
      .post(interviewBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Backend Platform Interview',
        interviewType: 'technical',
        role: 'Backend Engineer',
        companyId,
        visibility: 'public',
        status: 'published',
        questionCount: 3,
        durationMinutes: 20,
        generateQuestions: false,
        questions: [
          'Describe your most recent backend scalability challenge.',
          'How do you design resilient API error handling?',
          'Explain your production observability strategy in detail.',
        ],
      })
      .expect(200);

    interviewId = createInterviewResponse.body.data.id;
    expect(createInterviewResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.CREATE_SUCCESS,
      }),
    );
    expect(createInterviewResponse.body.data.companyId).toBe(companyId);
    expect(interviewId).toBeTruthy();

    const createSecondInterviewResponse = await request(httpServer)
      .post(interviewBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Second Backend Interview',
        interviewType: 'technical',
        role: 'Backend Engineer',
        companyId,
        visibility: 'public',
        status: 'published',
        questionCount: 2,
        durationMinutes: 15,
        generateQuestions: false,
        questions: [
          'How would you scale a write-heavy API endpoint?',
          'Explain an outage postmortem you have contributed to.',
        ],
      })
      .expect(200);
    secondInterviewId = createSecondInterviewResponse.body.data.id;

    const createJobResponse = await request(httpServer)
      .post(jobBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        companyId,
        title: 'Platform Backend Engineer',
        description: 'Build and maintain scalable backend services.',
        requirements: { skills: ['Node.js', 'NestJS'] },
        workMode: 'remote',
        deadline: '2031-01-01T00:00:00.000Z',
      })
      .expect(200);

    expect(createJobResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.CREATE_SUCCESS,
      }),
    );
    jobId = createJobResponse.body.data.id;
    expect(jobId).toBeTruthy();
  });

  it('should expose interview discovery and details for students', async () => {
    const httpServer = context.app.getHttpServer();

    const listResponse = await request(httpServer)
      .get(interviewBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({
        page: 1,
        size: 10,
        search: 'backend platform',
        sortBy: 'newest',
        ownership: 'all',
      })
      .expect(200);

    expect(listResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.FETCH_ALL_SUCCESS,
      }),
    );
    expect(Array.isArray(listResponse.body.data.interviews)).toBe(true);
    expect(listResponse.body.data.interviews.length).toBeGreaterThanOrEqual(1);

    const byIdResponse = await request(httpServer)
      .get(`${interviewBase}/${interviewId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(byIdResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.FETCH_SUCCESS,
        data: expect.objectContaining({
          id: interviewId,
          companyId,
          questions: expect.any(Array),
        }),
      }),
    );
  });

  it('should reject invalid interview id in route params', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${interviewBase}/invalid-id`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
      }),
    );
  });

  it('should block outsider recruiter from updating interview and allow creator update', async () => {
    await request(context.app.getHttpServer())
      .patch(`${interviewBase}/${interviewId}`)
      .set('Authorization', `Bearer ${outsiderRecruiterToken}`)
      .send({
        title: 'Unauthorized interview update',
      })
      .expect(403);

    const updated = await request(context.app.getHttpServer())
      .patch(`${interviewBase}/${interviewId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Backend Platform Interview Updated',
        durationMinutes: 25,
      })
      .expect(200);

    expect(updated.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.UPDATE_SUCCESS,
        data: expect.objectContaining({
          id: interviewId,
          title: 'Backend Platform Interview Updated',
          durationMinutes: 25,
        }),
      }),
    );
  });

  it('should allow candidates to save and list bookmarked jobs and interviews', async () => {
    const httpServer = context.app.getHttpServer();

    const saveJobResponse = await request(httpServer)
      .post(`${bookmarkBase}/jobs/${jobId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(saveJobResponse.body.message).toBe(BOOKMARK_MESSAGES.SAVE_JOB_SUCCESS);

    const saveInterviewResponse = await request(httpServer)
      .post(`${bookmarkBase}/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(saveInterviewResponse.body.message).toBe(
      BOOKMARK_MESSAGES.SAVE_INTERVIEW_SUCCESS,
    );

    const listResponse = await request(httpServer)
      .get(`${bookmarkBase}/me`)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({
        type: 'all',
        sortBy: 'saved_at_desc',
        search: 'backend engineer',
      })
      .expect(200);

    expect(listResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: BOOKMARK_MESSAGES.FETCH_SUCCESS,
        data: expect.objectContaining({
          counts: expect.objectContaining({
            total: 2,
            jobs: 1,
            interviews: 1,
          }),
        }),
      }),
    );
  });

  it('should block bookmark routes for recruiter role', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${bookmarkBase}/me`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(403);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
      }),
    );
  });

  it('should start, complete, and list interview sessions for candidate', async () => {
    const httpServer = context.app.getHttpServer();

    const startResponse = await request(httpServer)
      .post(`${interviewBase}/${interviewId}/sessions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mode: 'web',
        metadata: { source: 'e2e' },
      })
      .expect(200);

    expect(startResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.SESSION_START_SUCCESS,
        data: expect.objectContaining({
          session: expect.objectContaining({
            status: 'in_progress',
          }),
        }),
      }),
    );
    sessionId = startResponse.body.data.session.id;
    expect(sessionId).toBeTruthy();

    const completeResponse = await request(httpServer)
      .patch(`${interviewBase}/${interviewId}/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'completed',
        generateEvaluation: false,
        transcript: [
          {
            role: 'assistant',
            content: 'Tell me about a backend migration you handled.',
          },
          {
            role: 'user',
            content: 'I migrated an API cluster with zero-downtime rollout.',
          },
        ],
      })
      .expect(200);

    expect(completeResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.SESSION_COMPLETE_SUCCESS,
        data: expect.objectContaining({
          session: expect.objectContaining({
            id: sessionId,
            status: 'completed',
          }),
          evaluation: null,
        }),
      }),
    );

    const mySessionsResponse = await request(httpServer)
      .get(`${interviewBase}/${interviewId}/sessions/me`)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(mySessionsResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.SESSION_FETCH_SUCCESS,
      }),
    );
    expect(Array.isArray(mySessionsResponse.body.data.sessions)).toBe(true);
    expect(mySessionsResponse.body.data.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it('should reject recruiter session start and cross-user completion', async () => {
    const httpServer = context.app.getHttpServer();

    const recruiterStart = await request(httpServer)
      .post(`${interviewBase}/${interviewId}/sessions`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ mode: 'web' })
      .expect(403);
    expect(recruiterStart.body).toEqual(
      expect.objectContaining({
        success: false,
      }),
    );

    const secondStudentComplete = await request(httpServer)
      .patch(`${interviewBase}/${interviewId}/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${secondStudentToken}`)
      .send({
        status: 'completed',
        transcript: [{ role: 'user', content: 'Unauthorized completion attempt.' }],
      })
      .expect(403);
    expect(secondStudentComplete.body.message).toBe(
      INTERVIEW_MESSAGES.SESSION_FORBIDDEN,
    );
  });

  it('should return session mismatch for interview/session mismatch', async () => {
    const response = await request(context.app.getHttpServer())
      .patch(`${interviewBase}/${secondInterviewId}/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'completed',
        generateEvaluation: false,
        transcript: [{ role: 'user', content: 'This belongs to another interview.' }],
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: INTERVIEW_MESSAGES.SESSION_MISMATCH,
      }),
    );
  });

  it('should return feedback-not-found when no evaluation is generated', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${interviewBase}/sessions/${sessionId}/feedback`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: INTERVIEW_MESSAGES.EVALUATION_NOT_FOUND,
      }),
    );
  });

  it('should return analytics for interview manager', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${interviewBase}/${interviewId}/analytics`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.ANALYTICS_FETCH_SUCCESS,
        data: expect.objectContaining({
          summary: expect.objectContaining({
            totalSessions: expect.any(Number),
            uniqueParticipants: expect.any(Number),
            completionRate: expect.any(Number),
          }),
        }),
      }),
    );
  });

  it('should delete interview by id and return not-found for subsequent fetch', async () => {
    const deleted = await request(context.app.getHttpServer())
      .delete(`${interviewBase}/${secondInterviewId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);

    expect(deleted.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.DELETE_SUCCESS,
        data: expect.objectContaining({
          id: secondInterviewId,
        }),
      }),
    );

    await request(context.app.getHttpServer())
      .get(`${interviewBase}/${secondInterviewId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);
  });

  it('should expose vapi endpoints for health, auth, validation and success', async () => {
    const httpServer = context.app.getHttpServer();

    const health = await request(httpServer)
      .get(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_GENERATE}`)
      .expect(200);
    expect(health.body.message).toBe(INTERVIEW_MESSAGES.VAPI_GENERATE_SUCCESS);

    delete process.env.VAPI_WEB_TOKEN;
    delete process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID;
    delete process.env.VAPI_WEBHOOK_SECRET;
    process.env.VAPI_WEBHOOK_HEADER_NAME = 'x-vapi-secret';

    const missingToken = await request(httpServer)
      .post(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_VOICE_CREATE_CONFIG}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(500);
    expect(missingToken.body.message).toBe(
      INTERVIEW_MESSAGES.VAPI_WEB_TOKEN_MISSING,
    );

    process.env.VAPI_WEB_TOKEN = 'vapi-web-token-test';
    const missingWorkflow = await request(httpServer)
      .post(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_VOICE_CREATE_CONFIG}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(500);
    expect(missingWorkflow.body.message).toBe(
      INTERVIEW_MESSAGES.VAPI_WORKFLOW_MISSING,
    );

    process.env.VAPI_INTERVIEW_CREATE_WORKFLOW_ID = 'workflow-123';
    const configSuccess = await request(httpServer)
      .post(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_VOICE_CREATE_CONFIG}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(configSuccess.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.VAPI_CREATION_CONFIG_SUCCESS,
        data: expect.objectContaining({
          vapi: expect.objectContaining({
            webToken: 'vapi-web-token-test',
            workflowId: 'workflow-123',
            variableValues: expect.objectContaining({
              userId: studentId,
              candidateId: studentId,
            }),
          }),
        }),
      }),
    );

    const missingSecret = await request(httpServer)
      .post(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_GENERATE}`)
      .send({
        role: 'Backend Engineer',
        userId: studentId,
        interviewType: 'technical',
        questions: ['What is your current backend system design approach?'],
        generateQuestions: false,
      })
      .expect(500);
    expect(missingSecret.body.message).toBe(
      INTERVIEW_MESSAGES.VAPI_WEBHOOK_SECRET_MISSING,
    );

    process.env.VAPI_WEBHOOK_SECRET = 'webhook-secret-test';

    const unauthorizedSecret = await request(httpServer)
      .post(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_GENERATE}`)
      .send({
        role: 'Backend Engineer',
        userId: studentId,
        interviewType: 'technical',
        questions: ['How would you design a resilient API error model?'],
        generateQuestions: false,
      })
      .expect(401);
    expect(unauthorizedSecret.body.message).toBe(
      INTERVIEW_MESSAGES.VAPI_WEBHOOK_UNAUTHORIZED,
    );

    const missingUser = await request(httpServer)
      .post(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_GENERATE}`)
      .set('x-vapi-secret', process.env.VAPI_WEBHOOK_SECRET)
      .send({
        role: 'Backend Engineer',
        interviewType: 'technical',
        questions: ['How would you tune a high-throughput backend endpoint?'],
        generateQuestions: false,
      })
      .expect(400);
    expect(missingUser.body.message).toBe(INTERVIEW_MESSAGES.VAPI_USER_REQUIRED);

    const missingRole = await request(httpServer)
      .post(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_GENERATE}`)
      .set('x-vapi-secret', process.env.VAPI_WEBHOOK_SECRET)
      .send({
        userId: studentId,
        interviewType: 'technical',
        questions: ['How do you evaluate API schema versioning trade-offs?'],
        generateQuestions: false,
      })
      .expect(400);
    expect(missingRole.body.message).toBe(INTERVIEW_MESSAGES.VAPI_ROLE_REQUIRED);

    const generated = await request(httpServer)
      .post(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_GENERATE}`)
      .set('x-vapi-secret', process.env.VAPI_WEBHOOK_SECRET)
      .send({
        userId: studentId,
        role: 'Platform Engineer',
        interviewType: 'technical',
        questionCount: 2,
        durationMinutes: 15,
        visibility: 'public',
        status: 'published',
        questions: [
          'Walk through a backend incident and your response strategy.',
          'How do you monitor distributed API services in production?',
        ],
        generateQuestions: false,
      })
      .expect(200);

    expect(generated.body).toEqual(
      expect.objectContaining({
        success: true,
        message: INTERVIEW_MESSAGES.VAPI_GENERATE_SUCCESS,
        data: expect.objectContaining({
          id: expect.any(String),
          role: 'Platform Engineer',
        }),
      }),
    );
  });

  it('should remove bookmarks for candidate', async () => {
    const httpServer = context.app.getHttpServer();

    const removeJobResponse = await request(httpServer)
      .delete(`${bookmarkBase}/jobs/${jobId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(removeJobResponse.body.message).toBe(
      BOOKMARK_MESSAGES.UNSAVE_JOB_SUCCESS,
    );
    expect(removeJobResponse.body.data.removed).toBe(true);

    const removeInterviewResponse = await request(httpServer)
      .delete(`${bookmarkBase}/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(removeInterviewResponse.body.message).toBe(
      BOOKMARK_MESSAGES.UNSAVE_INTERVIEW_SUCCESS,
    );
    expect(removeInterviewResponse.body.data.removed).toBe(true);
  });
});

import request from 'supertest';
import {
  COLLEGE_MESSAGES,
  COMPANY_MESSAGES,
  LEADERBOARD_MESSAGES,
  RESOURCE_MESSAGES,
} from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;
const collegeBase = `/api/v1/${ROUTES.COLLEGE.BASE}`;
const companyBase = `/api/v1/${ROUTES.COMPANY.BASE}`;
const resumeBuilderBase = `/api/v1/${ROUTES.RESUME_BUILDER.BASE}`;
const resourceBase = `/api/v1/${ROUTES.RESOURCE.BASE}`;
const leaderboardBase = `/api/v1/${ROUTES.LEADERBOARD.BASE}`;
const streamBase = `/api/v1/${ROUTES.STREAM.BASE}`;

describe('Platform feature routes (e2e)', () => {
  let context: E2EApp;
  let studentToken = '';
  let studentId = '';
  let recruiterToken = '';
  let recruiterId = '';
  let collegeToken = '';
  let collegeId = '';
  let companyId = '';
  let resumeBuilderId = '';
  let resourceCourseId = '';

  const signupAndLogin = async (input: {
    name: string;
    email: string;
    role: 'student' | 'recruiter' | 'college';
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

    const student = await signupAndLogin({
      name: 'Feature Student',
      email: 'feature.student.e2e@example.com',
      role: 'student',
    });
    studentId = student.id;
    studentToken = student.token;

    const recruiter = await signupAndLogin({
      name: 'Feature Recruiter',
      email: 'feature.recruiter.e2e@example.com',
      role: 'recruiter',
    });
    recruiterId = recruiter.id;
    recruiterToken = recruiter.token;

    const college = await signupAndLogin({
      name: 'Feature College',
      email: 'feature.college.e2e@example.com',
      role: 'college',
    });
    collegeToken = college.token;

    const createCollegeResponse = await request(context.app.getHttpServer())
      .post(collegeBase)
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({
        name: 'Feature College Workspace',
        institutionType: 'Engineering College',
      })
      .expect(200);

    collegeId = createCollegeResponse.body.data.id;

    await request(context.app.getHttpServer())
      .post(`${collegeBase}/${ROUTES.COLLEGE.JOIN_BY_CODE}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        inviteCode: createCollegeResponse.body.data.inviteCode,
        program: 'BSc CSIT',
        year: 3,
      })
      .expect(200);

    const createCompanyResponse = await request(context.app.getHttpServer())
      .post(companyBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        name: 'Feature Recruiter Workspace',
        industry: 'Technology',
      })
      .expect(200);

    companyId = createCompanyResponse.body.data.id;
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  it('should run complete resume builder HTTP flow for student users', async () => {
    const httpServer = context.app.getHttpServer();

    const createResponse = await request(httpServer)
      .post(resumeBuilderBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Feature Resume Draft',
        targetRole: 'Backend Engineer',
        content: {
          personalInfo: {
            firstName: 'Feature',
            lastName: 'Student',
          },
          skills: ['Node.js', 'NestJS'],
        },
      })
      .expect(201);

    expect(createResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Resume draft created.',
      }),
    );

    resumeBuilderId = createResponse.body.data.id;
    expect(resumeBuilderId).toBeTruthy();

    const listResponse = await request(httpServer)
      .get(`${resumeBuilderBase}/${ROUTES.RESUME_BUILDER.LIST}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(listResponse.body.message).toBe('Resumes fetched.');
    expect(Array.isArray(listResponse.body.data.items)).toBe(true);

    const byIdResponse = await request(httpServer)
      .get(`${resumeBuilderBase}/${resumeBuilderId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(byIdResponse.body.message).toBe('Resume fetched.');

    const updateResponse = await request(httpServer)
      .patch(`${resumeBuilderBase}/${resumeBuilderId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Feature Resume Draft Updated',
        content: {
          professionalSummary: 'Built and maintained scalable backend APIs.',
        },
      })
      .expect(200);

    expect(updateResponse.body.message).toBe('Resume updated.');

    const generatePdfResponse = await request(httpServer)
      .post(
        `${resumeBuilderBase}/${ROUTES.RESUME_BUILDER.GENERATE_PDF.replace(':id', resumeBuilderId)}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(generatePdfResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'PDF generated.',
        data: expect.objectContaining({
          pdfUrl: expect.any(String),
        }),
      }),
    );

    const saveResponse = await request(httpServer)
      .post(`${resumeBuilderBase}/${ROUTES.RESUME_BUILDER.SAVE.replace(':id', resumeBuilderId)}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(saveResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Resume saved.',
        data: expect.objectContaining({
          resumeId: expect.any(String),
          pdfUrl: expect.any(String),
        }),
      }),
    );

    await request(httpServer)
      .post(`${resumeBuilderBase}/${ROUTES.RESUME_BUILDER.AI_SUMMARY}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ skills: 'not-an-array' })
      .expect(400);

    const aiBulletsResponse = await request(httpServer)
      .post(`${resumeBuilderBase}/${ROUTES.RESUME_BUILDER.AI_EXPERIENCE_BULLETS}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        position: 'Backend Engineer',
        company: 'Feature Inc',
        description: 'Built APIs and improved backend latency by 35 percent.',
      })
      .expect(200);

    expect(aiBulletsResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Bullets generated.',
      }),
    );

    const aiSuggestionsResponse = await request(httpServer)
      .post(`${resumeBuilderBase}/${ROUTES.RESUME_BUILDER.AI_SUGGESTIONS}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        focus: 'summary',
        targetRole: 'Backend Engineer',
      })
      .expect(200);

    expect(aiSuggestionsResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Suggestions generated.',
      }),
    );

    await request(httpServer)
      .post(`${resumeBuilderBase}/${ROUTES.RESUME_BUILDER.ATS_SCAN}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);

    const deleteResponse = await request(httpServer)
      .delete(`${resumeBuilderBase}/${resumeBuilderId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(deleteResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Resume deleted.',
      }),
    );

    await request(httpServer)
      .get(`${resumeBuilderBase}/${resumeBuilderId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);
  });

  it('should block resume builder routes for recruiter role', async () => {
    await request(context.app.getHttpServer())
      .post(resumeBuilderBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Recruiter Resume', targetRole: 'N/A' })
      .expect(403);
  });

  it('should run resource course flow for student and recruiter users', async () => {
    const httpServer = context.app.getHttpServer();

    const studentCreate = await request(httpServer)
      .post(resourceBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Backend Interview Crash Course',
        category: 'Interview Preparation',
        generationMode: 'interview_prep',
        difficulty: 'intermediate',
        targetRoles: ['Backend Engineer'],
        chapterCount: 2,
        includeVideoRecommendations: false,
        visibility: 'private',
      })
      .expect(200);

    expect(studentCreate.body).toEqual(
      expect.objectContaining({
        success: true,
        message: RESOURCE_MESSAGES.CREATE_SUCCESS,
      }),
    );

    resourceCourseId = studentCreate.body.data.id;
    expect(resourceCourseId).toBeTruthy();

    const studentList = await request(httpServer)
      .get(resourceBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, ownership: 'mine' })
      .expect(200);

    expect(studentList.body.message).toBe(RESOURCE_MESSAGES.FETCH_ALL_SUCCESS);
    expect(Array.isArray(studentList.body.data.courses)).toBe(true);

    const byId = await request(httpServer)
      .get(`${resourceBase}/${resourceCourseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(byId.body.message).toBe(RESOURCE_MESSAGES.FETCH_SUCCESS);

    const update = await request(httpServer)
      .patch(`${resourceBase}/${resourceCourseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        visibility: 'public',
        includeVideoRecommendations: false,
      })
      .expect(200);

    expect(update.body.message).toBe(RESOURCE_MESSAGES.UPDATE_SUCCESS);

    const recruiterCreate = await request(httpServer)
      .post(resourceBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Recruiter Workspace Course',
        category: 'Hiring',
        generationMode: 'learn',
        difficulty: 'beginner',
        targetRoles: ['Recruiter'],
        chapterCount: 1,
        includeVideoRecommendations: false,
        companyId,
      })
      .expect(200);

    expect(recruiterCreate.body).toEqual(
      expect.objectContaining({
        success: true,
        message: RESOURCE_MESSAGES.CREATE_SUCCESS,
      }),
    );

    const deleteResponse = await request(httpServer)
      .delete(`${resourceBase}/${resourceCourseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(deleteResponse.body.message).toBe(RESOURCE_MESSAGES.DELETE_SUCCESS);

    await request(httpServer)
      .get(`${resourceBase}/${resourceCourseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);

    await request(httpServer)
      .post(resourceBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'x' })
      .expect(400);
  });

  it('should run global and college leaderboard flows with role restrictions', async () => {
    const httpServer = context.app.getHttpServer();

    const globalLeaderboard = await request(httpServer)
      .get(leaderboardBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ scope: 'global', page: 1, size: 20 })
      .expect(200);

    expect(globalLeaderboard.body).toEqual(
      expect.objectContaining({
        success: true,
        message: LEADERBOARD_MESSAGES.FETCH_SUCCESS,
      }),
    );

    const collegeLeaderboard = await request(httpServer)
      .get(leaderboardBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ scope: 'college', collegeId, page: 1, size: 20 })
      .expect(200);

    expect(collegeLeaderboard.body).toEqual(
      expect.objectContaining({
        success: true,
        message: LEADERBOARD_MESSAGES.FETCH_SUCCESS,
        data: expect.objectContaining({
          scope: 'college',
          workspace: expect.objectContaining({
            id: collegeId,
          }),
        }),
      }),
    );

    await request(httpServer)
      .get(leaderboardBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .query({ scope: 'college', collegeId, page: 1, size: 20 })
      .expect(403);
  });

  it('should run stream endpoint flows including config and guard/failure paths', async () => {
    const httpServer = context.app.getHttpServer();

    const configResponse = await request(httpServer)
      .get(`${streamBase}/${ROUTES.STREAM.CONFIG}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(configResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          chatEnabled: false,
          videoEnabled: false,
        }),
      }),
    );

    await request(httpServer)
      .post(`${streamBase}/${ROUTES.STREAM.CHAT_TOKEN}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(503);

    await request(httpServer)
      .post(`${streamBase}/${ROUTES.STREAM.VIDEO_TOKEN}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(503);

    const ensureChannels = await request(httpServer)
      .post(`${streamBase}/${ROUTES.STREAM.ENSURE_CHANNELS}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);

    expect(ensureChannels.body.message).toBe('Channels ensured');

    await request(httpServer)
      .post(`${streamBase}/${ROUTES.STREAM.ENSURE_CHANNEL_WITH}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({})
      .expect(500);

    const ensureWithTarget = await request(httpServer)
      .post(`${streamBase}/${ROUTES.STREAM.ENSURE_CHANNEL_WITH}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ targetUserId: recruiterId })
      .expect(201);

    expect(ensureWithTarget.body.message).toBe('Channel ensured');
  });

  it('should allow college role to invite students and expose workspace messages', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${collegeBase}/${ROUTES.COLLEGE.INVITES.replace(':id', collegeId)}`)
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({
        email: 'feature.invited.student@example.com',
        program: 'BSc CSIT',
        year: 2,
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.INVITE_CREATE_SUCCESS,
      }),
    );

    const recruiterCompanyView = await request(context.app.getHttpServer())
      .get(`${companyBase}/${companyId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);

    expect(recruiterCompanyView.body.message).toBe(COMPANY_MESSAGES.FETCH_SUCCESS);
    expect(recruiterCompanyView.body.data.id).toBe(companyId);
    expect(studentId).toBeTruthy();
  });
});

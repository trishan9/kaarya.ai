import { expect } from 'chai';
import request from 'supertest';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;
const companyBase = `/api/v1/${ROUTES.COMPANY.BASE}`;
const interviewBase = `/api/v1/${ROUTES.INTERVIEW.BASE}`;
const bookmarkBase = `/api/v1/${ROUTES.BOOKMARK.BASE}`;

describe('Interview + Bookmark routes (mocha)', () => {
  const setup =
    typeof beforeAll === 'function'
      ? beforeAll
      : (hook: (done?: Mocha.Done) => unknown) => before(hook);
  const teardown =
    typeof afterAll === 'function'
      ? afterAll
      : (hook: (done?: Mocha.Done) => unknown) => after(hook);

  let context: E2EApp;
  let recruiterToken = '';
  let studentToken = '';
  let companyId = '';
  let interviewId = '';
  let sessionId = '';

  setup(async () => {
    context = await createE2EApp();

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Mocha Interview Recruiter',
        email: 'mocha.interview.recruiter@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'recruiter',
      })
      .expect(200);

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Mocha Interview Student',
        email: 'mocha.interview.student@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'student',
      })
      .expect(200);

    const recruiterLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'mocha.interview.recruiter@example.com',
        password: 'Password123',
      })
      .expect(200);
    recruiterToken = recruiterLogin.body.data.accessToken;

    const studentLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'mocha.interview.student@example.com',
        password: 'Password123',
      })
      .expect(200);
    studentToken = studentLogin.body.data.accessToken;
  });

  teardown(async () => {
    await closeE2EApp(context);
  });

  it('should run interview and bookmark flow with recruiter + student roles', async () => {
    const createCompanyResponse = await request(context.app.getHttpServer())
      .post(companyBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        name: 'Mocha Interview Workspace',
      })
      .expect(200);
    companyId = createCompanyResponse.body.data.id;
    expect(companyId).to.be.a('string').and.not.empty;

    const createInterviewResponse = await request(context.app.getHttpServer())
      .post(interviewBase)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Mocha Platform Interview',
        interviewType: 'technical',
        role: 'Platform Engineer',
        companyId,
        visibility: 'public',
        status: 'published',
        generateQuestions: false,
        questionCount: 2,
        durationMinutes: 10,
        questions: [
          'Describe a production backend failure and mitigation.',
          'How do you manage reliability risk in API releases?',
        ],
      })
      .expect(200);
    interviewId = createInterviewResponse.body.data.id;
    expect(interviewId).to.be.a('string').and.not.empty;

    await request(context.app.getHttpServer())
      .post(`${bookmarkBase}/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const startResponse = await request(context.app.getHttpServer())
      .post(`${interviewBase}/${interviewId}/sessions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ mode: 'web' })
      .expect(200);
    sessionId = startResponse.body.data.session.id;
    expect(sessionId).to.be.a('string').and.not.empty;

    await request(context.app.getHttpServer())
      .patch(`${interviewBase}/${interviewId}/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        status: 'completed',
        generateEvaluation: false,
        transcript: [
          { role: 'assistant', content: 'Tell me about a reliability challenge.' },
          { role: 'user', content: 'I improved API resilience through retries.' },
        ],
      })
      .expect(200);

    const listBookmarks = await request(context.app.getHttpServer())
      .get(`${bookmarkBase}/me`)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ type: 'all' })
      .expect(200);
    expect(listBookmarks.body.data.counts.total).to.be.greaterThan(0);

    await request(context.app.getHttpServer())
      .delete(`${bookmarkBase}/interviews/${interviewId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(context.app.getHttpServer())
      .get(`${interviewBase}/${ROUTES.INTERVIEW.VAPI_GENERATE}`)
      .expect(200);
  });
});

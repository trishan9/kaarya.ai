import { expect } from 'chai';
import request from 'supertest';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;
const collegeBase = `/api/v1/${ROUTES.COLLEGE.BASE}`;
const jobBase = `/api/v1/${ROUTES.JOB.BASE}`;
const applicationBase = `/api/v1/${ROUTES.APPLICATION.BASE}`;

describe('Job Application routes (mocha)', () => {
  const setup =
    typeof beforeAll === 'function'
      ? beforeAll
      : (hook: (done?: Mocha.Done) => unknown) => before(hook);
  const teardown =
    typeof afterAll === 'function'
      ? afterAll
      : (hook: (done?: Mocha.Done) => unknown) => after(hook);

  let context: E2EApp;
  let collegeToken = '';
  let studentToken = '';
  let inviteCode = '';
  let jobId = '';
  let resumeId = '';

  setup(async () => {
    context = await createE2EApp();

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Mocha College',
        email: 'mocha.college@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'college',
      })
      .expect(200);

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Mocha Student',
        email: 'mocha.student@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'student',
      })
      .expect(200);

    const collegeLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({ email: 'mocha.college@example.com', password: 'Password123' })
      .expect(200);
    collegeToken = collegeLogin.body.data.accessToken;

    const studentLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({ email: 'mocha.student@example.com', password: 'Password123' })
      .expect(200);
    studentToken = studentLogin.body.data.accessToken;
  });

  teardown(async () => {
    await closeE2EApp(context);
  });

  it('should run the basic resume + application route flow', async () => {
    const createCollege = await request(context.app.getHttpServer())
      .post(collegeBase)
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({ name: 'Mocha Application College' })
      .expect(200);

    inviteCode = createCollege.body.data.inviteCode;
    expect(inviteCode).to.match(/^KC-/);

    await request(context.app.getHttpServer())
      .post(`${collegeBase}/${ROUTES.COLLEGE.JOIN_BY_CODE}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ inviteCode, program: 'BCA', year: 2 })
      .expect(200);

    const createJob = await request(context.app.getHttpServer())
      .post(jobBase)
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({
        title: 'Mocha College API Role',
        description: 'Build API features and maintain backend service quality.',
        deadline: '2032-01-01T00:00:00.000Z',
        requirements: { skills: ['API'] },
      })
      .expect(200);

    jobId = createJob.body.data.id;
    expect(jobId).to.be.a('string').and.not.empty;

    const uploadResume = await request(context.app.getHttpServer())
      .post(`${applicationBase}/${ROUTES.APPLICATION.RESUMES_ME}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', Buffer.from('%PDF-1.4'), {
        filename: 'mocha-resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    resumeId = uploadResume.body.data.id;
    expect(resumeId).to.be.a('string').and.not.empty;

    const apply = await request(context.app.getHttpServer())
      .post(
        `${applicationBase}/${ROUTES.APPLICATION.JOB_APPLICATIONS.replace(':jobId', jobId)}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ resumeId, coverLetter: 'Mocha candidate application' })
      .expect(200);

    expect(apply.body.data.status).to.equal('applied');
  });
});

import { expect } from 'chai';
import request from 'supertest';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;
const companyBase = `/api/v1/${ROUTES.COMPANY.BASE}`;
const jobBase = `/api/v1/${ROUTES.JOB.BASE}`;

describe('Company + Job routes (mocha)', () => {
  const setup =
    typeof beforeAll === 'function'
      ? beforeAll
      : (hook: (done?: Mocha.Done) => unknown) => before(hook);
  const teardown =
    typeof afterAll === 'function'
      ? afterAll
      : (hook: (done?: Mocha.Done) => unknown) => after(hook);

  let context: E2EApp;
  let recruiter1Token = '';
  let recruiter2Token = '';
  let companyId = '';
  let inviteCode = '';

  setup(async () => {
    context = await createE2EApp();

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Mocha Recruiter One',
        email: 'mocha.recruiter.one@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'recruiter',
      })
      .expect(200);

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Mocha Recruiter Two',
        email: 'mocha.recruiter.two@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'recruiter',
      })
      .expect(200);

    const login1 = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'mocha.recruiter.one@example.com',
        password: 'Password123',
      })
      .expect(200);
    recruiter1Token = login1.body.data.accessToken;

    const login2 = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'mocha.recruiter.two@example.com',
        password: 'Password123',
      })
      .expect(200);
    recruiter2Token = login2.body.data.accessToken;
  });

  teardown(async () => {
    await closeE2EApp(context);
  });

  it('should create company, join by invite code, and create job for workspace', async () => {
    const createCompanyResponse = await request(context.app.getHttpServer())
      .post(companyBase)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .send({
        name: 'Mocha Workspace',
        industry: 'SaaS',
      })
      .expect(200);

    companyId = createCompanyResponse.body.data.id;
    inviteCode = createCompanyResponse.body.data.inviteCode;
    expect(companyId).to.be.a('string').and.not.empty;
    expect(inviteCode).to.match(/^KR-/);

    await request(context.app.getHttpServer())
      .post(`${companyBase}/join-by-code`)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .send({
        inviteCode,
      })
      .expect(200);

    const createJobResponse = await request(context.app.getHttpServer())
      .post(jobBase)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .send({
        companyId,
        title: 'Mocha Backend Engineer',
        description: 'Build APIs and work on platform stability.',
        workMode: 'remote',
        requirements: { skills: ['NestJS'] },
        deadline: '2031-01-01T00:00:00.000Z',
      })
      .expect(200);

    expect(createJobResponse.body.data.companyId).to.equal(companyId);
    expect(createJobResponse.body.data.workMode).to.equal('remote');
  });
});

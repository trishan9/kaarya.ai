import request from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  COMPANY_MESSAGES,
  JOB_MESSAGES,
} from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { ApplicationSchemaClass } from 'src/entities/application.schema';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;
const companyBase = `/api/v1/${ROUTES.COMPANY.BASE}`;
const jobBase = `/api/v1/${ROUTES.JOB.BASE}`;
const applicationBase = `/api/v1/${ROUTES.APPLICATION.BASE}`;

describe('Company and Job Posting routes (e2e)', () => {
  let context: E2EApp;
  let recruiter1Token = '';
  let recruiter2Token = '';
  let recruiter3Id = '';
  let recruiter3Token = '';
  let studentId = '';
  let studentToken = '';
  let adminToken = '';
  let recruiter1CompanyId = '';
  let recruiter1SecondCompanyId = '';
  let recruiter1SecondCompanyInviteCode = '';
  let recruiter1CompanyInviteCode = '';
  let recruiter1CompanyLogo = '';
  let recruiter2CompanyId = '';
  let createdJobId = '';
  let createdJobId2 = '';
  let applicationModel: Model<ApplicationSchemaClass>;

  beforeAll(async () => {
    context = await createE2EApp();
    applicationModel = context.module.get(
      getModelToken(ApplicationSchemaClass.name),
    );

    const recruiter1Signup = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Recruiter One',
        email: 'recruiter.one@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'recruiter',
      })
      .expect(200);
    const recruiter1Id = recruiter1Signup.body.data.id;

    const recruiter1Login = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'recruiter.one@example.com',
        password: 'Password123',
      })
      .expect(200);
    recruiter1Token = recruiter1Login.body.data.accessToken;

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Recruiter Two',
        email: 'recruiter.two@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'recruiter',
      })
      .expect(200);

    const recruiter2Login = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'recruiter.two@example.com',
        password: 'Password123',
      })
      .expect(200);
    recruiter2Token = recruiter2Login.body.data.accessToken;

    const recruiter3Signup = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Recruiter Three',
        email: 'recruiter.three@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'recruiter',
      })
      .expect(200);
    recruiter3Id = recruiter3Signup.body.data.id;

    const recruiter3Login = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'recruiter.three@example.com',
        password: 'Password123',
      })
      .expect(200);
    recruiter3Token = recruiter3Login.body.data.accessToken;

    if (!recruiter1Id || !recruiter3Id) {
      throw new Error('Recruiter setup failed');
    }

    const studentSignup = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Student User',
        email: 'student.user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'student',
      })
      .expect(200);
    studentId = studentSignup.body.data.id;

    const studentLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'student.user@example.com',
        password: 'Password123',
      })
      .expect(200);
    studentToken = studentLogin.body.data.accessToken;

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Admin User',
        email: 'admin.user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'admin',
      })
      .expect(200);

    const adminLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'admin.user@example.com',
        password: 'Password123',
      })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  it('should allow a recruiter to create a company and link self', async () => {
    const response = await request(context.app.getHttpServer())
      .post(companyBase)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .field('name', 'Alpha Hiring Inc')
      .field('industry', 'Technology')
      .field('location', 'Remote')
      .field('designation', 'Talent Partner')
      .attach('logo', Buffer.from('fake-image'), {
        filename: 'company-logo.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.CREATE_SUCCESS,
        data: expect.objectContaining({
          name: 'Alpha Hiring Inc',
          logo: 'https://img.test/photo',
        }),
      }),
    );
    recruiter1CompanyId = response.body.data.id;
    recruiter1CompanyInviteCode = response.body.data.inviteCode;
    recruiter1CompanyLogo = response.body.data.logo;
    expect(recruiter1CompanyId).toBeTruthy();
    expect(recruiter1CompanyInviteCode).toBeTruthy();
  });

  it('should allow another recruiter to create a different company', async () => {
    const response = await request(context.app.getHttpServer())
      .post(companyBase)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .send({
        name: 'Beta Talent LLC',
        industry: 'Fintech',
      })
      .expect(200);

    recruiter2CompanyId = response.body.data.id;
    expect(recruiter2CompanyId).toBeTruthy();
  });

  it('should list companies and support search', async () => {
    const allCompanies = await request(context.app.getHttpServer())
      .get(companyBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(allCompanies.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.FETCH_ALL_SUCCESS,
      }),
    );
    expect(Array.isArray(allCompanies.body.data.companies)).toBe(true);

    const searchCompanies = await request(context.app.getHttpServer())
      .get(companyBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, search: 'Alpha Hiring' })
      .expect(200);

    expect(searchCompanies.body.data.companies.length).toBeGreaterThanOrEqual(1);
    expect(searchCompanies.body.data.companies[0].name).toContain('Alpha Hiring');
  });

  it('should return recruiter primary company context', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${companyBase}/me`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.FETCH_SUCCESS,
      }),
    );
    expect(response.body.data.company).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    );
  });

  it('should allow recruiter to create multiple companies and list workspaces', async () => {
    const createSecondCompanyResponse = await request(context.app.getHttpServer())
      .post(companyBase)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .send({
        name: 'Alpha Hiring Labs',
      })
      .expect(200);

    recruiter1SecondCompanyId = createSecondCompanyResponse.body.data.id;
    recruiter1SecondCompanyInviteCode = createSecondCompanyResponse.body.data.inviteCode;
    expect(recruiter1SecondCompanyId).toBeTruthy();
    expect(recruiter1SecondCompanyInviteCode).toBeTruthy();

    const listWorkspacesResponse = await request(context.app.getHttpServer())
      .get(`${companyBase}/workspaces/me`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(listWorkspacesResponse.body.data.workspaces.length).toBeGreaterThanOrEqual(
      2,
    );
    expect(listWorkspacesResponse.body.data.workspaces[0]).toEqual(
      expect.objectContaining({
        company: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
      }),
    );
  });

  it('should block students from creating companies', async () => {
    await request(context.app.getHttpServer())
      .post(companyBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Student Company',
      })
      .expect(403);
  });

  it('should reject non-image company logo uploads on create', async () => {
    const response = await request(context.app.getHttpServer())
      .post(companyBase)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .field('name', 'Invalid Logo Company')
      .attach('logo', Buffer.from('not-an-image'), {
        filename: 'invalid.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'Only image files are allowed.',
      }),
    );
  });

  it('should allow recruiter member to update company details and logo', async () => {
    const response = await request(context.app.getHttpServer())
      .patch(`${companyBase}/${recruiter1CompanyId}`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .field('location', 'Hybrid')
      .attach('logo', Buffer.from('fake-image-2'), {
        filename: 'company-logo-2.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.UPDATE_SUCCESS,
        data: expect.objectContaining({
          id: recruiter1CompanyId,
          location: 'Hybrid',
          logo: 'https://img.test/photo',
        }),
      }),
    );
  });

  it('should reject non-image company logo uploads on update', async () => {
    const response = await request(context.app.getHttpServer())
      .patch(`${companyBase}/${recruiter1CompanyId}`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .field('location', 'Remote')
      .attach('logo', Buffer.from('not-an-image'), {
        filename: 'invalid.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'Only image files are allowed.',
      }),
    );
  });

  it('should reject join-by-code with invalid invite code', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${companyBase}/join-by-code`)
      .set('Authorization', `Bearer ${recruiter3Token}`)
      .send({
        inviteCode: 'KR-NOTVALID',
      })
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        message: COMPANY_MESSAGES.INVITE_CODE_INVALID,
      }),
    );
  });

  it('should allow recruiter to join company by invite code', async () => {
    const joinResponse = await request(context.app.getHttpServer())
      .post(`${companyBase}/join-by-code`)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .send({
        inviteCode: recruiter1SecondCompanyInviteCode,
      })
      .expect(200);

    expect(joinResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.JOIN_BY_CODE_SUCCESS,
      }),
    );
    expect(joinResponse.body.data.workspace.id).toBe(recruiter1SecondCompanyId);
  });

  it('should allow recruiter member to reset invite code', async () => {
    const response = await request(context.app.getHttpServer())
      .post(`${companyBase}/${recruiter1SecondCompanyId}/invite-code/reset`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.INVITE_CODE_RESET_SUCCESS,
        data: expect.objectContaining({
          inviteCode: expect.any(String),
        }),
      }),
    );

    recruiter1SecondCompanyInviteCode = response.body.data.inviteCode;
  });

  it('should block non-member recruiter from resetting another workspace invite code', async () => {
    await request(context.app.getHttpServer())
      .post(`${companyBase}/${recruiter1CompanyId}/invite-code/reset`)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .expect(403);
  });

  it('should allow recruiter to invite another recruiter to company and join by invite code', async () => {
    const inviteResponse = await request(context.app.getHttpServer())
      .post(`${companyBase}/${recruiter1CompanyId}/invites`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .send({
        email: 'recruiter.three@example.com',
        designation: 'Recruiter',
      })
      .expect(200);

    expect(inviteResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.INVITE_CREATE_SUCCESS,
      }),
    );

    const inviteLink = inviteResponse.body?.data?.inviteLink as string | undefined;
    const inviteCode = inviteResponse.body?.data?.inviteCode as string | undefined;
    expect(typeof inviteLink).toBe('string');
    expect(typeof inviteCode).toBe('string');
    if (!inviteLink) {
      throw new Error('Invite link missing');
    }
    if (!inviteCode) {
      throw new Error('Invite code missing');
    }
    expect(inviteLink).toContain('inviteCode=');
    expect(inviteLink).toContain('companyId=');

    const joinResponse = await request(context.app.getHttpServer())
      .post(`${companyBase}/join-by-code`)
      .set('Authorization', `Bearer ${recruiter3Token}`)
      .send({
        inviteCode,
      })
      .expect(200);

    expect(joinResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.JOIN_BY_CODE_SUCCESS,
      }),
    );

    const recruitersResponse = await request(context.app.getHttpServer())
      .get(`${companyBase}/${recruiter1CompanyId}/recruiters`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .query({ page: 1, size: 20 })
      .expect(200);

    expect(recruitersResponse.body.data.members.length).toBeGreaterThanOrEqual(2);
  });

  it('should allow recruiter to create a job for their company', async () => {
    const response = await request(context.app.getHttpServer())
      .post(jobBase)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .send({
        companyId: recruiter1CompanyId,
        title: 'Senior Backend Engineer',
        description: 'Build reliable APIs and distributed services at scale.',
        location: 'Kathmandu, Bagmati',
        employmentType: 'Full-Time',
        engagementType: 'Internship',
        workMode: 'remote',
        salaryRange: 'NPR 10,00,000 - NPR 15,00,000',
        requirements: { skills: ['NestJS', 'MongoDB'] },
        deadline: '2030-01-01T00:00:00.000Z',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.CREATE_SUCCESS,
        data: expect.objectContaining({
          title: 'Senior Backend Engineer',
        }),
      }),
    );
    createdJobId = response.body.data.id;
    expect(response.body.data.companyId).toBe(recruiter1CompanyId);
    expect(response.body.data.company).toEqual(
      expect.objectContaining({
        id: recruiter1CompanyId,
        name: 'Alpha Hiring Inc',
        logo: recruiter1CompanyLogo,
      }),
    );
    expect(response.body.data.workMode).toBe('remote');
    expect(response.body.data.salaryRange).toBe(
      'NPR 10,00,000 - NPR 15,00,000',
    );
  });

  it('should allow admin to create a job for any company', async () => {
    const response = await request(context.app.getHttpServer())
      .post(jobBase)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: recruiter2CompanyId,
        title: 'Data Analyst',
        description: 'Analyze hiring funnel data and performance trends.',
        requirements: { skills: ['SQL', 'BI'] },
        deadline: '2030-06-01T00:00:00.000Z',
      })
      .expect(200);

    createdJobId2 = response.body.data.id;
    expect(response.body.data.companyId).toBe(recruiter2CompanyId);
  });

  it('should fetch a job by id', async () => {
    const response = await request(context.app.getHttpServer())
      .get(`${jobBase}/${createdJobId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.FETCH_SUCCESS,
        data: expect.objectContaining({
          id: createdJobId,
          company: expect.objectContaining({
            id: recruiter1CompanyId,
          }),
        }),
      }),
    );
  });

  it('should block recruiters from creating jobs for other companies', async () => {
    await request(context.app.getHttpServer())
      .post(jobBase)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .send({
        companyId: recruiter2CompanyId,
        title: 'Unauthorized Job',
        description: 'This should fail due to company mismatch.',
        requirements: {},
        deadline: '2030-01-01T00:00:00.000Z',
      })
      .expect(403);
  });

  it('should block students from creating jobs', async () => {
    await request(context.app.getHttpServer())
      .post(jobBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Student Unauthorized Job',
        description: 'Students should not be allowed to create jobs.',
        deadline: '2030-01-01T00:00:00.000Z',
      })
      .expect(403);
  });

  it('should block recruiter from updating another company job', async () => {
    await request(context.app.getHttpServer())
      .patch(`${jobBase}/${createdJobId}`)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .send({
        title: 'Should Not Update',
      })
      .expect(403);
  });

  it('should allow recruiter owner to update their job', async () => {
    const response = await request(context.app.getHttpServer())
      .patch(`${jobBase}/${createdJobId}`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .send({
        status: 'closed',
        workMode: 'hybrid',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.UPDATE_SUCCESS,
        data: expect.objectContaining({
          id: createdJobId,
          status: 'closed',
          workMode: 'hybrid',
        }),
      }),
    );
  });

  it('should allow admin to assign and remove recruiters from company', async () => {
    const assignResponse = await request(context.app.getHttpServer())
      .post(`${companyBase}/${recruiter1CompanyId}/recruiters`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recruiterId: recruiter3Id,
        designation: 'Talent Acquisition Partner',
      })
      .expect(200);

    expect(assignResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.RECRUITER_ASSIGN_SUCCESS,
      }),
    );

    const removeResponse = await request(context.app.getHttpServer())
      .delete(`${companyBase}/${recruiter1CompanyId}/recruiters/${recruiter3Id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(removeResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.RECRUITER_DELETE_SUCCESS,
      }),
    );
  });

  it('should list jobs for authenticated users', async () => {
    const response = await request(context.app.getHttpServer())
      .get(jobBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.FETCH_ALL_SUCCESS,
        data: expect.objectContaining({
          jobs: expect.any(Array),
          meta: expect.objectContaining({
            page: 1,
            size: 10,
          }),
          activeFeed: 'all',
        }),
      }),
    );
    const firstJob = response.body.data.jobs[0];
    expect(firstJob.company).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    );
  });

  it('should support backend feed filter for_you', async () => {
    const response = await request(context.app.getHttpServer())
      .get(jobBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, feed: 'for_you' })
      .expect(200);

    expect(response.body.data.activeFeed).toBe('for_you');
    expect(Array.isArray(response.body.data.jobs)).toBe(true);
  });

  it('should support remoteOnly filter from backend', async () => {
    const response = await request(context.app.getHttpServer())
      .get(jobBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, feed: 'for_you', remoteOnly: true })
      .expect(200);

    expect(response.body.data.activeFeed).toBe('for_you');
    expect(Array.isArray(response.body.data.jobs)).toBe(true);
  });

  it('should support backend feed filter trending', async () => {
    const response = await request(context.app.getHttpServer())
      .get(jobBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, feed: 'trending' })
      .expect(200);

    expect(response.body.data.activeFeed).toBe('trending');
    expect(Array.isArray(response.body.data.jobs)).toBe(true);
  });

  it('should support backend feed filter last_week', async () => {
    const response = await request(context.app.getHttpServer())
      .get(jobBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, feed: 'last_week' })
      .expect(200);

    expect(response.body.data.activeFeed).toBe('last_week');
    expect(Array.isArray(response.body.data.jobs)).toBe(true);
  });

  it('should support backend feed filters accepted and rejected', async () => {
    await applicationModel.create({
      jobId: createdJobId2,
      studentId,
      status: ApplicationStatus.ACCEPTED,
    });

    const accepted = await request(context.app.getHttpServer())
      .get(jobBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, feed: 'accepted' })
      .expect(200);

    expect(accepted.body.data.activeFeed).toBe('accepted');
    expect(Array.isArray(accepted.body.data.jobs)).toBe(true);

    const rejected = await request(context.app.getHttpServer())
      .get(jobBase)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, feed: 'rejected' })
      .expect(200);

    expect(rejected.body.data.activeFeed).toBe('rejected');
    expect(Array.isArray(rejected.body.data.jobs)).toBe(true);
  });

  it('should return empty accepted feed for recruiter users', async () => {
    const response = await request(context.app.getHttpServer())
      .get(jobBase)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .query({ page: 1, size: 10, feed: 'accepted' })
      .expect(200);

    expect(response.body.data.activeFeed).toBe('accepted');
    expect(response.body.data.jobs).toEqual([]);
  });

  it('should allow recruiter workspace members to view job applications', async () => {
    await applicationModel.create({
      jobId: createdJobId,
      studentId,
      status: ApplicationStatus.APPLIED,
    });
    const jobApplicationsPath = `${applicationBase}/${ROUTES.APPLICATION.JOB_APPLICATIONS.replace(
      ':jobId',
      createdJobId,
    )}`;

    const recruiterView = await request(context.app.getHttpServer())
      .get(jobApplicationsPath)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(recruiterView.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.APPLICATIONS_FETCH_SUCCESS,
      }),
    );
    expect(Array.isArray(recruiterView.body.data.applications)).toBe(true);

    await request(context.app.getHttpServer())
      .get(jobApplicationsPath)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .query({ page: 1, size: 10 })
      .expect(403);
  });

  it('should record job views and return metrics with application count', async () => {
    await applicationModel.create({
      jobId: createdJobId2,
      studentId: recruiter3Id,
      status: ApplicationStatus.APPLIED,
    });

    await request(context.app.getHttpServer())
      .post(`${jobBase}/${createdJobId2}/view`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    await request(context.app.getHttpServer())
      .post(`${jobBase}/${createdJobId2}/view`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    const metricsResponse = await request(context.app.getHttpServer())
      .get(`${jobBase}/${createdJobId2}/metrics`)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ syncApplicationsCount: true })
      .expect(200);

    expect(metricsResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.METRICS_FETCH_SUCCESS,
        data: expect.objectContaining({
          jobId: createdJobId2,
          viewsCount: expect.any(Number),
          applicationsCount: expect.any(Number),
        }),
      }),
    );
    expect(metricsResponse.body.data.viewsCount).toBeGreaterThanOrEqual(2);
    expect(metricsResponse.body.data.applicationsCount).toBeGreaterThanOrEqual(1);
  });

  it('should allow recruiter owner to delete their job', async () => {
    const response = await request(context.app.getHttpServer())
      .delete(`${jobBase}/${createdJobId}`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.DELETE_SUCCESS,
        data: expect.objectContaining({
          id: createdJobId,
        }),
      }),
    );
  });

  it('should allow admin to delete a company', async () => {
    const response = await request(context.app.getHttpServer())
      .delete(`${companyBase}/${recruiter2CompanyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COMPANY_MESSAGES.DELETE_SUCCESS,
        data: expect.objectContaining({
          id: recruiter2CompanyId,
        }),
      }),
    );
  });
});

import request from 'supertest';
import {
  COLLEGE_MESSAGES,
  JOB_MESSAGES,
} from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { createE2EApp, closeE2EApp, E2EApp } from '../helpers/e2e';

const authBase = `/api/v1/${ROUTES.AUTH.BASE}`;
const collegeBase = `/api/v1/${ROUTES.COLLEGE.BASE}`;
const jobBase = `/api/v1/${ROUTES.JOB.BASE}`;
const applicationBase = `/api/v1/${ROUTES.APPLICATION.BASE}`;

describe('College + Job Applications routes (e2e)', () => {
  let context: E2EApp;
  let collegeToken = '';
  let studentToken = '';
  let studentId = '';
  let secondStudentToken = '';
  let secondStudentId = '';
  let recruiterToken = '';
  let collegeId = '';
  let inviteCode = '';
  let jobId = '';
  let resumeId = '';
  let applicationId = '';
  const currentMonthKey = () => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  };

  beforeAll(async () => {
    context = await createE2EApp();

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'College Owner',
        email: 'college.owner.e2e@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'college',
      })
      .expect(200);

    const collegeLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'college.owner.e2e@example.com',
        password: 'Password123',
      })
      .expect(200);
    collegeToken = collegeLogin.body.data.accessToken;

    const studentSignup = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Application Student',
        email: 'application.student.e2e@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'student',
      })
      .expect(200);
    studentId = studentSignup.body.data.id;

    const studentLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'application.student.e2e@example.com',
        password: 'Password123',
      })
      .expect(200);
    studentToken = studentLogin.body.data.accessToken;

    const secondStudentSignup = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Application Student Two',
        email: 'application.student.two.e2e@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'student',
      })
      .expect(200);
    secondStudentId = secondStudentSignup.body.data.id;

    const secondStudentLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'application.student.two.e2e@example.com',
        password: 'Password123',
      })
      .expect(200);
    secondStudentToken = secondStudentLogin.body.data.accessToken;

    await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.SIGNUP}`)
      .send({
        name: 'Outsider Recruiter',
        email: 'outsider.recruiter.e2e@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        role: 'recruiter',
      })
      .expect(200);

    const recruiterLogin = await request(context.app.getHttpServer())
      .post(`${authBase}/${ROUTES.AUTH.LOGIN}`)
      .send({
        email: 'outsider.recruiter.e2e@example.com',
        password: 'Password123',
      })
      .expect(200);
    recruiterToken = recruiterLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await closeE2EApp(context);
  });

  it('should create a college workspace with image logo', async () => {
    const response = await request(context.app.getHttpServer())
      .post(collegeBase)
      .set('Authorization', `Bearer ${collegeToken}`)
      .field('name', 'Application College')
      .field('institutionType', 'Engineering College')
      .field('location', 'Kathmandu')
      .attach('logo', Buffer.from('logo'), {
        filename: 'college-logo.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.CREATE_SUCCESS,
      }),
    );

    collegeId = response.body.data.id;
    inviteCode = response.body.data.inviteCode;
    expect(collegeId).toBeTruthy();
    expect(inviteCode).toMatch(/^KC-/);
  });

  it('should reject invalid college logo uploads', async () => {
    const response = await request(context.app.getHttpServer())
      .post(collegeBase)
      .set('Authorization', `Bearer ${collegeToken}`)
      .field('name', 'Invalid Logo College')
      .attach('logo', Buffer.from('not-image'), {
        filename: 'logo.txt',
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

  it('should reject invalid college invite code and allow valid join', async () => {
    await request(context.app.getHttpServer())
      .post(`${collegeBase}/${ROUTES.COLLEGE.JOIN_BY_CODE}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ inviteCode: 'KR-NOT-REAL' })
      .expect(404);

    const response = await request(context.app.getHttpServer())
      .post(`${collegeBase}/${ROUTES.COLLEGE.JOIN_BY_CODE}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ inviteCode, program: 'BSc CSIT', year: 3 })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.JOIN_BY_CODE_SUCCESS,
      }),
    );
  });

  it('should create a college job posting and list student workspaces', async () => {
    const createJobResponse = await request(context.app.getHttpServer())
      .post(jobBase)
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({
        title: 'College Backend Internship',
        description: 'Build backend APIs and ship reliable platform features.',
        deadline: '2031-01-01T00:00:00.000Z',
        requirements: { skills: ['Node.js', 'NestJS'] },
      })
      .expect(200);

    jobId = createJobResponse.body.data.id;
    expect(jobId).toBeTruthy();
    expect(createJobResponse.body.data.visibility).toBe('college_only');

    const workspaces = await request(context.app.getHttpServer())
      .get(`${collegeBase}/${ROUTES.COLLEGE.WORKSPACES_ME}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(workspaces.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.WORKSPACES_FETCH_SUCCESS,
      }),
    );
  });

  it('should support college management routes for me/by-id/reset/list/remove', async () => {
    const myCollege = await request(context.app.getHttpServer())
      .get(`${collegeBase}/${ROUTES.COLLEGE.ME}`)
      .set('Authorization', `Bearer ${collegeToken}`)
      .expect(200);

    expect(myCollege.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.FETCH_SUCCESS,
      }),
    );
    expect(myCollege.body.data.college.id).toBe(collegeId);

    const byId = await request(context.app.getHttpServer())
      .get(`${collegeBase}/${collegeId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(byId.body.message).toBe(COLLEGE_MESSAGES.FETCH_SUCCESS);
    expect(byId.body.data.id).toBe(collegeId);

    const resetInvite = await request(context.app.getHttpServer())
      .post(`${collegeBase}/${ROUTES.COLLEGE.INVITE_CODE_RESET.replace(':id', collegeId)}`)
      .set('Authorization', `Bearer ${collegeToken}`)
      .expect(200);

    expect(resetInvite.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.INVITE_CODE_RESET_SUCCESS,
      }),
    );
    inviteCode = resetInvite.body.data.inviteCode;
    expect(inviteCode).toMatch(/^KC-/);

    await request(context.app.getHttpServer())
      .post(`${collegeBase}/${ROUTES.COLLEGE.JOIN_BY_CODE}`)
      .set('Authorization', `Bearer ${secondStudentToken}`)
      .send({ inviteCode, program: 'BIM', year: 2 })
      .expect(200);

    const listStudents = await request(context.app.getHttpServer())
      .get(`${collegeBase}/${ROUTES.COLLEGE.STUDENTS.replace(':id', collegeId)}`)
      .set('Authorization', `Bearer ${collegeToken}`)
      .query({ page: 1, size: 20 })
      .expect(200);

    expect(listStudents.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.FETCH_ALL_SUCCESS,
      }),
    );
    const memberIds = listStudents.body.data.members.map(
      (member: { student?: { id?: string }; studentId?: string }) =>
        member.student?.id ?? member.studentId,
    );
    expect(memberIds).toContain(studentId);
    expect(memberIds).toContain(secondStudentId);

    const removeStudent = await request(context.app.getHttpServer())
      .delete(
        `${collegeBase}/${ROUTES.COLLEGE.STUDENT_BY_ID.replace(':id', collegeId).replace(
          ':studentId',
          secondStudentId,
        )}`,
      )
      .set('Authorization', `Bearer ${collegeToken}`)
      .expect(200);

    expect(removeStudent.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.STUDENT_DELETE_SUCCESS,
      }),
    );
  });

  it('should validate resume uploads for job applications', async () => {
    await request(context.app.getHttpServer())
      .post(`${applicationBase}/${ROUTES.APPLICATION.RESUMES_ME}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);

    await request(context.app.getHttpServer())
      .post(`${applicationBase}/${ROUTES.APPLICATION.RESUMES_ME}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', Buffer.from('not-a-doc'), {
        filename: 'resume.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    const uploadResponse = await request(context.app.getHttpServer())
      .post(`${applicationBase}/${ROUTES.APPLICATION.RESUMES_ME}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', Buffer.from('%PDF-1.4'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    expect(uploadResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Resume uploaded successfully.',
      }),
    );

    resumeId = uploadResponse.body.data.id;
    expect(resumeId).toBeTruthy();
  });

  it('should enforce mutually exclusive resume inputs when applying', async () => {
    await request(context.app.getHttpServer())
      .post(
        `${applicationBase}/${ROUTES.APPLICATION.JOB_APPLICATIONS.replace(':jobId', jobId)}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ coverLetter: 'Interested in this role.' })
      .expect(400);

    await request(context.app.getHttpServer())
      .post(
        `${applicationBase}/${ROUTES.APPLICATION.JOB_APPLICATIONS.replace(':jobId', jobId)}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .field('resumeId', resumeId)
      .attach('resume', Buffer.from('%PDF-1.4'), {
        filename: 'duplicate.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
  });

  it('should create and fetch my application using existing resume id', async () => {
    const createResponse = await request(context.app.getHttpServer())
      .post(
        `${applicationBase}/${ROUTES.APPLICATION.JOB_APPLICATIONS.replace(':jobId', jobId)}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        resumeId,
        coverLetter: 'I have strong backend fundamentals and internship experience.',
        portfolioLinks: ['https://portfolio.example.com'],
      })
      .expect(200);

    expect(createResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.APPLICATION_CREATE_SUCCESS,
      }),
    );

    applicationId = createResponse.body.data.id;
    expect(applicationId).toBeTruthy();

    await request(context.app.getHttpServer())
      .post(
        `${applicationBase}/${ROUTES.APPLICATION.JOB_APPLICATIONS.replace(':jobId', jobId)}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ resumeId })
      .expect(409);

    const byJob = await request(context.app.getHttpServer())
      .get(
        `${applicationBase}/${ROUTES.APPLICATION.MY_APPLICATION_BY_JOB.replace(':jobId', jobId)}`,
      )
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(byJob.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.MY_APPLICATION_FETCH_SUCCESS,
      }),
    );

    const listMy = await request(context.app.getHttpServer())
      .get(`${applicationBase}/${ROUTES.APPLICATION.MY_APPLICATIONS}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ page: 1, size: 10, status: 'applied' })
      .expect(200);

    expect(listMy.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.MY_APPLICATIONS_FETCH_SUCCESS,
      }),
    );

    await request(context.app.getHttpServer())
      .get(`${applicationBase}/${ROUTES.APPLICATION.MY_APPLICATIONS_SUMMARY}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ month: currentMonthKey(), statuses: 'applied' })
      .expect(200);
  });

  it('should enforce access control for listing job applications', async () => {
    await request(context.app.getHttpServer())
      .get(
        `${applicationBase}/${ROUTES.APPLICATION.JOB_APPLICATIONS.replace(':jobId', jobId)}`,
      )
      .set('Authorization', `Bearer ${recruiterToken}`)
      .query({ page: 1, size: 10 })
      .expect(403);

    const response = await request(context.app.getHttpServer())
      .get(
        `${applicationBase}/${ROUTES.APPLICATION.JOB_APPLICATIONS.replace(':jobId', jobId)}`,
      )
      .set('Authorization', `Bearer ${collegeToken}`)
      .query({ page: 1, size: 10 })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.APPLICATIONS_FETCH_SUCCESS,
      }),
    );
  });

  it('should validate and update application status and resume activity', async () => {
    await request(context.app.getHttpServer())
      .patch(
        `${applicationBase}/${ROUTES.APPLICATION.APPLICATION_BY_JOB.replace(':jobId', jobId).replace(':applicationId', applicationId)}`,
      )
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({})
      .expect(400);

    const updateResponse = await request(context.app.getHttpServer())
      .patch(
        `${applicationBase}/${ROUTES.APPLICATION.APPLICATION_BY_JOB.replace(':jobId', jobId).replace(':applicationId', applicationId)}`,
      )
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({ status: 'shortlisted' })
      .expect(200);

    expect(updateResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.APPLICATION_UPDATE_SUCCESS,
      }),
    );

    await request(context.app.getHttpServer())
      .patch(
        `${applicationBase}/${ROUTES.APPLICATION.APPLICATION_RESUME_ACTIVITY.replace(':jobId', jobId).replace(':applicationId', applicationId)}`,
      )
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({ action: 'invalid' })
      .expect(400);

    const activityResponse = await request(context.app.getHttpServer())
      .patch(
        `${applicationBase}/${ROUTES.APPLICATION.APPLICATION_RESUME_ACTIVITY.replace(':jobId', jobId).replace(':applicationId', applicationId)}`,
      )
      .set('Authorization', `Bearer ${collegeToken}`)
      .send({ action: 'viewed' })
      .expect(200);

    expect(activityResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: JOB_MESSAGES.APPLICATION_RESUME_ACTIVITY_UPDATED,
      }),
    );
  });

  it('should reject deleting resume already linked to an application', async () => {
    const response = await request(context.app.getHttpServer())
      .delete(`${applicationBase}/${ROUTES.APPLICATION.RESUME_BY_ID.replace(':resumeId', resumeId)}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('already used');
  });

  it('should validate college update logo filter and allow valid update', async () => {
    await request(context.app.getHttpServer())
      .patch(`${collegeBase}/${collegeId}`)
      .set('Authorization', `Bearer ${collegeToken}`)
      .attach('logo', Buffer.from('bad'), {
        filename: 'logo.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    const updateResponse = await request(context.app.getHttpServer())
      .patch(`${collegeBase}/${collegeId}`)
      .set('Authorization', `Bearer ${collegeToken}`)
      .field('location', 'Lalitpur')
      .attach('logo', Buffer.from('image-two'), {
        filename: 'college-logo-2.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(updateResponse.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.UPDATE_SUCCESS,
      }),
    );

    await request(context.app.getHttpServer())
      .get(`${collegeBase}/${ROUTES.COLLEGE.METRICS.replace(':id', collegeId)}`)
      .set('Authorization', `Bearer ${collegeToken}`)
      .expect(200);
  });

  it('should delete college workspace and return not-found for later fetch', async () => {
    const deleted = await request(context.app.getHttpServer())
      .delete(`${collegeBase}/${collegeId}`)
      .set('Authorization', `Bearer ${collegeToken}`)
      .expect(200);

    expect(deleted.body).toEqual(
      expect.objectContaining({
        success: true,
        message: COLLEGE_MESSAGES.DELETE_SUCCESS,
      }),
    );

    await request(context.app.getHttpServer())
      .get(`${collegeBase}/${collegeId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);
  });
});

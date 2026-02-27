import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { JOB_MESSAGES } from 'src/constants/messages.constants';
import { JobApplicationController } from 'src/controllers/job-application.controller';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { JobApplicationService } from 'src/services/job-application.service';
import { ApplicationStatus } from 'src/types/application-status.enum';

describe('JobApplicationController', () => {
  let controller: JobApplicationController;
  let jobApplicationService: jest.Mocked<JobApplicationService>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const user = { id: new Types.ObjectId().toString(), role: 'student' } as never;
  const jobId = new Types.ObjectId().toString();
  const resumeId = new Types.ObjectId().toString();
  const applicationId = new Types.ObjectId().toString();

  beforeEach(() => {
    jobApplicationService = {
      getMyApplicationsSummary: jest.fn(),
      getMyApplications: jest.fn(),
      getMyApplicationForJob: jest.fn(),
      listMyResumes: jest.fn(),
      uploadMyResume: jest.fn(),
      deleteMyResume: jest.fn(),
      getJobApplications: jest.fn(),
      createJobApplication: jest.fn(),
      updateJobApplication: jest.fn(),
      updateApplicationResumeActivity: jest.fn(),
    } as unknown as jest.Mocked<JobApplicationService>;

    cloudinaryService = {
      uploadDocument: jest.fn(),
    } as unknown as jest.Mocked<CloudinaryService>;

    controller = new JobApplicationController(jobApplicationService, cloudinaryService);
  });

  it('should get my application summary and validate query', async () => {
    jobApplicationService.getMyApplicationsSummary.mockResolvedValue({
      total: 0,
    } as never);

    const result = await controller.getMyApplicationsSummary(
      { user },
      { month: '2026-02', statuses: 'applied,rejected' } as never,
    );

    expect(result.message).toBe('Application summary fetched successfully.');

    await expect(
      controller.getMyApplicationsSummary(
        { user },
        { month: '2026-13' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get my applications and handle invalid query', async () => {
    jobApplicationService.getMyApplications.mockResolvedValue({
      applications: [],
      meta: { page: 1, size: 10 },
    } as never);

    const result = await controller.getMyApplications(
      { user },
      { page: 1, size: 10, status: ApplicationStatus.APPLIED },
    );

    expect(result.message).toBe(JOB_MESSAGES.MY_APPLICATIONS_FETCH_SUCCESS);

    await expect(
      controller.getMyApplications({ user }, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get my application for a job and validate id', async () => {
    jobApplicationService.getMyApplicationForJob.mockResolvedValue({
      id: applicationId,
    } as never);

    const result = await controller.getMyApplicationForJob({ user }, jobId);
    expect(result.message).toBe(JOB_MESSAGES.MY_APPLICATION_FETCH_SUCCESS);

    await expect(
      controller.getMyApplicationForJob({ user }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should list my resumes and validate query', async () => {
    jobApplicationService.listMyResumes.mockResolvedValue({
      resumes: [],
      meta: { page: 1, size: 20 },
    } as never);

    const result = await controller.listMyResumes({ user }, { page: 1, size: 20 });
    expect(result.message).toBe('Resumes fetched successfully.');

    await expect(
      controller.listMyResumes({ user }, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should upload my resume and reject missing file', async () => {
    const file = {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf'),
      size: 20,
    } as Express.Multer.File;

    cloudinaryService.uploadDocument.mockResolvedValue({
      url: 'https://cdn.example.com/resume.pdf',
      publicId: 'pub-1',
      bytes: 1024,
      originalFilename: 'resume.pdf',
    } as never);
    jobApplicationService.uploadMyResume.mockResolvedValue({
      id: resumeId,
    } as never);

    const uploaded = await controller.uploadMyResume({ user }, file);
    expect(uploaded.message).toBe('Resume uploaded successfully.');

    await expect(
      controller.uploadMyResume({ user }, undefined),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should reject upload when transformed payload is invalid', async () => {
    const file = {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf'),
      size: 20,
    } as Express.Multer.File;

    cloudinaryService.uploadDocument.mockResolvedValue({
      url: 'https://cdn.example.com/resume.pdf',
      publicId: 'pub-1',
      bytes: -1,
      originalFilename: 'resume.pdf',
    } as never);

    await expect(controller.uploadMyResume({ user }, file)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('should delete my resume and validate id', async () => {
    jobApplicationService.deleteMyResume.mockResolvedValue({
      deleted: true,
      id: resumeId,
    } as never);

    const result = await controller.deleteMyResume({ user }, resumeId);
    expect(result.message).toBe('Resume deleted successfully.');

    await expect(
      controller.deleteMyResume({ user }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get applications for a job and validate inputs', async () => {
    jobApplicationService.getJobApplications.mockResolvedValue({
      applications: [],
      meta: { page: 1, size: 10 },
    } as never);

    const result = await controller.getJobApplications(
      { user },
      jobId,
      { page: 1, size: 10 },
    );
    expect(result.message).toBe(JOB_MESSAGES.APPLICATIONS_FETCH_SUCCESS);

    await expect(
      controller.getJobApplications({ user }, 'bad-id', { page: 1, size: 10 }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.getJobApplications({ user }, jobId, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should create job application using existing resume id', async () => {
    jobApplicationService.createJobApplication.mockResolvedValue({
      id: applicationId,
    } as never);

    const result = await controller.createJobApplication(
      { user },
      jobId,
      { resumeId },
      undefined,
    );

    expect(jobApplicationService.createJobApplication).toHaveBeenCalledWith(
      user,
      jobId,
      expect.objectContaining({ resumeId }),
    );
    expect(result.message).toBe(JOB_MESSAGES.APPLICATION_CREATE_SUCCESS);
  });

  it('should create job application with uploaded resume', async () => {
    const file = {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf'),
      size: 20,
    } as Express.Multer.File;

    cloudinaryService.uploadDocument.mockResolvedValue({
      url: 'https://cdn.example.com/resume.pdf',
      publicId: 'pub-2',
      bytes: 1200,
      originalFilename: 'resume.pdf',
    } as never);
    jobApplicationService.createJobApplication.mockResolvedValue({
      id: applicationId,
    } as never);

    const result = await controller.createJobApplication(
      { user },
      jobId,
      { coverLetter: 'Hello' } as never,
      file,
    );

    expect(cloudinaryService.uploadDocument).toHaveBeenCalledWith(file);
    expect(result.message).toBe(JOB_MESSAGES.APPLICATION_CREATE_SUCCESS);
  });

  it('should reject create application when neither or both resume inputs are provided', async () => {
    await expect(
      controller.createJobApplication(
        { user },
        jobId,
        {} as never,
        undefined,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    const file = {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf'),
      size: 20,
    } as Express.Multer.File;

    await expect(
      controller.createJobApplication({ user }, jobId, { resumeId }, file),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should reject create application when ids/payload are invalid', async () => {
    await expect(
      controller.createJobApplication({ user }, 'bad-id', { resumeId }, undefined),
    ).rejects.toBeInstanceOf(ApiError);

    cloudinaryService.uploadDocument.mockResolvedValue({
      url: 'https://cdn.example.com/resume.pdf',
      publicId: 'pub-2',
      bytes: -1,
      originalFilename: 'resume.pdf',
    } as never);

    const file = {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('pdf'),
      size: 20,
    } as Express.Multer.File;

    await expect(
      controller.createJobApplication(
        { user },
        jobId,
        { coverLetter: 'Hello' } as never,
        file,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should update job application and validate ids/payload', async () => {
    jobApplicationService.updateJobApplication.mockResolvedValue({
      id: applicationId,
      status: ApplicationStatus.SHORTLISTED,
    } as never);

    const result = await controller.updateJobApplication(
      { user },
      jobId,
      applicationId,
      { status: ApplicationStatus.SHORTLISTED },
    );
    expect(result.message).toBe(JOB_MESSAGES.APPLICATION_UPDATE_SUCCESS);

    await expect(
      controller.updateJobApplication(
        { user },
        'bad-id',
        applicationId,
        { status: ApplicationStatus.SHORTLISTED },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.updateJobApplication(
        { user },
        jobId,
        'bad-id',
        { status: ApplicationStatus.SHORTLISTED },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.updateJobApplication({ user }, jobId, applicationId, {} as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should update resume activity and validate ids/payload', async () => {
    jobApplicationService.updateApplicationResumeActivity.mockResolvedValue({
      updated: true,
    } as never);

    const result = await controller.updateApplicationResumeActivity(
      { user },
      jobId,
      applicationId,
      { action: 'viewed' },
    );

    expect(result.message).toBe(JOB_MESSAGES.APPLICATION_RESUME_ACTIVITY_UPDATED);

    await expect(
      controller.updateApplicationResumeActivity(
        { user },
        'bad-id',
        applicationId,
        { action: 'viewed' },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.updateApplicationResumeActivity(
        { user },
        jobId,
        'bad-id',
        { action: 'viewed' },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.updateApplicationResumeActivity(
        { user },
        jobId,
        applicationId,
        { action: 'invalid' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });
});


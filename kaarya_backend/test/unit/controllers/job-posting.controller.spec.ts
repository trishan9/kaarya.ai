import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { JOB_MESSAGES } from 'src/constants/messages.constants';
import { JobPostingController } from 'src/controllers/job-posting.controller';
import { JobPostingService } from 'src/services/job-posting.service';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('JobPostingController', () => {
  let controller: JobPostingController;
  let jobPostingService: jest.Mocked<JobPostingService>;

  const user = {
    id: new Types.ObjectId().toString(),
    role: UserRole.STUDENT,
  } as never;
  const recruiter = {
    id: new Types.ObjectId().toString(),
    role: UserRole.RECRUITER,
  } as never;
  const jobId = new Types.ObjectId().toString();
  const companyId = new Types.ObjectId().toString();

  beforeEach(() => {
    jobPostingService = {
      getAllJobPostings: jest.fn(),
      getJobPostingById: jest.fn(),
      recordJobView: jest.fn(),
      getJobPostingMetrics: jest.fn(),
      createJobPosting: jest.fn(),
      updateJobPosting: jest.fn(),
      deleteJobPosting: jest.fn(),
    } as unknown as jest.Mocked<JobPostingService>;

    controller = new JobPostingController(jobPostingService);
  });

  it('should get all jobs and validate query payload', async () => {
    jobPostingService.getAllJobPostings.mockResolvedValue({
      jobs: [],
      meta: { page: 1, size: 10, totalItems: 0, totalPages: 0, hasNextPage: false },
      activeFeed: JobFeedFilter.ALL,
    } as never);

    const result = await controller.getAllJobs(
      { user },
      { page: 1, size: 10, feed: JobFeedFilter.ALL },
    );

    expect(result.message).toBe(JOB_MESSAGES.FETCH_ALL_SUCCESS);
    expect(jobPostingService.getAllJobPostings).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ page: 1, size: 10 }),
    );

    await expect(
      controller.getAllJobs({ user }, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get job by id and reject invalid id', async () => {
    jobPostingService.getJobPostingById.mockResolvedValue({
      id: jobId,
      title: 'Backend Engineer',
    } as never);

    const result = await controller.getJobById({ user }, jobId);
    expect(result.message).toBe(JOB_MESSAGES.FETCH_SUCCESS);

    await expect(controller.getJobById({ user }, 'bad-id')).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('should record job view and reject invalid id', async () => {
    jobPostingService.recordJobView.mockResolvedValue({
      jobId,
      viewed: true,
    } as never);

    const result = await controller.recordJobView({ user }, jobId);
    expect(result.message).toBe(JOB_MESSAGES.VIEW_RECORDED);

    await expect(
      controller.recordJobView({ user }, 'invalid-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get metrics and validate id/query', async () => {
    jobPostingService.getJobPostingMetrics.mockResolvedValue({
      jobId,
      viewsCount: 10,
      applicationsCount: 3,
    } as never);

    const result = await controller.getJobMetrics(jobId, {
      syncApplicationsCount: true,
    });
    expect(result.message).toBe(JOB_MESSAGES.METRICS_FETCH_SUCCESS);

    const withDefaults = await controller.getJobMetrics(jobId, undefined as never);
    expect(withDefaults.message).toBe(JOB_MESSAGES.METRICS_FETCH_SUCCESS);

    await expect(
      controller.getJobMetrics('', { syncApplicationsCount: true }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.getJobMetrics(jobId, { syncApplicationsCount: [] as never }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should create job posting and reject invalid payload', async () => {
    jobPostingService.createJobPosting.mockResolvedValue({
      id: jobId,
      title: 'Backend Engineer',
    } as never);

    const payload = {
      companyId,
      title: 'Backend Engineer',
      description: 'Build scalable APIs and distributed services.',
      deadline: new Date('2030-01-01T00:00:00.000Z'),
      workMode: JobWorkMode.HYBRID,
      requirements: {},
      status: JobPostingStatus.OPEN,
    };

    const result = await controller.createJobPosting({ user: recruiter }, payload);
    expect(result.message).toBe(JOB_MESSAGES.CREATE_SUCCESS);
    expect(jobPostingService.createJobPosting).toHaveBeenCalledWith(
      recruiter,
      expect.objectContaining({ title: 'Backend Engineer' }),
    );

    await expect(
      controller.createJobPosting(
        { user: recruiter },
        { ...payload, title: 'x' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should update job posting and validate id/payload', async () => {
    jobPostingService.updateJobPosting.mockResolvedValue({
      id: jobId,
      status: JobPostingStatus.CLOSED,
    } as never);

    const result = await controller.updateJobPosting(
      { user: recruiter },
      jobId,
      { status: JobPostingStatus.CLOSED },
    );
    expect(result.message).toBe(JOB_MESSAGES.UPDATE_SUCCESS);

    await expect(
      controller.updateJobPosting(
        { user: recruiter },
        'bad-id',
        { status: JobPostingStatus.CLOSED },
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.updateJobPosting({ user: recruiter }, jobId, {} as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should delete job posting and reject invalid id', async () => {
    jobPostingService.deleteJobPosting.mockResolvedValue({
      id: jobId,
      deleted: true,
    } as never);

    const result = await controller.deleteJobPosting({ user: recruiter }, jobId);
    expect(result.message).toBe(JOB_MESSAGES.DELETE_SUCCESS);

    await expect(
      controller.deleteJobPosting({ user: recruiter }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

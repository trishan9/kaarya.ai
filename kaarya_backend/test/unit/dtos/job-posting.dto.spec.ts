import {
  CreateJobPostingDTO,
  JobMetricsQueryDTO,
  JobPostingQueryDTO,
  UpdateJobPostingDTO,
} from 'src/dtos/jobs/job-posting.dto';
import { JobFeedFilter } from 'src/types/job-feed-filter.enum';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';

describe('JobPosting DTOs', () => {
  const objectId = '507f191e810c19729de860ea';

  it('should parse create payload with optional preprocessors', () => {
    const parsed = CreateJobPostingDTO.parse({
      title: '  Backend Engineer  ',
      description: '  Build and scale APIs for core business workflows.  ',
      location: '   ',
      employmentType: ' Full-Time ',
      engagementType: ' Internship ',
      workMode: JobWorkMode.REMOTE,
      salaryRange: '  ',
      deadline: '2030-01-01T00:00:00.000Z',
      requirements: { language: 'TypeScript' },
      companyId: objectId,
      visibility: JobVisibility.GLOBAL,
    });

    expect(parsed.title).toBe('Backend Engineer');
    expect(parsed.description).toBe('Build and scale APIs for core business workflows.');
    expect(parsed.location).toBeUndefined();
    expect(parsed.salaryRange).toBeUndefined();
    expect(parsed.deadline).toBeInstanceOf(Date);
  });

  it('should validate update payload and require at least one field', () => {
    const valid = UpdateJobPostingDTO.safeParse({
      title: ' Updated title ',
      location: '',
      status: JobPostingStatus.CLOSED,
    });
    const invalid = UpdateJobPostingDTO.safeParse({});

    expect(valid.success).toBe(true);
    expect(valid.data?.title).toBe('Updated title');
    expect(valid.data?.location).toBeUndefined();
    expect(invalid.success).toBe(false);
  });

  it('should parse query defaults and coercions', () => {
    const defaults = JobPostingQueryDTO.parse({});
    const filtered = JobPostingQueryDTO.parse({
      page: '2',
      size: '20',
      feed: JobFeedFilter.FOR_YOU,
      search: '  backend ',
      status: JobPostingStatus.OPEN,
      companyId: objectId,
      collegeId: objectId,
      visibility: JobVisibility.COLLEGE_ONLY,
      location: ' Kathmandu ',
      employmentType: ' Full-Time ',
      engagementType: '',
      workMode: JobWorkMode.HYBRID,
      remoteOnly: 'true',
      createdFrom: '2026-01-01T00:00:00.000Z',
      createdTo: '',
      deadlineFrom: null,
      deadlineTo: '2026-12-31T00:00:00.000Z',
    });
    const booleanRemote = JobPostingQueryDTO.parse({
      remoteOnly: false,
    });

    expect(defaults).toEqual(
      expect.objectContaining({
        page: 1,
        size: 10,
        feed: JobFeedFilter.ALL,
      }),
    );
    expect(filtered.search).toBe('backend');
    expect(filtered.location).toBe('Kathmandu');
    expect(filtered.employmentType).toBe('Full-Time');
    expect(filtered.engagementType).toBeUndefined();
    expect(filtered.remoteOnly).toBe(true);
    expect(filtered.createdFrom).toBeInstanceOf(Date);
    expect(filtered.createdTo).toBeUndefined();
    expect(filtered.deadlineFrom).toBeUndefined();
    expect(filtered.deadlineTo).toBeInstanceOf(Date);
    expect(booleanRemote.remoteOnly).toBe(false);
  });

  it('should parse metrics query defaults and boolean coercion', () => {
    const defaults = JobMetricsQueryDTO.parse({});
    const emptyString = JobMetricsQueryDTO.parse({ syncApplicationsCount: '' });
    const falseString = JobMetricsQueryDTO.parse({ syncApplicationsCount: 'false' });
    const explicit = JobMetricsQueryDTO.parse({ syncApplicationsCount: true });

    expect(defaults.syncApplicationsCount).toBe(true);
    expect(emptyString.syncApplicationsCount).toBe(true);
    expect(falseString.syncApplicationsCount).toBe(false);
    expect(explicit.syncApplicationsCount).toBe(true);
  });
});

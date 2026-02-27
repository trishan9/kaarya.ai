import {
  CreateJobApplicationDTO,
  JobApplicationsQueryDTO,
  MyApplicationsSummaryQueryDTO,
  MyJobApplicationsQueryDTO,
  MyResumesQueryDTO,
  UpdateJobApplicationDTO,
  UpdateResumeActivityDTO,
  UploadMyResumeDTO,
} from 'src/dtos/jobs/job-application.dto';
import { ApplicationStatus } from 'src/types/application-status.enum';

describe('JobApplication DTOs', () => {
  it('should parse pagination/status query params', () => {
    const result = JobApplicationsQueryDTO.parse({
      page: '2',
      size: '15',
      status: ApplicationStatus.SHORTLISTED,
    });

    expect(result).toEqual({
      page: 2,
      size: 15,
      status: ApplicationStatus.SHORTLISTED,
    });
  });

  it('should parse my applications filters and coerce dates', () => {
    const result = MyJobApplicationsQueryDTO.parse({
      page: '1',
      size: '20',
      fromDate: '2026-02-01',
      toDate: '2026-02-20',
      status: ApplicationStatus.REVIEWING,
    });

    expect(result.fromDate).toBeInstanceOf(Date);
    expect(result.toDate).toBeInstanceOf(Date);
    expect(result.status).toBe(ApplicationStatus.REVIEWING);
  });

  it('should parse summary statuses from comma tokens and array inputs', () => {
    const first = MyApplicationsSummaryQueryDTO.parse({
      month: '2026-02',
      statuses: 'applied,rejected',
    });
    const second = MyApplicationsSummaryQueryDTO.parse({
      statuses: ['reviewing,shortlisted', 'accepted'],
    });

    expect(first.statuses).toEqual([
      ApplicationStatus.APPLIED,
      ApplicationStatus.REJECTED,
    ]);
    expect(second.statuses).toEqual([
      ApplicationStatus.REVIEWING,
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.ACCEPTED,
    ]);
  });

  it('should reject invalid month format', () => {
    const parsed = MyApplicationsSummaryQueryDTO.safeParse({
      month: '2026-13',
    });

    expect(parsed.success).toBe(false);
  });

  it('should parse resume list query defaults', () => {
    const result = MyResumesQueryDTO.parse({});
    expect(result).toEqual({ page: 1, size: 20 });
  });

  it('should parse create payload with preprocessing branches', () => {
    const result = CreateJobApplicationDTO.parse({
      coverLetter: '  Hello team  ',
      portfolioLinks: '["https://a.com","https://b.com"]',
      resumeFileName: ' resume.pdf ',
      resumeUrl: ' https://cdn.example.com/resume.pdf ',
      resumePublicId: ' pub-1 ',
      resumeMimeType: ' application/pdf ',
      resumeFileSize: '1024',
    });

    expect(result.coverLetter).toBe('Hello team');
    expect(result.portfolioLinks).toEqual(['https://a.com', 'https://b.com']);
    expect(result.resumeFileSize).toBe(1024);
  });

  it('should parse single portfolio link and blank optional text as undefined', () => {
    const result = CreateJobApplicationDTO.parse({
      coverLetter: '   ',
      portfolioLinks: 'https://portfolio.example.com',
    });

    expect(result.coverLetter).toBeUndefined();
    expect(result.portfolioLinks).toEqual(['https://portfolio.example.com']);
  });

  it('should parse upload resume payload and reject invalid size', () => {
    const good = UploadMyResumeDTO.safeParse({
      resumeFileName: 'cv.pdf',
      resumeFileSize: '200',
    });
    const bad = UploadMyResumeDTO.safeParse({
      resumeFileSize: '-1',
    });

    expect(good.success).toBe(true);
    expect(bad.success).toBe(false);
  });

  it('should validate update application payload and action enum', () => {
    const valid = UpdateJobApplicationDTO.safeParse({
      status: ApplicationStatus.ACCEPTED,
      interviewNote: '  Passed round one  ',
      interviewScheduledAt: '2026-02-28T08:00:00.000Z',
    });
    const invalid = UpdateJobApplicationDTO.safeParse({});
    const action = UpdateResumeActivityDTO.parse({ action: 'downloaded' });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
    expect(action.action).toBe('downloaded');
  });
});


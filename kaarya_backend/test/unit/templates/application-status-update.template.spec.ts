import { buildApplicationStatusUpdateEmail } from 'src/templates/email/application-status-update.template';
import { ApplicationStatus } from 'src/types/application-status.enum';

describe('buildApplicationStatusUpdateEmail', () => {
  it.each([
    [ApplicationStatus.APPLIED, 'Waiting for approval'],
    [ApplicationStatus.REVIEWING, 'Under review'],
    [ApplicationStatus.SHORTLISTED, 'Shortlisted'],
    [ApplicationStatus.INTERVIEW_SCHEDULED, 'Interview scheduled'],
    [ApplicationStatus.ACCEPTED, 'Accepted'],
    [ApplicationStatus.REJECTED, 'Rejected'],
    [ApplicationStatus.WITHDRAWN, 'Withdrawn'],
  ])('should render mapped status label for %s', (status, expectedLabel) => {
    const result = buildApplicationStatusUpdateEmail({
      brandName: 'Kaarya',
      companyName: 'Acme',
      jobTitle: 'Backend Engineer',
      status,
      candidateName: 'Alex',
      interviewScheduledAt: '2026-02-12T09:30:00.000Z',
      supportUrl: 'https://support.example.com',
      logoUrl: 'https://img.example.com/logo.png',
      primaryColor: '#123456',
    });

    expect(result.subject).toContain('Backend Engineer at Acme');
    expect(result.html).toContain(expectedLabel);
    expect(result.html).toContain('https://img.example.com/logo.png');
    expect(result.html).toContain('Contact support');
    expect(result.html).toContain('#123456');
    expect(result.text).toContain(`is now ${expectedLabel}.`);
    expect(result.text).toContain('Support: https://support.example.com');
    expect(result.text).toContain('Interview schedule:');
  });

  it('should use defaults and omit optional sections when not provided', () => {
    const result = buildApplicationStatusUpdateEmail({
      brandName: 'Kaarya',
      companyName: 'Acme',
      jobTitle: 'Backend Engineer',
      status: 'custom_status' as ApplicationStatus,
    });

    expect(result.html).toContain('Status: custom_status');
    expect(result.html).toContain('#2563eb');
    expect(result.html).not.toContain('Contact support');
    expect(result.html).not.toContain('Interview schedule:');
    expect(result.text).not.toContain('Support:');
  });
});


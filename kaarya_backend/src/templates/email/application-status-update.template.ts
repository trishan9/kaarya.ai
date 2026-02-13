import { ApplicationStatus } from 'src/types/application-status.enum';

type BuildApplicationStatusUpdateEmailInput = {
  brandName: string;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  candidateName?: string | null;
  interviewScheduledAt?: string;
  supportUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
};

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

const statusLabel = (status: ApplicationStatus) => {
  if (status === ApplicationStatus.APPLIED) return 'Waiting for approval';
  if (status === ApplicationStatus.REVIEWING) return 'Under review';
  if (status === ApplicationStatus.SHORTLISTED) return 'Shortlisted';
  if (status === ApplicationStatus.INTERVIEW_SCHEDULED)
    return 'Interview scheduled';
  if (status === ApplicationStatus.ACCEPTED) return 'Accepted';
  if (status === ApplicationStatus.REJECTED) return 'Rejected';
  if (status === ApplicationStatus.WITHDRAWN) return 'Withdrawn';
  return status;
};

export const buildApplicationStatusUpdateEmail = (
  input: BuildApplicationStatusUpdateEmailInput,
): EmailTemplate => {
  const accent = input.primaryColor ?? '#2563eb';
  const namePrefix = input.candidateName ? `${input.candidateName}, ` : '';
  const status = statusLabel(input.status);
  const interviewDateLabel = input.interviewScheduledAt
    ? new Date(input.interviewScheduledAt).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  const interviewLine = interviewDateLabel
    ? `<p style="margin:12px 0 0;">Interview schedule: <strong>${interviewDateLabel}</strong></p>`
    : '';
  const supportLine = input.supportUrl
    ? `<p style="margin:20px 0 0;">Need help? <a href="${input.supportUrl}">Contact support</a>.</p>`
    : '';
  const logoLine = input.logoUrl
    ? `<img src="${input.logoUrl}" alt="${input.brandName}" style="max-height:40px; margin-bottom:16px;" />`
    : '';

  const subject = `Application update: ${input.jobTitle} at ${input.companyName}`;
  const html = `
    <div style="font-family:Arial, sans-serif; line-height:1.5; color:#111827; max-width:560px; margin:0 auto; padding:24px;">
      ${logoLine}
      <h2 style="margin:0 0 12px;">Your application was updated</h2>
      <p style="margin:0 0 12px;">${namePrefix}your application for <strong>${input.jobTitle}</strong> at <strong>${input.companyName}</strong> is now <strong>${status}</strong>.</p>
      ${interviewLine}
      <p style="margin:20px 0 0;">
        Keep tracking your application status in your ${input.brandName} dashboard.
      </p>
      <div style="margin-top:16px; display:inline-block; padding:10px 16px; border-radius:8px; background:${accent}; color:#fff;">
        Status: ${status}
      </div>
      ${supportLine}
    </div>
  `.trim();

  const text = [
    `${subject}`,
    '',
    `${namePrefix}your application for ${input.jobTitle} at ${input.companyName} is now ${status}.`,
    interviewDateLabel ? `Interview schedule: ${interviewDateLabel}` : '',
    input.supportUrl ? `Support: ${input.supportUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
};

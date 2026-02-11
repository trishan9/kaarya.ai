type BuildCompanyInviteEmailInput = {
  brandName: string;
  companyName: string;
  inviteeEmail: string;
  invitedByName?: string | null;
  inviteCode: string;
  inviteLink: string;
  designation?: string | null;
  supportUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
};

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export const buildCompanyInviteEmail = (
  input: BuildCompanyInviteEmailInput,
): EmailTemplate => {
  const accent = input.primaryColor ?? '#2563eb';
  const invitedBy = input.invitedByName ?? 'A recruiter';
  const designationLine = input.designation
    ? `<p style="margin:0 0 12px;">Suggested role: <strong>${input.designation}</strong></p>`
    : '';
  const supportLine = input.supportUrl
    ? `<p style="margin:20px 0 0;">Need help? <a href="${input.supportUrl}">Contact support</a>.</p>`
    : '';
  const logoLine = input.logoUrl
    ? `<img src="${input.logoUrl}" alt="${input.brandName}" style="max-height:40px; margin-bottom:16px;" />`
    : '';

  const subject = `You're invited to join ${input.companyName} on ${input.brandName}`;
  const html = `
    <div style="font-family:Arial, sans-serif; line-height:1.5; color:#111827; max-width:560px; margin:0 auto; padding:24px;">
      ${logoLine}
      <h2 style="margin:0 0 12px;">Join ${input.companyName}</h2>
      <p style="margin:0 0 12px;">${invitedBy} invited <strong>${input.inviteeEmail}</strong> to join the recruiter workspace on ${input.brandName}.</p>
      ${designationLine}
      <p style="margin:0 0 12px;">Use this invite code to join the workspace: <strong>${input.inviteCode}</strong></p>
      <p style="margin:0 0 20px;">Use the link below to open the join screen.</p>
      <a href="${input.inviteLink}" style="display:inline-block; background:${accent}; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px;">Open Join Page</a>
      <p style="margin:20px 0 0; font-size:12px; color:#6b7280;">If you did not expect this invite, you can ignore this email.</p>
      ${supportLine}
    </div>
  `.trim();

  const text = [
    `${subject}`,
    '',
    `${invitedBy} invited ${input.inviteeEmail} to join ${input.companyName} on ${input.brandName}.`,
    input.designation ? `Suggested role: ${input.designation}` : '',
    `Invite code: ${input.inviteCode}`,
    `Join link: ${input.inviteLink}`,
    input.supportUrl ? `Support: ${input.supportUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, html, text };
};

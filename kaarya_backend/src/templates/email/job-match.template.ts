type JobMatchEmailParams = {
  brandName: string;
  userName?: string | null;
  jobTitle: string;
  companyName: string;
  companyLogo?: string | null;
  location?: string | null;
  workMode?: string | null;
  salaryRange?: string | null;
  employmentType?: string | null;
  matchScore?: number;
  jobUrl: string;
  supportUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
};

export const buildJobMatchEmail = (params: JobMatchEmailParams) => {
  const brandName = params.brandName || 'Kaarya';
  const primaryColor = params.primaryColor || '#0b67c2';
  const supportUrl = params.supportUrl;
  const logoUrl =
    params.logoUrl ||
    'https://res.cloudinary.com/dnqet3vq1/image/upload/v1770357829/kaarya/tl0x4mtzklebkdsbl50b.png';
  const firstName = params.userName?.trim()?.split(/\s+/)[0] || 'there';

  const companyLogo = params.companyLogo;
  const matchLabel =
    params.matchScore && params.matchScore >= 80
      ? 'Excellent Match'
      : params.matchScore && params.matchScore >= 60
        ? 'Strong Match'
        : 'New Match';

  const subject = `${matchLabel}: ${params.jobTitle} at ${params.companyName}`;

  const detailRows = [
    params.location
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:110px;vertical-align:top;">Location</td><td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:500;">${params.location}</td></tr>`
      : '',
    params.workMode
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:110px;vertical-align:top;">Work Mode</td><td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:500;">${params.workMode.charAt(0).toUpperCase() + params.workMode.slice(1)}</td></tr>`
      : '',
    params.employmentType
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:110px;vertical-align:top;">Type</td><td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:500;">${params.employmentType}</td></tr>`
      : '',
    params.salaryRange && params.salaryRange !== 'Compensation not specified'
      ? `<tr><td style="padding:6px 0;font-size:13px;color:#64748b;width:110px;vertical-align:top;">Salary</td><td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:500;">${params.salaryRange}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;background-color:#f2f5fb;padding:24px;font-family:'Sora','DM Sans','Inter',Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7edf5;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:22px 28px;background:${primaryColor};color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      ${
                        logoUrl
                          ? `<img src="${logoUrl}" alt="${brandName} logo" style="height:32px;width:auto;border-radius:8px;vertical-align:middle;display:inline-block;margin-right:10px;" />`
                          : ''
                      }
                      <span style="font-size:16px;font-weight:700;letter-spacing:0.3px;vertical-align:middle;display:inline-block;">${brandName}</span>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.18);font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;">${matchLabel}</span>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:18px 0 6px;font-size:22px;line-height:1.3;">We found a job for you, ${firstName}</h1>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#dbeafe;">A new role matching your profile has just been posted.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:20px;">
                  <tr>
                    <td style="padding:20px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="vertical-align:top;width:52px;">
                            ${
                              companyLogo
                                ? `<img src="${companyLogo}" alt="${params.companyName}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;border:1px solid #e2e8f0;" />`
                                : `<div style="width:44px;height:44px;border-radius:10px;background:${primaryColor};color:#ffffff;font-size:20px;font-weight:700;text-align:center;line-height:44px;">${params.companyName.charAt(0).toUpperCase()}</div>`
                            }
                          </td>
                          <td style="vertical-align:top;padding-left:14px;">
                            <div style="font-size:17px;font-weight:700;color:#0f172a;line-height:1.3;">${params.jobTitle}</div>
                            <div style="font-size:13px;color:#475569;margin-top:2px;">${params.companyName}</div>
                          </td>
                        </tr>
                      </table>
                      ${
                        detailRows
                          ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:14px;border-top:1px solid #e2e8f0;padding-top:12px;">${detailRows}</table>`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="padding:4px 0 8px;">
                      <a href="${params.jobUrl}" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;font-weight:600;border-radius:10px;padding:13px 28px;font-size:14px;letter-spacing:0.2px;">View Job Details</a>
                    </td>
                  </tr>
                </table>
                <div style="margin:16px 0 0;padding:14px 16px;border-radius:12px;background:#f1f5f9;border:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                    This match is based on your profile preferences and skills. Keep your profile up to date for the most relevant job recommendations.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-size:12px;color:#94a3b8;">
                      Need help?${supportUrl ? ` <a href="${supportUrl}" style="color:${primaryColor};text-decoration:none;font-weight:600;">Contact support</a>.` : ''}
                    </td>
                    <td align="right" style="font-size:12px;color:#94a3b8;">${brandName} Team</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;">This is an automated message from ${brandName}. Please do not reply.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${matchLabel}: ${params.jobTitle} at ${params.companyName}

Hi ${firstName},

A new job matching your profile has been posted:

${params.jobTitle} at ${params.companyName}
${params.location ? `Location: ${params.location}` : ''}
${params.workMode ? `Work Mode: ${params.workMode}` : ''}
${params.employmentType ? `Type: ${params.employmentType}` : ''}
${params.salaryRange && params.salaryRange !== 'Compensation not specified' ? `Salary: ${params.salaryRange}` : ''}

View the job: ${params.jobUrl}

${supportUrl ? `Support: ${supportUrl}` : ''}`;

  return { subject, html, text };
};

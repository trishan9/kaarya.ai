type PasswordChangedEmailParams = {
  brandName: string;
  userName?: string | null;
  occurredAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  supportUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
};

const formatTimestamp = (value: Date) => {
  return `${value.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kathmandu',
  })} GMT+5:45 (KTM)`;
};

export const buildPasswordChangedEmail = (
  params: PasswordChangedEmailParams,
) => {
  const brandName = params.brandName || 'Kaarya';
  const primaryColor = params.primaryColor || '#0b67c2';
  const supportUrl = params.supportUrl;
  const logoUrl =
    params.logoUrl ||
    'https://res.cloudinary.com/dnqet3vq1/image/upload/v1770357829/kaarya/tl0x4mtzklebkdsbl50b.png';
  const firstName = params.userName?.trim()?.split(/\s+/)[0] || 'there';
  const occurredAt = params.occurredAt ?? new Date();
  const occurredAtLabel = formatTimestamp(occurredAt);
  const ipAddress = params.ipAddress?.trim() || 'Unavailable';
  const userAgent = params.userAgent?.trim() || 'Unavailable';

  const subject = `Your ${brandName} password was changed`;

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
                      <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.18);font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;">Security Alert</span>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:18px 0 6px;font-size:22px;line-height:1.3;">Password changed</h1>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#dbeafe;">Your account password was changed from your settings.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">
                  Hi ${firstName}, your ${brandName} password was changed on ${occurredAtLabel} via the settings page.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr style="border-radius:14px;">
                    <td style="padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;margin-bottom:10px;">Change details</div>
                      <p style="margin:0 0 7px;font-size:13px;line-height:1.6;color:#334155;"><strong style="color:#0f172a;">Time:</strong> ${occurredAtLabel}</p>
                      <p style="margin:0 0 7px;font-size:13px;line-height:1.6;color:#334155;"><strong style="color:#0f172a;">IP:</strong> ${ipAddress}</p>
                      <p style="margin:0;font-size:13px;line-height:1.6;color:#334155;"><strong style="color:#0f172a;">Device:</strong> ${userAgent}</p>
                    </td>
                  </tr>
                </table>
                <div style="margin:18px 0 0;padding:14px 16px;border-radius:12px;background:#fef2f2;border:1px solid #fecaca;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#991b1b;">
                    If you did not make this change, please reset your password immediately and contact support.
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
                    <td align="right" style="font-size:12px;color:#94a3b8;">${brandName} Security Team</td>
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

  const text = `Your ${brandName} password was changed

Hi ${firstName}, your password was changed on ${occurredAtLabel} via the settings page.
IP: ${ipAddress}
Device: ${userAgent}

If you did not make this change, please reset your password immediately.
${supportUrl ? `Support: ${supportUrl}` : ''}`;

  return { subject, html, text };
};

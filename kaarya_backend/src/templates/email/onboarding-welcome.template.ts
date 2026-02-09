type OnboardingWelcomeEmailParams = {
  brandName: string;
  userName?: string | null;
  supportUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
};

export const buildOnboardingWelcomeEmail = (
  params: OnboardingWelcomeEmailParams,
) => {
  const brandName = params.brandName || 'Kaarya';
  const primaryColor = params.primaryColor || '#0b67c2';
  const supportUrl = params.supportUrl;
  const logoUrl =
    params.logoUrl ||
    'https://res.cloudinary.com/dnqet3vq1/image/upload/v1770357829/kaarya/tl0x4mtzklebkdsbl50b.png';
  const firstName = params.userName?.trim()?.split(/\s+/)[0] || 'there';

  const subject = `Welcome to ${brandName}`;

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
                      <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.18);font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;">Account Created</span>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:18px 0 6px;font-size:22px;line-height:1.3;">Welcome aboard, ${firstName}</h1>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#dbeafe;">Your account is ready. Let us help you get started.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;">
                  Thanks for joining ${brandName}. Here are a few quick steps to make the most of your account:
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#334155;">1. Complete your profile details for better recommendations.</p>
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#334155;">2. Explore your dashboard and set your preferences.</p>
                      <p style="margin:0;font-size:13px;line-height:1.6;color:#334155;">3. Keep your account secure and use a strong password.</p>
                    </td>
                  </tr>
                </table>
                <div style="margin:18px 0 0;padding:14px 16px;border-radius:12px;background:#f1f5f9;border:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                    If you need help setting things up, our team is here to support you.
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

  const text = `Welcome to ${brandName}, ${firstName}

Your account has been created successfully.

Get started:
1. Complete your profile.
2. Explore your dashboard.
3. Keep your account secure.

${supportUrl ? `Support: ${supportUrl}` : ''}`;

  return { subject, html, text };
};

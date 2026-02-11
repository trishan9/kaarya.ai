import { buildCompanyInviteEmail } from 'src/templates/email/company-invite.template';

describe('buildCompanyInviteEmail', () => {
  it('should include invite code and join link in html/text', () => {
    const result = buildCompanyInviteEmail({
      brandName: 'Kaarya',
      companyName: 'Acme Hiring',
      inviteeEmail: 'invitee@example.com',
      invitedByName: 'Recruiter One',
      inviteCode: 'KR-AB12CD34',
      inviteLink:
        'https://app.example.com/company-invites?companyId=abc&inviteCode=KR-AB12CD34',
      designation: 'Talent Partner',
      supportUrl: 'https://support.example.com',
    });

    expect(result.subject).toContain('Acme Hiring');
    expect(result.html).toContain('KR-AB12CD34');
    expect(result.html).toContain('Open Join Page');
    expect(result.text).toContain('Invite code: KR-AB12CD34');
    expect(result.text).toContain('Join link: https://app.example.com');
  });

  it('should render without optional values', () => {
    const result = buildCompanyInviteEmail({
      brandName: 'Kaarya',
      companyName: 'Acme Hiring',
      inviteeEmail: 'invitee@example.com',
      inviteCode: 'KR-XYZ98765',
      inviteLink:
        'https://app.example.com/company-invites?companyId=abc&inviteCode=KR-XYZ98765',
    });

    expect(result.html).toContain('KR-XYZ98765');
    expect(result.text).toContain('Invite code: KR-XYZ98765');
  });
});

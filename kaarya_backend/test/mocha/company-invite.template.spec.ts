import { expect } from 'chai';
import { buildCompanyInviteEmail } from 'src/templates/email/company-invite.template';

describe('Company invite email template (mocha)', () => {
  it('should include invite code and join link', () => {
    const email = buildCompanyInviteEmail({
      brandName: 'Kaarya',
      companyName: 'Acme Hiring',
      inviteeEmail: 'invitee@example.com',
      inviteCode: 'KR-AB12CD34',
      inviteLink:
        'https://app.example.com/company-invites?companyId=123&inviteCode=KR-AB12CD34',
      invitedByName: 'Recruiter One',
      designation: 'Hiring Manager',
    });

    expect(email.subject).to.contain('Acme Hiring');
    expect(email.html).to.contain('KR-AB12CD34');
    expect(email.html).to.contain('Open Join Page');
    expect(email.text).to.contain('Invite code: KR-AB12CD34');
    expect(email.text).to.contain('Join link: https://app.example.com');
  });
});

import { buildOnboardingWelcomeEmail } from 'src/templates/email/onboarding-welcome.template';

describe('Onboarding welcome email template', () => {
  it('should include branding, recipient name, and support details when provided', () => {
    const result = buildOnboardingWelcomeEmail({
      brandName: 'Kaarya',
      userName: 'Alex Johnson',
      supportUrl: 'https://support.example.com',
      logoUrl: 'https://img.example.com/logo.png',
      primaryColor: '#123456',
    });

    expect(result.subject).toBe('Welcome to Kaarya');
    expect(result.html).toContain('Welcome aboard, Alex');
    expect(result.html).toContain('https://img.example.com/logo.png');
    expect(result.html).toContain('Contact support');
    expect(result.html).toContain('#123456');
    expect(result.text).toContain('Support: https://support.example.com');
  });

  it('should omit support links when none are provided', () => {
    const result = buildOnboardingWelcomeEmail({
      brandName: '',
      userName: '',
    });

    expect(result.subject).toBe('Welcome to Kaarya');
    expect(result.text).not.toContain('Support:');
    expect(result.html).not.toContain('Contact support');
  });
});

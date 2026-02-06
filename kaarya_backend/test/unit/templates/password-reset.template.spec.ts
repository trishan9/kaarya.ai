import { buildPasswordResetEmail } from 'src/templates/email/password-reset.template';

describe('Password reset email template', () => {
  it('should include branding, otp, and support details when provided', () => {
    const result = buildPasswordResetEmail({
      brandName: 'Kaarya',
      otp: '123456',
      expiresInMinutes: 10,
      supportUrl: 'https://support.example.com',
      logoUrl: 'https://img.example.com/logo.png',
      primaryColor: '#123456',
    });

    expect(result.subject).toBe('Kaarya password reset code');
    expect(result.html).toContain('123456');
    expect(result.html).toContain('https://img.example.com/logo.png');
    expect(result.html).toContain('Contact support');
    expect(result.html).toContain('#123456');
    expect(result.text).toContain('Support: https://support.example.com');
  });

  it('should omit support links when none are provided', () => {
    const result = buildPasswordResetEmail({
      brandName: '',
      otp: '654321',
      expiresInMinutes: 5,
    });

    expect(result.subject).toBe('Kaarya password reset code');
    expect(result.text).not.toContain('Support:');
    expect(result.html).not.toContain('Contact support');
  });
});

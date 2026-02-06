import { buildPasswordResetSuccessEmail } from 'src/templates/email/password-reset-success.template';

describe('Password reset success email template', () => {
  it('should include reset metadata and support details when provided', () => {
    const result = buildPasswordResetSuccessEmail({
      brandName: 'Kaarya',
      userName: 'Alex Johnson',
      occurredAt: new Date('2026-02-06T12:00:00.000Z'),
      ipAddress: '10.0.0.8',
      userAgent: 'Mozilla/5.0',
      supportUrl: 'https://support.example.com',
      logoUrl: 'https://img.example.com/logo.png',
      primaryColor: '#123456',
    });

    expect(result.subject).toBe('Kaarya password changed successfully');
    expect(result.html).toContain('10.0.0.8');
    expect(result.html).toContain('Mozilla/5.0');
    expect(result.html).toContain('https://img.example.com/logo.png');
    expect(result.html).toContain('Contact support');
    expect(result.html).toContain('#123456');
    expect(result.text).toContain('Support: https://support.example.com');
  });

  it('should provide fallback values when metadata is missing', () => {
    const result = buildPasswordResetSuccessEmail({
      brandName: '',
    });

    expect(result.subject).toBe('Kaarya password changed successfully');
    expect(result.html).toContain('Unavailable');
    expect(result.text).not.toContain('Support:');
  });
});

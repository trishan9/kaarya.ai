import { buildPasswordChangedEmail } from 'src/templates/email/password-changed.template';

describe('buildPasswordChangedEmail', () => {
  it('should render full security email details', () => {
    const result = buildPasswordChangedEmail({
      brandName: 'Kaarya',
      userName: '  Alex Doe ',
      occurredAt: new Date('2026-02-14T10:30:00.000Z'),
      ipAddress: ' 203.0.113.10 ',
      userAgent: '  Chrome on Windows ',
      supportUrl: 'https://support.example.com',
      logoUrl: 'https://img.example.com/logo.png',
      primaryColor: '#334455',
    });

    expect(result.subject).toBe('Your Kaarya password was changed');
    expect(result.html).toContain('Hi Alex');
    expect(result.html).toContain('203.0.113.10');
    expect(result.html).toContain('Chrome on Windows');
    expect(result.html).toContain('Contact support');
    expect(result.html).toContain('#334455');
    expect(result.text).toContain('IP: 203.0.113.10');
    expect(result.text).toContain('Device: Chrome on Windows');
    expect(result.text).toContain('Support: https://support.example.com');
    expect(result.text).toContain('GMT+5:45 (KTM)');
  });

  it('should use fallback values for missing optional fields', () => {
    const result = buildPasswordChangedEmail({
      brandName: '',
      userName: null,
    });

    expect(result.subject).toBe('Your Kaarya password was changed');
    expect(result.html).toContain('Hi there');
    expect(result.html).toContain('Unavailable');
    expect(result.html).not.toContain('Contact support');
    expect(result.text).not.toContain('Support:');
  });
});


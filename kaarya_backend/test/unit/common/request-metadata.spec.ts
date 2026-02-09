import { getRequestMetadata } from 'src/common/utils/request-metadata';

describe('getRequestMetadata', () => {
  it('should prefer forwarded client metadata when available', () => {
    const result = getRequestMetadata({
      ip: '::1',
      headers: {
        'x-client-ip': '203.0.113.12',
        'x-client-user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        'user-agent': 'axios/1.13.2',
      },
    });

    expect(result).toEqual({
      ip: '203.0.113.12',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    });
  });

  it('should extract the first IP from x-forwarded-for values', () => {
    const result = getRequestMetadata({
      headers: {
        'x-forwarded-for': '198.51.100.10, 10.0.0.5',
      },
    });

    expect(result.ip).toBe('198.51.100.10');
  });

  it('should fall back to request values when no forwarded headers exist', () => {
    const result = getRequestMetadata({
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'axios/1.13.2',
      },
      connection: { remoteAddress: '127.0.0.1' },
    });

    expect(result).toEqual({
      ip: '127.0.0.1',
      userAgent: 'axios/1.13.2',
    });
  });
});

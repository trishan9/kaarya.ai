import { ConfigService } from '@nestjs/config';
import { GithubOAuthStrategy } from 'src/strategies/github-oauth.strategy';
import { AuthProvider } from 'src/types/auth-provider.enum';

describe('GithubOAuthStrategy', () => {
  const createStrategy = (authConfig?: Record<string, unknown>) => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'auth') return authConfig;
        if (key === 'app.backendDomain') return 'https://api.example.com';
        if (key === 'app.apiPrefix') return 'api';
        return undefined;
      }),
    } as unknown as ConfigService;

    return new GithubOAuthStrategy(configService);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fallback to public email when emails url is not configured', async () => {
    const strategy = createStrategy();
    const result = await strategy.validate(
      'token',
      'refresh',
      {
        id: 'github-1',
        displayName: ' Dev User ',
        emails: [{ value: 'Public@Example.com ' }],
        photos: [{ value: ' https://img.example.com/u.png ' }],
      } as never,
    );

    expect(result).toEqual({
      provider: AuthProvider.GITHUB,
      providerUserId: 'github-1',
      email: 'public@example.com',
      emailVerified: false,
      name: 'Dev User',
      photo: 'https://img.example.com/u.png',
    });
  });

  it('should resolve primary verified email from github api', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([
        { email: 'first@example.com', verified: true, primary: false },
        { email: 'primary@example.com', verified: true, primary: true },
      ]),
    });
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const strategy = createStrategy({
      oauthGithub: {
        clientId: 'cid',
        clientSecret: 'secret',
        emailsUrl: 'https://api.github.com/user/emails',
      },
    });

    const result = await strategy.validate(
      'token',
      'refresh',
      {
        id: 'github-2',
        displayName: 'Dev User',
        emails: [{ value: 'public@example.com' }],
        photos: [],
      } as never,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/user/emails',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }),
      }),
    );
    expect(result.email).toBe('primary@example.com');
    expect(result.emailVerified).toBe(true);
  });

  it('should fallback to public email for failed/invalid github email responses', async () => {
    const strategy = createStrategy({
      oauthGithub: {
        emailsUrl: 'https://api.github.com/user/emails',
      },
    });
    const profile = {
      id: 'github-3',
      displayName: '',
      emails: [{ value: 'public@example.com' }],
      photos: [],
    } as never;

    (global as unknown as { fetch: typeof fetch }).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('bad json')),
      })
      .mockRejectedValueOnce(new Error('network'));

    const first = await strategy.validate('token', 'refresh', profile);
    const second = await strategy.validate('token', 'refresh', profile);
    const third = await strategy.validate('token', 'refresh', profile);

    expect(first).toEqual(
      expect.objectContaining({
        email: 'public@example.com',
        emailVerified: false,
      }),
    );
    expect(second).toEqual(
      expect.objectContaining({
        email: 'public@example.com',
        emailVerified: false,
      }),
    );
    expect(third).toEqual(
      expect.objectContaining({
        email: 'public@example.com',
        emailVerified: false,
      }),
    );
  });

  it('should expose authorization params with optional custom state', () => {
    const strategy = createStrategy();
    expect(strategy.authorizationParams({ customState: 'state-1' })).toEqual({
      state: 'state-1',
    });
    expect(strategy.authorizationParams({})).toEqual({});
  });
});


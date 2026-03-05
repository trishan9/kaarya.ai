import { ConfigService } from '@nestjs/config';
import { GoogleOAuthStrategy } from 'src/strategies/google-oauth.strategy';
import { AuthProvider } from 'src/types/auth-provider.enum';

describe('GoogleOAuthStrategy', () => {
  const createStrategy = (authConfig?: Record<string, unknown>) => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'auth') return authConfig;
        if (key === 'app.backendDomain') return 'https://api.example.com';
        if (key === 'app.apiPrefix') return 'api';
        return undefined;
      }),
    } as unknown as ConfigService;

    return new GoogleOAuthStrategy(configService);
  };

  it('should map google profile with verified email', async () => {
    const strategy = createStrategy({
      oauthGoogle: {
        clientId: 'cid',
        clientSecret: 'secret',
      },
    });

    const result = await strategy.validate(
      'access-token',
      'refresh-token',
      {
        id: 'google-1',
        displayName: ' OAuth User ',
        emails: [
          { value: 'first@example.com', verified: false },
          { value: 'verified@example.com', verified: true },
        ],
        photos: [{ value: ' https://img.example.com/u.png ' }],
      } as never,
    );

    expect(result).toEqual({
      provider: AuthProvider.GOOGLE,
      providerUserId: 'google-1',
      email: 'verified@example.com',
      emailVerified: true,
      name: 'OAuth User',
      photo: 'https://img.example.com/u.png',
    });
  });

  it('should fallback to first email and _json.email_verified flag', async () => {
    const strategy = createStrategy();

    const result = await strategy.validate(
      'access-token',
      'refresh-token',
      {
        id: 'google-2',
        displayName: '',
        emails: [{ value: 'first@example.com', verified: false }],
        photos: [],
        _json: { email_verified: true },
      } as never,
    );

    expect(result).toEqual({
      provider: AuthProvider.GOOGLE,
      providerUserId: 'google-2',
      email: 'first@example.com',
      emailVerified: true,
      name: null,
      photo: null,
    });
  });

  it('should expose authorization params with optional custom state', () => {
    const strategy = createStrategy();
    expect(strategy.authorizationParams({ customState: 'state-1' })).toEqual({
      state: 'state-1',
    });
    expect(strategy.authorizationParams({})).toEqual({});
  });
});


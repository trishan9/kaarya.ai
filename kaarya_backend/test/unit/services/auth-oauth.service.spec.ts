import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { AuthOAuthService } from 'src/services/auth-oauth.service';
import { OAuthAccountService } from 'src/services/oauth-account.service';
import { RedisService } from 'src/services/redis.service';
import { AuthProvider } from 'src/types/auth-provider.enum';

describe('AuthOAuthService', () => {
  let service: AuthOAuthService;
  let configService: jest.Mocked<ConfigService>;
  let redisService: jest.Mocked<RedisService>;
  let oauthAccountService: jest.Mocked<OAuthAccountService>;
  let redisClient: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(() => {
    redisClient = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === CONFIG_KEYS.AUTH.OAUTH_STATE_EXPIRES) return '10m';
        if (key === CONFIG_KEYS.AUTH.OAUTH_RESULT_EXPIRES) return '5m';
        if (key === CONFIG_KEYS.AUTH.OAUTH_LINK_EXPIRES) return '15m';
        if (key === CONFIG_KEYS.AUTH.OAUTH_ALLOWED_REDIRECTS) {
          return ['https://app.example.com/oauth'];
        }
        if (key === CONFIG_KEYS.REDIS.KEY_PREFIX) return 'kaarya-test';
        return undefined;
      }),
    } as never;

    redisService = {
      getClient: jest.fn().mockResolvedValue(redisClient),
    } as never;

    oauthAccountService = {
      resolveOAuthResult: jest.fn(),
      completeOAuthLink: jest.fn(),
    } as never;

    service = new AuthOAuthService(
      configService as never,
      redisService,
      oauthAccountService,
    );
  });

  const expectApiError = async (
    fn: () => Promise<unknown>,
    status: number,
    message?: string,
  ) => {
    try {
      await fn();
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.getStatus()).toBe(status);
      if (message) {
        expect(apiError.getResponse()).toEqual(
          expect.objectContaining({ message }),
        );
      }
    }
  };

  it('should create oauth state and store transaction in redis', async () => {
    const state = await service.createOAuthState({
      provider: AuthProvider.GOOGLE,
      redirectUri: 'https://app.example.com/oauth/callback?from=web',
    });

    expect(state).toEqual(expect.any(String));
    expect(redisClient.set).toHaveBeenCalledWith(
      expect.stringContaining('kaarya-test:oauth:tx:'),
      expect.any(String),
      { EX: 600 },
    );
  });

  it('should reject unsupported provider and invalid redirect uri', async () => {
    await expectApiError(
      () =>
        service.createOAuthState({
          provider: 'unknown' as never,
          redirectUri: 'https://app.example.com/oauth/callback',
        }),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_PROVIDER_NOT_SUPPORTED,
    );

    await expectApiError(
      () =>
        service.createOAuthState({
          provider: AuthProvider.GOOGLE,
          redirectUri: 'https://evil.example.com/callback',
        }),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
    );
  });

  it('should handle oauth provider errors and redirect', async () => {
    await expectApiError(
      () =>
        service.handleOAuthProviderError({
          provider: AuthProvider.GOOGLE,
        }),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
    );

    redisClient.get.mockResolvedValue(
      JSON.stringify({
        provider: AuthProvider.GOOGLE,
        intent: 'login',
        redirectUri: 'https://app.example.com/oauth/callback',
        createdAt: new Date().toISOString(),
      }),
    );

    const url = await service.handleOAuthProviderError({
      provider: AuthProvider.GOOGLE,
      state: 'state-1',
      error: 'access_denied',
      errorDescription: 'Denied by user',
    });

    expect(url).toContain('https://app.example.com/oauth/callback');
    expect(url).toContain('oauth_result_token=');
    expect(redisClient.set).toHaveBeenCalledWith(
      expect.stringContaining('kaarya-test:oauth:result:'),
      expect.stringContaining('"code":"provider_error"'),
      { EX: 300 },
    );
  });

  it('should handle oauth callback with profile validation and redirect', async () => {
    await expectApiError(
      () =>
        service.handleOAuthCallback({
          provider: AuthProvider.GOOGLE,
          profile: {
            provider: AuthProvider.GOOGLE,
            providerUserId: 'abc',
            email: 'user@example.com',
            emailVerified: true,
          },
        }),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
    );

    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({
        provider: AuthProvider.GOOGLE,
        intent: 'login',
        redirectUri: 'https://app.example.com/oauth/callback',
        createdAt: new Date().toISOString(),
      }),
    );
    oauthAccountService.resolveOAuthResult.mockResolvedValue({
      status: 'authenticated',
      user: { id: 'u1' } as never,
      accessToken: 'jwt',
      isNewUser: false,
    });

    const redirectUrl = await service.handleOAuthCallback({
      provider: AuthProvider.GOOGLE,
      state: 'state-2',
      profile: {
        provider: AuthProvider.GOOGLE,
        providerUserId: 'provider-1',
        email: 'User@Example.com',
        emailVerified: true,
        name: '  OAuth User ',
        photo: ' https://img.example.com/u.png ',
      },
    });

    expect(oauthAccountService.resolveOAuthResult).toHaveBeenCalledWith(
      expect.objectContaining({ provider: AuthProvider.GOOGLE }),
      expect.objectContaining({
        providerUserId: 'provider-1',
        email: 'user@example.com',
        name: 'OAuth User',
      }),
      expect.any(Function),
    );
    expect(redirectUrl).toContain('oauth_result_token=');

    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({
        provider: AuthProvider.GOOGLE,
        intent: 'login',
        redirectUri: 'https://app.example.com/oauth/callback',
        createdAt: new Date().toISOString(),
      }),
    );
    await expectApiError(
      () =>
        service.handleOAuthCallback({
          provider: AuthProvider.GOOGLE,
          state: 'state-3',
          profile: {
            provider: AuthProvider.GOOGLE,
            providerUserId: '   ',
            email: 'u@example.com',
            emailVerified: true,
          },
        }),
      HttpStatus.UNAUTHORIZED,
      AUTH_MESSAGES.OAUTH_UNAVAILABLE,
    );
  });

  it('should exchange oauth result token', async () => {
    await expectApiError(
      () => service.exchangeOAuthResultToken(' '),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
    );

    redisClient.get.mockResolvedValueOnce(null);
    await expectApiError(
      () => service.exchangeOAuthResultToken('token-1'),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
    );

    redisClient.get.mockResolvedValueOnce('not-json');
    await expectApiError(
      () => service.exchangeOAuthResultToken('token-2'),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
    );

    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({ status: 'authenticated', accessToken: 'jwt' }),
    );
    const result = await service.exchangeOAuthResultToken('token-3');
    expect(result).toEqual({ status: 'authenticated', accessToken: 'jwt' });
  });

  it('should complete oauth link with full token validation', async () => {
    await expectApiError(
      () => service.completeOAuthLink('u1', ' '),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
    );

    redisClient.get.mockResolvedValueOnce(null);
    await expectApiError(
      () => service.completeOAuthLink('u1', 'token-1'),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
    );

    redisClient.get.mockResolvedValueOnce('invalid-json');
    await expectApiError(
      () => service.completeOAuthLink('u1', 'token-2'),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
    );

    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({
        userId: 'u2',
        provider: AuthProvider.GOOGLE,
        providerUserId: 'provider-1',
      }),
    );
    await expectApiError(
      () => service.completeOAuthLink('u1', 'token-3'),
      HttpStatus.UNAUTHORIZED,
      AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
    );

    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({
        userId: 'u1',
        provider: AuthProvider.GOOGLE,
        providerUserId: 'provider-1',
      }),
    );
    oauthAccountService.completeOAuthLink.mockResolvedValueOnce(null);
    await expectApiError(
      () => service.completeOAuthLink('u1', 'token-4'),
      HttpStatus.CONFLICT,
      AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
    );

    redisClient.get.mockResolvedValueOnce(
      JSON.stringify({
        userId: 'u1',
        provider: AuthProvider.GOOGLE,
        providerUserId: 'provider-1',
      }),
    );
    oauthAccountService.completeOAuthLink.mockResolvedValueOnce({
      user: { id: 'u1' } as never,
      accessToken: 'jwt',
    });

    const linked = await service.completeOAuthLink('u1', 'token-5');
    expect(linked).toEqual({
      user: { id: 'u1' },
      accessToken: 'jwt',
    });
  });

  it('should enforce transaction provider match on callback/provider error flows', async () => {
    redisClient.get.mockResolvedValue(
      JSON.stringify({
        provider: AuthProvider.GITHUB,
        intent: 'login',
        redirectUri: 'https://app.example.com/oauth/callback',
        createdAt: new Date().toISOString(),
      }),
    );

    await expectApiError(
      () =>
        service.handleOAuthProviderError({
          provider: AuthProvider.GOOGLE,
          state: 'state-x',
        }),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
    );

    redisClient.get.mockResolvedValue(
      JSON.stringify({
        provider: AuthProvider.GITHUB,
        intent: 'login',
        redirectUri: 'https://app.example.com/oauth/callback',
        createdAt: new Date().toISOString(),
      }),
    );

    await expectApiError(
      () =>
        service.handleOAuthCallback({
          provider: AuthProvider.GOOGLE,
          state: 'state-y',
          profile: {
            provider: AuthProvider.GOOGLE,
            providerUserId: 'provider',
            email: 'u@example.com',
            emailVerified: true,
          },
        }),
      HttpStatus.BAD_REQUEST,
      AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
    );
  });
});


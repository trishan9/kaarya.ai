import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import ms from 'ms';
import { ApiError } from 'src/common/errors/api-error';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { TOAuthIntent } from 'src/dtos/auth/oauth.dto';
import { OAuthAccountService } from 'src/services/oauth-account.service';
import { RedisService } from 'src/services/redis.service';
import {
  OAuthLinkTicket,
  OAuthResultPayload,
  OAuthTransactionState,
} from 'src/types/oauth-flow.type';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { AllConfigType } from 'src/types/config.type';
import { OAuthProviderProfile } from 'src/types/oauth-profile.type';

export type { OAuthResultPayload };

@Injectable()
export class AuthOAuthService {
  private readonly oauthStateTtlMs: number;
  private readonly oauthStateTtlSeconds: number;
  private readonly oauthResultTtlSeconds: number;
  private readonly oauthLinkTtlSeconds: number;
  private readonly oauthAllowedRedirects: string[];
  private readonly redisPrefix: string;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly redisService: RedisService,
    private readonly oauthAccountService: OAuthAccountService,
  ) {
    this.oauthStateTtlMs = this.parseMs(
      this.configService.get(CONFIG_KEYS.AUTH.OAUTH_STATE_EXPIRES, {
        infer: true,
      }),
      10 * 60 * 1000,
    );
    this.oauthStateTtlSeconds = Math.ceil(this.oauthStateTtlMs / 1000);
    this.oauthResultTtlSeconds = Math.ceil(
      this.parseMs(
        this.configService.get(CONFIG_KEYS.AUTH.OAUTH_RESULT_EXPIRES, {
          infer: true,
        }),
        5 * 60 * 1000,
      ) / 1000,
    );
    this.oauthLinkTtlSeconds = Math.ceil(
      this.parseMs(
        this.configService.get(CONFIG_KEYS.AUTH.OAUTH_LINK_EXPIRES, {
          infer: true,
        }),
        15 * 60 * 1000,
      ) / 1000,
    );
    this.oauthAllowedRedirects =
      this.configService.get(CONFIG_KEYS.AUTH.OAUTH_ALLOWED_REDIRECTS, {
        infer: true,
      }) ?? [];
    this.redisPrefix =
      this.configService.get(CONFIG_KEYS.REDIS.KEY_PREFIX, { infer: true }) ??
      'kaarya';
  }

  async createOAuthState(input: {
    provider: AuthProvider;
    redirectUri: string;
    intent?: TOAuthIntent;
    requestedByUserId?: string;
  }) {
    const provider = this.assertOAuthProvider(input.provider);
    const intent = input.intent ?? (input.requestedByUserId ? 'link' : 'login');
    const redirectUri = this.normalizeAndValidateRedirectUri(input.redirectUri);

    const state = this.generateOpaqueToken();
    const txState: OAuthTransactionState = {
      provider,
      intent,
      redirectUri,
      requestedByUserId: input.requestedByUserId,
      createdAt: new Date().toISOString(),
    };

    const client = await this.redisService.getClient();
    await client.set(this.buildOAuthTxKey(state), JSON.stringify(txState), {
      EX: this.oauthStateTtlSeconds,
    });

    return state;
  }

  async handleOAuthProviderError(input: {
    provider: AuthProvider;
    state?: string;
    error?: string;
    errorDescription?: string;
  }) {
    const provider = this.assertOAuthProvider(input.provider);
    const state = input.state?.trim();

    if (!state) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }

    const tx = await this.consumeOAuthTransaction(state);
    if (!tx || tx.provider !== provider) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }

    const message =
      input.errorDescription?.trim() ||
      input.error?.trim() ||
      AUTH_MESSAGES.OAUTH_UNAVAILABLE;

    return await this.issueOAuthRedirect(tx.redirectUri, {
      status: 'error',
      code: 'provider_error',
      message,
    });
  }

  async handleOAuthCallback(input: {
    provider: AuthProvider;
    state?: string;
    profile: OAuthProviderProfile;
  }) {
    const provider = this.assertOAuthProvider(input.provider);
    const state = input.state?.trim();

    if (!state) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }

    const tx = await this.consumeOAuthTransaction(state);
    if (!tx || tx.provider !== provider) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }

    const profile = this.normalizeAndValidateProfile(provider, input.profile);
    const result = await this.oauthAccountService.resolveOAuthResult(
      tx,
      profile,
      async (payload) => await this.createLinkTicket(payload),
    );

    return await this.issueOAuthRedirect(tx.redirectUri, result);
  }

  async exchangeOAuthResultToken(
    resultToken: string,
  ): Promise<OAuthResultPayload> {
    const normalizedToken = resultToken.trim();
    if (!normalizedToken) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }

    const key = this.buildOAuthResultKey(normalizedToken);
    const client = await this.redisService.getClient();
    const payload = await client.get(key);
    await client.del(key);

    if (!payload) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }

    try {
      return JSON.parse(payload) as OAuthResultPayload;
    } catch {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }
  }

  async completeOAuthLink(userId: string, linkToken: string) {
    const normalizedLinkToken = linkToken.trim();
    if (!normalizedLinkToken) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
      });
    }

    const client = await this.redisService.getClient();
    const key = this.buildOAuthLinkKey(normalizedLinkToken);
    const rawTicket = await client.get(key);
    await client.del(key);

    if (!rawTicket) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
      });
    }

    let ticket: OAuthLinkTicket;
    try {
      ticket = JSON.parse(rawTicket) as OAuthLinkTicket;
    } catch {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
      });
    }

    if (!ticket.userId || ticket.userId !== userId) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
      });
    }

    const linked = await this.oauthAccountService.completeOAuthLink(
      userId,
      ticket,
    );
    if (!linked) {
      throw new ApiError({
        statusCode: HttpStatus.CONFLICT,
        message: AUTH_MESSAGES.OAUTH_LINK_TOKEN_INVALID,
      });
    }

    return linked;
  }

  private normalizeAndValidateProfile(
    provider: AuthProvider,
    profile: OAuthProviderProfile,
  ): OAuthProviderProfile {
    if (
      !profile ||
      profile.provider !== provider ||
      !profile.providerUserId ||
      profile.providerUserId.trim().length === 0
    ) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.OAUTH_UNAVAILABLE,
      });
    }

    return {
      provider,
      providerUserId: profile.providerUserId.trim(),
      email: this.normalizeEmailOrNull(profile.email),
      emailVerified: Boolean(profile.emailVerified),
      name: profile.name?.trim() || null,
      photo: profile.photo?.trim() || null,
    };
  }

  private async createLinkTicket(payload: OAuthLinkTicket) {
    const token = this.generateOpaqueToken();
    const client = await this.redisService.getClient();
    await client.set(this.buildOAuthLinkKey(token), JSON.stringify(payload), {
      EX: this.oauthLinkTtlSeconds,
    });
    return token;
  }

  private async issueOAuthRedirect(
    redirectUri: string,
    payload: OAuthResultPayload,
  ) {
    const token = this.generateOpaqueToken();
    const client = await this.redisService.getClient();
    await client.set(this.buildOAuthResultKey(token), JSON.stringify(payload), {
      EX: this.oauthResultTtlSeconds,
    });

    const url = new URL(redirectUri);
    url.searchParams.set('oauth_result_token', token);
    return url.toString();
  }

  private async consumeOAuthTransaction(state: string) {
    const client = await this.redisService.getClient();
    const key = this.buildOAuthTxKey(state);
    const payload = await client.get(key);
    await client.del(key);

    if (!payload) {
      return null;
    }

    try {
      return JSON.parse(payload) as OAuthTransactionState;
    } catch {
      return null;
    }
  }

  private assertOAuthProvider(provider: AuthProvider) {
    if (provider !== AuthProvider.GOOGLE && provider !== AuthProvider.GITHUB) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_PROVIDER_NOT_SUPPORTED,
      });
    }

    return provider;
  }

  private normalizeAndValidateRedirectUri(redirectUri: string) {
    const candidate = this.safeUrl(redirectUri);
    if (!candidate) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }

    const isAllowed = this.oauthAllowedRedirects.some((allowed) => {
      const allowedUrl = this.safeUrl(allowed);
      if (!allowedUrl) return false;
      if (allowedUrl.protocol !== candidate.protocol) return false;
      if (allowedUrl.host !== candidate.host) return false;

      const allowedPath = allowedUrl.pathname.endsWith('/')
        ? allowedUrl.pathname
        : `${allowedUrl.pathname}/`;
      const candidatePath = candidate.pathname.endsWith('/')
        ? candidate.pathname
        : `${candidate.pathname}/`;

      return candidatePath.startsWith(allowedPath);
    });

    if (!isAllowed) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: AUTH_MESSAGES.OAUTH_INVALID_REQUEST,
      });
    }

    return candidate.toString();
  }

  private buildOAuthTxKey(state: string) {
    return `${this.redisPrefix}:oauth:tx:${state}`;
  }

  private buildOAuthResultKey(token: string) {
    return `${this.redisPrefix}:oauth:result:${token}`;
  }

  private buildOAuthLinkKey(token: string) {
    return `${this.redisPrefix}:oauth:link:${token}`;
  }

  private generateOpaqueToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  private normalizeEmailOrNull(email?: string | null) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  private safeUrl(value: string) {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }

  private parseMs(value: ms.StringValue | undefined, fallbackMs: number) {
    if (!value) return fallbackMs;
    const parsed = ms(value);
    if (typeof parsed !== 'number' || Number.isNaN(parsed) || parsed <= 0) {
      return fallbackMs;
    }
    return parsed;
  }
}

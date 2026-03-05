import { JwtService } from '@nestjs/jwt';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { ACAuthIdentityRepository } from 'src/repositories/auth-identity.repository';
import { OAuthAccountService } from 'src/services/oauth-account.service';
import { UserService } from 'src/services/user.service';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('OAuthAccountService', () => {
  let service: OAuthAccountService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let logger: jest.Mocked<PinoLoggerService>;
  let authIdentityRepository: jest.Mocked<ACAuthIdentityRepository>;

  const profile = {
    provider: AuthProvider.GOOGLE,
    providerUserId: 'provider-user-1',
    email: 'user@example.com',
    emailVerified: true,
    name: 'OAuth User',
    photo: 'https://img.example.com/u.png',
  } as const;
  const ids = {
    u1: '507f191e810c19729de860ea',
    u2: '507f191e810c19729de860eb',
    u3: '507f191e810c19729de860ec',
    u4: '507f191e810c19729de860ed',
    u5: '507f191e810c19729de860ee',
    u6: '507f191e810c19729de860ef',
    u7: '507f191e810c19729de860f0',
    u8: '507f191e810c19729de860f1',
    other: '507f191e810c19729de860f2',
  } as const;
  const txLogin = () =>
    ({
      provider: AuthProvider.GOOGLE,
      intent: 'login',
      redirectUri: 'https://app',
      createdAt: new Date().toISOString(),
    }) as never;
  const txLink = (requestedByUserId: string) =>
    ({
      provider: AuthProvider.GOOGLE,
      intent: 'link',
      requestedByUserId,
      redirectUri: 'https://app',
      createdAt: new Date().toISOString(),
    }) as never;

  beforeEach(() => {
    userService = {
      getUserByIdRaw: jest.fn(),
      getUserByProviderSocialId: jest.fn(),
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      updateUserRaw: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt-token'),
    } as unknown as jest.Mocked<JwtService>;

    logger = {
      log: jest.fn(),
    } as unknown as jest.Mocked<PinoLoggerService>;

    authIdentityRepository = {
      findByProviderIdentity: jest.fn(),
      updateById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<ACAuthIdentityRepository>;

    service = new OAuthAccountService(
      userService,
      jwtService,
      logger,
      authIdentityRepository,
    );
  });

  it('should authenticate existing identity and backfill user', async () => {
    authIdentityRepository.findByProviderIdentity.mockResolvedValue({
      id: 'identity-1',
      userId: { toString: () => ids.u1 },
      name: 'Old Name',
      photo: 'old-photo',
    } as never);
    userService.getUserByIdRaw.mockResolvedValue({
      id: ids.u1,
      email: 'user@example.com',
      role: UserRole.STUDENT,
      provider: AuthProvider.GOOGLE,
      socialId: null,
      name: null,
      photo: null,
    } as never);
    userService.getUserByEmail.mockResolvedValue(null as never);

    const result = await service.resolveOAuthResult(
      txLogin(),
      profile,
      jest.fn(),
    );

    expect(authIdentityRepository.updateById).toHaveBeenCalledWith(
      'identity-1',
      expect.objectContaining({
        email: 'user@example.com',
        emailVerified: true,
      }),
    );
    expect(userService.updateUserRaw).toHaveBeenCalledWith(
      ids.u1,
      expect.objectContaining({
        name: 'OAuth User',
        photo: 'https://img.example.com/u.png',
        socialId: 'provider-user-1',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: 'authenticated',
        accessToken: 'jwt-token',
        isNewUser: false,
      }),
    );
  });

  it('should authenticate legacy social-id user', async () => {
    authIdentityRepository.findByProviderIdentity.mockResolvedValue(null as never);
    userService.getUserByProviderSocialId.mockResolvedValue({
      id: ids.u2,
      email: 'legacy@example.com',
      role: UserRole.USER,
      provider: AuthProvider.GOOGLE,
      socialId: 'provider-user-1',
      name: 'Legacy',
      photo: null,
    } as never);
    userService.getUserByIdRaw.mockResolvedValue({
      id: ids.u2,
      email: 'legacy@example.com',
      role: UserRole.USER,
      provider: AuthProvider.GOOGLE,
      socialId: 'provider-user-1',
      name: 'Legacy',
      photo: null,
    } as never);

    const result = await service.resolveOAuthResult(
      txLogin(),
      profile,
      jest.fn(),
    );

    expect(authIdentityRepository.create).toHaveBeenCalled();
    expect(result.status).toBe('authenticated');
    expect((result as any).isNewUser).toBe(false);
  });

  it('should return link_required for link intent when no user mapping exists', async () => {
    authIdentityRepository.findByProviderIdentity.mockResolvedValue(null as never);
    userService.getUserByProviderSocialId.mockResolvedValue(null as never);
    const createLinkTicket = jest.fn().mockResolvedValue('link-ticket');

    const result = await service.resolveOAuthResult(
      txLink(ids.u3),
      profile,
      createLinkTicket,
    );

    expect(createLinkTicket).toHaveBeenCalledWith(
      expect.objectContaining({ userId: ids.u3 }),
    );
    expect(result).toEqual({
      status: 'link_required',
      message: AUTH_MESSAGES.OAUTH_LINK_REQUIRED,
      linkToken: 'link-ticket',
      provider: AuthProvider.GOOGLE,
      email: 'user@example.com',
    });
  });

  it('should return errors for missing/unverified emails', async () => {
    authIdentityRepository.findByProviderIdentity.mockResolvedValue(null as never);
    userService.getUserByProviderSocialId.mockResolvedValue(null as never);

    const missingEmail = await service.resolveOAuthResult(
      txLogin(),
      { ...profile, email: null },
      jest.fn(),
    );
    const unverified = await service.resolveOAuthResult(
      txLogin(),
      { ...profile, emailVerified: false },
      jest.fn(),
    );

    expect(missingEmail).toEqual({
      status: 'error',
      code: 'email_missing',
      message: AUTH_MESSAGES.OAUTH_EMAIL_MISSING,
    });
    expect(unverified).toEqual({
      status: 'error',
      code: 'email_unverified',
      message: AUTH_MESSAGES.OAUTH_EMAIL_NOT_VERIFIED,
    });
  });

  it('should create a new user when no email owner exists', async () => {
    authIdentityRepository.findByProviderIdentity.mockResolvedValue(null as never);
    userService.getUserByProviderSocialId.mockResolvedValue(null as never);
    userService.getUserByEmail.mockResolvedValue(null as never);
    userService.createUser.mockResolvedValue({
      id: ids.u4,
      email: 'user@example.com',
      role: UserRole.USER,
    } as never);

    const result = await service.resolveOAuthResult(
      txLogin(),
      { ...profile, name: null, email: '  john.smith@example.com  ' },
      jest.fn(),
    );

    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Smith',
        email: 'john.smith@example.com',
      }),
    );
    expect(authIdentityRepository.create).toHaveBeenCalled();
    expect((result as any).isNewUser).toBe(true);
  });

  it('should authenticate an existing email owner and ignore duplicate identity create errors', async () => {
    authIdentityRepository.findByProviderIdentity.mockResolvedValue(null as never);
    userService.getUserByProviderSocialId.mockResolvedValue(null as never);
    userService.getUserByEmail.mockResolvedValue({
      id: ids.u5,
      email: 'user@example.com',
      role: UserRole.STUDENT,
      provider: AuthProvider.GOOGLE,
      socialId: null,
      name: null,
      photo: null,
    } as never);
    userService.getUserByIdRaw.mockResolvedValue({
      id: ids.u5,
      email: 'user@example.com',
      role: UserRole.STUDENT,
      provider: AuthProvider.GOOGLE,
      socialId: null,
      name: null,
      photo: null,
    } as never);
    authIdentityRepository.create.mockRejectedValueOnce({ code: 11000 });

    const result = await service.resolveOAuthResult(
      txLogin(),
      profile,
      jest.fn(),
    );

    expect(result.status).toBe('authenticated');
    expect((result as any).isNewUser).toBe(false);
  });

  it('should complete oauth link flow with create and update branches', async () => {
    userService.getUserByIdRaw
      .mockResolvedValueOnce({
        id: ids.u6,
        email: null,
        role: UserRole.USER,
        provider: AuthProvider.GOOGLE,
        socialId: null,
        name: null,
        photo: null,
      } as never)
      .mockResolvedValueOnce({
        id: ids.u6,
        email: 'user@example.com',
        role: UserRole.USER,
        provider: AuthProvider.GOOGLE,
        socialId: 'provider-user-1',
        name: 'OAuth User',
        photo: 'https://img.example.com/u.png',
      } as never);
    authIdentityRepository.findByProviderIdentity
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce({
        id: 'identity-6',
        userId: { toString: () => ids.u6 },
        name: null,
        photo: null,
      } as never);
    userService.getUserByEmail.mockResolvedValue(null as never);

    const ticket = {
      userId: ids.u6,
      provider: AuthProvider.GOOGLE,
      providerUserId: 'provider-user-1',
      email: 'user@example.com',
      emailVerified: true,
      name: 'OAuth User',
      photo: 'https://img.example.com/u.png',
      createdAt: new Date().toISOString(),
    };

    const created = await service.completeOAuthLink(ids.u6, ticket);
    expect(authIdentityRepository.create).toHaveBeenCalled();
    expect(userService.updateUserRaw).toHaveBeenCalled();
    expect(created?.accessToken).toBe('jwt-token');

    userService.getUserByIdRaw
      .mockResolvedValueOnce({
        id: ids.u6,
        email: 'user@example.com',
        role: UserRole.USER,
        provider: AuthProvider.GOOGLE,
        socialId: null,
        name: 'OAuth User',
        photo: null,
      } as never)
      .mockResolvedValueOnce({
        id: ids.u6,
        email: 'user@example.com',
        role: UserRole.USER,
        provider: AuthProvider.GOOGLE,
        socialId: 'provider-user-1',
        name: 'OAuth User',
        photo: null,
      } as never);
    const updated = await service.completeOAuthLink(ids.u6, ticket);
    expect(authIdentityRepository.updateById).toHaveBeenCalledWith(
      'identity-6',
      expect.objectContaining({
        email: 'user@example.com',
      }),
    );
    expect(updated?.accessToken).toBe('jwt-token');
  });

  it('should return null for linking if provider identity belongs to another user', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: ids.u7,
      email: `${ids.u7}@example.com`,
      role: UserRole.USER,
      provider: AuthProvider.GOOGLE,
      socialId: null,
      name: 'User Seven',
      photo: null,
    } as never);
    authIdentityRepository.findByProviderIdentity.mockResolvedValue({
      id: 'identity-7',
      userId: { toString: () => ids.other },
    } as never);

    const result = await service.completeOAuthLink(ids.u7, {
      userId: ids.u7,
      provider: AuthProvider.GOOGLE,
      providerUserId: 'provider-user-7',
      email: `${ids.u7}@example.com`,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    });

    expect(result).toBeNull();
  });

  it('should rethrow non-duplicate identity create errors', async () => {
    authIdentityRepository.findByProviderIdentity.mockResolvedValue(null as never);
    userService.getUserByProviderSocialId.mockResolvedValue({
      id: ids.u8,
      email: `${ids.u8}@example.com`,
      role: UserRole.USER,
      provider: AuthProvider.GOOGLE,
      socialId: 'provider-user-8',
      name: 'User Eight',
      photo: null,
    } as never);
    authIdentityRepository.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.resolveOAuthResult(
        txLogin(),
        { ...profile, providerUserId: 'provider-user-8' },
        jest.fn(),
      ),
    ).rejects.toThrow('db down');
  });
});

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import passport from 'passport';
import { ApiError } from 'src/common/errors/api-error';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { AuthController } from 'src/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { PasswordResetService } from 'src/services/password-reset.service';
import { AuthProvider } from 'src/types/auth-provider.enum';

type AuthControllerPrivates = {
  redirectToProvider: (
    request: unknown,
    response: unknown,
    provider: AuthProvider,
    state: string,
  ) => void;
  authenticateCallback: (
    request: unknown,
    response: unknown,
    provider: AuthProvider,
  ) => Promise<unknown>;
};

describe('AuthController OAuth & Uploads', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;
  let passwordResetService: jest.Mocked<PasswordResetService>;

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
      me: jest.fn(),
      updateMe: jest.fn(),
      createOAuthState: jest.fn(),
      handleOAuthProviderError: jest.fn(),
      handleOAuthCallback: jest.fn(),
      exchangeOAuthResultToken: jest.fn(),
      completeOAuthLink: jest.fn(),
      getLinkedAccounts: jest.fn(),
      unlinkOAuthProvider: jest.fn(),
      changePassword: jest.fn(),
    } as never;

    cloudinaryService = {
      uploadImage: jest.fn(),
      uploadDocument: jest.fn(),
    } as never;

    passwordResetService = {
      requestReset: jest.fn(),
      verifyOtp: jest.fn(),
      resetPassword: jest.fn(),
    } as never;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: CloudinaryService, useValue: cloudinaryService },
        { provide: PasswordResetService, useValue: passwordResetService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('should authorize oauth and reject invalid provider/query', async () => {
    const privateController = controller as unknown as AuthControllerPrivates;
    const redirectSpy = jest
      .spyOn(privateController, 'redirectToProvider')
      .mockImplementation(() => {});
    authService.createOAuthState.mockResolvedValue('oauth-state');

    const response = { redirect: jest.fn() } as never;
    await controller.oauthAuthorize(
      {} as never,
      AuthProvider.GOOGLE,
      { redirectUri: 'https://app.example.com/oauth', intent: 'login' },
      response,
    );

    expect(authService.createOAuthState).toHaveBeenCalledWith({
      provider: AuthProvider.GOOGLE,
      redirectUri: 'https://app.example.com/oauth',
      intent: 'login',
    });
    expect(redirectSpy).toHaveBeenCalledWith(
      expect.anything(),
      response,
      AuthProvider.GOOGLE,
      'oauth-state',
    );

    await expect(
      controller.oauthAuthorize(
        {} as never,
        'bad-provider',
        { redirectUri: 'https://app.example.com/oauth' } as never,
        response,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.oauthAuthorize(
        {} as never,
        AuthProvider.GOOGLE,
        { redirectUri: '' } as never,
        response,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should authorize oauth linking for authenticated users', async () => {
    const privateController = controller as unknown as AuthControllerPrivates;
    const redirectSpy = jest
      .spyOn(privateController, 'redirectToProvider')
      .mockImplementation(() => {});
    authService.createOAuthState.mockResolvedValue('link-state');
    const response = { redirect: jest.fn() } as never;

    await controller.oauthLinkAuthorize(
      { user: { id: 'user-1' } } as never,
      AuthProvider.GITHUB,
      { redirectUri: 'https://app.example.com/link', intent: 'signup' },
      response,
    );

    expect(authService.createOAuthState).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: AuthProvider.GITHUB,
        intent: 'link',
        requestedByUserId: 'user-1',
      }),
    );
    expect(redirectSpy).toHaveBeenCalled();
  });

  it('should reject invalid oauth link authorize provider and query payloads', async () => {
    const response = { redirect: jest.fn() } as never;

    await expect(
      controller.oauthLinkAuthorize(
        { user: { id: 'user-1' } } as never,
        'invalid-provider',
        { redirectUri: 'https://app.example.com/link' } as never,
        response,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.oauthLinkAuthorize(
        { user: { id: 'user-1' } } as never,
        AuthProvider.GOOGLE,
        { redirectUri: '' } as never,
        response,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should handle oauth callback provider errors and success', async () => {
    const privateController = controller as unknown as AuthControllerPrivates;
    const redirect = jest.fn();
    const response = { redirect } as never;
    authService.handleOAuthProviderError.mockResolvedValue(
      'https://app.example.com/oauth/error',
    );

    await controller.oauthCallback(
      {} as never,
      AuthProvider.GOOGLE,
      { error: 'access_denied', state: 'opaque-state' },
      response,
    );
    expect(authService.handleOAuthProviderError).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('https://app.example.com/oauth/error');

    jest
      .spyOn(privateController, 'authenticateCallback')
      .mockResolvedValue({ provider: AuthProvider.GOOGLE, id: 'oauth-id' } as never);
    authService.handleOAuthCallback.mockResolvedValue(
      'https://app.example.com/oauth/success',
    );

    await controller.oauthCallback(
      {} as never,
      AuthProvider.GOOGLE,
      { state: 'state-2', code: 'code-1' },
      response,
    );
    expect(authService.handleOAuthCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: AuthProvider.GOOGLE,
        state: 'state-2',
      }),
    );
    expect(redirect).toHaveBeenLastCalledWith(
      'https://app.example.com/oauth/success',
    );
  });

  it('should reject invalid oauth callback provider and query payloads', async () => {
    const response = { redirect: jest.fn() } as never;

    await expect(
      controller.oauthCallback(
        {} as never,
        'invalid-provider',
        { state: 'state-1' } as never,
        response,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.oauthCallback(
        {} as never,
        AuthProvider.GOOGLE,
        { state: 123 } as never,
        response,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should exchange oauth result and complete/unlink linked account operations', async () => {
    authService.exchangeOAuthResultToken.mockResolvedValue({
      accessToken: 'token',
      user: { id: 'user-1' },
    } as never);
    authService.completeOAuthLink.mockResolvedValue({ linked: true } as never);
    authService.getLinkedAccounts.mockResolvedValue({
      accounts: [],
      linkedProviders: [],
      total: 0,
    } as never);
    authService.unlinkOAuthProvider.mockResolvedValue({ unlinked: true } as never);

    const exchanged = await controller.oauthExchange({ resultToken: 'result-token' });
    expect(exchanged.message).toBe(AUTH_MESSAGES.OAUTH_RESULT_FETCHED);

    const linked = await controller.oauthCompleteLink(
      { user: { id: 'user-1' } } as never,
      { linkToken: 'link-token' },
    );
    expect(linked.message).toBe(AUTH_MESSAGES.OAUTH_LINK_COMPLETED);

    const linkedAccounts = await controller.getLinkedOAuthAccounts({
      user: { id: 'user-1' },
    } as never);
    expect(linkedAccounts.message).toBe(AUTH_MESSAGES.OAUTH_LINKED_ACCOUNTS_FETCHED);

    const unlinked = await controller.unlinkOAuthAccount(
      { user: { id: 'user-1' } } as never,
      AuthProvider.GITHUB,
    );
    expect(unlinked.message).toBe(AUTH_MESSAGES.OAUTH_ACCOUNT_UNLINKED);

    await expect(
      controller.oauthExchange({ resultToken: '' } as never),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.oauthCompleteLink(
        { user: { id: 'user-1' } } as never,
        { linkToken: '' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.unlinkOAuthAccount(
        { user: { id: 'user-1' } } as never,
        'invalid-provider',
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should change password and validate payload', async () => {
    authService.changePassword.mockResolvedValue({ changed: true } as never);

    const result = await controller.changePassword(
      {
        user: { id: 'user-1' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      } as never,
      {
        currentPassword: 'OldPassword!123',
        newPassword: 'NewStrongPassword!123',
        confirmNewPassword: 'NewStrongPassword!123',
      },
    );

    expect(result.message).toBe(AUTH_MESSAGES.CHANGE_PASSWORD_SUCCESS);
    expect(authService.changePassword).toHaveBeenCalledWith(
      'user-1',
      'OldPassword!123',
      'NewStrongPassword!123',
      expect.objectContaining({ ip: '127.0.0.1', userAgent: 'jest' }),
    );

    await expect(
      controller.changePassword(
        { user: { id: 'user-1' } } as never,
        {
          currentPassword: '',
          newPassword: 'weak',
          confirmNewPassword: 'weak',
        } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should upload certification media for image and document, and validate missing file', async () => {
    cloudinaryService.uploadImage.mockResolvedValue('https://cdn.example/image.png');
    cloudinaryService.uploadDocument.mockResolvedValue({
      url: 'https://cdn.example/file.pdf',
      publicId: 'doc-1',
    } as never);

    const imageResult = await controller.uploadCertificationMedia({
      mimetype: 'image/png',
      originalname: 'cert.png',
      size: 12345,
    } as never);
    expect(imageResult.data).toEqual(
      expect.objectContaining({
        url: 'https://cdn.example/image.png',
        mimeType: 'image/png',
      }),
    );

    const docResult = await controller.uploadCertificationMedia({
      mimetype: 'application/pdf',
      originalname: 'cert.pdf',
      size: 54321,
    } as never);
    expect(docResult.data).toEqual(
      expect.objectContaining({
        url: 'https://cdn.example/file.pdf',
        mimeType: 'application/pdf',
      }),
    );

    await expect(controller.uploadCertificationMedia(undefined)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('should redirect via passport and authenticate oauth callback private helpers', async () => {
    const authenticateSpy = jest.spyOn(passport, 'authenticate');
    const privateController = controller as unknown as AuthControllerPrivates;
    const request = {} as never;
    const response = {} as never;

    authenticateSpy.mockImplementationOnce((_provider, _options) => {
      return (_req, _res) => undefined;
    });
    privateController.redirectToProvider(
      request,
      response,
      AuthProvider.GOOGLE,
      'state-123',
    );
    expect(authenticateSpy).toHaveBeenCalledWith(
      AuthProvider.GOOGLE,
      expect.objectContaining({ customState: 'state-123' }),
    );

    authenticateSpy.mockImplementationOnce((_provider, _options, callback) => {
      return (_req, _res) => {
        (callback as Function)(null, { provider: AuthProvider.GOOGLE, id: 'oauth-id' });
      };
    });
    await expect(
      privateController.authenticateCallback(
        request,
        response,
        AuthProvider.GOOGLE,
      ),
    ).resolves.toEqual(expect.objectContaining({ id: 'oauth-id' }));

    authenticateSpy.mockImplementationOnce((_provider, _options, callback) => {
      return (_req, _res) => {
        (callback as Function)(new Error('oauth fail'), null);
      };
    });
    await expect(
      privateController.authenticateCallback(
        request,
        response,
        AuthProvider.GOOGLE,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    const restore = authenticateSpy.mockRestore.bind(authenticateSpy);
    restore();
  });

  it('should preserve ApiError status from service layer rejections in oauth handlers', async () => {
    authService.exchangeOAuthResultToken.mockRejectedValue(
      new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.OAUTH_UNAVAILABLE,
      }),
    );

    await expect(
      controller.oauthExchange({ resultToken: 'state-token' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

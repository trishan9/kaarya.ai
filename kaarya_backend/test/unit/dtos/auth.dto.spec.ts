import {
  ChangePasswordDTO,
} from 'src/dtos/auth/change-password.dto';
import {
  OAuthAuthorizeQueryDTO,
  OAuthCallbackQueryDTO,
  OAuthCompleteLinkDTO,
  OAuthExchangeDTO,
  OAuthProviderParamDTO,
} from 'src/dtos/auth/oauth.dto';
import {
  RequestPasswordResetDTO,
  ResetPasswordDTO,
  VerifyPasswordResetOtpDTO,
} from 'src/dtos/auth/password-reset.dto';
import { AuthProvider } from 'src/types/auth-provider.enum';

describe('Auth DTOs', () => {
  it('should validate change password payloads', () => {
    const valid = ChangePasswordDTO.safeParse({
      currentPassword: 'CurrentPass#123',
      newPassword: 'NewStrongPass#123',
      confirmNewPassword: 'NewStrongPass#123',
    });
    const invalidMismatch = ChangePasswordDTO.safeParse({
      currentPassword: 'CurrentPass#123',
      newPassword: 'NewStrongPass#123',
      confirmNewPassword: 'Mismatch#123',
    });
    const invalidWeak = ChangePasswordDTO.safeParse({
      currentPassword: 'CurrentPass#123',
      newPassword: 'weak',
      confirmNewPassword: 'weak',
    });

    expect(valid.success).toBe(true);
    expect(invalidMismatch.success).toBe(false);
    expect(invalidWeak.success).toBe(false);
  });

  it('should validate oauth DTOs', () => {
    const provider = OAuthProviderParamDTO.parse({
      provider: AuthProvider.GOOGLE,
    });
    const authorize = OAuthAuthorizeQueryDTO.parse({
      redirectUri: ' https://app.example.com/oauth/callback ',
      intent: 'link',
    });
    const callback = OAuthCallbackQueryDTO.parse({
      code: ' code ',
      state: ' state ',
      error: ' error ',
      error_description: ' description ',
    });
    const exchange = OAuthExchangeDTO.safeParse({ resultToken: ' token ' });
    const link = OAuthCompleteLinkDTO.safeParse({ linkToken: ' link-token ' });
    const invalidExchange = OAuthExchangeDTO.safeParse({ resultToken: ' ' });

    expect(provider.provider).toBe(AuthProvider.GOOGLE);
    expect(authorize.redirectUri).toBe('https://app.example.com/oauth/callback');
    expect(callback.code).toBe('code');
    expect(exchange.success).toBe(true);
    expect(link.success).toBe(true);
    expect(invalidExchange.success).toBe(false);
  });

  it('should validate password reset DTOs', () => {
    const request = RequestPasswordResetDTO.safeParse({
      email: 'test@example.com',
    });
    const verify = VerifyPasswordResetOtpDTO.safeParse({
      email: 'test@example.com',
      otp: '123456',
    });
    const reset = ResetPasswordDTO.safeParse({
      token: 'reset-token',
      password: 'StrongPassword#123',
      confirmPassword: 'StrongPassword#123',
    });
    const invalidOtp = VerifyPasswordResetOtpDTO.safeParse({
      email: 'test@example.com',
      otp: '12',
    });
    const invalidReset = ResetPasswordDTO.safeParse({
      token: 'reset-token',
      password: 'StrongPassword#123',
      confirmPassword: 'Mismatch#123',
    });

    expect(request.success).toBe(true);
    expect(verify.success).toBe(true);
    expect(reset.success).toBe(true);
    expect(invalidOtp.success).toBe(false);
    expect(invalidReset.success).toBe(false);
  });
});


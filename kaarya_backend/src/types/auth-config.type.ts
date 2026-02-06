import ms from 'ms';

export type AuthConfig = {
  secret?: string;
  expires?: ms.StringValue;
  refreshSecret?: string;
  refreshExpires?: ms.StringValue;
  forgotSecret?: string;
  forgotExpires?: ms.StringValue;
  confirmEmailSecret?: string;
  confirmEmailExpires?: ms.StringValue;
  resetOtpSecret?: string;
  resetOtpExpires?: ms.StringValue;
  resetOtpMaxAttempts?: number;
  resetRequestWindow?: ms.StringValue;
  resetRequestMax?: number;
  resetVerifyWindow?: ms.StringValue;
  resetVerifyMax?: number;
  resetPasswordWindow?: ms.StringValue;
  resetPasswordMax?: number;
};

import ms from 'ms';

export type OAuthProviderConfig = {
  clientId?: string;
  clientSecret?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  tokenInfoUrl?: string;
  emailsUrl?: string;
};

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
  oauthStateExpires?: ms.StringValue;
  oauthResultExpires?: ms.StringValue;
  oauthLinkExpires?: ms.StringValue;
  oauthAllowedRedirects?: string[];
  oauthGoogle?: OAuthProviderConfig;
  oauthGithub?: OAuthProviderConfig;
};

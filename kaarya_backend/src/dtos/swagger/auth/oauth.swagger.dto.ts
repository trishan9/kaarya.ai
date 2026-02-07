import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OAuthAuthorizeQuerySwaggerDTO {
  @ApiProperty({
    example: 'http://localhost:3000/oauth/callback',
    description: 'Frontend or mobile deep link callback URL.',
  })
  redirectUri: string;

  @ApiPropertyOptional({
    example: 'login',
    enum: ['login', 'signup', 'link'],
  })
  intent?: 'login' | 'signup' | 'link';
}

export class OAuthExchangeSwaggerDTO {
  @ApiProperty({ example: 'oauth_result_opaque_token' })
  resultToken: string;
}

export class OAuthCompleteLinkSwaggerDTO {
  @ApiProperty({ example: 'oauth_link_opaque_token' })
  linkToken: string;
}

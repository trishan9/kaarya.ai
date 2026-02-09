import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { AuthController } from 'src/controllers/auth.controller';
import { LoggerModule } from 'src/logger/logger.module';
import { AuthOAuthService } from 'src/services/auth-oauth.service';
import { AuthService } from 'src/services/auth.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { AllConfigType } from 'src/types/config.type';
import { UserModule } from './user.module';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { EmailModule } from 'src/modules/email.module';
import { RedisModule } from 'src/modules/redis.module';
import { PasswordResetService } from 'src/services/password-reset.service';
import { RateLimitService } from 'src/services/rate-limit.service';
import { OAuthAccountService } from 'src/services/oauth-account.service';
import { GithubOAuthStrategy } from 'src/strategies/github-oauth.strategy';
import { GoogleOAuthStrategy } from 'src/strategies/google-oauth.strategy';

@Module({
  imports: [
    UserModule,
    LoggerModule,
    EmailModule,
    RedisModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        secret: configService.get(CONFIG_KEYS.AUTH.SECRET, { infer: true }),
        signOptions: {
          expiresIn: configService.get(CONFIG_KEYS.AUTH.EXPIRES, {
            infer: true,
          }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthOAuthService,
    OAuthAccountService,
    JwtStrategy,
    GoogleOAuthStrategy,
    GithubOAuthStrategy,
    CloudinaryService,
    PasswordResetService,
    RateLimitService,
  ],
  exports: [AuthService],
})
export class AuthModule {}

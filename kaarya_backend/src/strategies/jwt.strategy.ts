import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ApiError } from 'src/common/errors/api-error';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { UserService } from 'src/services/user.service';
import { AllConfigType } from 'src/types/config.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow(CONFIG_KEYS.AUTH.SECRET, {
        infer: true,
      }),
    });
  }
  async validate(payload: { sub: string; iat?: number }) {
    let user;
    try {
      user = await this.userService.getUserByIdRaw(payload.sub);
    } catch {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_TOKEN,
      });
    }

    if (
      user.passwordChangedAt &&
      payload.iat &&
      user.passwordChangedAt instanceof Date
    ) {
      const issuedAtSeconds = payload.iat;
      const passwordChangedAtSeconds = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );
      if (issuedAtSeconds < passwordChangedAtSeconds) {
        throw new ApiError({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: AUTH_MESSAGES.INVALID_TOKEN,
        });
      }
    }

    return sanitizeUser(user);
  }
}

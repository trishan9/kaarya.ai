import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ApiError } from 'src/common/errors/api-error';
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

  async validate(payload) {
    if (!payload.id) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_TOKEN,
      });
    }

    const user = await this.userService.getUserById(payload.id);

    if (!user) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_TOKEN,
      });
    }

    return user;
  }
}

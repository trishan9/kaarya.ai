import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { ApiError } from 'src/common/errors/api-error';
import {
  AUTH_MESSAGES,
  LOG_MESSAGES,
  USER_MESSAGES,
} from 'src/constants/messages.constants';
import { TCreateUserDTO, TLoginDTO } from 'src/dtos/users/user.dto';
import { PinoLoggerService } from 'src/logger/pino-logger.service';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLoggerService,
  ) {}

  async signup(payload: TCreateUserDTO) {
    const existingUser = await this.userService.getUserByEmail(payload.email);
    if (existingUser) {
      throw new ApiError({
        statusCode: HttpStatus.CONFLICT,
        message: AUTH_MESSAGES.EMAIL_IN_USE,
      });
    }

    const hashedPassword = await argon2.hash(payload.password, {
      type: argon2.argon2d,
    });

    const user = await this.userService.createUser({
      ...payload,
      password: hashedPassword,
    });

    return user;
  }

  async login(payload: TLoginDTO) {
    const user = await this.userService.getUserByEmail(payload.email);

    if (!user) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    if (!user.password) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    const isPasswordValid = await argon2.verify(
      user.password,
      payload.password,
    );

    if (!isPasswordValid) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    const accessToken = await this.signAccessToken(
      user.id,
      user.email ?? payload.email,
      user.role,
    );

    this.logger.log(
      `${LOG_MESSAGES.LOGIN_SUCCESS} ${user.id}`,
      AuthService.name,
    );

    return {
      user,
      accessToken,
    };
  }

  async me(id: string) {
    if (!id) {
      throw new ApiError({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    return this.userService.getUserById(id);
  }

  private async signAccessToken(userId: string, email: string, role: UserRole) {
    return this.jwtService.signAsync({ sub: userId, email, role });
  }
}

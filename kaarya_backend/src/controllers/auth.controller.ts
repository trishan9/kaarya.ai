import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { asyncHandler } from 'src/common/utils/async-handler';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { AuthService } from 'src/services/auth.service';
import { ApiTags } from '@nestjs/swagger';
import { TCreateUserDTO, TLoginDTO } from 'src/dtos/users/user.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller({
  path: ROUTES.AUTH.BASE,
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(ROUTES.AUTH.SIGNUP)
  @HttpCode(HttpStatus.OK)
  async signup(@Body() payload: TCreateUserDTO) {
    return asyncHandler(async () => {
      const data = await this.authService.signup(payload);
      return buildSuccessResponse(data, AUTH_MESSAGES.SIGNUP_SUCCESS);
    });
  }

  @Post(ROUTES.AUTH.LOGIN)
  @HttpCode(HttpStatus.OK)
  async login(@Body() payload: TLoginDTO) {
    return asyncHandler(async () => {
      const data = await this.authService.login(payload);
      return buildSuccessResponse(data, AUTH_MESSAGES.LOGIN_SUCCESS);
    });
  }

  @Get(ROUTES.AUTH.ME)
  @UseGuards(AuthGuard('jwt'))
  getCurrentUser(@Request() request) {
    return asyncHandler(async () => {
      const user = await this.authService.me(request.user.id);
      return buildSuccessResponse(user, AUTH_MESSAGES.CURRENT_USER_SUCCESS);
    });
  }
}

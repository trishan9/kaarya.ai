import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { asyncHandler } from 'src/common/utils/async-handler';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/decorators/roles.decorator';

@ApiTags('Users')
@Controller({
  path: ROUTES.USER.BASE,
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getAllUsers() {
    return asyncHandler(async () => {
      const data = await this.userService.getAllUsers();
      return buildSuccessResponse(data, USER_MESSAGES.FETCH_ALL_SUCCESS);
    });
  }

  @Get(ROUTES.USER.BY_ID)
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  async getUserById(@Param('id') id: string) {
    return asyncHandler(async () => {
      const data = await this.userService.getUserById(id);
      return buildSuccessResponse(data, USER_MESSAGES.FETCH_BY_ID_SUCCESS);
    });
  }
}

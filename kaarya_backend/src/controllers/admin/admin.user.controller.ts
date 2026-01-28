import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import argon2 from 'argon2';
import { memoryStorage } from 'multer';
import z from 'zod';
import type { Express } from 'express';
import { ApiError } from 'src/common/errors/api-error';
import { asyncHandler } from 'src/common/utils/async-handler';
import { buildSuccessResponse } from 'src/common/utils/api-response';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import { AUTH_MESSAGES } from 'src/constants/messages.constants';
import { Roles } from 'src/decorators/roles.decorator';
import { CreateUserDTO, TCreateUserDTO } from 'src/dtos/users/user.dto';
import { CreateAdminUserSwaggerDTO } from 'src/dtos/swagger/users/user.swagger.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';

@ApiTags('Admin Users')
@Controller({
  path: `${ROUTES.ADMIN.BASE}/${ROUTES.USER.BASE}`,
  version: '1',
})
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(
            new ApiError({
              statusCode: HttpStatus.BAD_REQUEST,
              message: 'Only image files are allowed.',
            }),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateAdminUserSwaggerDTO })
  @HttpCode(HttpStatus.OK)
  async createUser(
    @Body() payload: TCreateUserDTO,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return asyncHandler(async () => {
      const parsedData = CreateUserDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const existingUser = await this.userService.getUserByEmail(
        parsedData.data.email,
      );

      if (existingUser) {
        throw new ApiError({
          statusCode: HttpStatus.CONFLICT,
          message: AUTH_MESSAGES.EMAIL_IN_USE,
        });
      }

      const hashedPassword = await argon2.hash(parsedData.data.password, {
        type: argon2.argon2id,
      });

      let photoUrl: string | undefined;
      if (photo) {
        photoUrl = await this.cloudinaryService.uploadImage(photo);
      }

      const { confirmPassword: _confirmPassword, ...userPayload } =
        parsedData.data;

      const user = await this.userService.createUser({
        ...userPayload,
        password: hashedPassword,
        confirmPassword: _confirmPassword,
        photo: photoUrl,
      });

      return buildSuccessResponse(
        sanitizeUser(user),
        USER_MESSAGES.CREATE_SUCCESS,
      );
    });
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
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
import {
  CreateUserDTO,
  TCreateUserDTO,
  TUpdateUserDTO,
  UpdateUserDTO,
} from 'src/dtos/users/user.dto';
import {
  CreateAdminUserSwaggerDTO,
  UpdateAdminUserSwaggerDTO,
} from 'src/dtos/swagger/users/user.swagger.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { UserRole } from 'src/types/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { ROUTES } from 'src/constants/routes.constants';
import { AdminUserService } from 'src/services/admin/admin.user.service';

@ApiTags('User Management - Admin')
@Controller({
  path: `${ROUTES.ADMIN.BASE}/${ROUTES.USER.BASE}`,
  version: '1',
})
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminUserController {
  constructor(
    private readonly userService: AdminUserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
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

  @Get()
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

  @Put(ROUTES.USER.BY_ID)
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
  @ApiBody({ type: UpdateAdminUserSwaggerDTO })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id') id: string,
    @Body() payload: TUpdateUserDTO,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return asyncHandler(async () => {
      const parsedData = UpdateUserDTO.safeParse(payload);

      if (!parsedData.success) {
        throw new ApiError({
          message: z.prettifyError(parsedData.error),
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      const existingUser = await this.userService.getUserById(id);
      if (!existingUser) {
        throw new ApiError({
          statusCode: HttpStatus.NOT_FOUND,
          message: USER_MESSAGES.NOT_FOUND,
        });
      }

      const userPayload = parsedData.data;

      if (userPayload.email && userPayload.email !== existingUser.email) {
        const emailOwner = await this.userService.getUserByEmail(
          userPayload.email,
        );
        if (emailOwner) {
          throw new ApiError({
            statusCode: HttpStatus.CONFLICT,
            message: AUTH_MESSAGES.EMAIL_IN_USE,
          });
        }
      }

      if (userPayload.password) {
        userPayload.password = await argon2.hash(userPayload.password, {
          type: argon2.argon2id,
        });
      }

      if (photo) {
        userPayload.photo = await this.cloudinaryService.uploadImage(photo);
      }

      const user = await this.userService.updateUser(id, userPayload);
      if (!user) {
        throw new ApiError({
          statusCode: HttpStatus.NOT_FOUND,
          message: USER_MESSAGES.NOT_FOUND,
        });
      }

      return buildSuccessResponse(
        sanitizeUser(user),
        USER_MESSAGES.UPDATE_SUCCESS,
      );
    });
  }
}

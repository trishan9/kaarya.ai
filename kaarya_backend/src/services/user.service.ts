import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { TUpdateMeDTO } from 'src/dtos/users/user.dto';
import { TUser } from 'src/types/user.type';
import { ACUserRepository } from 'src/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: ACUserRepository) {}

  async createUser(payload: Partial<TUser>) {
    return await this.userRepository.create(payload);
  }

  async updateUser(id: string, payload: Partial<TUpdateMeDTO>) {
    return await this.userRepository.updateById(id, payload);
  }

  async updateUserRaw(id: string, payload: Partial<TUser>) {
    return await this.userRepository.updateById(id, payload);
  }

  async updatePassword(id: string, hashedPassword: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      return null;
    }
    return await this.userRepository.updateById(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });
  }

  async getUserByEmail(email: string, options?: { includePassword?: boolean }) {
    return await this.userRepository.findByEmail(email, options);
  }

  async getUserByProviderSocialId(provider: string, socialId: string) {
    return await this.userRepository.findByProviderSocialId(provider, socialId);
  }

  async getUserByIdRaw(id: string) {
    if (!id || !isValidObjectId(id)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: USER_MESSAGES.NOT_FOUND,
      });
    }

    return user;
  }

  async getUserById(id: string) {
    if (!id || !isValidObjectId(id)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: USER_MESSAGES.NOT_FOUND,
      });
    }

    return sanitizeUser(user);
  }
}

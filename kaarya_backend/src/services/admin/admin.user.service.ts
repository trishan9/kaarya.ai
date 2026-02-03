import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { TCreateUserDTO, TUpdateUserDTO } from 'src/dtos/users/user.dto';
import { ACUserRepository } from 'src/repositories/user.repository';

@Injectable()
export class AdminUserService {
  constructor(private readonly userRepository: ACUserRepository) {}

  async createUser(payload: TCreateUserDTO) {
    return await this.userRepository.create(payload);
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

  async getUserByEmail(email: string, options?: { includePassword?: boolean }) {
    return await this.userRepository.findByEmail(email, options);
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map((user) => sanitizeUser(user));
  }

  async updateUser(id: string, payload: TUpdateUserDTO) {
    return await this.userRepository.updateById(id, payload);
  }

  async deleteUser(id: string) {
    return await this.userRepository.deleteById(id);
  }
}

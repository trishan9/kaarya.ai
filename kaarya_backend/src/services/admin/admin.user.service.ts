import { Injectable } from '@nestjs/common';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import { TCreateUserDTO } from 'src/dtos/users/user.dto';
import { ACUserRepository } from 'src/repositories/user.repository';

@Injectable()
export class AdminUserService {
  constructor(private readonly userRepository: ACUserRepository) {}

  async createUser(payload: TCreateUserDTO) {
    return await this.userRepository.create(payload);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    return sanitizeUser(user);
  }

  async getUserByEmail(email: string, options?: { includePassword?: boolean }) {
    return await this.userRepository.findByEmail(email, options);
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map((user) => sanitizeUser(user));
  }
}

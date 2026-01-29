import { Injectable } from '@nestjs/common';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import { TCreateUserDTO, TUpdateMeDTO } from 'src/dtos/users/user.dto';
import { ACUserRepository } from 'src/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: ACUserRepository) {}

  async createUser(payload: TCreateUserDTO) {
    return await this.userRepository.create(payload);
  }

  async updateUser(id: string, payload: Partial<TUpdateMeDTO>) {
    return await this.userRepository.updateById(id, payload);
  }

  async getUserByEmail(email: string, options?: { includePassword?: boolean }) {
    return await this.userRepository.findByEmail(email, options);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    return sanitizeUser(user);
  }
}

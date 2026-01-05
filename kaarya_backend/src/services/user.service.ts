import { Injectable } from '@nestjs/common';
import { TCreateUserDTO } from 'src/dtos/users/user.dto';
import { ACUserRepository } from 'src/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: ACUserRepository) {}

  async createUser(payload: TCreateUserDTO) {
    return this.userRepository.create(payload);
  }

  async getUserByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }

  async getAllUsers() {
    return this.userRepository.findAll();
  }
}

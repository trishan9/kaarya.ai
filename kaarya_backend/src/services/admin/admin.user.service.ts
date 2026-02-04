import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeUser } from 'src/common/utils/sanitize-user';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import { TCreateUserDTO, TUpdateUserDTO } from 'src/dtos/users/user.dto';
import { ACUserRepository } from 'src/repositories/user.repository';
import { UserRole } from 'src/types/user-role.enum';

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

  async getAllUsers(options: { page: number; size: number; search?: string }) {
    const { page, size, search } = options;
    const { users, total } = await this.userRepository.findAll({
      page,
      size,
      search,
    });

    return {
      users: users.map((user) => sanitizeUser(user)),
      meta: buildPaginationMeta({
        page,
        size,
        totalItems: total,
        search,
      }),
    };
  }

  async getUsersAnalytics() {
    const analytics = await this.userRepository.getAnalytics();

    const totalStandardUsers = Math.max(
      0,
      analytics.totalUsers - analytics.totalAdmins,
    );

    const now = new Date();
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const buckets = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: monthFormatter.format(date),
        value: 0,
      };
    });

    analytics.signupTrend.forEach((item) => {
      const key = `${item.year}-${item.month}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.value = item.value;
    });

    return {
      totalUsers: analytics.totalUsers,
      totalAdmins: analytics.totalAdmins,
      totalStandardUsers,
      newThisWeek: analytics.newThisWeek,
      roleBreakdown: [
        { name: UserRole.ADMIN, value: analytics.totalAdmins },
        { name: UserRole.USER, value: totalStandardUsers },
      ],
      signupTrend: buckets.map(({ label, value }) => ({ label, value })),
    };
  }

  async updateUser(id: string, payload: TUpdateUserDTO) {
    return await this.userRepository.updateById(id, payload);
  }

  async deleteUser(id: string) {
    return await this.userRepository.deleteById(id);
  }
}

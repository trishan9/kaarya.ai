import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AdminUserController } from 'src/controllers/admin/admin.user.controller';
import { AdminUserService } from 'src/services/admin/admin.user.service';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { ApiError } from 'src/common/errors/api-error';
import { AUTH_MESSAGES, USER_MESSAGES } from 'src/constants/messages.constants';
import argon2 from 'argon2';

jest.mock('argon2', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    argon2id: 'argon2id',
  },
}));

describe('AdminUserController', () => {
  let controller: AdminUserController;
  let userService: jest.Mocked<AdminUserService>;
  let cloudinaryService: { uploadImage: jest.Mock };
  const mockedArgon2 = argon2 as unknown as {
    hash: jest.Mock;
    argon2id: string;
  };

  beforeEach(async () => {
    userService = {
      createUser: jest.fn(),
      getUserByEmail: jest.fn(),
      getAllUsers: jest.fn(),
      getUsersAnalytics: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as jest.Mocked<AdminUserService>;

    cloudinaryService = {
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        { provide: AdminUserService, useValue: userService },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    controller = module.get(AdminUserController);
  });

  it('should reject invalid create payloads', async () => {
    await expect(
      controller.createUser({ name: '' } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should create a user with hashed password and optional photo', async () => {
    mockedArgon2.hash.mockResolvedValue('hashed');
    cloudinaryService.uploadImage.mockResolvedValue('https://img.test/photo');

    userService.getUserByEmail.mockResolvedValue(null);
    userService.createUser.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
    } as never);

    const response = await controller.createUser(
      {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      },
      {
        buffer: Buffer.from('fake'),
        mimetype: 'image/png',
      } as Express.Multer.File,
    );

    expect(userService.getUserByEmail).toHaveBeenCalledWith(
      'admin@example.com',
    );
    expect(mockedArgon2.hash).toHaveBeenCalled();
    expect(cloudinaryService.uploadImage).toHaveBeenCalled();
    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        password: 'hashed',
        photo: 'https://img.test/photo',
      }),
    );

    expect(response).toEqual({
      success: true,
      message: USER_MESSAGES.CREATE_SUCCESS,
      data: { id: 'user-1', email: 'admin@example.com', name: 'Admin' },
    });
  });

  it('should reject creation when email is already in use', async () => {
    userService.getUserByEmail.mockResolvedValue({ id: 'user-1' } as never);

    try {
      await controller.createUser({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(apiError.getResponse()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.EMAIL_IN_USE }),
      );
    }
  });

  it('should return all users with pagination', async () => {
    userService.getAllUsers.mockResolvedValue({
      users: [{ id: 'user-1', email: 'a@example.com' }],
      meta: {
        page: 1,
        size: 10,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
        search: null,
      },
    });

    const response = await controller.getAllUsers({ page: 1, size: 10 });

    expect(response).toEqual({
      success: true,
      message: USER_MESSAGES.FETCH_ALL_SUCCESS,
      data: {
        users: [{ id: 'user-1', email: 'a@example.com' }],
        meta: expect.any(Object),
      },
    });
  });

  it('should reject invalid query params', async () => {
    await expect(
      controller.getAllUsers({ page: 0, size: 200 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should return user analytics', async () => {
    userService.getUsersAnalytics.mockResolvedValue({
      totalUsers: 2,
      totalAdmins: 1,
      totalStandardUsers: 1,
      newThisWeek: 2,
      roleBreakdown: [
        { name: 'admin', value: 1 },
        { name: 'user', value: 1 },
      ],
      signupTrend: [{ label: 'Jan', value: 2 }],
    } as never);

    const response = await controller.getUsersAnalytics();

    expect(response).toEqual({
      success: true,
      message: USER_MESSAGES.FETCH_ALL_SUCCESS,
      data: expect.objectContaining({
        totalUsers: 2,
        totalAdmins: 1,
      }),
    });
  });

  it('should return a user by id', async () => {
    userService.getUserById.mockResolvedValue({ id: 'user-1' } as never);

    const response = await controller.getUserById('user-1');

    expect(response).toEqual({
      success: true,
      message: USER_MESSAGES.FETCH_BY_ID_SUCCESS,
      data: { id: 'user-1' },
    });
  });

  it('should reject update when the user does not exist', async () => {
    userService.getUserById.mockResolvedValue(null as never);

    try {
      await controller.updateUser('user-1', { name: 'Nope' });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(apiError.getResponse()).toEqual(
        expect.objectContaining({ message: USER_MESSAGES.NOT_FOUND }),
      );
    }
  });

  it('should reject update when email is already owned', async () => {
    userService.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
    } as never);
    userService.getUserByEmail.mockResolvedValue({ id: 'user-2' } as never);

    try {
      await controller.updateUser('user-1', { email: 'new@example.com' });
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(apiError.getResponse()).toEqual(
        expect.objectContaining({ message: AUTH_MESSAGES.EMAIL_IN_USE }),
      );
    }
  });

  it('should update a user with hashed password and optional photo', async () => {
    mockedArgon2.hash.mockResolvedValue('hashed');
    cloudinaryService.uploadImage.mockResolvedValue('https://img.test/photo');
    userService.getUserById.mockResolvedValue({
      id: 'user-1',
      email: 'old@example.com',
    } as never);
    userService.getUserByEmail.mockResolvedValue(null as never);
    userService.updateUser.mockResolvedValue({ id: 'user-1' } as never);

    const response = await controller.updateUser(
      'user-1',
      { email: 'new@example.com', password: 'Password123' },
      {
        buffer: Buffer.from('fake'),
        mimetype: 'image/png',
      } as Express.Multer.File,
    );

    expect(mockedArgon2.hash).toHaveBeenCalled();
    expect(userService.updateUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        email: 'new@example.com',
        password: 'hashed',
        photo: 'https://img.test/photo',
      }),
    );

    expect(response).toEqual({
      success: true,
      message: USER_MESSAGES.UPDATE_SUCCESS,
      data: { id: 'user-1' },
    });
  });

  it('should reject delete when user is missing', async () => {
    userService.deleteUser.mockResolvedValue(null as never);

    try {
      await controller.deleteUser('user-1');
      throw new Error('Expected error');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(apiError.getResponse()).toEqual(
        expect.objectContaining({ message: USER_MESSAGES.NOT_FOUND }),
      );
    }
  });

  it('should delete a user', async () => {
    userService.deleteUser.mockResolvedValue({ id: 'user-1' } as never);

    const response = await controller.deleteUser('user-1');

    expect(response).toEqual({
      success: true,
      message: USER_MESSAGES.DELETE_SUCCESS,
      data: { id: 'user-1' },
    });
  });
});

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { USER_MESSAGES } from 'src/constants/messages.constants';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('UserService (integration)', () => {
  let module: TestingModule | undefined;
  let userService: UserService;
  let mongo: TestMongo | undefined;

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    userService = module.get(UserService);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    if (mongo) {
      await stopInMemoryMongo(mongo);
    }
  });

  it('should create users and fetch them by id', async () => {
    const created = await userService.createUser({
      name: 'Integration User',
      email: 'user@example.com',
      password: 'Password123',
      provider: AuthProvider.EMAIL,
      role: UserRole.USER,
    });

    const fetched = await userService.getUserById(created.id as string);

    expect(fetched).toEqual(
      expect.objectContaining({ id: created.id, email: created.email }),
    );
    expect(fetched).not.toHaveProperty('password');
  });

  it('should throw for invalid user ids', async () => {
    try {
      await userService.getUserById('invalid-id');
      throw new Error('Expected getUserById to throw');
    } catch (error) {
      const err = error as ApiError;
      expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(err.getResponse()).toMatchObject({
        message: USER_MESSAGES.INVALID_ID,
      });
    }
  });

  it('should throw for missing users', async () => {
    const missingId = new Types.ObjectId().toString();

    try {
      await userService.getUserById(missingId);
      throw new Error('Expected getUserById to throw');
    } catch (error) {
      const err = error as ApiError;
      expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(err.getResponse()).toMatchObject({
        message: USER_MESSAGES.NOT_FOUND,
      });
    }
  });

  it('should update users by id', async () => {
    const created = await userService.createUser({
      name: 'Updater',
      email: 'updater@example.com',
      password: 'Password123',
      provider: AuthProvider.EMAIL,
      role: UserRole.USER,
    });

    const updated = await userService.updateUser(created.id as string, {
      name: 'Updated Name',
    });

    expect(updated).toEqual(
      expect.objectContaining({ id: created.id, name: 'Updated Name' }),
    );
  });

  it('should return null when fetching by email that does not exist', async () => {
    const found = await userService.getUserByEmail('missing@example.com');
    expect(found).toBeNull();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { fn, Mock } from 'jest-mock';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { EmailService } from 'src/services/email.service';
import { RedisService } from 'src/services/redis.service';
import { configureTestApp } from './app';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from './mongo';
import { InMemoryRedis } from './in-memory-redis';

export type E2EApp = {
  app: INestApplication;
  module: TestingModule;
  mongo: TestMongo;
  cloudinary: {
    uploadImage: Mock<(...args: unknown[]) => Promise<string>>;
  };
  email: {
    sendPasswordResetOtp: Mock<(...args: unknown[]) => Promise<void>>;
    sendPasswordResetSuccess: Mock<(...args: unknown[]) => Promise<void>>;
    sendOnboardingEmail: Mock<(...args: unknown[]) => Promise<void>>;
    sendCompanyInvite: Mock<(...args: unknown[]) => Promise<void>>;
  };
  redis: InMemoryRedis;
};

export const createE2EApp = async (): Promise<E2EApp> => {
  const mongo = await startInMemoryMongo();
  const { AppModule } = await import('src/app.module');

  const cloudinary = {
    uploadImage: fn<(...args: unknown[]) => Promise<string>>().mockResolvedValue(
      'https://img.test/photo',
    ),
  };
  const email = {
    sendPasswordResetOtp: fn<
      (...args: unknown[]) => Promise<void>
    >().mockResolvedValue(undefined),
    sendPasswordResetSuccess: fn<
      (...args: unknown[]) => Promise<void>
    >().mockResolvedValue(undefined),
    sendOnboardingEmail: fn<
      (...args: unknown[]) => Promise<void>
    >().mockResolvedValue(undefined),
    sendCompanyInvite: fn<
      (...args: unknown[]) => Promise<void>
    >().mockResolvedValue(undefined),
  };
  const redis = new InMemoryRedis();
  const redisService = {
    getClient: fn<(...args: unknown[]) => Promise<InMemoryRedis>>().mockResolvedValue(
      redis,
    ),
  };

  const module = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(CloudinaryService)
    .useValue(cloudinary)
    .overrideProvider(EmailService)
    .useValue(email)
    .overrideProvider(RedisService)
    .useValue(redisService)
    .compile();

  const app = module.createNestApplication();
  configureTestApp(app);
  await app.init();

  return { app, module, mongo, cloudinary, email, redis };
};

export const resetE2EDatabase = async (context?: E2EApp) => {
  await clearDatabase();
  context?.redis.reset();
};

export const closeE2EApp = async (context?: E2EApp) => {
  if (!context) return;

  await context.app.close();
  await context.module.close();
  await stopInMemoryMongo(context.mongo);
};

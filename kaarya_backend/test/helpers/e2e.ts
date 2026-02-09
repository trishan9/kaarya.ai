import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
  cloudinary: { uploadImage: jest.Mock };
  email: {
    sendPasswordResetOtp: jest.Mock;
    sendPasswordResetSuccess: jest.Mock;
    sendOnboardingEmail: jest.Mock;
  };
  redis: InMemoryRedis;
};

export const createE2EApp = async (): Promise<E2EApp> => {
  const mongo = await startInMemoryMongo();
  const { AppModule } = await import('src/app.module');

  const cloudinary = {
    uploadImage: jest.fn().mockResolvedValue('https://img.test/photo'),
  };
  const email = {
    sendPasswordResetOtp: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetSuccess: jest.fn().mockResolvedValue(undefined),
    sendOnboardingEmail: jest.fn().mockResolvedValue(undefined),
  };
  const redis = new InMemoryRedis();
  const redisService = {
    getClient: jest.fn().mockResolvedValue(redis),
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

export const closeE2EApp = async ({ app, module, mongo }: E2EApp) => {
  await app.close();
  await module.close();
  await stopInMemoryMongo(mongo);
};

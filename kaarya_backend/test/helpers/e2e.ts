import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { configureTestApp } from './app';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from './mongo';

export type E2EApp = {
  app: INestApplication;
  module: TestingModule;
  mongo: TestMongo;
  cloudinary: { uploadImage: jest.Mock };
};

export const createE2EApp = async (): Promise<E2EApp> => {
  const mongo = await startInMemoryMongo();

  const cloudinary = {
    uploadImage: jest.fn().mockResolvedValue('https://img.test/photo'),
  };

  const module = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(CloudinaryService)
    .useValue(cloudinary)
    .compile();

  const app = module.createNestApplication();
  configureTestApp(app);
  await app.init();

  return { app, module, mongo, cloudinary };
};

export const resetE2EDatabase = async () => {
  await clearDatabase();
};

export const closeE2EApp = async ({ app, module, mongo }: E2EApp) => {
  await app.close();
  await module.close();
  await stopInMemoryMongo(mongo);
};

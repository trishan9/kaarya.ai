import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { fn, Mock } from 'jest-mock';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { EmailService } from 'src/services/email.service';
import { GeminiService } from 'src/services/gemini.service';
import { RedisService } from 'src/services/redis.service';
import { ResumePdfService } from 'src/services/resume-pdf.service';
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
    uploadDocument: Mock<
      (...args: unknown[]) => Promise<{
        url: string;
        publicId: string;
        originalFilename: string;
        bytes: number;
        format?: string;
      }>
    >;
  };
  gemini: {
    generateProfessionalSummary: Mock<(...args: unknown[]) => Promise<string>>;
    generateExperienceBullets: Mock<(...args: unknown[]) => Promise<string[]>>;
    generateResumeSuggestions: Mock<
      (...args: unknown[]) => Promise<Record<string, unknown>>
    >;
    atsScanResume: Mock<(...args: unknown[]) => Promise<Record<string, unknown>>>;
    generateInterviewPrepCourse: Mock<
      (...args: unknown[]) => Promise<Record<string, unknown>>
    >;
  };
  resumePdf: {
    generatePdf: Mock<(...args: unknown[]) => Promise<Buffer>>;
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
    uploadDocument: fn<
      (...args: unknown[]) => Promise<{
        url: string;
        publicId: string;
        originalFilename: string;
        bytes: number;
        format?: string;
      }>
    >().mockResolvedValue({
      url: 'https://files.test/resume.pdf',
      publicId: 'resumes/mock-public-id',
      originalFilename: 'resume.pdf',
      bytes: 1024,
      format: 'pdf',
    }),
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
  const gemini = {
    generateProfessionalSummary: fn<
      (...args: unknown[]) => Promise<string>
    >().mockResolvedValue('Mock professional summary'),
    generateExperienceBullets: fn<
      (...args: unknown[]) => Promise<string[]>
    >().mockResolvedValue(['Mock bullet one', 'Mock bullet two']),
    generateResumeSuggestions: fn<
      (...args: unknown[]) => Promise<Record<string, unknown>>
    >().mockResolvedValue({
      targetRole: 'Backend Engineer',
      jobTitle: 'Backend Developer',
      professionalSummary: 'Mock suggestion summary',
      skills: ['Node.js', 'NestJS'],
    }),
    atsScanResume: fn<(...args: unknown[]) => Promise<Record<string, unknown>>>().mockResolvedValue({
      documentType: 'resume',
      classificationReason: 'Mocked ATS analysis.',
      overallScore: 80,
      ATS: { score: 80, tips: [] },
      toneAndStyle: { score: 78, tips: [] },
      content: { score: 81, tips: [] },
      structure: { score: 79, tips: [] },
      skills: { score: 82, tips: [] },
    }),
    generateInterviewPrepCourse: fn<
      (...args: unknown[]) => Promise<Record<string, unknown>>
    >().mockResolvedValue({
      learningOutcomes: ['Mock learning outcome'],
      aiModel: 'mock-gemini-model',
      chapters: [
        {
          title: 'Mock Chapter',
          overview: 'Mock chapter overview',
          estimatedMinutes: 20,
          material: ['Mock course material paragraph'],
          sections: [],
          learningObjectives: ['Mock objective'],
          coreConcepts: [],
          interviewQuestions: [
            {
              question: 'Mock question?',
              whyAsked: 'Mock reason',
              answerFramework: 'Mock framework',
              sampleAnswer: 'Mock answer',
            },
          ],
          practicePrompts: ['Mock prompt'],
          youtubeVideos: [],
        },
      ],
    }),
  };
  const resumePdf = {
    generatePdf: fn<(...args: unknown[]) => Promise<Buffer>>().mockResolvedValue(
      Buffer.from('%PDF-1.4 mock'),
    ),
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
    .overrideProvider(GeminiService)
    .useValue(gemini)
    .overrideProvider(ResumePdfService)
    .useValue(resumePdf)
    .overrideProvider(RedisService)
    .useValue(redisService)
    .compile();

  const app = module.createNestApplication();
  configureTestApp(app);
  await app.init();

  return { app, module, mongo, cloudinary, email, gemini, resumePdf, redis };
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

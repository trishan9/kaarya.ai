import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth.module';
import { UserModule } from './modules/user.module';
import { MongoDatabaseModule } from './database/mongodb.module';
import appConfig from './config/app-config';
import authConfig from './config/auth-config';
import cloudinaryConfig from './config/cloudinary-config';
import databaseConfig from './config/database-config';
import emailConfig from './config/email-config';
import geminiConfig from './config/gemini-config';
import redisConfig from './config/redis-config';
import streamConfig from './config/stream-config';
import { LoggerModule } from './logger/logger.module';
import { CompanyModule } from './modules/company.module';
import { CollegeModule } from './modules/college.module';
import { JobPostingModule } from './modules/job-posting.module';
import { InterviewModule } from './modules/interview.module';
import { BookmarkModule } from './modules/bookmark.module';
import { ResumeBuilderModule } from './modules/resume-builder.module';
import { JobMatchModule } from './modules/job-match.module';
import { ResourceCourseModule } from './modules/resource-course.module';
import { StreamModule } from './modules/stream.module';

export const InfrastructureDatabaseModule = MongoDatabaseModule;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        authConfig,
        databaseConfig,
        cloudinaryConfig,
        emailConfig,
        redisConfig,
        geminiConfig,
        streamConfig,
      ],
      envFilePath: process.env.NODE_ENV === 'test' ? [] : ['.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    InfrastructureDatabaseModule,
    LoggerModule,
    UserModule,
    AuthModule,
    CompanyModule,
    CollegeModule,
    JobPostingModule,
    InterviewModule,
    BookmarkModule,
    ResumeBuilderModule,
    JobMatchModule,
    ResourceCourseModule,
    StreamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

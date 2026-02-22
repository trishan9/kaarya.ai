import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobApplicationController } from 'src/controllers/job-application.controller';
import { JobPostingController } from 'src/controllers/job-posting.controller';
import {
  ApplicationSchema,
  ApplicationSchemaClass,
} from 'src/entities/application.schema';
import {
  BookmarkSchema,
  BookmarkSchemaClass,
} from 'src/entities/bookmark.schema';
import {
  JobPostingSchema,
  JobPostingSchemaClass,
} from 'src/entities/job-posting.schema';
import { ResumeSchema, ResumeSchemaClass } from 'src/entities/resume.schema';
import {
  ACBookmarkRepository,
  BookmarkRepository,
} from 'src/repositories/bookmark.repository';
import {
  ACApplicationRepository,
  ApplicationRepository,
} from 'src/repositories/application.repository';
import {
  ACJobPostingRepository,
  JobPostingRepository,
} from 'src/repositories/job-posting.repository';
import {
  ACResumeRepository,
  ResumeRepository,
} from 'src/repositories/resume.repository';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { JobApplicationService } from 'src/services/job-application.service';
import { JobPostingService } from 'src/services/job-posting.service';
import { CollegeModule } from './college.module';
import { CompanyModule } from './company.module';
import { EmailModule } from './email.module';
import { GamificationModule } from './gamification.module';
import { JobMatchModule } from './job-match.module';

@Module({
  imports: [
    CompanyModule,
    CollegeModule,
    EmailModule,
    GamificationModule,
    JobMatchModule,
    MongooseModule.forFeature([
      { name: JobPostingSchemaClass.name, schema: JobPostingSchema },
      { name: ApplicationSchemaClass.name, schema: ApplicationSchema },
      { name: ResumeSchemaClass.name, schema: ResumeSchema },
      { name: BookmarkSchemaClass.name, schema: BookmarkSchema },
    ]),
  ],
  controllers: [JobPostingController, JobApplicationController],
  providers: [
    JobPostingService,
    JobApplicationService,
    CloudinaryService,
    JobPostingRepository,
    BookmarkRepository,
    ApplicationRepository,
    ResumeRepository,
    { provide: ACJobPostingRepository, useClass: JobPostingRepository },
    { provide: ACBookmarkRepository, useClass: BookmarkRepository },
    { provide: ACApplicationRepository, useClass: ApplicationRepository },
    { provide: ACResumeRepository, useClass: ResumeRepository },
  ],
  exports: [JobPostingService, ACJobPostingRepository],
})
export class JobPostingModule {}

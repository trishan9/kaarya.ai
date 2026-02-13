import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobApplicationController } from 'src/controllers/job-application.controller';
import { JobPostingController } from 'src/controllers/job-posting.controller';
import {
  ApplicationSchema,
  ApplicationSchemaClass,
} from 'src/entities/application.schema';
import {
  JobPostingSchema,
  JobPostingSchemaClass,
} from 'src/entities/job-posting.schema';
import { ResumeSchema, ResumeSchemaClass } from 'src/entities/resume.schema';
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

@Module({
  imports: [
    CompanyModule,
    CollegeModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: JobPostingSchemaClass.name, schema: JobPostingSchema },
      { name: ApplicationSchemaClass.name, schema: ApplicationSchema },
      { name: ResumeSchemaClass.name, schema: ResumeSchema },
    ]),
  ],
  controllers: [JobPostingController, JobApplicationController],
  providers: [
    JobPostingService,
    JobApplicationService,
    CloudinaryService,
    JobPostingRepository,
    ApplicationRepository,
    ResumeRepository,
    { provide: ACJobPostingRepository, useClass: JobPostingRepository },
    { provide: ACApplicationRepository, useClass: ApplicationRepository },
    { provide: ACResumeRepository, useClass: ResumeRepository },
  ],
})
export class JobPostingModule {}

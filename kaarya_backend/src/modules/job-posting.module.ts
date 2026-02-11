import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPostingController } from 'src/controllers/job-posting.controller';
import {
  ApplicationSchema,
  ApplicationSchemaClass,
} from 'src/entities/application.schema';
import {
  JobPostingSchema,
  JobPostingSchemaClass,
} from 'src/entities/job-posting.schema';
import {
  ACApplicationRepository,
  ApplicationRepository,
} from 'src/repositories/application.repository';
import {
  ACJobPostingRepository,
  JobPostingRepository,
} from 'src/repositories/job-posting.repository';
import { JobPostingService } from 'src/services/job-posting.service';
import { CompanyModule } from './company.module';

@Module({
  imports: [
    CompanyModule,
    MongooseModule.forFeature([
      { name: JobPostingSchemaClass.name, schema: JobPostingSchema },
      { name: ApplicationSchemaClass.name, schema: ApplicationSchema },
    ]),
  ],
  controllers: [JobPostingController],
  providers: [
    JobPostingService,
    JobPostingRepository,
    ApplicationRepository,
    { provide: ACJobPostingRepository, useClass: JobPostingRepository },
    { provide: ACApplicationRepository, useClass: ApplicationRepository },
  ],
})
export class JobPostingModule {}

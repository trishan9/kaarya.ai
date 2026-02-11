import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from 'src/controllers/company.controller';
import { CompanySchema, CompanySchemaClass } from 'src/entities/company.schema';
import {
  JobPostingSchema,
  JobPostingSchemaClass,
} from 'src/entities/job-posting.schema';
import {
  RecruiterProfileSchema,
  RecruiterProfileSchemaClass,
} from 'src/entities/recruiter-profile.schema';
import {
  ACCompanyRepository,
  CompanyRepository,
} from 'src/repositories/company.repository';
import {
  ACJobPostingRepository,
  JobPostingRepository,
} from 'src/repositories/job-posting.repository';
import {
  ACRecruiterProfileRepository,
  RecruiterProfileRepository,
} from 'src/repositories/recruiter-profile.repository';
import { CompanyService } from 'src/services/company.service';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { RecruiterProfileService } from 'src/services/recruiter-profile.service';
import { EmailModule } from './email.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    UserModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: CompanySchemaClass.name, schema: CompanySchema },
      { name: JobPostingSchemaClass.name, schema: JobPostingSchema },
      {
        name: RecruiterProfileSchemaClass.name,
        schema: RecruiterProfileSchema,
      },
    ]),
  ],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    RecruiterProfileService,
    CloudinaryService,
    CompanyRepository,
    JobPostingRepository,
    RecruiterProfileRepository,
    { provide: ACCompanyRepository, useClass: CompanyRepository },
    { provide: ACJobPostingRepository, useClass: JobPostingRepository },
    {
      provide: ACRecruiterProfileRepository,
      useClass: RecruiterProfileRepository,
    },
  ],
  exports: [
    CompanyService,
    RecruiterProfileService,
    ACCompanyRepository,
    ACRecruiterProfileRepository,
  ],
})
export class CompanyModule {}

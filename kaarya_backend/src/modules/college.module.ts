import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollegeController } from 'src/controllers/college.controller';
import { LeaderboardController } from 'src/controllers/leaderboard.controller';
import { ApplicationSchema, ApplicationSchemaClass } from 'src/entities/application.schema';
import { CollegeSchema, CollegeSchemaClass } from 'src/entities/college.schema';
import { JobPostingSchema, JobPostingSchemaClass } from 'src/entities/job-posting.schema';
import { StudentSchema, StudentSchemaClass } from 'src/entities/student.schema';
import { ACApplicationRepository, ApplicationRepository } from 'src/repositories/application.repository';
import { ACCollegeRepository, CollegeRepository } from 'src/repositories/college.repository';
import { ACJobPostingRepository, JobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACStudentRepository, StudentRepository } from 'src/repositories/student.repository';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { CollegeService } from 'src/services/college.service';
import { LeaderboardService } from 'src/services/leaderboard.service';
import { StudentService } from 'src/services/student.service';
import { EmailModule } from './email.module';
import { GamificationModule } from './gamification.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    UserModule,
    EmailModule,
    GamificationModule,
    MongooseModule.forFeature([
      { name: CollegeSchemaClass.name, schema: CollegeSchema },
      { name: StudentSchemaClass.name, schema: StudentSchema },
      { name: JobPostingSchemaClass.name, schema: JobPostingSchema },
      { name: ApplicationSchemaClass.name, schema: ApplicationSchema },
    ]),
  ],
  controllers: [CollegeController, LeaderboardController],
  providers: [
    CollegeService,
    StudentService,
    LeaderboardService,
    CloudinaryService,
    CollegeRepository,
    StudentRepository,
    JobPostingRepository,
    ApplicationRepository,
    { provide: ACCollegeRepository, useClass: CollegeRepository },
    { provide: ACStudentRepository, useClass: StudentRepository },
    { provide: ACJobPostingRepository, useClass: JobPostingRepository },
    { provide: ACApplicationRepository, useClass: ApplicationRepository },
  ],
  exports: [
    CollegeService,
    StudentService,
    ACCollegeRepository,
    ACStudentRepository,
  ],
})
export class CollegeModule {}

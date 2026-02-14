import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewController } from 'src/controllers/interview.controller';
import { InterviewVapiController } from 'src/controllers/interview-vapi.controller';
import {
  AIEvaluationSchema,
  AIEvaluationSchemaClass,
} from 'src/entities/ai-evaluation.schema';
import {
  InterviewSessionSchema,
  InterviewSessionSchemaClass,
} from 'src/entities/interview-session.schema';
import {
  MockInterviewSchema,
  MockInterviewSchemaClass,
} from 'src/entities/mock-interview.schema';
import {
  ACAIEvaluationRepository,
  AIEvaluationRepository,
} from 'src/repositories/ai-evaluation.repository';
import {
  ACInterviewSessionRepository,
  InterviewSessionRepository,
} from 'src/repositories/interview-session.repository';
import {
  ACInterviewRepository,
  InterviewRepository,
} from 'src/repositories/interview.repository';
import { InterviewAIService } from 'src/services/interview-ai.service';
import { InterviewService } from 'src/services/interview.service';
import { CollegeModule } from './college.module';
import { CompanyModule } from './company.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    UserModule,
    CompanyModule,
    CollegeModule,
    MongooseModule.forFeature([
      { name: MockInterviewSchemaClass.name, schema: MockInterviewSchema },
      { name: InterviewSessionSchemaClass.name, schema: InterviewSessionSchema },
      { name: AIEvaluationSchemaClass.name, schema: AIEvaluationSchema },
    ]),
  ],
  controllers: [InterviewController, InterviewVapiController],
  providers: [
    InterviewService,
    InterviewAIService,
    InterviewRepository,
    InterviewSessionRepository,
    AIEvaluationRepository,
    { provide: ACInterviewRepository, useClass: InterviewRepository },
    { provide: ACInterviewSessionRepository, useClass: InterviewSessionRepository },
    { provide: ACAIEvaluationRepository, useClass: AIEvaluationRepository },
  ],
  exports: [InterviewService, ACInterviewRepository, ACInterviewSessionRepository],
})
export class InterviewModule {}

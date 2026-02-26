import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewController } from 'src/controllers/interview.controller';
import { InterviewVapiController } from 'src/controllers/interview-vapi.controller';
import {
  AIEvaluationSchema,
  AIEvaluationSchemaClass,
} from 'src/entities/ai-evaluation.schema';
import {
  BookmarkSchema,
  BookmarkSchemaClass,
} from 'src/entities/bookmark.schema';
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
  ACBookmarkRepository,
  BookmarkRepository,
} from 'src/repositories/bookmark.repository';
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
import { GamificationModule } from './gamification.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    UserModule,
    CompanyModule,
    CollegeModule,
    GamificationModule,
    MongooseModule.forFeature([
      { name: MockInterviewSchemaClass.name, schema: MockInterviewSchema },
      { name: InterviewSessionSchemaClass.name, schema: InterviewSessionSchema },
      { name: AIEvaluationSchemaClass.name, schema: AIEvaluationSchema },
      { name: BookmarkSchemaClass.name, schema: BookmarkSchema },
    ]),
  ],
  controllers: [InterviewController, InterviewVapiController],
  providers: [
    InterviewService,
    InterviewAIService,
    InterviewRepository,
    BookmarkRepository,
    InterviewSessionRepository,
    AIEvaluationRepository,
    { provide: ACInterviewRepository, useClass: InterviewRepository },
    { provide: ACBookmarkRepository, useClass: BookmarkRepository },
    { provide: ACInterviewSessionRepository, useClass: InterviewSessionRepository },
    { provide: ACAIEvaluationRepository, useClass: AIEvaluationRepository },
  ],
  exports: [InterviewService, ACInterviewRepository, ACInterviewSessionRepository],
})
export class InterviewModule {}

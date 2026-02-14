import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeBuilderController } from 'src/controllers/resume-builder.controller';
import {
  ResumeBuilderSchema,
  ResumeBuilderSchemaClass,
} from 'src/entities/resume-builder.schema';
import { ResumeSchema, ResumeSchemaClass } from 'src/entities/resume.schema';
import {
  ACResumeBuilderRepository,
  ResumeBuilderRepository,
} from 'src/repositories/resume-builder.repository';
import {
  ACResumeRepository,
  ResumeRepository,
} from 'src/repositories/resume.repository';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { GeminiService } from 'src/services/gemini.service';
import { ResumeBuilderService } from 'src/services/resume-builder.service';
import { ResumePdfService } from 'src/services/resume-pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ResumeBuilderSchemaClass.name, schema: ResumeBuilderSchema },
      { name: ResumeSchemaClass.name, schema: ResumeSchema },
    ]),
  ],
  controllers: [ResumeBuilderController],
  providers: [
    GeminiService,
    ResumePdfService,
    ResumeBuilderService,
    CloudinaryService,
    ResumeBuilderRepository,
    ResumeRepository,
    { provide: ACResumeBuilderRepository, useClass: ResumeBuilderRepository },
    { provide: ACResumeRepository, useClass: ResumeRepository },
  ],
  exports: [ResumeBuilderService],
})
export class ResumeBuilderModule {}

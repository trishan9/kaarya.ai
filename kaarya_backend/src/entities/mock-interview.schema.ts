import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types, now } from 'mongoose';
import { CompanySchemaClass } from './company.schema';
import { CollegeSchemaClass } from './college.schema';
import { UserSchemaClass } from './user.schema';
import { InterviewSource } from 'src/types/interview-source.enum';
import { InterviewStatus } from 'src/types/interview-status.enum';
import { InterviewType } from 'src/types/interview-type.enum';
import { InterviewVisibility } from 'src/types/interview-visibility.enum';

export type MockInterviewSchemaDocument = HydratedDocument<MockInterviewSchemaClass>;

@Schema({
  _id: false,
})
export class InterviewQuestionSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  question: string;

  @Prop({
    type: Number,
    min: 1,
    default: 1,
  })
  order: number;
}

export const InterviewQuestionSchema = SchemaFactory.createForClass(
  InterviewQuestionSchemaClass,
);

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class MockInterviewSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  })
  title: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  description?: string | null;

  @Prop({
    type: String,
    enum: Object.values(InterviewType),
    required: true,
    index: true,
  })
  interviewType: InterviewType;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
    index: true,
  })
  role: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 255,
  })
  level?: string | null;

  @Prop({
    type: [String],
    default: [],
  })
  techStack: string[];

  @Prop({
    type: Number,
    min: 1,
    max: 20,
    default: 8,
  })
  questionCount: number;

  @Prop({
    type: Number,
    min: 5,
    max: 120,
    default: 25,
  })
  durationMinutes: number;

  @Prop({
    type: [InterviewQuestionSchema],
    default: [],
  })
  questions: InterviewQuestionSchemaClass[];

  @Prop({
    type: String,
    enum: Object.values(InterviewVisibility),
    default: InterviewVisibility.PUBLIC,
    index: true,
  })
  visibility: InterviewVisibility;

  @Prop({
    type: String,
    enum: Object.values(InterviewStatus),
    default: InterviewStatus.DRAFT,
    index: true,
  })
  status: InterviewStatus;

  @Prop({
    type: String,
    enum: Object.values(InterviewSource),
    default: InterviewSource.CANDIDATE,
    index: true,
  })
  source: InterviewSource;

  @Prop({
    type: Types.ObjectId,
    ref: CompanySchemaClass.name,
    default: null,
    index: true,
  })
  companyId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: CollegeSchemaClass.name,
    default: null,
    index: true,
  })
  collegeId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  instructions?: string | null;

  @Prop({
    type: SchemaTypes.Mixed,
    default: {},
  })
  generationMeta: Record<string, unknown>;

  @Prop({
    type: Boolean,
    default: true,
  })
  aiGenerated: boolean;

  @Prop({
    type: Number,
    min: 0,
    default: 0,
    index: true,
  })
  attemptsCount: number;

  @Prop({
    type: Date,
    default: null,
    index: true,
  })
  lastAttemptAt?: Date | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const MockInterviewSchema = SchemaFactory.createForClass(
  MockInterviewSchemaClass,
);

MockInterviewSchema.index({ createdBy: 1, createdAt: -1 });
MockInterviewSchema.index({ status: 1, visibility: 1, createdAt: -1 });
MockInterviewSchema.index({ title: 'text', description: 'text', role: 'text' });
MockInterviewSchema.index({ source: 1, createdAt: -1 });
MockInterviewSchema.index({ companyId: 1, status: 1, createdAt: -1 });
MockInterviewSchema.index({ collegeId: 1, status: 1, createdAt: -1 });
MockInterviewSchema.index({ attemptsCount: -1, createdAt: -1 });

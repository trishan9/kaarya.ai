import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { MockInterviewSchemaClass } from './mock-interview.schema';
import { InterviewSessionSchemaClass } from './interview-session.schema';
import { UserSchemaClass } from './user.schema';

export type AIEvaluationSchemaDocument = HydratedDocument<AIEvaluationSchemaClass>;

@Schema({
  _id: false,
})
export class AIEvaluationCategoryScoreSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  })
  name: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    max: 100,
  })
  score: number;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  comment: string;
}

export const AIEvaluationCategoryScoreSchema = SchemaFactory.createForClass(
  AIEvaluationCategoryScoreSchemaClass,
);

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class AIEvaluationSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: MockInterviewSchemaClass.name,
    required: true,
    index: true,
  })
  interviewId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: InterviewSessionSchemaClass.name,
    required: true,
    index: true,
  })
  sessionId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true,
  })
  totalScore: number;

  @Prop({
    type: [AIEvaluationCategoryScoreSchema],
    default: [],
  })
  categoryScores: AIEvaluationCategoryScoreSchemaClass[];

  @Prop({
    type: [String],
    default: [],
  })
  strengths: string[];

  @Prop({
    type: [String],
    default: [],
  })
  areasForImprovement: string[];

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  finalAssessment?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  model?: string | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const AIEvaluationSchema = SchemaFactory.createForClass(
  AIEvaluationSchemaClass,
);

AIEvaluationSchema.index({ interviewId: 1, createdAt: -1 });
AIEvaluationSchema.index({ userId: 1, interviewId: 1, createdAt: -1 });
AIEvaluationSchema.index({ sessionId: 1 }, { unique: true });
AIEvaluationSchema.index({ totalScore: -1, createdAt: -1 });


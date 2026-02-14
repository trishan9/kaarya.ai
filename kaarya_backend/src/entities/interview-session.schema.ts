import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types, now } from 'mongoose';
import { MockInterviewSchemaClass } from './mock-interview.schema';
import { UserSchemaClass } from './user.schema';
import { InterviewMode } from 'src/types/interview-mode.enum';
import { InterviewSessionStatus } from 'src/types/interview-session-status.enum';

export type InterviewSessionSchemaDocument =
  HydratedDocument<InterviewSessionSchemaClass>;

@Schema({
  _id: false,
})
export class InterviewTranscriptMessageSchemaClass {
  @Prop({
    type: String,
    enum: ['assistant', 'user', 'system'],
    required: true,
  })
  role: 'assistant' | 'user' | 'system';

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  content: string;

  @Prop({
    type: Date,
    default: null,
  })
  timestamp?: Date | null;
}

export const InterviewTranscriptMessageSchema = SchemaFactory.createForClass(
  InterviewTranscriptMessageSchemaClass,
);

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class InterviewSessionSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: MockInterviewSchemaClass.name,
    required: true,
    index: true,
  })
  interviewId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(InterviewMode),
    default: InterviewMode.WEB,
    index: true,
  })
  mode: InterviewMode;

  @Prop({
    type: String,
    enum: Object.values(InterviewSessionStatus),
    default: InterviewSessionStatus.IN_PROGRESS,
    index: true,
  })
  status: InterviewSessionStatus;

  @Prop({
    type: [InterviewTranscriptMessageSchema],
    default: [],
  })
  transcript: InterviewTranscriptMessageSchemaClass[];

  @Prop({
    type: String,
    trim: true,
    default: null,
    index: true,
  })
  vapiCallId?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
  })
  recordingUrl?: string | null;

  @Prop({
    type: Number,
    min: 0,
    default: null,
  })
  durationSeconds?: number | null;

  @Prop({
    type: SchemaTypes.Mixed,
    default: {},
  })
  metadata: Record<string, unknown>;

  @Prop({
    type: Date,
    default: now,
    index: true,
  })
  startedAt: Date;

  @Prop({
    type: Date,
    default: null,
  })
  endedAt?: Date | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const InterviewSessionSchema = SchemaFactory.createForClass(
  InterviewSessionSchemaClass,
);

InterviewSessionSchema.index({ interviewId: 1, createdAt: -1 });
InterviewSessionSchema.index({ userId: 1, createdAt: -1 });
InterviewSessionSchema.index({ interviewId: 1, userId: 1, createdAt: -1 });
InterviewSessionSchema.index({ status: 1, createdAt: -1 });


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { JobPostingSchemaClass } from './job-posting.schema';
import { ResumeSchemaClass } from './resume.schema';
import { UserSchemaClass } from './user.schema';

export type ApplicationSchemaDocument = HydratedDocument<ApplicationSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class ApplicationSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: JobPostingSchemaClass.name,
    required: true,
    index: true,
  })
  jobId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.APPLIED,
    index: true,
  })
  status: ApplicationStatus;

  @Prop({
    type: Types.ObjectId,
    ref: ResumeSchemaClass.name,
    default: null,
  })
  resumeId?: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  coverLetter?: string | null;

  @Prop({ type: [String], default: [] })
  portfolioLinks?: string[];

  @Prop({ type: String, default: null })
  resumeFileName?: string | null;

  @Prop({
    type: [
      {
        status: {
          type: String,
          enum: Object.values(ApplicationStatus),
          required: true,
        },
        changedAt: {
          type: Date,
          default: now,
        },
        changedBy: {
          type: Types.ObjectId,
          ref: UserSchemaClass.name,
          default: null,
        },
      },
    ],
    default: [],
  })
  statusHistory?: Array<{
    status: ApplicationStatus;
    changedAt: Date;
    changedBy?: Types.ObjectId | null;
  }>;

  @Prop({ type: Date, default: null })
  interviewScheduledAt?: Date | null;

  @Prop({ type: String, default: null })
  interviewNote?: string | null;

  @Prop({ type: Date, default: null })
  invitedAt?: Date | null;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    default: null,
  })
  reviewedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  resumeViewedAt?: Date | null;

  @Prop({ type: Date, default: null })
  resumeDownloadedAt?: Date | null;

  @Prop({ type: Number, default: 0 })
  resumeViewCount?: number;

  @Prop({ type: Number, default: 0 })
  resumeDownloadCount?: number;

  @Prop({ type: Date, default: null })
  resumeLastActionAt?: Date | null;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    default: null,
  })
  resumeLastActionBy?: Types.ObjectId | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(
  ApplicationSchemaClass,
);

ApplicationSchema.index({ studentId: 1, status: 1, createdAt: -1 });
ApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

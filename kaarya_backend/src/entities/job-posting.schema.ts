import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types, now } from 'mongoose';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';
import { CollegeSchemaClass } from './college.schema';
import { CompanySchemaClass } from './company.schema';
import { UserSchemaClass } from './user.schema';

export type JobPostingSchemaDocument = HydratedDocument<JobPostingSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class JobPostingSchemaClass {
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
    type: String,
    enum: Object.values(JobVisibility),
    default: JobVisibility.GLOBAL,
    index: true,
  })
  visibility: JobVisibility;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  description: string;

  @Prop({
    type: String,
    trim: true,
    default: 'Remote',
    maxlength: 255,
    index: true,
  })
  location: string;

  @Prop({
    type: String,
    trim: true,
    default: 'Full-Time',
    maxlength: 100,
    index: true,
  })
  employmentType: string;

  @Prop({
    type: String,
    trim: true,
    default: 'Full-Time',
    maxlength: 100,
    index: true,
  })
  engagementType: string;

  @Prop({
    type: String,
    enum: Object.values(JobWorkMode),
    default: JobWorkMode.ONSITE,
    index: true,
  })
  workMode: JobWorkMode;

  @Prop({
    type: String,
    trim: true,
    default: 'Compensation not specified',
    maxlength: 255,
  })
  salaryRange: string;

  @Prop({
    type: SchemaTypes.Mixed,
    default: {},
  })
  requirements: Record<string, unknown>;

  @Prop({
    type: Date,
    required: true,
    index: true,
  })
  deadline: Date;

  @Prop({
    type: String,
    enum: Object.values(JobPostingStatus),
    default: JobPostingStatus.OPEN,
    index: true,
  })
  status: JobPostingStatus;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    index: true,
  })
  viewsCount: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    index: true,
  })
  applicationsCount: number;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const JobPostingSchema = SchemaFactory.createForClass(
  JobPostingSchemaClass,
);

JobPostingSchema.index({ companyId: 1, createdAt: -1 });
JobPostingSchema.index({ collegeId: 1, createdAt: -1 });
JobPostingSchema.index({ status: 1, deadline: 1 });
JobPostingSchema.index({ title: 'text', description: 'text' });
JobPostingSchema.index({ workMode: 1, createdAt: -1 });
JobPostingSchema.index({ applicationsCount: -1, viewsCount: -1, createdAt: -1 });

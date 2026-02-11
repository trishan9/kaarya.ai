import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { ApplicationStatus } from 'src/types/application-status.enum';
import { JobPostingSchemaClass } from './job-posting.schema';
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

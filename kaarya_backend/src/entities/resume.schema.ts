import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, Types } from 'mongoose';
import { UserSchemaClass } from './user.schema';

export type ResumeSchemaDocument = HydratedDocument<ResumeSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class ResumeSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;

  @Prop({
    type: String,
    default: 'job_application',
    index: true,
  })
  type: string;

  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({ type: String, required: true })
  fileUrl: string;

  @Prop({ type: String, default: null })
  filePublicId?: string | null;

  @Prop({ type: String, default: null })
  mimeType?: string | null;

  @Prop({ type: Number, default: null })
  fileSize?: number | null;

  @Prop({ type: Number, default: null })
  atsScore?: number | null;

  @Prop({ type: Object, default: {} })
  aiEvaluation?: Record<string, unknown>;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ResumeSchema = SchemaFactory.createForClass(ResumeSchemaClass);

ResumeSchema.index({ studentId: 1, createdAt: -1 });

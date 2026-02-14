import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, Types } from 'mongoose';
import { UserSchemaClass } from './user.schema';
import { ResumeSchemaClass } from './resume.schema';
import type { ResumeBuilderContent, ResumeBuilderTemplateId } from 'src/types/resume-builder.types';

export type ResumeBuilderSchemaDocument = HydratedDocument<ResumeBuilderSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
})
export class ResumeBuilderSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;

  @Prop({ type: String, default: 'Untitled Resume' })
  title: string;

  @Prop({ type: String, default: null })
  targetRole?: string | null;

  @Prop({ type: String, default: 'professional' })
  templateId: ResumeBuilderTemplateId;

  @Prop({ type: Object, default: {} })
  content: ResumeBuilderContent;

  @Prop({ type: Types.ObjectId, ref: ResumeSchemaClass.name, default: null })
  generatedResumeId?: Types.ObjectId | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ResumeBuilderSchema = SchemaFactory.createForClass(ResumeBuilderSchemaClass);
ResumeBuilderSchema.index({ studentId: 1, updatedAt: -1 });

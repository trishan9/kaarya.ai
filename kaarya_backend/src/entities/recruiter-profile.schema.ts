import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { CompanySchemaClass } from './company.schema';
import { UserSchemaClass } from './user.schema';

export type RecruiterProfileSchemaDocument =
  HydratedDocument<RecruiterProfileSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class RecruiterProfileSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  recruiterId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: CompanySchemaClass.name,
    required: true,
    index: true,
  })
  companyId: Types.ObjectId;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 255,
  })
  designation?: string | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const RecruiterProfileSchema = SchemaFactory.createForClass(
  RecruiterProfileSchemaClass,
);

RecruiterProfileSchema.index({ recruiterId: 1, companyId: 1 }, { unique: true });
RecruiterProfileSchema.index({ recruiterId: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { UserSchemaClass } from './user.schema';

export type CollegeSchemaDocument = HydratedDocument<CollegeSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class CollegeSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  })
  name: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 255,
  })
  institutionType?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 255,
  })
  location?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 500,
  })
  logo?: string | null;

  @Prop({
    type: String,
    trim: true,
    uppercase: true,
    default: null,
    maxlength: 32,
    unique: true,
    sparse: true,
    index: true,
  })
  inviteCode?: string | null;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    default: null,
    index: true,
  })
  createdBy?: Types.ObjectId | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const CollegeSchema = SchemaFactory.createForClass(CollegeSchemaClass);

CollegeSchema.index({ name: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { CollegeSchemaClass } from './college.schema';
import { UserSchemaClass } from './user.schema';

export type StudentSchemaDocument = HydratedDocument<StudentSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class StudentSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: CollegeSchemaClass.name,
    required: true,
    index: true,
  })
  collegeId: Types.ObjectId;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 255,
  })
  program?: string | null;

  @Prop({
    type: Number,
    min: 1,
    max: 10,
    default: null,
  })
  year?: number | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const StudentSchema = SchemaFactory.createForClass(StudentSchemaClass);

StudentSchema.index({ studentId: 1, collegeId: 1 }, { unique: true });
StudentSchema.index({ collegeId: 1, createdAt: -1 });

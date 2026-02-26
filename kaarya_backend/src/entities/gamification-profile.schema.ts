import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { UserSchemaClass } from './user.schema';

export type GamificationProfileSchemaDocument =
  HydratedDocument<GamificationProfileSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class GamificationProfileSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    index: true,
  })
  xp: number;

  @Prop({
    type: Number,
    default: 1,
    min: 1,
  })
  level: number;

  @Prop({
    type: Number,
    default: 0,
    index: true,
  })
  score: number;

  @Prop({
    type: Date,
    default: null,
  })
  xpUpdatedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  scoreUpdatedAt?: Date | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const GamificationProfileSchema = SchemaFactory.createForClass(
  GamificationProfileSchemaClass,
);

GamificationProfileSchema.index({ score: -1, xp: -1, userId: 1 });
GamificationProfileSchema.index({ xp: -1, userId: 1 });

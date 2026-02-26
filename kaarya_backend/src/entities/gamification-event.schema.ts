import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types, now } from 'mongoose';
import { GamificationEventType } from 'src/types/gamification-event-type.enum';
import { UserSchemaClass } from './user.schema';

export type GamificationEventSchemaDocument =
  HydratedDocument<GamificationEventSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class GamificationEventSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(GamificationEventType),
    required: true,
    index: true,
  })
  eventType: GamificationEventType;

  @Prop({
    type: String,
    required: true,
    trim: true,
    unique: true,
  })
  eventKey: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    default: 0,
  })
  xpAwarded: number;

  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  scoreDelta: number;

  @Prop({
    type: SchemaTypes.Mixed,
    default: {},
  })
  metadata: Record<string, unknown>;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const GamificationEventSchema = SchemaFactory.createForClass(
  GamificationEventSchemaClass,
);

GamificationEventSchema.index({ userId: 1, createdAt: -1 });
GamificationEventSchema.index({ userId: 1, eventType: 1, createdAt: -1 });

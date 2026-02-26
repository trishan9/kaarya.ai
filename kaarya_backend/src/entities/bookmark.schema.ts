import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { BookmarkEntityType } from 'src/types/bookmark-entity-type.enum';
import { UserSchemaClass } from './user.schema';

export type BookmarkSchemaDocument = HydratedDocument<BookmarkSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class BookmarkSchemaClass {
  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(BookmarkEntityType),
    required: true,
    index: true,
  })
  entityType: BookmarkEntityType;

  @Prop({
    type: Types.ObjectId,
    required: true,
    index: true,
  })
  entityId: Types.ObjectId;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const BookmarkSchema = SchemaFactory.createForClass(BookmarkSchemaClass);

BookmarkSchema.index({ userId: 1, entityType: 1, entityId: 1 }, { unique: true });
BookmarkSchema.index({ userId: 1, entityType: 1, createdAt: -1 });
BookmarkSchema.index({ entityType: 1, entityId: 1 });

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BookmarkSchemaClass,
  BookmarkSchemaDocument,
} from 'src/entities/bookmark.schema';
import { BookmarkEntityType } from 'src/types/bookmark-entity-type.enum';

export abstract class ACBookmarkRepository {
  abstract upsertByUserAndEntity(input: {
    userId: string;
    entityType: BookmarkEntityType;
    entityId: string;
  }): Promise<BookmarkSchemaDocument>;

  abstract deleteByUserAndEntity(input: {
    userId: string;
    entityType: BookmarkEntityType;
    entityId: string;
  }): Promise<BookmarkSchemaDocument | null>;

  abstract findAllByUser(input: {
    userId: string;
    entityType?: BookmarkEntityType;
  }): Promise<BookmarkSchemaDocument[]>;

  abstract findSavedEntityIds(input: {
    userId: string;
    entityType: BookmarkEntityType;
    entityIds?: string[];
  }): Promise<Set<string>>;
}

@Injectable()
export class BookmarkRepository implements ACBookmarkRepository {
  constructor(
    @InjectModel(BookmarkSchemaClass.name)
    private readonly bookmarkModel: Model<BookmarkSchemaClass>,
  ) {}

  async upsertByUserAndEntity(input: {
    userId: string;
    entityType: BookmarkEntityType;
    entityId: string;
  }): Promise<BookmarkSchemaDocument> {
    const result = await this.bookmarkModel
      .findOneAndUpdate(
        {
          userId: this.toObjectId(input.userId),
          entityType: input.entityType,
          entityId: this.toObjectId(input.entityId),
        },
        {
          userId: this.toObjectId(input.userId),
          entityType: input.entityType,
          entityId: this.toObjectId(input.entityId),
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    if (!result) {
      throw new Error('Bookmark upsert failed.');
    }

    return result;
  }

  async deleteByUserAndEntity(input: {
    userId: string;
    entityType: BookmarkEntityType;
    entityId: string;
  }): Promise<BookmarkSchemaDocument | null> {
    return await this.bookmarkModel
      .findOneAndDelete({
        userId: this.toObjectId(input.userId),
        entityType: input.entityType,
        entityId: this.toObjectId(input.entityId),
      })
      .exec();
  }

  async findAllByUser(input: {
    userId: string;
    entityType?: BookmarkEntityType;
  }): Promise<BookmarkSchemaDocument[]> {
    const filter: Record<string, unknown> = {
      userId: this.toObjectId(input.userId),
    };

    if (input.entityType) {
      filter.entityType = input.entityType;
    }

    return await this.bookmarkModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .exec();
  }

  async findSavedEntityIds(input: {
    userId: string;
    entityType: BookmarkEntityType;
    entityIds?: string[];
  }): Promise<Set<string>> {
    const filter: Record<string, unknown> = {
      userId: this.toObjectId(input.userId),
      entityType: input.entityType,
    };

    if (input.entityIds?.length) {
      filter.entityId = {
        $in: input.entityIds.map((entityId) => this.toObjectId(entityId)),
      };
    }

    const rows = await this.bookmarkModel.find(filter).select('entityId').lean().exec();
    const ids = rows
      .map((row) => {
        const rawEntityId = (row as { entityId?: unknown }).entityId;
        if (rawEntityId instanceof Types.ObjectId) {
          return rawEntityId.toString();
        }
        if (typeof rawEntityId === 'string') {
          return rawEntityId;
        }
        return null;
      })
      .filter(Boolean) as string[];

    return new Set(ids);
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

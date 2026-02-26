import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { resolveLevelFromXp } from 'src/constants/gamification.constants';
import {
  GamificationProfileSchemaClass,
  GamificationProfileSchemaDocument,
} from 'src/entities/gamification-profile.schema';

export abstract class ACGamificationProfileRepository {
  abstract findByUserId(
    userId: string,
  ): Promise<GamificationProfileSchemaDocument | null>;
  abstract findByUserIds(
    userIds: string[],
  ): Promise<Map<string, GamificationProfileSchemaDocument>>;
  abstract applyDelta(input: {
    userId: string;
    xpDelta?: number;
    scoreDelta?: number;
  }): Promise<GamificationProfileSchemaDocument | null>;
}

@Injectable()
export class GamificationProfileRepository
  implements ACGamificationProfileRepository
{
  constructor(
    @InjectModel(GamificationProfileSchemaClass.name)
    private readonly gamificationProfileModel: Model<GamificationProfileSchemaClass>,
  ) {}

  async findByUserId(
    userId: string,
  ): Promise<GamificationProfileSchemaDocument | null> {
    if (!userId) {
      return null;
    }

    return await this.gamificationProfileModel
      .findOne({
        userId: new Types.ObjectId(userId),
      })
      .exec();
  }

  async findByUserIds(
    userIds: string[],
  ): Promise<Map<string, GamificationProfileSchemaDocument>> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Map();
    }

    const objectIds = userIds
      .filter((userId): userId is string => Boolean(userId))
      .map((userId) => new Types.ObjectId(userId));

    if (objectIds.length === 0) {
      return new Map();
    }

    const profiles = await this.gamificationProfileModel
      .find({
        userId: {
          $in: objectIds,
        },
      })
      .exec();

    return new Map(
      profiles.map((profile) => [String(profile.userId), profile]),
    );
  }

  async applyDelta(input: {
    userId: string;
    xpDelta?: number;
    scoreDelta?: number;
  }): Promise<GamificationProfileSchemaDocument | null> {
    const { userId, xpDelta, scoreDelta } = input;
    if (!userId) {
      return null;
    }

    const safeXpDelta =
      Number.isFinite(xpDelta) && (xpDelta ?? 0) !== 0
        ? Math.floor(xpDelta as number)
        : 0;
    const safeScoreDelta =
      Number.isFinite(scoreDelta) && (scoreDelta ?? 0) !== 0
        ? Math.floor(scoreDelta as number)
        : 0;

    const profile = await this.gamificationProfileModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
        },
        {
          $setOnInsert: {
            userId: new Types.ObjectId(userId),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    if (!profile) {
      return null;
    }

    if (!safeXpDelta && !safeScoreDelta) {
      return profile;
    }

    const nextXp = Math.max(0, (profile.xp ?? 0) + safeXpDelta);
    const nextScore = (profile.score ?? 0) + safeScoreDelta;
    const nextLevel = resolveLevelFromXp(nextXp);

    return await this.gamificationProfileModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
        },
        {
          $set: {
            xp: nextXp,
            score: nextScore,
            level: nextLevel,
            ...(safeXpDelta ? { xpUpdatedAt: new Date() } : {}),
            ...(safeScoreDelta ? { scoreUpdatedAt: new Date() } : {}),
          },
        },
        {
          new: true,
        },
      )
      .exec();
  }
}

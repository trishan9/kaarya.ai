import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LEADERBOARD_TOTAL_WEIGHTS,
  SCORE_QUALITY_MULTIPLIER_BANDS,
  resolveLeaderboardTotal,
} from 'src/constants/gamification.constants';
import { GamificationProfileSchemaClass } from 'src/entities/gamification-profile.schema';
import { UserSchemaClass, UserSchemaDocument } from 'src/entities/user.schema';
import { UserRole } from 'src/types/user-role.enum';
import { TUser } from 'src/types/user.type';

export abstract class ACUserRepository {
  abstract create(payload: Partial<TUser>): Promise<UserSchemaDocument>;
  abstract findAll(options: {
    page: number;
    size: number;
    search?: string;
  }): Promise<{ users: UserSchemaDocument[]; total: number }>;
  abstract getAnalytics(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    newThisWeek: number;
    signupTrend: Array<{ year: number; month: number; value: number }>;
  }>;
  abstract findById(id: string): Promise<UserSchemaDocument | null>;
  abstract findByIds(ids: string[]): Promise<UserSchemaDocument[]>;
  abstract findByEmail(
    email: string,
    options?: { includePassword?: boolean },
  ): Promise<UserSchemaDocument | null>;
  abstract findByProviderSocialId(
    provider: string,
    socialId: string,
  ): Promise<UserSchemaDocument | null>;
  abstract updateById(
    id: string,
    payload: Partial<TUser>,
  ): Promise<UserSchemaDocument | null>;
  abstract deleteById(id: string): Promise<UserSchemaDocument | null>;
  abstract findCandidateLeaderboardRows(options: {
    page: number;
    size: number;
    candidateIds?: string[];
  }): Promise<{ users: UserSchemaDocument[]; total: number }>;
  abstract countCandidatesAheadOfUser(input: {
    userId: string;
    score: number;
    xp: number;
    candidateIds?: string[];
  }): Promise<number>;
}

@Injectable()
export class UserRepository implements ACUserRepository {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserSchemaClass>,
    @InjectModel(GamificationProfileSchemaClass.name)
    private readonly gamificationProfileModel: Model<GamificationProfileSchemaClass>,
  ) {}

  async create(payload: Partial<TUser>): Promise<UserSchemaDocument> {
    const user = new this.userModel(payload);
    return await user.save();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getGamificationLookupStages() {
    return [
      {
        $lookup: {
          from: this.gamificationProfileModel.collection.name,
          localField: '_id',
          foreignField: 'userId',
          as: 'gamificationProfile',
        },
      },
      {
        $addFields: {
          gamificationProfile: {
            $first: '$gamificationProfile',
          },
        },
      },
      {
        $addFields: {
          safeXp: { $ifNull: ['$gamificationProfile.xp', 0] },
          safeScore: { $ifNull: ['$gamificationProfile.score', 0] },
        },
      },
    ];
  }

  async findAll(options: {
    page: number;
    size: number;
    search?: string;
  }): Promise<{ users: UserSchemaDocument[]; total: number }> {
    const { page, size, search } = options;
    const skip = (page - 1) * size;

    const filter =
      search && search.trim().length > 0
        ? {
            $or: [
              {
                name: {
                  $regex: this.escapeRegex(search.trim()),
                  $options: 'i',
                },
              },
              {
                email: {
                  $regex: this.escapeRegex(search.trim()),
                  $options: 'i',
                },
              },
            ],
          }
        : {};

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { users, total };
  }

  async getAnalytics(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    newThisWeek: number;
    signupTrend: Array<{ year: number; month: number; value: number }>;
  }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWindow = new Date(
      startOfThisMonth.getFullYear(),
      startOfThisMonth.getMonth() - 5,
      1,
    );

    const [totalUsers, totalAdmins, newThisWeek, trend] = await Promise.all([
      this.userModel.countDocuments({}).exec(),
      this.userModel.countDocuments({ role: 'admin' }).exec(),
      this.userModel
        .countDocuments({ createdAt: { $gte: sevenDaysAgo } })
        .exec(),
      this.userModel
        .aggregate<{ _id: { year: number; month: number }; value: number }>([
          { $match: { createdAt: { $gte: startOfWindow } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              value: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ])
        .exec(),
    ]);

    const signupTrend = trend.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      value: item.value,
    }));

    return { totalUsers, totalAdmins, newThisWeek, signupTrend };
  }

  async findById(id: string): Promise<UserSchemaDocument | null> {
    if (!id) return null;
    return await this.userModel.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<UserSchemaDocument[]> {
    if (!ids?.length) return [];
    const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
    const objectIds = uniqueIds.map((id) => new Types.ObjectId(id));
    return await this.userModel.find({ _id: { $in: objectIds } }).exec();
  }

  async findByEmail(
    email: string,
    options?: { includePassword?: boolean },
  ): Promise<UserSchemaDocument | null> {
    if (!email) return null;
    const query = this.userModel.findOne({ email: email.trim().toLowerCase() });
    if (options?.includePassword) {
      query.select('+password');
    }
    return await query.exec();
  }

  async findByProviderSocialId(
    provider: string,
    socialId: string,
  ): Promise<UserSchemaDocument | null> {
    if (!provider || !socialId) return null;
    return await this.userModel.findOne({ provider, socialId }).exec();
  }

  async updateById(
    id: string,
    payload: Partial<TUser>,
  ): Promise<UserSchemaDocument | null> {
    if (!id) return null;
    return await this.userModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<UserSchemaDocument | null> {
    if (!id) return null;
    return await this.userModel.findByIdAndDelete(id).exec();
  }

  async findCandidateLeaderboardRows(options: {
    page: number;
    size: number;
    candidateIds?: string[];
  }): Promise<{ users: UserSchemaDocument[]; total: number }> {
    const { page, size, candidateIds } = options;
    const skip = (page - 1) * size;

    if (Array.isArray(candidateIds) && candidateIds.length === 0) {
      return { users: [], total: 0 };
    }

    const filter: Record<string, unknown> = {
      role: {
        $in: [UserRole.USER, UserRole.STUDENT],
      },
    };

    if (candidateIds?.length) {
      filter._id = {
        $in: candidateIds.map((id) => new Types.ObjectId(id)),
      };
    }

    const [rankedIds, total] = await Promise.all([
      this.userModel
        .aggregate<{ _id: Types.ObjectId }>([
          { $match: filter },
          ...this.getGamificationLookupStages(),
          {
            $addFields: {
              safeXpMultiplier: {
                $switch: {
                  branches: SCORE_QUALITY_MULTIPLIER_BANDS.map((band) => ({
                    case: { $gte: ['$safeScore', band.minScore] },
                    then: band.multiplier,
                  })),
                  default: 0.2,
                },
              },
            },
          },
          {
            $addFields: {
              safeTotal: {
                $max: [
                  0,
                  {
                    $add: [
                      {
                        $multiply: [
                          '$safeXp',
                          LEADERBOARD_TOTAL_WEIGHTS.XP,
                          '$safeXpMultiplier',
                        ],
                      },
                      {
                        $multiply: [
                          '$safeScore',
                          LEADERBOARD_TOTAL_WEIGHTS.SCORE,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          {
            $sort: {
              safeTotal: -1,
              safeScore: -1,
              safeXp: -1,
              _id: 1,
            },
          },
          { $skip: skip },
          { $limit: size },
          { $project: { _id: 1 } },
        ])
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    if (rankedIds.length === 0) {
      return { users: [], total };
    }

    const docs = await this.userModel
      .find({
        _id: { $in: rankedIds.map((item) => item._id) },
      })
      .exec();

    const docsById = new Map(docs.map((doc) => [String(doc._id), doc]));
    const users = rankedIds
      .map((item) => docsById.get(String(item._id)))
      .filter((doc): doc is UserSchemaDocument => Boolean(doc));

    return { users, total };
  }

  async countCandidatesAheadOfUser(input: {
    userId: string;
    score: number;
    xp: number;
    candidateIds?: string[];
  }): Promise<number> {
    if (!input.userId) return 0;

    const matchStage: Record<string, unknown> = {
      role: {
        $in: [UserRole.USER, UserRole.STUDENT],
      },
    };

    if (input.candidateIds?.length) {
      matchStage._id = {
        $in: input.candidateIds.map((id) => new Types.ObjectId(id)),
      };
    } else if (Array.isArray(input.candidateIds)) {
      return 0;
    }

    const total = resolveLeaderboardTotal({
      xp: input.xp,
      score: input.score,
    });
    const [result] = await this.userModel
      .aggregate<{ total: number }>([
        {
          $match: matchStage,
        },
        ...this.getGamificationLookupStages(),
        {
          $addFields: {
            safeXpMultiplier: {
              $switch: {
                branches: SCORE_QUALITY_MULTIPLIER_BANDS.map((band) => ({
                  case: { $gte: ['$safeScore', band.minScore] },
                  then: band.multiplier,
                })),
                default: 0.2,
              },
            },
          },
        },
        {
          $addFields: {
            safeTotal: {
              $max: [
                0,
                {
                  $add: [
                    {
                      $multiply: [
                        '$safeXp',
                        LEADERBOARD_TOTAL_WEIGHTS.XP,
                        '$safeXpMultiplier',
                      ],
                    },
                    {
                      $multiply: [
                        '$safeScore',
                        LEADERBOARD_TOTAL_WEIGHTS.SCORE,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $match: {
            $or: [
              {
                safeTotal: { $gt: total },
              },
              {
                safeTotal: total,
                safeScore: { $gt: input.score },
              },
              {
                safeTotal: total,
                safeScore: input.score,
                safeXp: { $gt: input.xp },
              },
              {
                safeTotal: total,
                safeScore: input.score,
                safeXp: input.xp,
                _id: { $lt: new Types.ObjectId(input.userId) },
              },
            ],
          },
        },
        {
          $count: 'total',
        },
      ])
      .exec();

    return result?.total ?? 0;
  }
}

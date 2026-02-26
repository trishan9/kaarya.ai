import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  GamificationEventSchemaClass,
  GamificationEventSchemaDocument,
} from 'src/entities/gamification-event.schema';
import { GamificationEventType } from 'src/types/gamification-event-type.enum';

export type TCreateGamificationEventInput = {
  userId: string;
  eventType: GamificationEventType;
  eventKey: string;
  xpAwarded: number;
  scoreDelta?: number;
  metadata?: Record<string, unknown>;
};

export abstract class ACGamificationEventRepository {
  abstract createUnique(
    input: TCreateGamificationEventInput,
  ): Promise<{
    created: boolean;
    event: GamificationEventSchemaDocument | null;
  }>;

  abstract getActivityStatsByUserIds(input: {
    userIds: string[];
  }): Promise<
    Map<
      string,
      {
        profileUpdates: number;
        jobViews: number;
        jobsSaved: number;
        interviewsSaved: number;
        applicationsSubmitted: number;
        interviewsTaken: number;
        interviewsCompleted: number;
        resumesCreated: number;
        resumesSaved: number;
        atsScans: number;
        bestInterviewScore: number;
        averageInterviewScore: number;
        interviewScoreEntries: number;
        bestAtsScore: number;
        averageAtsScore: number;
        atsScoreEntries: number;
      }
    >
  >;
}

@Injectable()
export class GamificationEventRepository implements ACGamificationEventRepository {
  constructor(
    @InjectModel(GamificationEventSchemaClass.name)
    private readonly gamificationEventModel: Model<GamificationEventSchemaClass>,
  ) {}

  async createUnique(
    input: TCreateGamificationEventInput,
  ): Promise<{
    created: boolean;
    event: GamificationEventSchemaDocument | null;
  }> {
    if (!input.userId || !input.eventType || !input.eventKey) {
      return { created: false, event: null };
    }

    try {
      const event = await this.gamificationEventModel.create({
        userId: new Types.ObjectId(input.userId),
        eventType: input.eventType,
        eventKey: input.eventKey,
        xpAwarded: input.xpAwarded,
        scoreDelta: Math.floor(input.scoreDelta ?? 0),
        metadata: input.metadata ?? {},
      });

      return { created: true, event };
    } catch (error) {
      const duplicateKey =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000;

      if (!duplicateKey) {
        throw error;
      }

      const event = await this.gamificationEventModel
        .findOne({ eventKey: input.eventKey })
        .exec();
      return { created: false, event };
    }
  }

  async getActivityStatsByUserIds(input: {
    userIds: string[];
  }): Promise<
    Map<
      string,
      {
        profileUpdates: number;
        jobViews: number;
        jobsSaved: number;
        interviewsSaved: number;
        applicationsSubmitted: number;
        interviewsTaken: number;
        interviewsCompleted: number;
        resumesCreated: number;
        resumesSaved: number;
        atsScans: number;
        bestInterviewScore: number;
        averageInterviewScore: number;
        interviewScoreEntries: number;
        bestAtsScore: number;
        averageAtsScore: number;
        atsScoreEntries: number;
      }
    >
  > {
    const map = new Map<
      string,
      {
        profileUpdates: number;
        jobViews: number;
        jobsSaved: number;
        interviewsSaved: number;
        applicationsSubmitted: number;
        interviewsTaken: number;
        interviewsCompleted: number;
        resumesCreated: number;
        resumesSaved: number;
        atsScans: number;
        bestInterviewScore: number;
        averageInterviewScore: number;
        interviewScoreEntries: number;
        bestAtsScore: number;
        averageAtsScore: number;
        atsScoreEntries: number;
      }
    >();

    if (!input.userIds.length) {
      return map;
    }

    const rows = await this.gamificationEventModel
      .aggregate<{
        _id: Types.ObjectId;
        profileUpdates: number;
        jobViews: number;
        jobsSaved: number;
        interviewsSaved: number;
        applicationsSubmitted: number;
        interviewsTaken: number;
        interviewsCompleted: number;
        resumesCreated: number;
        resumesSaved: number;
        atsScans: number;
        bestInterviewScore: number;
        averageInterviewScore: number;
        interviewScoreEntries: number;
        bestAtsScore: number;
        averageAtsScore: number;
        atsScoreEntries: number;
      }>([
        {
          $match: {
            userId: {
              $in: input.userIds.map((id) => new Types.ObjectId(id)),
            },
          },
        },
        {
          $group: {
            _id: '$userId',
            profileUpdates: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$eventType', GamificationEventType.PROFILE_UPDATED],
                  },
                  1,
                  0,
                ],
              },
            },
            jobViews: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$eventType', GamificationEventType.JOB_VIEWED],
                  },
                  1,
                  0,
                ],
              },
            },
            jobsSaved: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$eventType', GamificationEventType.JOB_SAVED],
                  },
                  1,
                  0,
                ],
              },
            },
            interviewsSaved: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$eventType', GamificationEventType.INTERVIEW_SAVED],
                  },
                  1,
                  0,
                ],
              },
            },
            applicationsSubmitted: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.JOB_APPLICATION_SUBMITTED,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            interviewsTaken: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.MOCK_INTERVIEW_STARTED,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            interviewsCompleted: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.MOCK_INTERVIEW_COMPLETED,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            resumesCreated: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.RESUME_BUILDER_CREATED,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            resumesSaved: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.RESUME_BUILDER_SAVED,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            atsScans: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.ATS_SCAN_COMPLETED,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            bestInterviewScore: {
              $max: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.MOCK_INTERVIEW_SCORE_AWARDED,
                    ],
                  },
                  { $ifNull: ['$metadata.score', 0] },
                  0,
                ],
              },
            },
            interviewScoreTotal: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.MOCK_INTERVIEW_SCORE_AWARDED,
                    ],
                  },
                  { $ifNull: ['$metadata.score', 0] },
                  0,
                ],
              },
            },
            interviewScoreEntries: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$eventType',
                      GamificationEventType.MOCK_INTERVIEW_SCORE_AWARDED,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            bestAtsScore: {
              $max: {
                $cond: [
                  {
                    $eq: ['$eventType', GamificationEventType.ATS_SCORE_AWARDED],
                  },
                  { $ifNull: ['$metadata.score', 0] },
                  0,
                ],
              },
            },
            atsScoreTotal: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$eventType', GamificationEventType.ATS_SCORE_AWARDED],
                  },
                  { $ifNull: ['$metadata.score', 0] },
                  0,
                ],
              },
            },
            atsScoreEntries: {
              $sum: {
                $cond: [
                  {
                    $eq: ['$eventType', GamificationEventType.ATS_SCORE_AWARDED],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $addFields: {
            averageInterviewScore: {
              $cond: [
                { $gt: ['$interviewScoreEntries', 0] },
                { $divide: ['$interviewScoreTotal', '$interviewScoreEntries'] },
                0,
              ],
            },
            averageAtsScore: {
              $cond: [
                { $gt: ['$atsScoreEntries', 0] },
                { $divide: ['$atsScoreTotal', '$atsScoreEntries'] },
                0,
              ],
            },
          },
        },
      ])
      .exec();

    rows.forEach((row) => {
      map.set(row._id.toString(), {
        profileUpdates: row.profileUpdates ?? 0,
        jobViews: row.jobViews ?? 0,
        jobsSaved: row.jobsSaved ?? 0,
        interviewsSaved: row.interviewsSaved ?? 0,
        applicationsSubmitted: row.applicationsSubmitted ?? 0,
        interviewsTaken: row.interviewsTaken ?? 0,
        interviewsCompleted: row.interviewsCompleted ?? 0,
        resumesCreated: row.resumesCreated ?? 0,
        resumesSaved: row.resumesSaved ?? 0,
        atsScans: row.atsScans ?? 0,
        bestInterviewScore: row.bestInterviewScore ?? 0,
        averageInterviewScore: row.averageInterviewScore ?? 0,
        interviewScoreEntries: row.interviewScoreEntries ?? 0,
        bestAtsScore: row.bestAtsScore ?? 0,
        averageAtsScore: row.averageAtsScore ?? 0,
        atsScoreEntries: row.atsScoreEntries ?? 0,
      });
    });

    return map;
  }
}

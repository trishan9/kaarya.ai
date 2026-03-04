import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InterviewSessionSchemaClass,
  InterviewSessionSchemaDocument,
} from 'src/entities/interview-session.schema';
import { InterviewSessionStatus } from 'src/types/interview-session-status.enum';

export type TInterviewSessionListByInterviewOptions = {
  interviewId: string;
  page: number;
  size: number;
  sort?: Record<string, 1 | -1>;
};

export type TInterviewSessionListByUserOptions = {
  userId: string;
  interviewId?: string;
  page: number;
  size: number;
  status?: InterviewSessionStatus;
  sort?: Record<string, 1 | -1>;
};

export abstract class ACInterviewSessionRepository {
  abstract create(
    payload: Partial<InterviewSessionSchemaClass>,
  ): Promise<InterviewSessionSchemaDocument>;
  abstract findById(id: string): Promise<InterviewSessionSchemaDocument | null>;
  abstract updateById(
    id: string,
    payload: Partial<InterviewSessionSchemaClass>,
  ): Promise<InterviewSessionSchemaDocument | null>;
  abstract findAllByInterviewId(
    options: TInterviewSessionListByInterviewOptions,
  ): Promise<{ sessions: InterviewSessionSchemaDocument[]; total: number }>;
  abstract findAllByUser(
    options: TInterviewSessionListByUserOptions,
  ): Promise<{ sessions: InterviewSessionSchemaDocument[]; total: number }>;
  abstract findInterviewIdsByUser(userId: string): Promise<string[]>;
  abstract countDistinctUsersByInterview(interviewId: string): Promise<number>;
  abstract countByUserAndCreatedBetween(input: {
    userId: string;
    start: Date;
    end: Date;
  }): Promise<number>;
  abstract findLatestByUserAndInterviewIds(input: {
    userId: string;
    interviewIds: string[];
  }): Promise<Map<string, InterviewSessionSchemaDocument>>;
}

@Injectable()
export class InterviewSessionRepository implements ACInterviewSessionRepository {
  constructor(
    @InjectModel(InterviewSessionSchemaClass.name)
    private readonly interviewSessionModel: Model<InterviewSessionSchemaClass>,
  ) {}

  async create(
    payload: Partial<InterviewSessionSchemaClass>,
  ): Promise<InterviewSessionSchemaDocument> {
    const session = new this.interviewSessionModel(payload);
    return await session.save();
  }

  async findById(id: string): Promise<InterviewSessionSchemaDocument | null> {
    if (!id) return null;
    return await this.interviewSessionModel.findById(id).exec();
  }

  async updateById(
    id: string,
    payload: Partial<InterviewSessionSchemaClass>,
  ): Promise<InterviewSessionSchemaDocument | null> {
    if (!id) return null;
    return await this.interviewSessionModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async findAllByInterviewId(
    options: TInterviewSessionListByInterviewOptions,
  ): Promise<{ sessions: InterviewSessionSchemaDocument[]; total: number }> {
    const skip = (options.page - 1) * options.size;
    const filter = { interviewId: new Types.ObjectId(options.interviewId) };
    const sort = options.sort ?? { createdAt: -1, _id: -1 };

    const [sessions, total] = await Promise.all([
      this.interviewSessionModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(options.size)
        .exec(),
      this.interviewSessionModel.countDocuments(filter).exec(),
    ]);

    return { sessions, total };
  }

  async findAllByUser(
    options: TInterviewSessionListByUserOptions,
  ): Promise<{ sessions: InterviewSessionSchemaDocument[]; total: number }> {
    const skip = (options.page - 1) * options.size;
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(options.userId),
    };

    if (options.interviewId) {
      filter.interviewId = new Types.ObjectId(options.interviewId);
    }

    if (options.status) {
      filter.status = options.status;
    }

    const sort = options.sort ?? { createdAt: -1, _id: -1 };

    const [sessions, total] = await Promise.all([
      this.interviewSessionModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(options.size)
        .exec(),
      this.interviewSessionModel.countDocuments(filter).exec(),
    ]);

    return { sessions, total };
  }

  async findInterviewIdsByUser(userId: string): Promise<string[]> {
    if (!userId) return [];
    const rows = await this.interviewSessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('interviewId')
      .lean()
      .exec();

    return Array.from(
      new Set(
        rows
          .map((row) => {
            const value = row.interviewId as unknown;
            if (value instanceof Types.ObjectId) {
              return value.toString();
            }
            if (typeof value === 'string') {
              return value;
            }
            return null;
          })
          .filter(Boolean) as string[],
      ),
    );
  }

  async countDistinctUsersByInterview(interviewId: string): Promise<number> {
    if (!interviewId) return 0;
    const rows = await this.interviewSessionModel.distinct('userId', {
      interviewId: new Types.ObjectId(interviewId),
    });
    return rows.length;
  }

  async countByUserAndCreatedBetween(input: {
    userId: string;
    start: Date;
    end: Date;
  }): Promise<number> {
    if (!input.userId) return 0;

    return await this.interviewSessionModel
      .countDocuments({
        userId: new Types.ObjectId(input.userId),
        createdAt: {
          $gte: input.start,
          $lte: input.end,
        },
      })
      .exec();
  }

  async findLatestByUserAndInterviewIds(input: {
    userId: string;
    interviewIds: string[];
  }): Promise<Map<string, InterviewSessionSchemaDocument>> {
    const result = new Map<string, InterviewSessionSchemaDocument>();
    if (!input.userId || !input.interviewIds.length) {
      return result;
    }

    const sessions = await this.interviewSessionModel
      .find({
        userId: new Types.ObjectId(input.userId),
        interviewId: {
          $in: input.interviewIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .exec();

    sessions.forEach((session) => {
      const interviewId = session.interviewId.toString();
      if (!result.has(interviewId)) {
        result.set(interviewId, session as InterviewSessionSchemaDocument);
      }
    });

    return result;
  }
}

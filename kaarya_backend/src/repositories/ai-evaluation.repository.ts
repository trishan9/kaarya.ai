import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  AIEvaluationSchemaClass,
  AIEvaluationSchemaDocument,
} from 'src/entities/ai-evaluation.schema';

export type TAIEvaluationListByInterviewAndUserOptions = {
  interviewId: string;
  userId: string;
  page: number;
  size: number;
};

export abstract class ACAIEvaluationRepository {
  abstract create(
    payload: Partial<AIEvaluationSchemaClass>,
  ): Promise<AIEvaluationSchemaDocument>;
  abstract upsertBySessionId(
    sessionId: string,
    payload: Partial<AIEvaluationSchemaClass>,
  ): Promise<AIEvaluationSchemaDocument | null>;
  abstract findBySessionId(
    sessionId: string,
  ): Promise<AIEvaluationSchemaDocument | null>;
  abstract findLatestByInterviewAndUser(input: {
    interviewId: string;
    userId: string;
  }): Promise<AIEvaluationSchemaDocument | null>;
  abstract findAllByInterviewAndUser(
    options: TAIEvaluationListByInterviewAndUserOptions,
  ): Promise<{ evaluations: AIEvaluationSchemaDocument[]; total: number }>;
  abstract getInterviewScoreSummary(interviewId: string): Promise<{
    averageScore: number;
    highestScore: number;
    evaluationsCount: number;
  }>;
  abstract findLatestByUserAndInterviewIds(input: {
    userId: string;
    interviewIds: string[];
  }): Promise<Map<string, AIEvaluationSchemaDocument>>;
}

@Injectable()
export class AIEvaluationRepository implements ACAIEvaluationRepository {
  constructor(
    @InjectModel(AIEvaluationSchemaClass.name)
    private readonly aiEvaluationModel: Model<AIEvaluationSchemaClass>,
  ) {}

  async create(
    payload: Partial<AIEvaluationSchemaClass>,
  ): Promise<AIEvaluationSchemaDocument> {
    const evaluation = new this.aiEvaluationModel(payload);
    return await evaluation.save();
  }

  async upsertBySessionId(
    sessionId: string,
    payload: Partial<AIEvaluationSchemaClass>,
  ): Promise<AIEvaluationSchemaDocument | null> {
    if (!sessionId) return null;
    return await this.aiEvaluationModel
      .findOneAndUpdate(
        { sessionId: new Types.ObjectId(sessionId) },
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async findBySessionId(
    sessionId: string,
  ): Promise<AIEvaluationSchemaDocument | null> {
    if (!sessionId) return null;
    return await this.aiEvaluationModel
      .findOne({ sessionId: new Types.ObjectId(sessionId) })
      .exec();
  }

  async findLatestByInterviewAndUser(input: {
    interviewId: string;
    userId: string;
  }): Promise<AIEvaluationSchemaDocument | null> {
    if (!input.interviewId || !input.userId) return null;
    return await this.aiEvaluationModel
      .findOne({
        interviewId: new Types.ObjectId(input.interviewId),
        userId: new Types.ObjectId(input.userId),
      })
      .sort({ createdAt: -1, _id: -1 })
      .exec();
  }

  async findAllByInterviewAndUser(
    options: TAIEvaluationListByInterviewAndUserOptions,
  ): Promise<{ evaluations: AIEvaluationSchemaDocument[]; total: number }> {
    const skip = (options.page - 1) * options.size;
    const filter = {
      interviewId: new Types.ObjectId(options.interviewId),
      userId: new Types.ObjectId(options.userId),
    };

    const [evaluations, total] = await Promise.all([
      this.aiEvaluationModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(options.size)
        .exec(),
      this.aiEvaluationModel.countDocuments(filter).exec(),
    ]);

    return { evaluations, total };
  }

  async getInterviewScoreSummary(interviewId: string): Promise<{
    averageScore: number;
    highestScore: number;
    evaluationsCount: number;
  }> {
    if (!interviewId) {
      return {
        averageScore: 0,
        highestScore: 0,
        evaluationsCount: 0,
      };
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          interviewId: new Types.ObjectId(interviewId),
        },
      },
      {
        $group: {
          _id: '$interviewId',
          averageScore: { $avg: '$totalScore' },
          highestScore: { $max: '$totalScore' },
          evaluationsCount: { $sum: 1 },
        },
      },
    ];

    const [row] = await this.aiEvaluationModel.aggregate(pipeline);
    if (!row) {
      return {
        averageScore: 0,
        highestScore: 0,
        evaluationsCount: 0,
      };
    }

    return {
      averageScore:
        typeof row.averageScore === 'number'
          ? Math.round(row.averageScore)
          : 0,
      highestScore:
        typeof row.highestScore === 'number' ? row.highestScore : 0,
      evaluationsCount:
        typeof row.evaluationsCount === 'number' ? row.evaluationsCount : 0,
    };
  }

  async findLatestByUserAndInterviewIds(input: {
    userId: string;
    interviewIds: string[];
  }): Promise<Map<string, AIEvaluationSchemaDocument>> {
    const result = new Map<string, AIEvaluationSchemaDocument>();
    if (!input.userId || !input.interviewIds.length) {
      return result;
    }

    const evaluations = await this.aiEvaluationModel
      .find({
        userId: new Types.ObjectId(input.userId),
        interviewId: {
          $in: input.interviewIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .exec();

    evaluations.forEach((evaluation) => {
      const interviewId = evaluation.interviewId.toString();
      if (!result.has(interviewId)) {
        result.set(interviewId, evaluation as AIEvaluationSchemaDocument);
      }
    });

    return result;
  }
}

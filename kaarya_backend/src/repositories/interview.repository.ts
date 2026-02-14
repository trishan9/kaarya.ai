import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MockInterviewSchemaClass,
  MockInterviewSchemaDocument,
} from 'src/entities/mock-interview.schema';

export type TInterviewListOptions = {
  page: number;
  size: number;
  filter?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
};

export abstract class ACInterviewRepository {
  abstract create(
    payload: Partial<MockInterviewSchemaClass>,
  ): Promise<MockInterviewSchemaDocument>;
  abstract findById(id: string): Promise<MockInterviewSchemaDocument | null>;
  abstract findAll(options: TInterviewListOptions): Promise<{
    interviews: MockInterviewSchemaDocument[];
    total: number;
  }>;
  abstract updateById(
    id: string,
    payload: Partial<MockInterviewSchemaClass>,
  ): Promise<MockInterviewSchemaDocument | null>;
  abstract deleteById(id: string): Promise<MockInterviewSchemaDocument | null>;
  abstract incrementAttemptsAndTouch(
    id: string,
    incrementBy?: number,
  ): Promise<MockInterviewSchemaDocument | null>;
}

@Injectable()
export class InterviewRepository implements ACInterviewRepository {
  constructor(
    @InjectModel(MockInterviewSchemaClass.name)
    private readonly interviewModel: Model<MockInterviewSchemaClass>,
  ) {}

  async create(
    payload: Partial<MockInterviewSchemaClass>,
  ): Promise<MockInterviewSchemaDocument> {
    const interview = new this.interviewModel(payload);
    return await interview.save();
  }

  async findById(id: string): Promise<MockInterviewSchemaDocument | null> {
    if (!id) return null;
    return await this.interviewModel.findById(id).exec();
  }

  async findAll(options: TInterviewListOptions): Promise<{
    interviews: MockInterviewSchemaDocument[];
    total: number;
  }> {
    const skip = (options.page - 1) * options.size;
    const filter = options.filter ?? {};
    const sort = options.sort ?? { createdAt: -1, _id: -1 };

    const [interviews, total] = await Promise.all([
      this.interviewModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(options.size)
        .exec(),
      this.interviewModel.countDocuments(filter).exec(),
    ]);

    return { interviews, total };
  }

  async updateById(
    id: string,
    payload: Partial<MockInterviewSchemaClass>,
  ): Promise<MockInterviewSchemaDocument | null> {
    if (!id) return null;
    return await this.interviewModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<MockInterviewSchemaDocument | null> {
    if (!id) return null;
    return await this.interviewModel.findByIdAndDelete(id).exec();
  }

  async incrementAttemptsAndTouch(
    id: string,
    incrementBy = 1,
  ): Promise<MockInterviewSchemaDocument | null> {
    if (!id) return null;
    return await this.interviewModel
      .findByIdAndUpdate(
        id,
        {
          $inc: { attemptsCount: Math.max(0, incrementBy) },
          $set: { lastAttemptAt: new Date() },
        },
        { new: true },
      )
      .exec();
  }
}


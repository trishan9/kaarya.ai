import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApplicationSchemaClass,
  ApplicationSchemaDocument,
} from 'src/entities/application.schema';
import { ApplicationStatus } from 'src/types/application-status.enum';

export abstract class ACApplicationRepository {
  abstract create(
    payload: Partial<ApplicationSchemaClass>,
  ): Promise<ApplicationSchemaDocument>;
  abstract findJobIdsByStudentAndStatuses(input: {
    studentId: string;
    statuses: ApplicationStatus[];
  }): Promise<string[]>;
  abstract countByJobId(jobId: string): Promise<number>;
  abstract findAllByJobId(options: {
    jobId: string;
    page: number;
    size: number;
    status?: ApplicationStatus;
  }): Promise<{
    applications: ApplicationSchemaDocument[];
    total: number;
  }>;
}

@Injectable()
export class ApplicationRepository implements ACApplicationRepository {
  constructor(
    @InjectModel(ApplicationSchemaClass.name)
    private readonly applicationModel: Model<ApplicationSchemaClass>,
  ) {}

  async create(
    payload: Partial<ApplicationSchemaClass>,
  ): Promise<ApplicationSchemaDocument> {
    const application = new this.applicationModel(payload);
    return await application.save();
  }

  async findJobIdsByStudentAndStatuses(input: {
    studentId: string;
    statuses: ApplicationStatus[];
  }): Promise<string[]> {
    const { studentId, statuses } = input;
    if (!studentId || !statuses.length) {
      return [];
    }

    const rows = await this.applicationModel
      .find({
        studentId: this.toObjectId(studentId),
        status: { $in: statuses },
      })
      .select('jobId')
      .lean()
      .exec();

    return rows.map((row) => row.jobId.toString());
  }

  async countByJobId(jobId: string): Promise<number> {
    if (!jobId) return 0;
    const objectId = this.toObjectId(jobId);
    return await this.applicationModel
      .countDocuments({
        $or: [{ jobId: objectId }, { jobId }],
      })
      .exec();
  }

  async findAllByJobId(options: {
    jobId: string;
    page: number;
    size: number;
    status?: ApplicationStatus;
  }): Promise<{
    applications: ApplicationSchemaDocument[];
    total: number;
  }> {
    const { jobId, page, size, status } = options;
    if (!jobId) {
      return { applications: [], total: 0 };
    }

    const skip = (page - 1) * size;
    const objectId = this.toObjectId(jobId);
    const filter: Record<string, unknown> = {
      $or: [{ jobId: objectId }, { jobId }],
    };

    if (status) {
      filter.status = status;
    }

    const [applications, total] = await Promise.all([
      this.applicationModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .populate({
          path: 'studentId',
          select: 'name email photo role',
        })
        .exec(),
      this.applicationModel.countDocuments(filter).exec(),
    ]);

    return { applications, total };
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

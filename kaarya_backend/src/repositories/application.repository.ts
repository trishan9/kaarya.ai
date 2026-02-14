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
  abstract findById(id: string): Promise<ApplicationSchemaDocument | null>;
  abstract findByJobIdAndStudentId(
    jobId: string,
    studentId: string,
  ): Promise<ApplicationSchemaDocument | null>;
  abstract findByJobIdAndStudentIdWithRelations(
    jobId: string,
    studentId: string,
  ): Promise<ApplicationSchemaDocument | null>;
  abstract findByIdForJob(
    jobId: string,
    applicationId: string,
  ): Promise<ApplicationSchemaDocument | null>;
  abstract findByStudentAndJobIds(input: {
    studentId: string;
    jobIds: string[];
  }): Promise<
    Array<{
      applicationId: string;
      jobId: string;
      status: ApplicationStatus;
    }>
  >;
  abstract findAllByStudentId(options: {
    studentId: string;
    page: number;
    size: number;
    status?: ApplicationStatus;
  }): Promise<{
    applications: ApplicationSchemaDocument[];
    total: number;
  }>;
  abstract updateById(
    id: string,
    payload: Partial<ApplicationSchemaClass>,
  ): Promise<ApplicationSchemaDocument | null>;
  abstract findJobIdsByStudentAndStatuses(input: {
    studentId: string;
    statuses: ApplicationStatus[];
  }): Promise<string[]>;
  abstract countByJobId(jobId: string): Promise<number>;
  abstract countByStudentIds(studentIds: string[]): Promise<number>;
  abstract findAllByJobId(options: {
    jobId: string;
    page: number;
    size: number;
    status?: ApplicationStatus;
  }): Promise<{
    applications: ApplicationSchemaDocument[];
    total: number;
  }>;
  abstract getStatusCountsByStudentIds(studentIds: string[]): Promise<{
    applied: number;
    reviewing: number;
    shortlisted: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  }>;
  abstract getLeaderboardRows(input: {
    page: number;
    size: number;
    studentIds?: string[];
  }): Promise<{
    rows: Array<{
      studentId: string;
      applications: number;
      interviewScheduled: number;
      accepted: number;
      score: number;
    }>;
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

  async findById(id: string): Promise<ApplicationSchemaDocument | null> {
    if (!id) return null;
    return await this.applicationModel
      .findById(id)
      .populate({
        path: 'studentId',
        select: 'name email photo role',
      })
      .populate({
        path: 'jobId',
      })
      .populate({
        path: 'resumeId',
      })
      .exec();
  }

  async findByJobIdAndStudentId(
    jobId: string,
    studentId: string,
  ): Promise<ApplicationSchemaDocument | null> {
    if (!jobId || !studentId) return null;

    return await this.applicationModel
      .findOne({
        $or: [{ jobId: this.toObjectId(jobId) }, { jobId }],
        $and: [
          { $or: [{ studentId: this.toObjectId(studentId) }, { studentId }] },
        ],
      })
      .exec();
  }

  async findByJobIdAndStudentIdWithRelations(
    jobId: string,
    studentId: string,
  ): Promise<ApplicationSchemaDocument | null> {
    if (!jobId || !studentId) return null;

    return await this.applicationModel
      .findOne({
        $or: [{ jobId: this.toObjectId(jobId) }, { jobId }],
        $and: [
          { $or: [{ studentId: this.toObjectId(studentId) }, { studentId }] },
        ],
      })
      .populate({
        path: 'studentId',
        select: 'name email photo role',
      })
      .populate({
        path: 'jobId',
      })
      .populate({
        path: 'resumeId',
      })
      .exec();
  }

  async findByIdForJob(
    jobId: string,
    applicationId: string,
  ): Promise<ApplicationSchemaDocument | null> {
    if (!jobId || !applicationId) return null;

    return await this.applicationModel
      .findOne({
        _id: this.toObjectId(applicationId),
        $or: [{ jobId: this.toObjectId(jobId) }, { jobId }],
      })
      .populate({
        path: 'studentId',
        select: 'name email photo role',
      })
      .populate({
        path: 'resumeId',
      })
      .exec();
  }

  async findByStudentAndJobIds(input: {
    studentId: string;
    jobIds: string[];
  }): Promise<
    Array<{
      applicationId: string;
      jobId: string;
      status: ApplicationStatus;
    }>
  > {
    if (!input.studentId || !input.jobIds.length) {
      return [];
    }

    const uniqueJobIds = Array.from(new Set(input.jobIds)).map((jobId) =>
      this.toObjectId(jobId),
    );
    const rows = await this.applicationModel
      .find({
        studentId: this.toObjectId(input.studentId),
        jobId: { $in: uniqueJobIds },
      })
      .select('_id jobId status')
      .lean()
      .exec();

    return rows.map((row) => ({
      applicationId: row._id.toString(),
      jobId: row.jobId.toString(),
      status: row.status,
    }));
  }

  async findAllByStudentId(options: {
    studentId: string;
    page: number;
    size: number;
    status?: ApplicationStatus;
  }): Promise<{
    applications: ApplicationSchemaDocument[];
    total: number;
  }> {
    const { studentId, page, size, status } = options;
    if (!studentId) {
      return { applications: [], total: 0 };
    }

    const skip = (page - 1) * size;
    const filter: Record<string, unknown> = {
      studentId: this.toObjectId(studentId),
    };

    if (status) {
      filter.status = status;
    }

    const [applications, total] = await Promise.all([
      this.applicationModel
        .find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .populate({
          path: 'jobId',
        })
        .populate({
          path: 'resumeId',
        })
        .exec(),
      this.applicationModel.countDocuments(filter).exec(),
    ]);

    return { applications, total };
  }

  async updateById(
    id: string,
    payload: Partial<ApplicationSchemaClass>,
  ): Promise<ApplicationSchemaDocument | null> {
    if (!id) return null;

    return await this.applicationModel
      .findByIdAndUpdate(id, payload, { new: true })
      .populate({
        path: 'studentId',
        select: 'name email photo role',
      })
      .populate({
        path: 'resumeId',
      })
      .exec();
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

  async countByStudentIds(studentIds: string[]): Promise<number> {
    if (!studentIds.length) return 0;

    return await this.applicationModel
      .countDocuments({
        studentId: {
          $in: studentIds.map((id) => this.toObjectId(id)),
        },
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
        .populate({
          path: 'resumeId',
        })
        .exec(),
      this.applicationModel.countDocuments(filter).exec(),
    ]);

    return { applications, total };
  }

  async getStatusCountsByStudentIds(studentIds: string[]): Promise<{
    applied: number;
    reviewing: number;
    shortlisted: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  }> {
    if (!studentIds.length) {
      return {
        applied: 0,
        reviewing: 0,
        shortlisted: 0,
        interviewScheduled: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
      };
    }

    const result = await this.applicationModel
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            studentId: {
              $in: studentIds.map((id) => this.toObjectId(id)),
            },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const statusMap = new Map(result.map((row) => [row._id, row.count]));

    return {
      applied: statusMap.get(ApplicationStatus.APPLIED) ?? 0,
      reviewing: statusMap.get(ApplicationStatus.REVIEWING) ?? 0,
      shortlisted: statusMap.get(ApplicationStatus.SHORTLISTED) ?? 0,
      interviewScheduled:
        statusMap.get(ApplicationStatus.INTERVIEW_SCHEDULED) ?? 0,
      accepted: statusMap.get(ApplicationStatus.ACCEPTED) ?? 0,
      rejected: statusMap.get(ApplicationStatus.REJECTED) ?? 0,
      withdrawn: statusMap.get(ApplicationStatus.WITHDRAWN) ?? 0,
    };
  }

  async getLeaderboardRows(input: {
    page: number;
    size: number;
    studentIds?: string[];
  }): Promise<{
    rows: Array<{
      studentId: string;
      applications: number;
      interviewScheduled: number;
      accepted: number;
      score: number;
    }>;
    total: number;
  }> {
    const { page, size, studentIds } = input;
    if (Array.isArray(studentIds) && studentIds.length === 0) {
      return {
        rows: [],
        total: 0,
      };
    }

    const skip = (page - 1) * size;

    const matchStage =
      studentIds && studentIds.length > 0
        ? {
            $match: {
              studentId: {
                $in: studentIds.map((id) => this.toObjectId(id)),
              },
            },
          }
        : null;

    const pipeline = [
      ...(matchStage ? [matchStage] : []),
      {
        $group: {
          _id: '$studentId',
          applications: { $sum: 1 },
          interviewScheduled: {
            $sum: {
              $cond: [
                { $eq: ['$status', ApplicationStatus.INTERVIEW_SCHEDULED] },
                1,
                0,
              ],
            },
          },
          accepted: {
            $sum: {
              $cond: [{ $eq: ['$status', ApplicationStatus.ACCEPTED] }, 1, 0],
            },
          },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ['$applications', 5] },
              { $multiply: ['$interviewScheduled', 20] },
              { $multiply: ['$accepted', 50] },
            ],
          },
        },
      },
      {
        $sort: {
          score: -1,
          accepted: -1,
          interviewScheduled: -1,
          applications: -1,
          _id: 1,
        },
      },
      {
        $facet: {
          rows: [{ $skip: skip }, { $limit: size }],
          meta: [{ $count: 'total' }],
        },
      },
    ];

    const [result] = await this.applicationModel
      .aggregate<{
        rows: Array<{
          _id: Types.ObjectId;
          applications: number;
          interviewScheduled: number;
          accepted: number;
          score: number;
        }>;
        meta: Array<{ total: number }>;
      }>(pipeline as any)
      .exec();

    const rowsRaw = result?.rows ?? [];
    const total = result?.meta?.[0]?.total ?? 0;

    return {
      rows: rowsRaw.map((row) => ({
        studentId: row._id.toString(),
        applications: row.applications ?? 0,
        interviewScheduled: row.interviewScheduled ?? 0,
        accepted: row.accepted ?? 0,
        score: row.score ?? 0,
      })),
      total,
    };
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

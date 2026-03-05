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
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    applications: ApplicationSchemaDocument[];
    total: number;
  }>;
  abstract countByStudentWithFilters(input: {
    studentId: string;
    statuses?: ApplicationStatus[];
    fromDate?: Date;
    toDate?: Date;
  }): Promise<number>;
  abstract getStatusCountsByStudentWithFilters(input: {
    studentId: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    applied: number;
    reviewing: number;
    shortlisted: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  }>;
  abstract getDailyCountsByStudentWithFilters(input: {
    studentId: string;
    fromDate: Date;
    toDate: Date;
    statuses?: ApplicationStatus[];
  }): Promise<
    Array<{
      date: string;
      count: number;
    }>
  >;
  abstract getJobCountsByStudentWithFilters(input: {
    studentId: string;
    statuses?: ApplicationStatus[];
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<
    Array<{
      jobId: string;
      count: number;
      latestAppliedAt: string;
    }>
  >;
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
  abstract findDistinctStudentIdsByJobIds(jobIds: string[]): Promise<string[]>;
  abstract countByStudentAndResumeId(input: {
    studentId: string;
    resumeId: string;
  }): Promise<number>;
  abstract getStatusCountsByStudentIds(studentIds: string[]): Promise<{
    applied: number;
    reviewing: number;
    shortlisted: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  }>;
  abstract getLeaderboardStatsByStudentIds(studentIds: string[]): Promise<
    Map<
      string,
      {
        applications: number;
        interviewScheduled: number;
        accepted: number;
        shortlisted: number;
        rejected: number;
      }
    >
  >;
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
        select: 'name email photo role candidateProfile',
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
        select: 'name email photo role candidateProfile',
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
        select: 'name email photo role candidateProfile',
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
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    applications: ApplicationSchemaDocument[];
    total: number;
  }> {
    const { studentId, page, size, status, fromDate, toDate } = options;
    if (!studentId) {
      return { applications: [], total: 0 };
    }

    const skip = (page - 1) * size;
    const filter = this.buildStudentFilter({
      studentId,
      statuses: status ? [status] : undefined,
      fromDate,
      toDate,
    });

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

  async countByStudentWithFilters(input: {
    studentId: string;
    statuses?: ApplicationStatus[];
    fromDate?: Date;
    toDate?: Date;
  }): Promise<number> {
    if (!input.studentId) return 0;
    const filter = this.buildStudentFilter(input);
    return await this.applicationModel.countDocuments(filter).exec();
  }

  async getStatusCountsByStudentWithFilters(input: {
    studentId: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    applied: number;
    reviewing: number;
    shortlisted: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  }> {
    if (!input.studentId) {
      return this.emptyStatusCounts();
    }

    const filter = this.buildStudentFilter({
      studentId: input.studentId,
      fromDate: input.fromDate,
      toDate: input.toDate,
    });

    const rows = await this.applicationModel
      .aggregate<{ _id: ApplicationStatus; count: number }>([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    return this.rowsToStatusCounts(rows);
  }

  async getDailyCountsByStudentWithFilters(input: {
    studentId: string;
    fromDate: Date;
    toDate: Date;
    statuses?: ApplicationStatus[];
  }): Promise<
    Array<{
      date: string;
      count: number;
    }>
  > {
    if (!input.studentId) return [];

    const filter = this.buildStudentFilter({
      studentId: input.studentId,
      statuses: input.statuses,
      fromDate: input.fromDate,
      toDate: input.toDate,
    });

    return await this.applicationModel
      .aggregate<{ date: string; count: number }>([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'UTC',
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            count: 1,
          },
        },
        { $sort: { date: 1 } },
      ])
      .exec();
  }

  async getJobCountsByStudentWithFilters(input: {
    studentId: string;
    statuses?: ApplicationStatus[];
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<
    Array<{
      jobId: string;
      count: number;
      latestAppliedAt: string;
    }>
  > {
    if (!input.studentId) return [];

    const filter = this.buildStudentFilter({
      studentId: input.studentId,
      statuses: input.statuses,
      fromDate: input.fromDate,
      toDate: input.toDate,
    });
    const limit = Math.max(1, Math.min(input.limit ?? 20, 100));

    const rows = await this.applicationModel
      .aggregate<{ _id: Types.ObjectId; count: number; latestAppliedAt: Date }>([
        { $match: filter },
        {
          $group: {
            _id: '$jobId',
            count: { $sum: 1 },
            latestAppliedAt: { $max: '$createdAt' },
          },
        },
        { $sort: { latestAppliedAt: -1, count: -1, _id: 1 } },
        { $limit: limit },
      ])
      .exec();

    return rows.map((row) => ({
      jobId: row._id.toString(),
      count: row.count ?? 0,
      latestAppliedAt:
        row.latestAppliedAt instanceof Date
          ? row.latestAppliedAt.toISOString()
          : new Date().toISOString(),
    }));
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
        select: 'name email photo role candidateProfile',
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
          select: 'name email photo role candidateProfile',
        })
        .populate({
          path: 'resumeId',
        })
        .exec(),
      this.applicationModel.countDocuments(filter).exec(),
    ]);

    return { applications, total };
  }

  async findDistinctStudentIdsByJobIds(jobIds: string[]): Promise<string[]> {
    if (!jobIds?.length) return [];
    const objectIds = jobIds
      .filter(Boolean)
      .map((id) => this.toObjectId(id));
    const results = await this.applicationModel
      .aggregate<{ _id: Types.ObjectId }>([
        { $match: { jobId: { $in: objectIds } } },
        { $group: { _id: '$studentId' } },
        { $match: { _id: { $ne: null } } },
      ])
      .exec();
    return results.map((r) => r._id.toString());
  }

  async countByStudentAndResumeId(input: {
    studentId: string;
    resumeId: string;
  }): Promise<number> {
    const { studentId, resumeId } = input;
    if (!studentId || !resumeId) return 0;

    return await this.applicationModel
      .countDocuments({
        studentId: this.toObjectId(studentId),
        resumeId: this.toObjectId(resumeId),
      })
      .exec();
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
      return this.emptyStatusCounts();
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

    return this.rowsToStatusCounts(result);
  }

  async getLeaderboardStatsByStudentIds(studentIds: string[]): Promise<
    Map<
      string,
      {
        applications: number;
        interviewScheduled: number;
        accepted: number;
        shortlisted: number;
        rejected: number;
      }
    >
  > {
    const map = new Map<
      string,
      {
        applications: number;
        interviewScheduled: number;
        accepted: number;
        shortlisted: number;
        rejected: number;
      }
    >();
    if (!studentIds.length) {
      return map;
    }

    const rows = await this.applicationModel
      .aggregate<{
        _id: Types.ObjectId;
        applications: number;
        interviewScheduled: number;
        accepted: number;
        shortlisted: number;
        rejected: number;
      }>([
        {
          $match: {
            studentId: {
              $in: studentIds.map((id) => this.toObjectId(id)),
            },
          },
        },
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
            shortlisted: {
              $sum: {
                $cond: [
                  { $eq: ['$status', ApplicationStatus.SHORTLISTED] },
                  1,
                  0,
                ],
              },
            },
            rejected: {
              $sum: {
                $cond: [{ $eq: ['$status', ApplicationStatus.REJECTED] }, 1, 0],
              },
            },
          },
        },
      ])
      .exec();

    rows.forEach((row) => {
      map.set(row._id.toString(), {
        applications: row.applications ?? 0,
        interviewScheduled: row.interviewScheduled ?? 0,
        accepted: row.accepted ?? 0,
        shortlisted: row.shortlisted ?? 0,
        rejected: row.rejected ?? 0,
      });
    });

    return map;
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

  private emptyStatusCounts() {
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

  private rowsToStatusCounts(
    rows: Array<{ _id: string; count: number }>,
  ): {
    applied: number;
    reviewing: number;
    shortlisted: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
    withdrawn: number;
  } {
    const statusMap = new Map(rows.map((row) => [row._id, row.count]));
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

  private buildStudentFilter(input: {
    studentId: string;
    statuses?: ApplicationStatus[];
    fromDate?: Date;
    toDate?: Date;
  }) {
    const filter: Record<string, unknown> = {
      studentId: this.toObjectId(input.studentId),
    };

    if (input.statuses?.length) {
      filter.status = { $in: input.statuses };
    }

    if (input.fromDate || input.toDate) {
      const createdAt: Record<string, Date> = {};
      if (input.fromDate) {
        createdAt.$gte = input.fromDate;
      }
      if (input.toDate) {
        createdAt.$lt = input.toDate;
      }
      filter.createdAt = createdAt;
    }

    return filter;
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

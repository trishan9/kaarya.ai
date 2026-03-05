import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  JobPostingSchemaClass,
  JobPostingSchemaDocument,
} from 'src/entities/job-posting.schema';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobVisibility } from 'src/types/job-visibility.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';

export type TJobPostingListOptions = {
  page: number;
  size: number;
  search?: string;
  status?: JobPostingStatus;
  visibility?: JobVisibility;
  companyId?: string;
  collegeId?: string;
  accessibleCollegeIds?: string[];
  location?: string;
  employmentType?: string;
  engagementType?: string;
  workMode?: JobWorkMode;
  remoteOnly?: boolean;
  jobIds?: string[];
  createdFrom?: Date;
  createdTo?: Date;
  sort?: Record<string, 1 | -1>;
  deadlineFrom?: Date;
  deadlineTo?: Date;
};

export abstract class ACJobPostingRepository {
  abstract create(
    payload: Partial<JobPostingSchemaClass>,
  ): Promise<JobPostingSchemaDocument>;
  abstract findById(id: string): Promise<JobPostingSchemaDocument | null>;
  abstract findAll(options: TJobPostingListOptions): Promise<{
    jobs: JobPostingSchemaDocument[];
    total: number;
  }>;
  abstract updateById(
    id: string,
    payload: Partial<JobPostingSchemaClass>,
  ): Promise<JobPostingSchemaDocument | null>;
  abstract deleteById(id: string): Promise<JobPostingSchemaDocument | null>;
  abstract deleteManyByCompanyId(companyId: string): Promise<number>;
  abstract deleteManyByCollegeId(collegeId: string): Promise<number>;
  abstract incrementViewsCount(
    id: string,
    incrementBy?: number,
  ): Promise<JobPostingSchemaDocument | null>;
  abstract setApplicationsCount(
    id: string,
    applicationsCount: number,
  ): Promise<JobPostingSchemaDocument | null>;
}

@Injectable()
export class JobPostingRepository implements ACJobPostingRepository {
  constructor(
    @InjectModel(JobPostingSchemaClass.name)
    private readonly jobPostingModel: Model<JobPostingSchemaClass>,
  ) {}

  async create(
    payload: Partial<JobPostingSchemaClass>,
  ): Promise<JobPostingSchemaDocument> {
    const job = new this.jobPostingModel(payload);
    return await job.save();
  }

  async findById(id: string): Promise<JobPostingSchemaDocument | null> {
    if (!id) return null;
    return await this.jobPostingModel.findById(id).exec();
  }

  async findAll(options: TJobPostingListOptions): Promise<{
    jobs: JobPostingSchemaDocument[];
    total: number;
  }> {
    const {
      page,
      size,
      search,
      status,
      visibility,
      companyId,
      collegeId,
      accessibleCollegeIds,
      location,
      employmentType,
      engagementType,
      workMode,
      remoteOnly,
      jobIds,
      createdFrom,
      createdTo,
      sort,
      deadlineFrom,
      deadlineTo,
    } = options;
    const skip = (page - 1) * size;

    const andClauses: Record<string, unknown>[] = [];
    if (search?.trim()) {
      andClauses.push({
        $or: [
          {
            title: {
              $regex: this.escapeRegex(search.trim()),
              $options: 'i',
            },
          },
          {
            description: {
              $regex: this.escapeRegex(search.trim()),
              $options: 'i',
            },
          },
        ],
      });
    }

    if (status) {
      andClauses.push({ status });
    }

    if (visibility) {
      andClauses.push({ visibility });
    }

    if (companyId) {
      andClauses.push({ companyId: this.toObjectId(companyId) });
    }

    if (collegeId) {
      andClauses.push({ collegeId: this.toObjectId(collegeId) });
    }

    if (accessibleCollegeIds) {
      const objectIds = accessibleCollegeIds.map((id) => this.toObjectId(id));
      andClauses.push({
        $or: [
          { visibility: JobVisibility.GLOBAL },
          {
            visibility: JobVisibility.COLLEGE_ONLY,
            collegeId: { $in: objectIds },
          },
        ],
      });
    }

    if (jobIds?.length) {
      andClauses.push({
        _id: {
          $in: jobIds.map((id) => this.toObjectId(id)),
        },
      });
    }

    if (location?.trim()) {
      andClauses.push({
        location: {
          $regex: this.escapeRegex(location.trim()),
          $options: 'i',
        },
      });
    }

    if (employmentType?.trim()) {
      andClauses.push({
        employmentType: {
          $regex: this.escapeRegex(employmentType.trim()),
          $options: 'i',
        },
      });
    }

    if (engagementType?.trim()) {
      andClauses.push({
        engagementType: {
          $regex: this.escapeRegex(engagementType.trim()),
          $options: 'i',
        },
      });
    }

    if (workMode) {
      andClauses.push({ workMode });
    }

    if (remoteOnly) {
      andClauses.push({ workMode: JobWorkMode.REMOTE });
    }

    if (createdFrom || createdTo) {
      const createdAtFilter: Record<string, Date> = {};
      if (createdFrom) {
        createdAtFilter.$gte = createdFrom;
      }
      if (createdTo) {
        createdAtFilter.$lt = createdTo;
      }
      andClauses.push({ createdAt: createdAtFilter });
    }

    if (deadlineFrom || deadlineTo) {
      const deadlineFilter: Record<string, Date> = {};
      if (deadlineFrom) {
        deadlineFilter.$gte = deadlineFrom;
      }
      if (deadlineTo) {
        deadlineFilter.$lte = deadlineTo;
      }
      andClauses.push({
        deadline: deadlineFilter,
      });
    }

    const filter =
      andClauses.length === 0
        ? {}
        : andClauses.length === 1
          ? andClauses[0]
          : { $and: andClauses };

    const [jobs, total] = await Promise.all([
      this.jobPostingModel
        .find(filter)
        .sort(sort ?? { createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.jobPostingModel.countDocuments(filter).exec(),
    ]);

    return { jobs, total };
  }

  async updateById(
    id: string,
    payload: Partial<JobPostingSchemaClass>,
  ): Promise<JobPostingSchemaDocument | null> {
    if (!id) return null;
    return await this.jobPostingModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<JobPostingSchemaDocument | null> {
    if (!id) return null;
    return await this.jobPostingModel.findByIdAndDelete(id).exec();
  }

  async deleteManyByCompanyId(companyId: string): Promise<number> {
    if (!companyId) return 0;
    const result = await this.jobPostingModel
      .deleteMany({ companyId: this.toObjectId(companyId) })
      .exec();
    return result.deletedCount ?? 0;
  }

  async deleteManyByCollegeId(collegeId: string): Promise<number> {
    if (!collegeId) return 0;
    const result = await this.jobPostingModel
      .deleteMany({ collegeId: this.toObjectId(collegeId) })
      .exec();
    return result.deletedCount ?? 0;
  }

  async incrementViewsCount(
    id: string,
    incrementBy = 1,
  ): Promise<JobPostingSchemaDocument | null> {
    if (!id) return null;
    return await this.jobPostingModel
      .findByIdAndUpdate(
        id,
        { $inc: { viewsCount: Math.max(0, incrementBy) } },
        { new: true },
      )
      .exec();
  }

  async setApplicationsCount(
    id: string,
    applicationsCount: number,
  ): Promise<JobPostingSchemaDocument | null> {
    if (!id) return null;
    return await this.jobPostingModel
      .findByIdAndUpdate(
        id,
        { applicationsCount: Math.max(0, Math.floor(applicationsCount)) },
        { new: true },
      )
      .exec();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

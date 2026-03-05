import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RecruiterProfileSchemaClass,
  RecruiterProfileSchemaDocument,
} from 'src/entities/recruiter-profile.schema';

export abstract class ACRecruiterProfileRepository {
  abstract create(
    payload: Partial<RecruiterProfileSchemaClass>,
  ): Promise<RecruiterProfileSchemaDocument>;
  abstract findFirstByRecruiterId(
    recruiterId: string,
  ): Promise<RecruiterProfileSchemaDocument | null>;
  abstract findByRecruiterAndCompany(input: {
    recruiterId: string;
    companyId: string;
  }): Promise<RecruiterProfileSchemaDocument | null>;
  abstract upsertByRecruiterAndCompany(
    recruiterId: string,
    companyId: string,
    payload: Partial<RecruiterProfileSchemaClass>,
  ): Promise<RecruiterProfileSchemaDocument>;
  abstract existsByRecruiterAndCompany(input: {
    recruiterId: string;
    companyId: string;
  }): Promise<boolean>;
  abstract findAllByRecruiterId(options: {
    recruiterId: string;
    page: number;
    size: number;
  }): Promise<{
    recruiterProfiles: RecruiterProfileSchemaDocument[];
    total: number;
  }>;
  abstract findCompanyIdsByRecruiterId(recruiterId: string): Promise<string[]>;
  abstract deleteByRecruiterAndCompany(input: {
    recruiterId: string;
    companyId: string;
  }): Promise<RecruiterProfileSchemaDocument | null>;
  abstract deleteManyByCompanyId(companyId: string): Promise<number>;
  abstract findAllByCompanyId(options: {
    companyId: string;
    page: number;
    size: number;
  }): Promise<{
    recruiterProfiles: RecruiterProfileSchemaDocument[];
    total: number;
  }>;
}

@Injectable()
export class RecruiterProfileRepository implements ACRecruiterProfileRepository {
  constructor(
    @InjectModel(RecruiterProfileSchemaClass.name)
    private readonly recruiterProfileModel: Model<RecruiterProfileSchemaClass>,
  ) {}

  async create(
    payload: Partial<RecruiterProfileSchemaClass>,
  ): Promise<RecruiterProfileSchemaDocument> {
    const profile = new this.recruiterProfileModel(payload);
    return await profile.save();
  }

  async findFirstByRecruiterId(
    recruiterId: string,
  ): Promise<RecruiterProfileSchemaDocument | null> {
    if (!recruiterId) return null;
    return await this.recruiterProfileModel
      .findOne({ recruiterId: this.toObjectId(recruiterId) })
      .sort({ createdAt: -1, _id: -1 })
      .exec();
  }

  async findByRecruiterAndCompany(input: {
    recruiterId: string;
    companyId: string;
  }): Promise<RecruiterProfileSchemaDocument | null> {
    const { recruiterId, companyId } = input;
    if (!recruiterId || !companyId) return null;

    return await this.recruiterProfileModel
      .findOne({
        recruiterId: this.toObjectId(recruiterId),
        companyId: this.toObjectId(companyId),
      })
      .exec();
  }

  async upsertByRecruiterAndCompany(
    recruiterId: string,
    companyId: string,
    payload: Partial<RecruiterProfileSchemaClass>,
  ): Promise<RecruiterProfileSchemaDocument> {
    const result = await this.recruiterProfileModel
      .findOneAndUpdate(
        {
          recruiterId: this.toObjectId(recruiterId),
          companyId: this.toObjectId(companyId),
        },
        payload,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    if (!result) {
      throw new Error('Recruiter membership upsert failed.');
    }

    return result;
  }

  async existsByRecruiterAndCompany(input: {
    recruiterId: string;
    companyId: string;
  }): Promise<boolean> {
    const { recruiterId, companyId } = input;
    if (!recruiterId || !companyId) return false;

    const count = await this.recruiterProfileModel
      .countDocuments({
        recruiterId: this.toObjectId(recruiterId),
        companyId: this.toObjectId(companyId),
      })
      .exec();

    return count > 0;
  }

  async findAllByRecruiterId(options: {
    recruiterId: string;
    page: number;
    size: number;
  }): Promise<{
    recruiterProfiles: RecruiterProfileSchemaDocument[];
    total: number;
  }> {
    const { recruiterId, page, size } = options;
    if (!recruiterId) {
      return { recruiterProfiles: [], total: 0 };
    }

    const skip = (page - 1) * size;
    const filter = { recruiterId: this.toObjectId(recruiterId) };

    const [recruiterProfiles, total] = await Promise.all([
      this.recruiterProfileModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .populate({
          path: 'companyId',
          select: 'name logo industry location verifiedStatus inviteCode',
        })
        .exec(),
      this.recruiterProfileModel.countDocuments(filter).exec(),
    ]);

    return { recruiterProfiles, total };
  }

  async findCompanyIdsByRecruiterId(recruiterId: string): Promise<string[]> {
    if (!recruiterId) return [];
    const rows = await this.recruiterProfileModel
      .find({ recruiterId: this.toObjectId(recruiterId) })
      .select('companyId')
      .lean()
      .exec();
    return rows
      .map((r) => (r.companyId as Types.ObjectId)?.toString?.())
      .filter((id): id is string => Boolean(id));
  }

  async deleteByRecruiterAndCompany(input: {
    recruiterId: string;
    companyId: string;
  }): Promise<RecruiterProfileSchemaDocument | null> {
    const { recruiterId, companyId } = input;
    if (!recruiterId || !companyId) return null;

    return await this.recruiterProfileModel
      .findOneAndDelete({
        recruiterId: this.toObjectId(recruiterId),
        companyId: this.toObjectId(companyId),
      })
      .exec();
  }

  async deleteManyByCompanyId(companyId: string): Promise<number> {
    if (!companyId) return 0;
    const result = await this.recruiterProfileModel
      .deleteMany({ companyId: this.toObjectId(companyId) })
      .exec();
    return result.deletedCount ?? 0;
  }

  async findAllByCompanyId(options: {
    companyId: string;
    page: number;
    size: number;
  }): Promise<{
    recruiterProfiles: RecruiterProfileSchemaDocument[];
    total: number;
  }> {
    const { companyId, page, size } = options;
    if (!companyId) {
      return { recruiterProfiles: [], total: 0 };
    }

    const skip = (page - 1) * size;
    const filter = { companyId: this.toObjectId(companyId) };

    const [recruiterProfiles, total] = await Promise.all([
      this.recruiterProfileModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .populate({
          path: 'recruiterId',
          select: 'name email photo role',
        })
        .exec(),
      this.recruiterProfileModel.countDocuments(filter).exec(),
    ]);

    return { recruiterProfiles, total };
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

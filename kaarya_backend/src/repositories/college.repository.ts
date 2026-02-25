import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CollegeSchemaClass,
  CollegeSchemaDocument,
} from 'src/entities/college.schema';

type TCollegeListOptions = {
  page: number;
  size: number;
  search?: string;
};

export abstract class ACCollegeRepository {
  abstract create(
    payload: Partial<CollegeSchemaClass>,
  ): Promise<CollegeSchemaDocument>;
  abstract findById(id: string): Promise<CollegeSchemaDocument | null>;
  abstract findByInviteCode(
    inviteCode: string,
  ): Promise<CollegeSchemaDocument | null>;
  abstract findByIds(ids: string[]): Promise<CollegeSchemaDocument[]>;
  abstract findFirstByCreatedBy(
    createdBy: string,
  ): Promise<CollegeSchemaDocument | null>;
  abstract findByCreatedBy(createdBy: string): Promise<CollegeSchemaDocument[]>;
  abstract updateById(
    id: string,
    payload: Partial<CollegeSchemaClass>,
  ): Promise<CollegeSchemaDocument | null>;
  abstract deleteById(id: string): Promise<CollegeSchemaDocument | null>;
  abstract findAll(options: TCollegeListOptions): Promise<{
    colleges: CollegeSchemaDocument[];
    total: number;
  }>;
}

@Injectable()
export class CollegeRepository implements ACCollegeRepository {
  constructor(
    @InjectModel(CollegeSchemaClass.name)
    private readonly collegeModel: Model<CollegeSchemaClass>,
  ) {}

  async create(
    payload: Partial<CollegeSchemaClass>,
  ): Promise<CollegeSchemaDocument> {
    const college = new this.collegeModel(payload);
    return await college.save();
  }

  async findById(id: string): Promise<CollegeSchemaDocument | null> {
    if (!id) return null;
    return await this.collegeModel.findById(id).exec();
  }

  async findByInviteCode(
    inviteCode: string,
  ): Promise<CollegeSchemaDocument | null> {
    if (!inviteCode) return null;
    return await this.collegeModel
      .findOne({ inviteCode: inviteCode.trim().toUpperCase() })
      .exec();
  }

  async findByIds(ids: string[]): Promise<CollegeSchemaDocument[]> {
    if (!ids.length) return [];
    const uniqueIds = Array.from(new Set(ids)).map((value) =>
      this.toObjectId(value),
    );

    return await this.collegeModel.find({ _id: { $in: uniqueIds } }).exec();
  }

  async findFirstByCreatedBy(
    createdBy: string,
  ): Promise<CollegeSchemaDocument | null> {
    if (!createdBy) return null;
    return await this.collegeModel
      .findOne({
        createdBy: this.toObjectId(createdBy),
      })
      .sort({ createdAt: -1, _id: -1 })
      .exec();
  }

  async findByCreatedBy(createdBy: string): Promise<CollegeSchemaDocument[]> {
    if (!createdBy) return [];
    return await this.collegeModel
      .find({
        createdBy: this.toObjectId(createdBy),
      })
      .sort({ createdAt: -1, _id: -1 })
      .exec();
  }

  async updateById(
    id: string,
    payload: Partial<CollegeSchemaClass>,
  ): Promise<CollegeSchemaDocument | null> {
    if (!id) return null;
    return await this.collegeModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<CollegeSchemaDocument | null> {
    if (!id) return null;
    return await this.collegeModel.findByIdAndDelete(id).exec();
  }

  async findAll(options: TCollegeListOptions): Promise<{
    colleges: CollegeSchemaDocument[];
    total: number;
  }> {
    const { page, size, search } = options;
    const skip = (page - 1) * size;

    const filter =
      search && search.trim()
        ? {
            name: {
              $regex: this.escapeRegex(search.trim()),
              $options: 'i',
            },
          }
        : {};

    const [colleges, total] = await Promise.all([
      this.collegeModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.collegeModel.countDocuments(filter).exec(),
    ]);

    return { colleges, total };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

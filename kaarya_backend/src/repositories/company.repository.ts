import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CompanySchemaClass,
  CompanySchemaDocument,
} from 'src/entities/company.schema';

type TCompanyListOptions = {
  page: number;
  size: number;
  search?: string;
};

export abstract class ACCompanyRepository {
  abstract create(
    payload: Partial<CompanySchemaClass>,
  ): Promise<CompanySchemaDocument>;
  abstract findById(id: string): Promise<CompanySchemaDocument | null>;
  abstract findByInviteCode(
    inviteCode: string,
  ): Promise<CompanySchemaDocument | null>;
  abstract findByIds(ids: string[]): Promise<CompanySchemaDocument[]>;
  abstract updateById(
    id: string,
    payload: Partial<CompanySchemaClass>,
  ): Promise<CompanySchemaDocument | null>;
  abstract deleteById(id: string): Promise<CompanySchemaDocument | null>;
  abstract findAll(options: TCompanyListOptions): Promise<{
    companies: CompanySchemaDocument[];
    total: number;
  }>;
}

@Injectable()
export class CompanyRepository implements ACCompanyRepository {
  constructor(
    @InjectModel(CompanySchemaClass.name)
    private readonly companyModel: Model<CompanySchemaClass>,
  ) {}

  async create(
    payload: Partial<CompanySchemaClass>,
  ): Promise<CompanySchemaDocument> {
    const company = new this.companyModel(payload);
    return await company.save();
  }

  async findById(id: string): Promise<CompanySchemaDocument | null> {
    if (!id) return null;
    return await this.companyModel.findById(id).exec();
  }

  async findByInviteCode(
    inviteCode: string,
  ): Promise<CompanySchemaDocument | null> {
    if (!inviteCode) return null;
    return await this.companyModel
      .findOne({ inviteCode: inviteCode.trim().toUpperCase() })
      .exec();
  }

  async findByIds(ids: string[]): Promise<CompanySchemaDocument[]> {
    if (!ids.length) return [];
    const uniqueIds = Array.from(new Set(ids)).map((value) =>
      this.toObjectId(value),
    );

    return await this.companyModel.find({ _id: { $in: uniqueIds } }).exec();
  }

  async updateById(
    id: string,
    payload: Partial<CompanySchemaClass>,
  ): Promise<CompanySchemaDocument | null> {
    if (!id) return null;
    return await this.companyModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<CompanySchemaDocument | null> {
    if (!id) return null;
    return await this.companyModel.findByIdAndDelete(id).exec();
  }

  async findAll(options: TCompanyListOptions): Promise<{
    companies: CompanySchemaDocument[];
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

    const [companies, total] = await Promise.all([
      this.companyModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.companyModel.countDocuments(filter).exec(),
    ]);

    return { companies, total };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

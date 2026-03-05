import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ResourceCourseSchemaClass,
  ResourceCourseSchemaDocument,
} from 'src/entities/resource-course.schema';

export type TResourceCourseListOptions = {
  page: number;
  size: number;
  filter?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
};

export abstract class ACResourceCourseRepository {
  abstract create(
    payload: Partial<ResourceCourseSchemaClass>,
  ): Promise<ResourceCourseSchemaDocument>;
  abstract findById(id: string): Promise<ResourceCourseSchemaDocument | null>;
  abstract findAll(options: TResourceCourseListOptions): Promise<{
    courses: ResourceCourseSchemaDocument[];
    total: number;
  }>;
  abstract updateById(
    id: string,
    payload: Partial<ResourceCourseSchemaClass>,
  ): Promise<ResourceCourseSchemaDocument | null>;
  abstract deleteById(id: string): Promise<ResourceCourseSchemaDocument | null>;
}

@Injectable()
export class ResourceCourseRepository implements ACResourceCourseRepository {
  constructor(
    @InjectModel(ResourceCourseSchemaClass.name)
    private readonly resourceCourseModel: Model<ResourceCourseSchemaClass>,
  ) {}

  async create(
    payload: Partial<ResourceCourseSchemaClass>,
  ): Promise<ResourceCourseSchemaDocument> {
    const course = new this.resourceCourseModel(payload);
    return await course.save();
  }

  async findById(id: string): Promise<ResourceCourseSchemaDocument | null> {
    if (!id) return null;
    return await this.resourceCourseModel.findById(id).exec();
  }

  async findAll(options: TResourceCourseListOptions): Promise<{
    courses: ResourceCourseSchemaDocument[];
    total: number;
  }> {
    const skip = (options.page - 1) * options.size;
    const filter = options.filter ?? {};
    const sort = options.sort ?? { createdAt: -1, _id: -1 };

    const [courses, total] = await Promise.all([
      this.resourceCourseModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(options.size)
        .exec(),
      this.resourceCourseModel.countDocuments(filter).exec(),
    ]);

    return { courses, total };
  }

  async updateById(
    id: string,
    payload: Partial<ResourceCourseSchemaClass>,
  ): Promise<ResourceCourseSchemaDocument | null> {
    if (!id) return null;
    return await this.resourceCourseModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<ResourceCourseSchemaDocument | null> {
    if (!id) return null;
    return await this.resourceCourseModel.findByIdAndDelete(id).exec();
  }
}

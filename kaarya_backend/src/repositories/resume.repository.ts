import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ResumeSchemaClass,
  ResumeSchemaDocument,
} from 'src/entities/resume.schema';

export abstract class ACResumeRepository {
  abstract create(
    payload: Partial<ResumeSchemaClass>,
  ): Promise<ResumeSchemaDocument>;

  abstract findById(id: string): Promise<ResumeSchemaDocument | null>;
  abstract findByIdAndStudentId(
    id: string,
    studentId: string,
  ): Promise<ResumeSchemaDocument | null>;
  abstract findAllByStudentId(options: {
    studentId: string;
    page: number;
    size: number;
  }): Promise<{
    resumes: ResumeSchemaDocument[];
    total: number;
  }>;
  abstract deleteByIdAndStudentId(
    id: string,
    studentId: string,
  ): Promise<boolean>;
}

@Injectable()
export class ResumeRepository implements ACResumeRepository {
  constructor(
    @InjectModel(ResumeSchemaClass.name)
    private readonly resumeModel: Model<ResumeSchemaClass>,
  ) {}

  async create(
    payload: Partial<ResumeSchemaClass>,
  ): Promise<ResumeSchemaDocument> {
    const resume = new this.resumeModel(payload);
    return await resume.save();
  }

  async findById(id: string): Promise<ResumeSchemaDocument | null> {
    if (!id) return null;
    return await this.resumeModel.findById(id).exec();
  }

  async findByIdAndStudentId(
    id: string,
    studentId: string,
  ): Promise<ResumeSchemaDocument | null> {
    if (!id || !studentId) return null;

    return await this.resumeModel
      .findOne({
        _id: new Types.ObjectId(id),
        studentId: new Types.ObjectId(studentId),
      })
      .exec();
  }

  async findAllByStudentId(options: {
    studentId: string;
    page: number;
    size: number;
  }): Promise<{
    resumes: ResumeSchemaDocument[];
    total: number;
  }> {
    const { studentId, page, size } = options;
    if (!studentId) {
      return { resumes: [], total: 0 };
    }

    const skip = (page - 1) * size;
    const filter = {
      studentId: new Types.ObjectId(studentId),
    };

    const [resumes, total] = await Promise.all([
      this.resumeModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.resumeModel.countDocuments(filter).exec(),
    ]);

    return { resumes, total };
  }

  async deleteByIdAndStudentId(
    id: string,
    studentId: string,
  ): Promise<boolean> {
    if (!id || !studentId) return false;

    const deleted = await this.resumeModel
      .findOneAndDelete({
        _id: new Types.ObjectId(id),
        studentId: new Types.ObjectId(studentId),
      })
      .exec();

    return Boolean(deleted);
  }
}

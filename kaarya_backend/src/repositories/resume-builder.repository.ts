import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ResumeBuilderSchemaClass,
  ResumeBuilderSchemaDocument,
} from 'src/entities/resume-builder.schema';

export abstract class ACResumeBuilderRepository {
  abstract create(payload: {
    studentId: Types.ObjectId;
    title?: string;
    targetRole?: string | null;
    templateId?: string;
    content?: object;
  }): Promise<ResumeBuilderSchemaDocument>;

  abstract findById(id: string): Promise<ResumeBuilderSchemaDocument | null>;
  abstract findByIdAndStudentId(
    id: string,
    studentId: string,
  ): Promise<ResumeBuilderSchemaDocument | null>;
  abstract findAllByStudentId(options: {
    studentId: string;
    page: number;
    size: number;
  }): Promise<{
    items: ResumeBuilderSchemaDocument[];
    total: number;
  }>;
  abstract update(
    studentId: string,
    id: string,
    payload: Partial<{
      title: string;
      targetRole: string | null;
      templateId: string;
      content: object;
      generatedResumeId: Types.ObjectId | null;
    }>,
  ): Promise<ResumeBuilderSchemaDocument | null>;

  abstract delete(
    studentId: string,
    id: string,
  ): Promise<boolean>;
}

@Injectable()
export class ResumeBuilderRepository implements ACResumeBuilderRepository {
  constructor(
    @InjectModel(ResumeBuilderSchemaClass.name)
    private readonly model: Model<ResumeBuilderSchemaClass>,
  ) {}

  async create(payload: {
    studentId: Types.ObjectId;
    title?: string;
    targetRole?: string | null;
    templateId?: string;
    content?: object;
  }): Promise<ResumeBuilderSchemaDocument> {
    const doc = new this.model({
      studentId: payload.studentId,
      title: payload.title ?? 'Untitled Resume',
      targetRole: payload.targetRole ?? null,
      templateId: payload.templateId ?? 'professional',
      content: payload.content ?? {},
    });
    return doc.save();
  }

  async findById(id: string): Promise<ResumeBuilderSchemaDocument | null> {
    if (!id) return null;
    return this.model.findById(id).exec();
  }

  async findByIdAndStudentId(
    id: string,
    studentId: string,
  ): Promise<ResumeBuilderSchemaDocument | null> {
    if (!id || !studentId) return null;
    return this.model
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
    items: ResumeBuilderSchemaDocument[];
    total: number;
  }> {
    const { studentId, page, size } = options;
    if (!studentId) return { items: [], total: 0 };
    const skip = (page - 1) * size;
    const filter = { studentId: new Types.ObjectId(studentId) };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(size).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async update(
    studentId: string,
    id: string,
    payload: Partial<{
      title: string;
      targetRole: string | null;
      templateId: string;
      content: object;
      generatedResumeId: Types.ObjectId | null;
    }>,
  ): Promise<ResumeBuilderSchemaDocument | null> {
    if (!id || !studentId) return null;
    return this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), studentId: new Types.ObjectId(studentId) },
        { $set: { ...payload, updatedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async delete(studentId: string, id: string): Promise<boolean> {
    if (!id || !studentId) return false;
    const result = await this.model
      .deleteOne({
        _id: new Types.ObjectId(id),
        studentId: new Types.ObjectId(studentId),
      })
      .exec();
    return result.deletedCount === 1;
  }
}

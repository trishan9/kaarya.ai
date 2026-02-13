import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StudentSchemaClass,
  StudentSchemaDocument,
} from 'src/entities/student.schema';

export abstract class ACStudentRepository {
  abstract create(
    payload: Partial<StudentSchemaClass>,
  ): Promise<StudentSchemaDocument>;
  abstract findByStudentAndCollege(input: {
    studentId: string;
    collegeId: string;
  }): Promise<StudentSchemaDocument | null>;
  abstract upsertByStudentAndCollege(
    studentId: string,
    collegeId: string,
    payload: Partial<StudentSchemaClass>,
  ): Promise<StudentSchemaDocument>;
  abstract findAllByStudentId(options: {
    studentId: string;
    page: number;
    size: number;
  }): Promise<{
    students: StudentSchemaDocument[];
    total: number;
  }>;
  abstract findAllByCollegeId(options: {
    collegeId: string;
    page: number;
    size: number;
  }): Promise<{
    students: StudentSchemaDocument[];
    total: number;
  }>;
  abstract findStudentIdsByCollegeId(collegeId: string): Promise<string[]>;
  abstract findCollegeIdsByStudentId(studentId: string): Promise<string[]>;
  abstract deleteByStudentAndCollege(input: {
    studentId: string;
    collegeId: string;
  }): Promise<StudentSchemaDocument | null>;
  abstract deleteManyByCollegeId(collegeId: string): Promise<number>;
}

@Injectable()
export class StudentRepository implements ACStudentRepository {
  constructor(
    @InjectModel(StudentSchemaClass.name)
    private readonly studentModel: Model<StudentSchemaClass>,
  ) {}

  async create(
    payload: Partial<StudentSchemaClass>,
  ): Promise<StudentSchemaDocument> {
    const student = new this.studentModel(payload);
    return await student.save();
  }

  async findByStudentAndCollege(input: {
    studentId: string;
    collegeId: string;
  }): Promise<StudentSchemaDocument | null> {
    const { studentId, collegeId } = input;
    if (!studentId || !collegeId) return null;

    return await this.studentModel
      .findOne({
        studentId: this.toObjectId(studentId),
        collegeId: this.toObjectId(collegeId),
      })
      .exec();
  }

  async upsertByStudentAndCollege(
    studentId: string,
    collegeId: string,
    payload: Partial<StudentSchemaClass>,
  ): Promise<StudentSchemaDocument> {
    const result = await this.studentModel
      .findOneAndUpdate(
        {
          studentId: this.toObjectId(studentId),
          collegeId: this.toObjectId(collegeId),
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
      throw new Error('Student membership upsert failed.');
    }

    return result;
  }

  async findAllByStudentId(options: {
    studentId: string;
    page: number;
    size: number;
  }): Promise<{
    students: StudentSchemaDocument[];
    total: number;
  }> {
    const { studentId, page, size } = options;
    if (!studentId) {
      return { students: [], total: 0 };
    }

    const skip = (page - 1) * size;
    const filter = { studentId: this.toObjectId(studentId) };

    const [students, total] = await Promise.all([
      this.studentModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .populate({
          path: 'collegeId',
          select: 'name logo institutionType location inviteCode',
        })
        .exec(),
      this.studentModel.countDocuments(filter).exec(),
    ]);

    return { students, total };
  }

  async findAllByCollegeId(options: {
    collegeId: string;
    page: number;
    size: number;
  }): Promise<{
    students: StudentSchemaDocument[];
    total: number;
  }> {
    const { collegeId, page, size } = options;
    if (!collegeId) {
      return { students: [], total: 0 };
    }

    const skip = (page - 1) * size;
    const filter = { collegeId: this.toObjectId(collegeId) };

    const [students, total] = await Promise.all([
      this.studentModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .populate({
          path: 'studentId',
          select: 'name email photo role',
        })
        .exec(),
      this.studentModel.countDocuments(filter).exec(),
    ]);

    return { students, total };
  }

  async findStudentIdsByCollegeId(collegeId: string): Promise<string[]> {
    if (!collegeId) return [];

    const rows = await this.studentModel
      .find({
        collegeId: this.toObjectId(collegeId),
      })
      .select('studentId')
      .lean()
      .exec();

    return rows.map((row) => row.studentId.toString());
  }

  async findCollegeIdsByStudentId(studentId: string): Promise<string[]> {
    if (!studentId) return [];

    const rows = await this.studentModel
      .find({
        studentId: this.toObjectId(studentId),
      })
      .select('collegeId')
      .lean()
      .exec();

    return rows.map((row) => row.collegeId.toString());
  }

  async deleteByStudentAndCollege(input: {
    studentId: string;
    collegeId: string;
  }): Promise<StudentSchemaDocument | null> {
    const { studentId, collegeId } = input;
    if (!studentId || !collegeId) return null;

    return await this.studentModel
      .findOneAndDelete({
        studentId: this.toObjectId(studentId),
        collegeId: this.toObjectId(collegeId),
      })
      .exec();
  }

  async deleteManyByCollegeId(collegeId: string): Promise<number> {
    if (!collegeId) return 0;
    const result = await this.studentModel
      .deleteMany({ collegeId: this.toObjectId(collegeId) })
      .exec();
    return result.deletedCount ?? 0;
  }

  private toObjectId(value: string) {
    return new Types.ObjectId(value);
  }
}

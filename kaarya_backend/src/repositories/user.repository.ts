import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSchemaClass, UserSchemaDocument } from 'src/entities/user.schema';
import { TUser } from 'src/types/user.type';

export abstract class ACUserRepository {
  abstract create(payload: Partial<TUser>): Promise<UserSchemaDocument>;
  abstract findAll(options: {
    page: number;
    size: number;
    search?: string;
  }): Promise<{ users: UserSchemaDocument[]; total: number }>;
  abstract getAnalytics(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    newThisWeek: number;
    signupTrend: Array<{ year: number; month: number; value: number }>;
  }>;
  abstract findById(id: string): Promise<UserSchemaDocument | null>;
  abstract findByEmail(
    email: string,
    options?: { includePassword?: boolean },
  ): Promise<UserSchemaDocument | null>;
  abstract updateById(
    id: string,
    payload: Partial<TUser>,
  ): Promise<UserSchemaDocument | null>;
  abstract deleteById(id: string): Promise<UserSchemaDocument | null>;
}

@Injectable()
export class UserRepository implements ACUserRepository {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly userModel: Model<UserSchemaClass>,
  ) {}

  async create(payload: Partial<TUser>): Promise<UserSchemaDocument> {
    const user = new this.userModel(payload);
    return await user.save();
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async findAll(options: {
    page: number;
    size: number;
    search?: string;
  }): Promise<{ users: UserSchemaDocument[]; total: number }> {
    const { page, size, search } = options;
    const skip = (page - 1) * size;

    const filter =
      search && search.trim().length > 0
        ? {
            $or: [
              {
                name: {
                  $regex: this.escapeRegex(search.trim()),
                  $options: 'i',
                },
              },
              {
                email: {
                  $regex: this.escapeRegex(search.trim()),
                  $options: 'i',
                },
              },
            ],
          }
        : {};

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { users, total };
  }

  async getAnalytics(): Promise<{
    totalUsers: number;
    totalAdmins: number;
    newThisWeek: number;
    signupTrend: Array<{ year: number; month: number; value: number }>;
  }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWindow = new Date(
      startOfThisMonth.getFullYear(),
      startOfThisMonth.getMonth() - 5,
      1,
    );

    const [totalUsers, totalAdmins, newThisWeek, trend] = await Promise.all([
      this.userModel.countDocuments({}).exec(),
      this.userModel.countDocuments({ role: 'admin' }).exec(),
      this.userModel
        .countDocuments({ createdAt: { $gte: sevenDaysAgo } })
        .exec(),
      this.userModel
        .aggregate<{ _id: { year: number; month: number }; value: number }>([
          { $match: { createdAt: { $gte: startOfWindow } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              value: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ])
        .exec(),
    ]);

    const signupTrend = trend.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      value: item.value,
    }));

    return { totalUsers, totalAdmins, newThisWeek, signupTrend };
  }

  async findById(id: string): Promise<UserSchemaDocument | null> {
    if (!id) return null;
    return await this.userModel.findById(id).exec();
  }

  async findByEmail(
    email: string,
    options?: { includePassword?: boolean },
  ): Promise<UserSchemaDocument | null> {
    if (!email) return null;
    const query = this.userModel.findOne({ email });
    if (options?.includePassword) {
      query.select('+password');
    }
    return await query.exec();
  }

  async updateById(
    id: string,
    payload: Partial<TUser>,
  ): Promise<UserSchemaDocument | null> {
    if (!id) return null;
    return await this.userModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<UserSchemaDocument | null> {
    if (!id) return null;
    return await this.userModel.findByIdAndDelete(id).exec();
  }
}

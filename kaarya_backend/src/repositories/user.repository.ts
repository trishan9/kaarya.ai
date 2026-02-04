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

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSchemaClass, UserSchemaDocument } from 'src/entities/user.schema';
import { TUser } from 'src/types/user.type';

export abstract class ACUserRepository {
  abstract create(payload: Partial<TUser>): Promise<UserSchemaDocument>;
  abstract findAll(): Promise<UserSchemaDocument[]>;
  abstract findById(id: string): Promise<UserSchemaDocument | null>;
  abstract findByEmail(
    email: string,
    options?: { includePassword?: boolean },
  ): Promise<UserSchemaDocument | null>;
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

  async findAll(): Promise<UserSchemaDocument[]> {
    return await this.userModel.find().exec();
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
}

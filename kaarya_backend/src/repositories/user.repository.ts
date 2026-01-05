import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSchemaClass, UserSchemaDocument } from 'src/entities/user.schema';
import { TUser } from 'src/types/user.type';

export interface IUserRepository {
  create(payload: Partial<TUser>): Promise<UserSchemaDocument>;
  findAll(): Promise<UserSchemaDocument[]>;
  findById(id: string): Promise<UserSchemaDocument | null>;
  findByEmail(email: string): Promise<UserSchemaDocument | null>;
}

@Injectable()
export class UserRepository implements IUserRepository {
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

  async findByEmail(email: string): Promise<UserSchemaDocument | null> {
    if (!email) return null;
    return await this.userModel.findOne({ email });
  }
}

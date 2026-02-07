import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AuthIdentitySchema,
  AuthIdentitySchemaDocument,
} from 'src/entities/auth-identity.schema';
import { AuthProvider } from 'src/types/auth-provider.enum';

export abstract class ACAuthIdentityRepository {
  abstract create(
    payload: Partial<AuthIdentitySchema>,
  ): Promise<AuthIdentitySchemaDocument>;
  abstract findByProviderIdentity(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<AuthIdentitySchemaDocument | null>;
  abstract findByUserAndProvider(
    userId: string,
    provider: AuthProvider,
  ): Promise<AuthIdentitySchemaDocument | null>;
  abstract findByUserId(userId: string): Promise<AuthIdentitySchemaDocument[]>;
  abstract updateById(
    id: string,
    payload: Partial<AuthIdentitySchema>,
  ): Promise<AuthIdentitySchemaDocument | null>;
  abstract deleteById(id: string): Promise<AuthIdentitySchemaDocument | null>;
}

@Injectable()
export class AuthIdentityRepository implements ACAuthIdentityRepository {
  constructor(
    @InjectModel(AuthIdentitySchema.name)
    private readonly authIdentityModel: Model<AuthIdentitySchema>,
  ) {}

  async create(
    payload: Partial<AuthIdentitySchema>,
  ): Promise<AuthIdentitySchemaDocument> {
    const identity = new this.authIdentityModel(payload);
    return await identity.save();
  }

  async findByProviderIdentity(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<AuthIdentitySchemaDocument | null> {
    if (!provider || !providerUserId) return null;
    return await this.authIdentityModel
      .findOne({ provider, providerUserId })
      .exec();
  }

  async findByUserAndProvider(
    userId: string,
    provider: AuthProvider,
  ): Promise<AuthIdentitySchemaDocument | null> {
    if (!userId || !provider) return null;
    return await this.authIdentityModel
      .findOne({ userId: this.toObjectId(userId), provider })
      .exec();
  }

  async findByUserId(userId: string): Promise<AuthIdentitySchemaDocument[]> {
    if (!userId) return [];
    return await this.authIdentityModel
      .find({ userId: this.toObjectId(userId) })
      .sort({ createdAt: 1, _id: 1 })
      .exec();
  }

  async updateById(
    id: string,
    payload: Partial<AuthIdentitySchema>,
  ): Promise<AuthIdentitySchemaDocument | null> {
    if (!id) return null;
    return await this.authIdentityModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<AuthIdentitySchemaDocument | null> {
    if (!id) return null;
    return await this.authIdentityModel.findByIdAndDelete(id).exec();
  }

  private toObjectId(value: string): Types.ObjectId {
    return new Types.ObjectId(value);
  }
}

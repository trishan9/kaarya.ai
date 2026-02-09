import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, now } from 'mongoose';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { UserSchemaClass } from './user.schema';

export type AuthIdentitySchemaDocument = HydratedDocument<AuthIdentitySchema>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class AuthIdentitySchema {
  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(AuthProvider),
    required: true,
  })
  provider: AuthProvider;

  @Prop({
    type: String,
    required: true,
  })
  providerUserId: string;

  @Prop({
    type: String,
    lowercase: true,
    default: null,
  })
  email?: string | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  emailVerified: boolean;

  @Prop({
    type: String,
    default: null,
  })
  name?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  photo?: string | null;

  @Prop({
    type: Date,
    default: now,
  })
  lastLoginAt: Date;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const AuthIdentitySchemaModel =
  SchemaFactory.createForClass(AuthIdentitySchema);

AuthIdentitySchemaModel.index(
  { provider: 1, providerUserId: 1 },
  { unique: true },
);
AuthIdentitySchemaModel.index({ userId: 1, provider: 1 }, { unique: true });
AuthIdentitySchemaModel.index({ email: 1, emailVerified: 1 });

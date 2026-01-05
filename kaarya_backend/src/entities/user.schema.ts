import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now } from 'mongoose';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { UserRole } from 'src/types/user-role.enum';

export type UserSchemaDocument = HydratedDocument<UserSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class UserSchemaClass {
  @Prop({
    type: String,
    unique: true,
    lowercase: true,
  })
  email: string | null;

  @Prop({ select: false })
  password?: string;

  @Prop({
    type: String,
    enum: Object.values(AuthProvider),
    default: AuthProvider.EMAIL,
  })
  provider: AuthProvider;

  @Prop({
    type: String,
  })
  socialId?: string | null;

  @Prop({
    type: String,
  })
  name: string | null;

  @Prop({
    type: String,
  })
  photo?: string | null;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserSchemaClass);

UserSchema.index({ 'role._id': 1 });

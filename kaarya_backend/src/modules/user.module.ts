import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUserController } from 'src/controllers/admin/admin.user.controller';
import {
  AuthIdentitySchema,
  AuthIdentitySchemaModel,
} from 'src/entities/auth-identity.schema';
import { UserSchemaClass, UserSchema } from 'src/entities/user.schema';
import {
  ACAuthIdentityRepository,
  AuthIdentityRepository,
} from 'src/repositories/auth-identity.repository';
import {
  ACUserRepository,
  UserRepository,
} from 'src/repositories/user.repository';
import { AdminUserService } from 'src/services/admin/admin.user.service';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
      { name: AuthIdentitySchema.name, schema: AuthIdentitySchemaModel },
    ]),
  ],
  controllers: [AdminUserController],
  providers: [
    UserService,
    AdminUserService,
    CloudinaryService,
    UserRepository,
    AuthIdentityRepository,
    { provide: ACUserRepository, useClass: UserRepository },
    { provide: ACAuthIdentityRepository, useClass: AuthIdentityRepository },
  ],
  exports: [
    UserService,
    AdminUserService,
    ACUserRepository,
    ACAuthIdentityRepository,
  ],
})
export class UserModule {}

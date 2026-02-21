import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUserController } from 'src/controllers/admin/admin.user.controller';
import {
  AuthIdentitySchema,
  AuthIdentitySchemaModel,
} from 'src/entities/auth-identity.schema';
import {
  GamificationProfileSchema,
  GamificationProfileSchemaClass,
} from 'src/entities/gamification-profile.schema';
import { UserSchemaClass, UserSchema } from 'src/entities/user.schema';
import {
  ResumeSchemaClass,
  ResumeSchema,
} from 'src/entities/resume.schema';
import {
  ACAuthIdentityRepository,
  AuthIdentityRepository,
} from 'src/repositories/auth-identity.repository';
import {
  ACUserRepository,
  UserRepository,
} from 'src/repositories/user.repository';
import {
  ACResumeRepository,
  ResumeRepository,
} from 'src/repositories/resume.repository';
import { AdminUserService } from 'src/services/admin/admin.user.service';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
      {
        name: GamificationProfileSchemaClass.name,
        schema: GamificationProfileSchema,
      },
      { name: AuthIdentitySchema.name, schema: AuthIdentitySchemaModel },
      { name: ResumeSchemaClass.name, schema: ResumeSchema },
    ]),
  ],
  controllers: [AdminUserController],
  providers: [
    UserService,
    AdminUserService,
    CloudinaryService,
    UserRepository,
    AuthIdentityRepository,
    ResumeRepository,
    { provide: ACUserRepository, useClass: UserRepository },
    { provide: ACAuthIdentityRepository, useClass: AuthIdentityRepository },
    { provide: ACResumeRepository, useClass: ResumeRepository },
  ],
  exports: [
    UserService,
    AdminUserService,
    ACUserRepository,
    ACAuthIdentityRepository,
    ACResumeRepository,
  ],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUserController } from 'src/controllers/admin/admin.user.controller';
import { UserSchemaClass, UserSchema } from 'src/entities/user.schema';
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
    ]),
  ],
  controllers: [AdminUserController],
  providers: [
    UserService,
    AdminUserService,
    CloudinaryService,
    UserRepository,
    { provide: ACUserRepository, useClass: UserRepository },
  ],
  exports: [UserService, AdminUserService, ACUserRepository],
})
export class UserModule {}

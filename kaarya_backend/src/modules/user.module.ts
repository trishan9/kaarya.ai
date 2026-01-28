import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUserController } from 'src/controllers/admin/admin.user.controller';
import { UserController } from 'src/controllers/user.controller';
import { UserSchemaClass, UserSchema } from 'src/entities/user.schema';
import {
  ACUserRepository,
  UserRepository,
} from 'src/repositories/user.repository';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserController, AdminUserController],
  providers: [
    UserService,
    CloudinaryService,
    UserRepository,
    { provide: ACUserRepository, useClass: UserRepository },
  ],
  exports: [UserService, ACUserRepository],
})
export class UserModule {}

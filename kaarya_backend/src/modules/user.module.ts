import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/controllers/user.controller';
import { UserSchemaClass, UserSchema } from 'src/entities/user.schema';
import {
  ACUserRepository,
  UserRepository,
} from 'src/repositories/user.repository';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    { provide: ACUserRepository, useClass: UserRepository },
  ],
  exports: [UserService, ACUserRepository],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from 'src/controllers/user.controller';
import { UserSchemaClass, UserSchema } from 'src/entities/user.schema';
import { UserService } from 'src/services/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [
    UserService,
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
    ]),
  ],
})
export class UserModule {}

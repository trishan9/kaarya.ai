import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchemaClass, UserSchema } from 'src/entities/user.schema';
import { LoggerModule } from 'src/logger/logger.module';
import { JobMatchService } from 'src/services/job-match.service';
import { EmailModule } from './email.module';

@Module({
  imports: [
    EmailModule,
    LoggerModule,
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
    ]),
  ],
  providers: [JobMatchService],
  exports: [JobMatchService],
})
export class JobMatchModule {}

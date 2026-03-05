import { Module } from '@nestjs/common';
import { StreamController } from 'src/controllers/stream.controller';
import { StreamService } from 'src/services/stream.service';
import { UserModule } from './user.module';
import { CollegeModule } from './college.module';
import { CompanyModule } from './company.module';
import { JobPostingModule } from './job-posting.module';

@Module({
  imports: [UserModule, CollegeModule, CompanyModule, JobPostingModule],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}

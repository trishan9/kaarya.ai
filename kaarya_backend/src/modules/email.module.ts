import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/logger/logger.module';
import { EmailService } from 'src/services/email.service';

@Module({
  imports: [LoggerModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from 'src/controllers/payment.controller';
import { PaymentService } from 'src/services/payment.service';
import { InterviewModule } from './interview.module';
import { UserModule } from './user.module';

@Module({
  imports: [ConfigModule, UserModule, InterviewModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

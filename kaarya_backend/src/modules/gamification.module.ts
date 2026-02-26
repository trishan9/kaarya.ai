import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GamificationEventSchema,
  GamificationEventSchemaClass,
} from 'src/entities/gamification-event.schema';
import {
  GamificationProfileSchema,
  GamificationProfileSchemaClass,
} from 'src/entities/gamification-profile.schema';
import {
  ACGamificationEventRepository,
  GamificationEventRepository,
} from 'src/repositories/gamification-event.repository';
import {
  ACGamificationProfileRepository,
  GamificationProfileRepository,
} from 'src/repositories/gamification-profile.repository';
import { GamificationService } from 'src/services/gamification.service';
import { UserModule } from './user.module';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      {
        name: GamificationEventSchemaClass.name,
        schema: GamificationEventSchema,
      },
      {
        name: GamificationProfileSchemaClass.name,
        schema: GamificationProfileSchema,
      },
    ]),
  ],
  providers: [
    GamificationService,
    GamificationEventRepository,
    GamificationProfileRepository,
    {
      provide: ACGamificationEventRepository,
      useClass: GamificationEventRepository,
    },
    {
      provide: ACGamificationProfileRepository,
      useClass: GamificationProfileRepository,
    },
  ],
  exports: [
    GamificationService,
    ACGamificationEventRepository,
    ACGamificationProfileRepository,
  ],
})
export class GamificationModule {}

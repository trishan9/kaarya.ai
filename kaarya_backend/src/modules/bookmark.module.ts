import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookmarkController } from 'src/controllers/bookmark.controller';
import { BookmarkSchema, BookmarkSchemaClass } from 'src/entities/bookmark.schema';
import { ACBookmarkRepository, BookmarkRepository } from 'src/repositories/bookmark.repository';
import { BookmarkService } from 'src/services/bookmark.service';
import { GamificationModule } from './gamification.module';
import { InterviewModule } from './interview.module';
import { JobPostingModule } from './job-posting.module';

@Module({
  imports: [
    JobPostingModule,
    InterviewModule,
    GamificationModule,
    MongooseModule.forFeature([
      { name: BookmarkSchemaClass.name, schema: BookmarkSchema },
    ]),
  ],
  controllers: [BookmarkController],
  providers: [
    BookmarkService,
    BookmarkRepository,
    { provide: ACBookmarkRepository, useClass: BookmarkRepository },
  ],
})
export class BookmarkModule {}

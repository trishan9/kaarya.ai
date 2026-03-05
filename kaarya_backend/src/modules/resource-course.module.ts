import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourceCourseController } from 'src/controllers/resource-course.controller';
import {
  ResourceCourseSchema,
  ResourceCourseSchemaClass,
} from 'src/entities/resource-course.schema';
import {
  ACResourceCourseRepository,
  ResourceCourseRepository,
} from 'src/repositories/resource-course.repository';
import { GeminiService } from 'src/services/gemini.service';
import { ResourceCourseService } from 'src/services/resource-course.service';
import { CollegeModule } from './college.module';
import { CompanyModule } from './company.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    UserModule,
    CompanyModule,
    CollegeModule,
    MongooseModule.forFeature([
      { name: ResourceCourseSchemaClass.name, schema: ResourceCourseSchema },
    ]),
  ],
  controllers: [ResourceCourseController],
  providers: [
    ResourceCourseService,
    GeminiService,
    ResourceCourseRepository,
    { provide: ACResourceCourseRepository, useClass: ResourceCourseRepository },
  ],
  exports: [ResourceCourseService, ACResourceCourseRepository],
})
export class ResourceCourseModule {}

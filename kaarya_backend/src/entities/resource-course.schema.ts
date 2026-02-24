import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, Types } from 'mongoose';
import { CollegeSchemaClass } from './college.schema';
import { CompanySchemaClass } from './company.schema';
import { UserSchemaClass } from './user.schema';
import { ResourceCourseDifficulty } from 'src/types/resource-course-difficulty.enum';
import { ResourceCourseGenerationMode } from 'src/types/resource-course-generation-mode.enum';
import { ResourceCourseSource } from 'src/types/resource-course-source.enum';
import { ResourceCourseVisibility } from 'src/types/resource-course-visibility.enum';

export type ResourceCourseSchemaDocument = HydratedDocument<ResourceCourseSchemaClass>;

@Schema({
  _id: false,
})
export class ResourceCourseSectionSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 180,
  })
  heading: string;

  @Prop({
    type: [String],
    default: [],
  })
  subheadings: string[];

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 1200,
  })
  summary?: string | null;

  @Prop({
    type: [String],
    default: [],
  })
  content: string[];
}

export const ResourceCourseSectionSchema = SchemaFactory.createForClass(
  ResourceCourseSectionSchemaClass,
);

@Schema({
  _id: false,
})
export class ResourceCourseVideoSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 180,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 2048,
  })
  youtubeUrl: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 400,
  })
  reason?: string | null;
}

export const ResourceCourseVideoSchema = SchemaFactory.createForClass(
  ResourceCourseVideoSchemaClass,
);

@Schema({
  _id: false,
})
export class ResourceCourseConceptSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  })
  concept: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 2600,
  })
  theory?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 2600,
  })
  explanation?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 1600,
  })
  interviewApplication?: string | null;
}

export const ResourceCourseConceptSchema = SchemaFactory.createForClass(
  ResourceCourseConceptSchemaClass,
);

@Schema({
  _id: false,
})
export class ResourceCourseInterviewQnASchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  })
  question: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 1600,
  })
  whyAsked?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 2200,
  })
  answerFramework?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 4200,
  })
  sampleAnswer?: string | null;
}

export const ResourceCourseInterviewQnASchema = SchemaFactory.createForClass(
  ResourceCourseInterviewQnASchemaClass,
);

@Schema({
  _id: false,
})
export class ResourceCourseChapterSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 180,
  })
  title: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 1500,
  })
  overview?: string | null;

  @Prop({
    type: Number,
    min: 5,
    max: 240,
    default: 30,
  })
  estimatedMinutes: number;

  @Prop({
    type: [String],
    default: [],
  })
  material: string[];

  @Prop({
    type: [ResourceCourseSectionSchema],
    default: [],
  })
  sections: ResourceCourseSectionSchemaClass[];

  @Prop({
    type: [String],
    default: [],
  })
  learningObjectives: string[];

  @Prop({
    type: [ResourceCourseConceptSchema],
    default: [],
  })
  coreConcepts: ResourceCourseConceptSchemaClass[];

  @Prop({
    type: [ResourceCourseInterviewQnASchema],
    default: [],
  })
  interviewQuestions: ResourceCourseInterviewQnASchemaClass[];

  @Prop({
    type: [String],
    default: [],
  })
  practicePrompts: string[];

  @Prop({
    type: [ResourceCourseVideoSchema],
    default: [],
  })
  youtubeVideos: ResourceCourseVideoSchemaClass[];
}

export const ResourceCourseChapterSchema = SchemaFactory.createForClass(
  ResourceCourseChapterSchemaClass,
);

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class ResourceCourseSchemaClass {
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 180,
    index: true,
  })
  title: string;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 2500,
  })
  description?: string | null;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
    index: true,
  })
  category: string;

  @Prop({
    type: String,
    enum: Object.values(ResourceCourseGenerationMode),
    default: ResourceCourseGenerationMode.LEARN,
    index: true,
  })
  generationMode: ResourceCourseGenerationMode;

  @Prop({
    type: String,
    enum: Object.values(ResourceCourseDifficulty),
    default: ResourceCourseDifficulty.INTERMEDIATE,
    index: true,
  })
  difficulty: ResourceCourseDifficulty;

  @Prop({
    type: [String],
    default: [],
  })
  targetRoles: string[];

  @Prop({
    type: String,
    enum: Object.values(ResourceCourseVisibility),
    default: ResourceCourseVisibility.PRIVATE,
    index: true,
  })
  visibility: ResourceCourseVisibility;

  @Prop({
    type: String,
    enum: Object.values(ResourceCourseSource),
    default: ResourceCourseSource.CANDIDATE,
    index: true,
  })
  source: ResourceCourseSource;

  @Prop({
    type: Types.ObjectId,
    ref: CompanySchemaClass.name,
    default: null,
    index: true,
  })
  companyId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: CollegeSchemaClass.name,
    default: null,
    index: true,
  })
  collegeId?: Types.ObjectId | null;

  @Prop({
    type: Types.ObjectId,
    ref: UserSchemaClass.name,
    required: true,
    index: true,
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: [String],
    default: [],
  })
  learningOutcomes: string[];

  @Prop({
    type: [ResourceCourseChapterSchema],
    default: [],
  })
  chapters: ResourceCourseChapterSchemaClass[];

  @Prop({
    type: [String],
    default: [],
  })
  customVideoUrls: string[];

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 5000,
  })
  jobDescriptionContext?: string | null;

  @Prop({
    type: Boolean,
    default: true,
  })
  includeVideoRecommendations: boolean;

  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  aiGenerated: boolean;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 2400,
  })
  aiPrompt?: string | null;

  @Prop({
    type: String,
    trim: true,
    default: null,
    maxlength: 80,
  })
  aiModel?: string | null;

  @Prop({ default: now })
  createdAt: Date;

  @Prop({ default: now })
  updatedAt: Date;
}

export const ResourceCourseSchema = SchemaFactory.createForClass(
  ResourceCourseSchemaClass,
);

ResourceCourseSchema.index({ createdBy: 1, updatedAt: -1 });
ResourceCourseSchema.index({ visibility: 1, updatedAt: -1 });
ResourceCourseSchema.index({ source: 1, updatedAt: -1 });
ResourceCourseSchema.index({ category: 1, difficulty: 1, updatedAt: -1 });
ResourceCourseSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  targetRoles: 'text',
});

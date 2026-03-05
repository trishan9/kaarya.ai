import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import { RESOURCE_MESSAGES } from 'src/constants/messages.constants';
import {
  TCreateResourceCourseDTO,
  TResourceCourseListQueryDTO,
  TUpdateResourceCourseDTO,
} from 'src/dtos/resources/resource-course.dto';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACResourceCourseRepository } from 'src/repositories/resource-course.repository';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { ResourceCourseSource } from 'src/types/resource-course-source.enum';
import { ResourceCourseVisibility } from 'src/types/resource-course-visibility.enum';
import { ResourceCourseGenerationMode } from 'src/types/resource-course-generation-mode.enum';
import { UserRole } from 'src/types/user-role.enum';
import { CollegeService } from './college.service';
import { GeminiService } from './gemini.service';
import { RecruiterProfileService } from './recruiter-profile.service';
import { UserService } from './user.service';

@Injectable()
export class ResourceCourseService {
  constructor(
    private readonly resourceCourseRepository: ACResourceCourseRepository,
    private readonly companyRepository: ACCompanyRepository,
    private readonly collegeRepository: ACCollegeRepository,
    private readonly recruiterProfileService: RecruiterProfileService,
    private readonly collegeService: CollegeService,
    private readonly userService: UserService,
    private readonly geminiService: GeminiService,
  ) {}

  async createResourceCourse(
    currentUser: TAuthenticatedUser,
    payload: TCreateResourceCourseDTO,
  ) {
    const creationContext = await this.resolveCreationContext(currentUser, payload);
    const generatedContent = await this.geminiService.generateInterviewPrepCourse({
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category,
      generationMode: payload.generationMode,
      difficulty: payload.difficulty,
      targetRoles: payload.targetRoles,
      chapterCount: payload.chapterCount,
      chapterTitles: payload.chapterTitles,
      includeVideoRecommendations: payload.includeVideoRecommendations,
      promptContext: payload.promptContext ?? null,
      jobDescriptionContext: payload.jobDescriptionContext ?? null,
    });

    const createdCourse = await this.resourceCourseRepository.create({
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category,
      generationMode: payload.generationMode,
      difficulty: payload.difficulty,
      targetRoles: payload.targetRoles,
      visibility: payload.visibility,
      source: creationContext.source,
      companyId: creationContext.companyId
        ? new Types.ObjectId(creationContext.companyId)
        : null,
      collegeId: creationContext.collegeId
        ? new Types.ObjectId(creationContext.collegeId)
        : null,
      createdBy: new Types.ObjectId(currentUser.id),
      learningOutcomes: generatedContent.learningOutcomes,
      chapters: generatedContent.chapters,
      customVideoUrls: payload.customVideoUrls,
      jobDescriptionContext: payload.jobDescriptionContext ?? null,
      includeVideoRecommendations: payload.includeVideoRecommendations,
      aiGenerated: Boolean(generatedContent.aiModel),
      aiPrompt: payload.promptContext ?? null,
      aiModel: generatedContent.aiModel ?? null,
    });

    return await this.buildCourseResponse(createdCourse, currentUser.id);
  }

  async listResourceCourses(
    currentUser: TAuthenticatedUser,
    query: TResourceCourseListQueryDTO,
  ) {
    const filter = await this.buildListFilter(currentUser, query);
    const sort = this.resolveSort(query.sortBy);
    const { courses, total } = await this.resourceCourseRepository.findAll({
      page: query.page,
      size: query.size,
      filter,
      sort,
    });

    const companyMap = await this.buildCompanyMap(
      courses
        .map((course) => (course.companyId ? course.companyId.toString() : null))
        .filter(Boolean) as string[],
    );
    const collegeMap = await this.buildCollegeMap(
      courses
        .map((course) => (course.collegeId ? course.collegeId.toString() : null))
        .filter(Boolean) as string[],
    );

    return {
      courses: (
        await Promise.all(
          courses.map((course) =>
            this.buildCourseResponse(course, currentUser.id, {
              companyMap,
              collegeMap,
            }),
          ),
        )
      ).filter(Boolean),
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
        search: query.search,
      }),
    };
  }

  async getResourceCourseById(currentUser: TAuthenticatedUser, courseId: string) {
    const course = await this.getResourceCourseByIdRaw(courseId);
    await this.assertCanAccessCourse(currentUser, course);

    const companyMap = await this.buildCompanyMap(
      course.companyId ? [course.companyId.toString()] : [],
    );
    const collegeMap = await this.buildCollegeMap(
      course.collegeId ? [course.collegeId.toString()] : [],
    );

    return await this.buildCourseResponse(course, currentUser.id, {
      companyMap,
      collegeMap,
      includeCreator: true,
    });
  }

  async updateResourceCourse(
    currentUser: TAuthenticatedUser,
    courseId: string,
    payload: TUpdateResourceCourseDTO,
  ) {
    const course = await this.getResourceCourseByIdRaw(courseId);
    await this.assertCanManageCourse(currentUser, course);

    const updatePayload: Record<string, unknown> = { ...payload };
    delete updatePayload.regenerateContent;

    if (payload.regenerateContent === true) {
      const generatedContent = await this.geminiService.generateInterviewPrepCourse({
        title: payload.title ?? course.title,
        description: payload.description ?? course.description ?? null,
        category: payload.category ?? course.category,
        generationMode:
          payload.generationMode ??
          ((course as { generationMode?: ResourceCourseGenerationMode }).generationMode ??
            ResourceCourseGenerationMode.LEARN),
        difficulty: payload.difficulty ?? course.difficulty,
        targetRoles: payload.targetRoles ?? course.targetRoles,
        chapterCount: payload.chapterCount ?? course.chapters.length ?? 6,
        chapterTitles: payload.chapterTitles ?? [],
        includeVideoRecommendations:
          payload.includeVideoRecommendations ?? course.includeVideoRecommendations,
        promptContext: payload.promptContext ?? course.aiPrompt ?? null,
        jobDescriptionContext:
          payload.jobDescriptionContext ??
          (course.jobDescriptionContext as string | null | undefined) ??
          null,
      });

      updatePayload.learningOutcomes = generatedContent.learningOutcomes;
      updatePayload.chapters = generatedContent.chapters;
      updatePayload.aiGenerated = Boolean(generatedContent.aiModel);
      updatePayload.aiModel = generatedContent.aiModel ?? course.aiModel ?? null;
    }

    const updatedCourse = await this.resourceCourseRepository.updateById(course.id, {
      ...(updatePayload as Record<string, unknown>),
    });
    if (!updatedCourse) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: RESOURCE_MESSAGES.NOT_FOUND,
      });
    }

    return await this.buildCourseResponse(updatedCourse, currentUser.id, {
      includeCreator: true,
    });
  }

  async deleteResourceCourse(currentUser: TAuthenticatedUser, courseId: string) {
    const course = await this.getResourceCourseByIdRaw(courseId);
    await this.assertCanManageCourse(currentUser, course);

    const deletedCourse = await this.resourceCourseRepository.deleteById(course.id);
    if (!deletedCourse) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: RESOURCE_MESSAGES.NOT_FOUND,
      });
    }

    return sanitizeDocument(deletedCourse);
  }

  private async resolveCreationContext(
    currentUser: TAuthenticatedUser,
    payload: {
      companyId?: string;
      collegeId?: string;
    },
  ): Promise<{
    source: ResourceCourseSource;
    companyId?: string;
    collegeId?: string;
  }> {
    if (currentUser.role === UserRole.ADMIN) {
      if (payload.companyId && payload.collegeId) {
        throw new ApiError({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Provide either companyId or collegeId, not both.',
        });
      }

      if (payload.companyId) {
        return {
          source: ResourceCourseSource.COMPANY,
          companyId: payload.companyId,
        };
      }

      if (payload.collegeId) {
        return {
          source: ResourceCourseSource.COLLEGE,
          collegeId: payload.collegeId,
        };
      }

      return {
        source: ResourceCourseSource.CANDIDATE,
      };
    }

    if (currentUser.role === UserRole.RECRUITER) {
      const requestedCompanyId = payload.companyId;
      if (requestedCompanyId) {
        await this.recruiterProfileService.assertRecruiterMembership({
          recruiterId: currentUser.id,
          companyId: requestedCompanyId,
        });

        return {
          source: ResourceCourseSource.COMPANY,
          companyId: requestedCompanyId,
        };
      }

      let profile: { companyId: Types.ObjectId };
      try {
        profile =
          await this.recruiterProfileService.getRecruiterProfileByUserIdOrThrow(
            currentUser.id,
          );
      } catch {
        throw new ApiError({
          statusCode: HttpStatus.FORBIDDEN,
          message: RESOURCE_MESSAGES.RECRUITER_WORKSPACE_REQUIRED,
        });
      }

      return {
        source: ResourceCourseSource.COMPANY,
        companyId: profile.companyId.toString(),
      };
    }

    if (currentUser.role === UserRole.COLLEGE) {
      const requestedCollegeId = payload.collegeId;
      if (requestedCollegeId) {
        await this.collegeService.assertCanManageCollege(
          currentUser,
          requestedCollegeId,
        );

        return {
          source: ResourceCourseSource.COLLEGE,
          collegeId: requestedCollegeId,
        };
      }

      let myCollege: { college: { id: string } };
      try {
        myCollege = (await this.collegeService.getMyCollege(currentUser)) as {
          college: { id: string };
        };
      } catch {
        throw new ApiError({
          statusCode: HttpStatus.FORBIDDEN,
          message: RESOURCE_MESSAGES.COLLEGE_WORKSPACE_REQUIRED,
        });
      }
      const collegeId = String((myCollege.college as { id: string }).id ?? '');
      if (!collegeId) {
        throw new ApiError({
          statusCode: HttpStatus.FORBIDDEN,
          message: RESOURCE_MESSAGES.COLLEGE_WORKSPACE_REQUIRED,
        });
      }

      return {
        source: ResourceCourseSource.COLLEGE,
        collegeId,
      };
    }

    if (payload.companyId || payload.collegeId) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: RESOURCE_MESSAGES.FORBIDDEN_CREATE,
      });
    }

    return {
      source: ResourceCourseSource.CANDIDATE,
    };
  }

  private async buildListFilter(
    currentUser: TAuthenticatedUser,
    query: TResourceCourseListQueryDTO,
  ) {
    const filter: Record<string, unknown> = {};

    if (query.ownership === 'mine') {
      filter.createdBy = new Types.ObjectId(currentUser.id);
    } else if (query.ownership === 'public') {
      filter.visibility = ResourceCourseVisibility.PUBLIC;
    } else if (currentUser.role !== UserRole.ADMIN) {
      filter.$or = [
        { createdBy: new Types.ObjectId(currentUser.id) },
        { visibility: ResourceCourseVisibility.PUBLIC },
      ];
    }

    if (query.visibility === ResourceCourseVisibility.PUBLIC) {
      filter.visibility = ResourceCourseVisibility.PUBLIC;
    }

    if (query.visibility === ResourceCourseVisibility.PRIVATE) {
      if (currentUser.role === UserRole.ADMIN) {
        filter.visibility = ResourceCourseVisibility.PRIVATE;
      } else {
        filter.createdBy = new Types.ObjectId(currentUser.id);
        filter.visibility = ResourceCourseVisibility.PRIVATE;
      }
    }

    if (query.category) {
      filter.category = {
        $regex: this.escapeRegex(query.category),
        $options: 'i',
      };
    }

    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }

    if (query.source) {
      filter.source = query.source;
    }

    if (query.search) {
      const regex = {
        $regex: this.escapeRegex(query.search),
        $options: 'i',
      };
      filter.$and = [
        {
          $or: [
            { title: regex },
            { description: regex },
            { category: regex },
            { targetRoles: regex },
          ],
        },
      ];
    }

    return filter;
  }

  private async getResourceCourseByIdRaw(courseId: string) {
    if (!courseId || !isValidObjectId(courseId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: RESOURCE_MESSAGES.INVALID_ID,
      });
    }

    const course = await this.resourceCourseRepository.findById(courseId);
    if (!course) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: RESOURCE_MESSAGES.NOT_FOUND,
      });
    }

    return course;
  }

  private async assertCanAccessCourse(
    currentUser: TAuthenticatedUser,
    course: {
      createdBy: Types.ObjectId;
      source: ResourceCourseSource;
      visibility: ResourceCourseVisibility;
      companyId?: Types.ObjectId | null;
      collegeId?: Types.ObjectId | null;
    },
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (course.createdBy.toString() === currentUser.id) {
      return;
    }

    if (course.visibility === ResourceCourseVisibility.PUBLIC) {
      return;
    }

    if (
      course.source === ResourceCourseSource.COMPANY &&
      currentUser.role === UserRole.RECRUITER &&
      course.companyId
    ) {
      await this.recruiterProfileService.assertRecruiterMembership({
        recruiterId: currentUser.id,
        companyId: course.companyId.toString(),
      });
      return;
    }

    if (
      course.source === ResourceCourseSource.COLLEGE &&
      currentUser.role === UserRole.COLLEGE &&
      course.collegeId
    ) {
      await this.collegeService.assertCanManageCollege(
        currentUser,
        course.collegeId.toString(),
      );
      return;
    }

    throw new ApiError({
      statusCode: HttpStatus.FORBIDDEN,
      message: RESOURCE_MESSAGES.FORBIDDEN_ACCESS,
    });
  }

  private async assertCanManageCourse(
    currentUser: TAuthenticatedUser,
    course: {
      createdBy: Types.ObjectId;
      source: ResourceCourseSource;
      companyId?: Types.ObjectId | null;
      collegeId?: Types.ObjectId | null;
    },
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (course.createdBy.toString() === currentUser.id) {
      return;
    }

    if (
      course.source === ResourceCourseSource.COMPANY &&
      currentUser.role === UserRole.RECRUITER &&
      course.companyId
    ) {
      await this.recruiterProfileService.assertRecruiterMembership({
        recruiterId: currentUser.id,
        companyId: course.companyId.toString(),
      });
      return;
    }

    if (
      course.source === ResourceCourseSource.COLLEGE &&
      currentUser.role === UserRole.COLLEGE &&
      course.collegeId
    ) {
      await this.collegeService.assertCanManageCollege(
        currentUser,
        course.collegeId.toString(),
      );
      return;
    }

    throw new ApiError({
      statusCode: HttpStatus.FORBIDDEN,
      message: RESOURCE_MESSAGES.FORBIDDEN_MANAGE,
    });
  }

  private async buildCourseResponse(
    course: unknown,
    viewerUserId: string,
    options?: {
      includeCreator?: boolean;
      companyMap?: Map<string, { id: string; name: string; logo: string | null }>;
      collegeMap?: Map<string, { id: string; name: string; logo: string | null }>;
    },
  ) {
    const courseData = sanitizeDocument(course);
    if (!courseData) return null;

    const courseId = String(courseData.id ?? '');
    const createdById =
      typeof courseData.createdBy === 'string'
        ? courseData.createdBy
        : ((courseData.createdBy as { toString?: () => string } | undefined)?.toString?.() ??
          null);
    const companyId =
      typeof courseData.companyId === 'string'
        ? courseData.companyId
        : ((courseData.companyId as { toString?: () => string } | undefined)?.toString?.() ??
          null);
    const collegeId =
      typeof courseData.collegeId === 'string'
        ? courseData.collegeId
        : ((courseData.collegeId as { toString?: () => string } | undefined)?.toString?.() ??
          null);

    const company =
      companyId && options?.companyMap ? options.companyMap.get(companyId) : null;
    const college =
      collegeId && options?.collegeMap ? options.collegeMap.get(collegeId) : null;

    const response: Record<string, unknown> = {
      ...courseData,
      generationMode:
        courseData.generationMode ??
        (typeof courseData.category === 'string' &&
        courseData.category.toLowerCase().includes('interview')
          ? ResourceCourseGenerationMode.INTERVIEW_PREP
          : ResourceCourseGenerationMode.LEARN),
      company: company ?? null,
      college: college ?? null,
      isOwner: createdById === viewerUserId,
      canEdit: createdById === viewerUserId,
      viewerId: viewerUserId,
      courseId,
    };

    if (options?.includeCreator && createdById) {
      try {
        const creator = await this.userService.getUserByIdRaw(createdById);
        response.creator = {
          id: creator.id,
          name: creator.name,
          email: creator.email,
          role: creator.role,
          photo: creator.photo ?? null,
        };
      } catch {
        response.creator = null;
      }
    }

    return response;
  }

  private resolveSort(
    sortBy: TResourceCourseListQueryDTO['sortBy'],
  ): Record<string, 1 | -1> {
    if (sortBy === 'updated') {
      return { updatedAt: -1, _id: -1 };
    }

    if (sortBy === 'title') {
      return { title: 1, createdAt: -1, _id: -1 };
    }

    return { createdAt: -1, _id: -1 };
  }

  private async buildCompanyMap(companyIds: string[]) {
    const validIds = companyIds.filter((id) => isValidObjectId(id));
    if (!validIds.length) {
      return new Map<string, { id: string; name: string; logo: string | null }>();
    }

    const companies = await this.companyRepository.findByIds(validIds);
    const map = new Map<string, { id: string; name: string; logo: string | null }>();
    companies.forEach((company) => {
      map.set(company.id, {
        id: company.id,
        name: company.name,
        logo: company.logo ?? null,
      });
    });
    return map;
  }

  private async buildCollegeMap(collegeIds: string[]) {
    const validIds = collegeIds.filter((id) => isValidObjectId(id));
    if (!validIds.length) {
      return new Map<string, { id: string; name: string; logo: string | null }>();
    }

    const colleges = await this.collegeRepository.findByIds(validIds);
    const map = new Map<string, { id: string; name: string; logo: string | null }>();
    colleges.forEach((college) => {
      map.set(college.id, {
        id: college.id,
        name: college.name,
        logo: college.logo ?? null,
      });
    });
    return map;
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

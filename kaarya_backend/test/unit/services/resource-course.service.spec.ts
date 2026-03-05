import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { ACCollegeRepository } from 'src/repositories/college.repository';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACResourceCourseRepository } from 'src/repositories/resource-course.repository';
import { CollegeService } from 'src/services/college.service';
import { GeminiService } from 'src/services/gemini.service';
import { RecruiterProfileService } from 'src/services/recruiter-profile.service';
import { ResourceCourseService } from 'src/services/resource-course.service';
import { UserService } from 'src/services/user.service';
import { ResourceCourseGenerationMode } from 'src/types/resource-course-generation-mode.enum';
import { ResourceCourseSource } from 'src/types/resource-course-source.enum';
import { ResourceCourseVisibility } from 'src/types/resource-course-visibility.enum';
import { UserRole } from 'src/types/user-role.enum';

describe('ResourceCourseService', () => {
  let service: ResourceCourseService;
  let resourceCourseRepository: jest.Mocked<ACResourceCourseRepository>;
  let companyRepository: jest.Mocked<ACCompanyRepository>;
  let collegeRepository: jest.Mocked<ACCollegeRepository>;
  let recruiterProfileService: jest.Mocked<RecruiterProfileService>;
  let collegeService: jest.Mocked<CollegeService>;
  let userService: jest.Mocked<UserService>;
  let geminiService: jest.Mocked<GeminiService>;

  const userId = new Types.ObjectId().toString();
  const courseId = new Types.ObjectId().toString();
  const companyId = new Types.ObjectId().toString();
  const collegeId = new Types.ObjectId().toString();

  beforeEach(() => {
    resourceCourseRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<ACResourceCourseRepository>;

    companyRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ACCompanyRepository>;

    collegeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn(),
      findFirstByCreatedBy: jest.fn(),
      findByCreatedBy: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ACCollegeRepository>;

    recruiterProfileService = {
      assertRecruiterMembership: jest.fn(),
      getRecruiterProfileByUserIdOrThrow: jest.fn(),
      resolveWritableCompanyIdForRecruiter: jest.fn(),
    } as unknown as jest.Mocked<RecruiterProfileService>;

    collegeService = {
      assertCanManageCollege: jest.fn(),
      getMyCollege: jest.fn(),
      getCollegeByIdRaw: jest.fn(),
      listStudentCollegeIds: jest.fn(),
      getCollegeById: jest.fn(),
    } as unknown as jest.Mocked<CollegeService>;

    userService = {
      getUserByIdRaw: jest.fn(),
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      getUserById: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    geminiService = {
      generateInterviewPrepCourse: jest.fn(),
      generateProfessionalSummary: jest.fn(),
      generateExperienceBullets: jest.fn(),
      generateResumeSuggestions: jest.fn(),
      atsScanResume: jest.fn(),
    } as unknown as jest.Mocked<GeminiService>;

    service = new ResourceCourseService(
      resourceCourseRepository,
      companyRepository,
      collegeRepository,
      recruiterProfileService,
      collegeService,
      userService,
      geminiService,
    );
  });

  it('should create a candidate resource course', async () => {
    geminiService.generateInterviewPrepCourse.mockResolvedValue({
      learningOutcomes: ['Understand basics'],
      chapters: [{ title: 'Intro', material: [] }],
      aiModel: 'gpt-4o',
    } as never);
    resourceCourseRepository.create.mockResolvedValue({
      id: courseId,
      title: 'Course',
      visibility: ResourceCourseVisibility.PUBLIC,
      source: ResourceCourseSource.CANDIDATE,
      createdBy: new Types.ObjectId(userId),
      companyId: null,
      collegeId: null,
      category: 'Interview',
    } as never);

    const result = await service.createResourceCourse(
      { id: userId, role: UserRole.STUDENT } as never,
      {
        title: 'Course',
        category: 'Interview',
        generationMode: ResourceCourseGenerationMode.LEARN,
        difficulty: 'beginner',
        targetRoles: ['Backend Engineer'],
        chapterCount: 1,
        chapterTitles: ['Intro'],
        includeVideoRecommendations: false,
        visibility: ResourceCourseVisibility.PUBLIC,
      } as never,
    );

    expect(geminiService.generateInterviewPrepCourse).toHaveBeenCalled();
    expect(resourceCourseRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        source: ResourceCourseSource.CANDIDATE,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: courseId,
        isOwner: true,
        canEdit: true,
      }),
    );
  });

  it('should list, get, update and delete courses', async () => {
    resourceCourseRepository.findAll.mockResolvedValue({
      courses: [
        {
          id: courseId,
          title: 'Course',
          source: ResourceCourseSource.COMPANY,
          visibility: ResourceCourseVisibility.PUBLIC,
          companyId: new Types.ObjectId(companyId),
          createdBy: new Types.ObjectId(userId),
          category: 'Interview',
          generationMode: ResourceCourseGenerationMode.LEARN,
        },
      ],
      total: 1,
    } as never);
    companyRepository.findByIds.mockResolvedValue([
      { id: companyId, name: 'Acme', logo: null },
    ] as never);
    collegeRepository.findByIds.mockResolvedValue([] as never);
    const listed = await service.listResourceCourses(
      { id: userId, role: UserRole.ADMIN } as never,
      { page: 1, size: 10, sortBy: 'updated' } as never,
    );
    expect(listed.meta.totalItems).toBe(1);
    expect(listed.courses[0]).toEqual(
      expect.objectContaining({
        company: { id: companyId, name: 'Acme', logo: null },
      }),
    );

    resourceCourseRepository.findById.mockResolvedValue({
      id: courseId,
      title: 'Course',
      source: ResourceCourseSource.COMPANY,
      visibility: ResourceCourseVisibility.PUBLIC,
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(userId),
      category: 'Interview',
      generationMode: ResourceCourseGenerationMode.LEARN,
      chapters: [],
      difficulty: 'beginner',
      targetRoles: ['Backend Engineer'],
      includeVideoRecommendations: false,
    } as never);
    userService.getUserByIdRaw.mockResolvedValue({
      id: userId,
      name: 'Owner',
      email: 'owner@example.com',
      role: UserRole.STUDENT,
      photo: null,
    } as never);
    const fetched = await service.getResourceCourseById(
      { id: userId, role: UserRole.STUDENT } as never,
      courseId,
    );
    expect(fetched).toEqual(
      expect.objectContaining({
        id: courseId,
      }),
    );

    geminiService.generateInterviewPrepCourse.mockResolvedValue({
      learningOutcomes: ['Updated'],
      chapters: [{ title: 'Updated', material: [] }],
      aiModel: 'gpt-4o',
    } as never);
    resourceCourseRepository.updateById.mockResolvedValue({
      id: courseId,
      title: 'Course 2',
      source: ResourceCourseSource.CANDIDATE,
      visibility: ResourceCourseVisibility.PUBLIC,
      createdBy: new Types.ObjectId(userId),
      category: 'Interview',
      generationMode: ResourceCourseGenerationMode.LEARN,
    } as never);
    const updated = await service.updateResourceCourse(
      { id: userId, role: UserRole.STUDENT } as never,
      courseId,
      {
        title: 'Course 2',
        regenerateContent: true,
      } as never,
    );
    expect(updated).toEqual(expect.objectContaining({ title: 'Course 2' }));

    resourceCourseRepository.deleteById.mockResolvedValue({
      id: courseId,
    } as never);
    await expect(
      service.deleteResourceCourse(
        { id: userId, role: UserRole.STUDENT } as never,
        courseId,
      ),
    ).resolves.toEqual(expect.objectContaining({ id: courseId }));
  });

  it('should cover creation context and access control branches', async () => {
    const internal = service as any;

    await expect(
      internal.resolveCreationContext(
        { id: userId, role: UserRole.ADMIN },
        { companyId, collegeId },
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      internal.resolveCreationContext(
        { id: userId, role: UserRole.ADMIN },
        { companyId },
      ),
    ).resolves.toEqual({
      source: ResourceCourseSource.COMPANY,
      companyId,
    });

    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    await expect(
      internal.resolveCreationContext(
        { id: userId, role: UserRole.RECRUITER },
        { companyId },
      ),
    ).resolves.toEqual({
      source: ResourceCourseSource.COMPANY,
      companyId,
    });
    expect(recruiterProfileService.assertRecruiterMembership).toHaveBeenCalled();

    recruiterProfileService.getRecruiterProfileByUserIdOrThrow.mockResolvedValue({
      companyId: new Types.ObjectId(companyId),
    } as never);
    await expect(
      internal.resolveCreationContext(
        { id: userId, role: UserRole.RECRUITER },
        {},
      ),
    ).resolves.toEqual({
      source: ResourceCourseSource.COMPANY,
      companyId,
    });

    collegeService.assertCanManageCollege.mockResolvedValue(undefined);
    await expect(
      internal.resolveCreationContext(
        { id: userId, role: UserRole.COLLEGE },
        { collegeId },
      ),
    ).resolves.toEqual({
      source: ResourceCourseSource.COLLEGE,
      collegeId,
    });

    collegeService.getMyCollege.mockResolvedValue({
      college: { id: collegeId },
    } as never);
    await expect(
      internal.resolveCreationContext(
        { id: userId, role: UserRole.COLLEGE },
        {},
      ),
    ).resolves.toEqual({
      source: ResourceCourseSource.COLLEGE,
      collegeId,
    });

    await expect(
      internal.resolveCreationContext(
        { id: userId, role: UserRole.STUDENT },
        { companyId },
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      internal.assertCanAccessCourse(
        { id: userId, role: UserRole.ADMIN },
        { createdBy: new Types.ObjectId(userId), source: ResourceCourseSource.CANDIDATE, visibility: ResourceCourseVisibility.PRIVATE },
      ),
    ).resolves.toBeUndefined();

    await expect(
      internal.assertCanAccessCourse(
        { id: userId, role: UserRole.STUDENT },
        {
          createdBy: new Types.ObjectId(new Types.ObjectId().toString()),
          source: ResourceCourseSource.COMPANY,
          visibility: ResourceCourseVisibility.PRIVATE,
          companyId: new Types.ObjectId(companyId),
        },
      ),
    ).rejects.toBeInstanceOf(ApiError);

    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    await expect(
      internal.assertCanAccessCourse(
        { id: userId, role: UserRole.RECRUITER },
        {
          createdBy: new Types.ObjectId(new Types.ObjectId().toString()),
          source: ResourceCourseSource.COMPANY,
          visibility: ResourceCourseVisibility.PRIVATE,
          companyId: new Types.ObjectId(companyId),
        },
      ),
    ).resolves.toBeUndefined();

    collegeService.assertCanManageCollege.mockResolvedValue(undefined);
    await expect(
      internal.assertCanManageCourse(
        { id: userId, role: UserRole.COLLEGE },
        {
          createdBy: new Types.ObjectId(new Types.ObjectId().toString()),
          source: ResourceCourseSource.COLLEGE,
          collegeId: new Types.ObjectId(collegeId),
        },
      ),
    ).resolves.toBeUndefined();

    await expect(
      internal.assertCanManageCourse(
        { id: userId, role: UserRole.STUDENT },
        {
          createdBy: new Types.ObjectId(new Types.ObjectId().toString()),
          source: ResourceCourseSource.CANDIDATE,
        },
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should cover list filter/sort helpers and maps', async () => {
    const internal = service as any;
    const filter = await internal.buildListFilter(
      { id: userId, role: UserRole.STUDENT },
      {
        ownership: 'public',
        visibility: ResourceCourseVisibility.PRIVATE,
        category: 'AI',
        difficulty: 'advanced',
        source: ResourceCourseSource.CANDIDATE,
        search: 'course',
      },
    );
    expect(filter).toEqual(
      expect.objectContaining({
        createdBy: expect.any(Types.ObjectId),
        visibility: ResourceCourseVisibility.PRIVATE,
        source: ResourceCourseSource.CANDIDATE,
      }),
    );

    expect(internal.resolveSort('title')).toEqual({
      title: 1,
      createdAt: -1,
      _id: -1,
    });
    expect(internal.resolveSort('unknown')).toEqual({
      createdAt: -1,
      _id: -1,
    });
    expect(internal.escapeRegex('a+b')).toBe('a\\+b');

    companyRepository.findByIds.mockResolvedValue([
      { id: companyId, name: 'Acme', logo: null },
    ] as never);
    collegeRepository.findByIds.mockResolvedValue([
      { id: collegeId, name: 'Campus', logo: null },
    ] as never);

    const companyMap = await internal.buildCompanyMap([
      companyId,
      'not-an-object-id',
    ]);
    expect(companyMap.get(companyId)).toEqual({
      id: companyId,
      name: 'Acme',
      logo: null,
    });
    const collegeMap = await internal.buildCollegeMap([
      collegeId,
      'not-an-object-id',
    ]);
    expect(collegeMap.get(collegeId)).toEqual({
      id: collegeId,
      name: 'Campus',
      logo: null,
    });
  });

  it('should validate id lookup helpers and update/delete not-found branches', async () => {
    const internal = service as any;

    await expect(internal.getResourceCourseByIdRaw('bad-id')).rejects.toBeInstanceOf(
      ApiError,
    );
    resourceCourseRepository.findById.mockResolvedValue(null);
    await expect(
      internal.getResourceCourseByIdRaw(new Types.ObjectId().toString()),
    ).rejects.toBeInstanceOf(ApiError);

    resourceCourseRepository.findById.mockResolvedValue({
      id: courseId,
      title: 'Course',
      source: ResourceCourseSource.CANDIDATE,
      visibility: ResourceCourseVisibility.PUBLIC,
      createdBy: new Types.ObjectId(userId),
      category: 'Interview',
      generationMode: ResourceCourseGenerationMode.LEARN,
      chapters: [],
      difficulty: 'beginner',
      targetRoles: ['Backend Engineer'],
      includeVideoRecommendations: false,
    } as never);
    resourceCourseRepository.updateById.mockResolvedValue(null);
    await expect(
      service.updateResourceCourse(
        { id: userId, role: UserRole.STUDENT } as never,
        courseId,
        { title: 'x' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    resourceCourseRepository.deleteById.mockResolvedValue(null);
    await expect(
      service.deleteResourceCourse(
        { id: userId, role: UserRole.STUDENT } as never,
        courseId,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

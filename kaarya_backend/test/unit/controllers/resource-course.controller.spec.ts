import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { RESOURCE_MESSAGES } from 'src/constants/messages.constants';
import { ResourceCourseController } from 'src/controllers/resource-course.controller';
import { ResourceCourseService } from 'src/services/resource-course.service';
import { ResourceCourseDifficulty } from 'src/types/resource-course-difficulty.enum';

describe('ResourceCourseController', () => {
  const courseId = new Types.ObjectId().toString();
  const user = { id: new Types.ObjectId().toString(), role: 'student' } as never;

  let controller: ResourceCourseController;
  let resourceCourseService: jest.Mocked<ResourceCourseService>;

  beforeEach(() => {
    resourceCourseService = {
      listResourceCourses: jest.fn(),
      getResourceCourseById: jest.fn(),
      createResourceCourse: jest.fn(),
      updateResourceCourse: jest.fn(),
      deleteResourceCourse: jest.fn(),
    } as unknown as jest.Mocked<ResourceCourseService>;

    controller = new ResourceCourseController(resourceCourseService);
  });

  it('should list resource courses', async () => {
    resourceCourseService.listResourceCourses.mockResolvedValue({
      courses: [],
      meta: {
        page: 1,
        size: 12,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
      },
    } as never);

    const result = await controller.listResourceCourses(
      { user },
      { page: '1', size: '12', ownership: 'all' } as never,
    );

    expect(resourceCourseService.listResourceCourses).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ page: 1, size: 12 }),
    );
    expect(result.message).toBe(RESOURCE_MESSAGES.FETCH_ALL_SUCCESS);
  });

  it('should reject invalid list query', async () => {
    await expect(
      controller.listResourceCourses({ user }, { page: 0 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get a resource course by id', async () => {
    resourceCourseService.getResourceCourseById.mockResolvedValue({
      id: courseId,
    } as never);

    const result = await controller.getResourceCourseById({ user }, courseId);

    expect(resourceCourseService.getResourceCourseById).toHaveBeenCalledWith(
      user,
      courseId,
    );
    expect(result.message).toBe(RESOURCE_MESSAGES.FETCH_SUCCESS);
  });

  it('should reject invalid course id', async () => {
    await expect(
      controller.getResourceCourseById({ user }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should create a resource course', async () => {
    resourceCourseService.createResourceCourse.mockResolvedValue({
      id: courseId,
    } as never);

    const result = await controller.createResourceCourse(
      { user },
      {
        title: 'Backend Sprint',
        category: 'Learn',
        difficulty: ResourceCourseDifficulty.INTERMEDIATE,
        targetRoles: ['Backend Engineer'],
      } as never,
    );

    expect(resourceCourseService.createResourceCourse).toHaveBeenCalled();
    expect(result.message).toBe(RESOURCE_MESSAGES.CREATE_SUCCESS);
  });

  it('should reject invalid create payload', async () => {
    await expect(
      controller.createResourceCourse(
        { user },
        {
          title: 'x',
        } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should update a resource course', async () => {
    resourceCourseService.updateResourceCourse.mockResolvedValue({
      id: courseId,
    } as never);

    const result = await controller.updateResourceCourse(
      { user },
      courseId,
      { title: 'Updated title' } as never,
    );

    expect(resourceCourseService.updateResourceCourse).toHaveBeenCalledWith(
      user,
      courseId,
      expect.objectContaining({ title: 'Updated title' }),
    );
    expect(result.message).toBe(RESOURCE_MESSAGES.UPDATE_SUCCESS);
  });

  it('should reject invalid update payload or id', async () => {
    await expect(
      controller.updateResourceCourse({ user }, 'bad-id', { title: 'ok' } as never),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.updateResourceCourse({ user }, courseId, { title: 'x' } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should delete a resource course', async () => {
    resourceCourseService.deleteResourceCourse.mockResolvedValue({
      deleted: true,
      id: courseId,
    } as never);

    const result = await controller.deleteResourceCourse({ user }, courseId);

    expect(resourceCourseService.deleteResourceCourse).toHaveBeenCalledWith(
      user,
      courseId,
    );
    expect(result.message).toBe(RESOURCE_MESSAGES.DELETE_SUCCESS);
  });
});


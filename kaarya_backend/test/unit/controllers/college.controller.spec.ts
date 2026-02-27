import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { COLLEGE_MESSAGES } from 'src/constants/messages.constants';
import { CollegeController } from 'src/controllers/college.controller';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { CollegeService } from 'src/services/college.service';

describe('CollegeController', () => {
  let controller: CollegeController;
  let collegeService: jest.Mocked<CollegeService>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const userId = new Types.ObjectId().toString();
  const collegeId = new Types.ObjectId().toString();
  const studentId = new Types.ObjectId().toString();

  beforeEach(() => {
    collegeService = {
      listColleges: jest.fn(),
      getMyCollege: jest.fn(),
      listStudentWorkspaces: jest.fn(),
      getCollegeById: jest.fn(),
      joinCollegeByInviteCode: jest.fn(),
      createCollege: jest.fn(),
      updateCollege: jest.fn(),
      resetCollegeInviteCode: jest.fn(),
      deleteCollege: jest.fn(),
      listCollegeStudents: jest.fn(),
      inviteStudentToCollege: jest.fn(),
      removeStudentFromCollege: jest.fn(),
      getCollegeMetrics: jest.fn(),
    } as never;

    cloudinaryService = {
      uploadImage: jest.fn(),
    } as never;

    controller = new CollegeController(collegeService, cloudinaryService);
  });

  it('should list colleges and validate query', async () => {
    collegeService.listColleges.mockResolvedValue({
      colleges: [],
      meta: { page: 1, size: 10, totalItems: 0 },
    } as never);

    const result = await controller.listColleges({ page: 1, size: 10 });
    expect(collegeService.listColleges).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, size: 10 }),
    );
    expect(result.message).toBe(COLLEGE_MESSAGES.FETCH_ALL_SUCCESS);

    await expect(
      controller.listColleges({ page: 0, size: 10 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get my college', async () => {
    collegeService.getMyCollege.mockResolvedValue({ college: { id: collegeId } } as never);

    const result = await controller.getMyCollege({
      user: { id: userId, role: 'college' } as never,
    });

    expect(result.message).toBe(COLLEGE_MESSAGES.FETCH_SUCCESS);
    expect(collegeService.getMyCollege).toHaveBeenCalledWith(
      expect.objectContaining({ id: userId }),
    );
  });

  it('should list my workspaces and validate query', async () => {
    collegeService.listStudentWorkspaces.mockResolvedValue({
      workspaces: [],
      meta: { page: 1, size: 10, totalItems: 0 },
    } as never);

    const result = await controller.listMyWorkspaces(
      { user: { id: userId, role: 'student' } as never },
      { page: 1, size: 10 },
    );
    expect(result.message).toBe(COLLEGE_MESSAGES.WORKSPACES_FETCH_SUCCESS);

    await expect(
      controller.listMyWorkspaces(
        { user: { id: userId } as never },
        { page: 1, size: 101 } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get college by id and reject invalid id', async () => {
    collegeService.getCollegeById.mockResolvedValue({ id: collegeId } as never);

    const result = await controller.getCollegeById(collegeId);
    expect(result.message).toBe(COLLEGE_MESSAGES.FETCH_SUCCESS);

    await expect(controller.getCollegeById('bad-id')).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('should join college by code and validate payload', async () => {
    collegeService.joinCollegeByInviteCode.mockResolvedValue({
      workspace: { id: collegeId },
      member: { id: 'm1' },
    } as never);

    const result = await controller.joinCollegeByCode(
      { user: { id: userId, role: 'user' } as never },
      { inviteCode: ' abcd ', program: 'BCA', year: 2 },
    );
    expect(result.message).toBe(COLLEGE_MESSAGES.JOIN_BY_CODE_SUCCESS);

    await expect(
      controller.joinCollegeByCode(
        { user: { id: userId } as never },
        { inviteCode: '' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should create college with optional logo upload and validate payload', async () => {
    cloudinaryService.uploadImage.mockResolvedValue('https://cdn.example/logo.png');
    collegeService.createCollege.mockResolvedValue({ id: collegeId } as never);

    const created = await controller.createCollege(
      { user: { id: userId, role: 'college' } as never },
      { name: 'Tech College', institutionType: 'Engineering', location: 'KTM' },
      { mimetype: 'image/png' } as never,
    );
    expect(cloudinaryService.uploadImage).toHaveBeenCalled();
    expect(created.message).toBe(COLLEGE_MESSAGES.CREATE_SUCCESS);

    await expect(
      controller.createCollege(
        { user: { id: userId } as never },
        { name: 'a' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should update college and validate id/payload', async () => {
    cloudinaryService.uploadImage.mockResolvedValue('https://cdn.example/logo.png');
    collegeService.updateCollege.mockResolvedValue({ id: collegeId } as never);

    const updated = await controller.updateCollege(
      { user: { id: userId, role: 'college' } as never },
      collegeId,
      { name: 'Updated College' },
      { mimetype: 'image/png' } as never,
    );
    expect(updated.message).toBe(COLLEGE_MESSAGES.UPDATE_SUCCESS);

    await expect(
      controller.updateCollege(
        { user: { id: userId } as never },
        'bad-id',
        { name: 'Updated' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.updateCollege(
        { user: { id: userId } as never },
        collegeId,
        {} as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should reset invite code and delete college with id validation', async () => {
    collegeService.resetCollegeInviteCode.mockResolvedValue({
      college: { id: collegeId },
      inviteCode: 'KC-ABCD',
    } as never);
    collegeService.deleteCollege.mockResolvedValue({ id: collegeId } as never);

    const reset = await controller.resetInviteCode(
      { user: { id: userId } as never },
      collegeId,
    );
    expect(reset.message).toBe(COLLEGE_MESSAGES.INVITE_CODE_RESET_SUCCESS);

    const deleted = await controller.deleteCollege(
      { user: { id: userId } as never },
      collegeId,
    );
    expect(deleted.message).toBe(COLLEGE_MESSAGES.DELETE_SUCCESS);

    await expect(
      controller.resetInviteCode({ user: { id: userId } as never }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.deleteCollege({ user: { id: userId } as never }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should list college students and validate query/id', async () => {
    collegeService.listCollegeStudents.mockResolvedValue({
      workspace: { id: collegeId },
      members: [],
      meta: { page: 1, size: 10, totalItems: 0 },
    } as never);

    const result = await controller.listCollegeStudents(
      { user: { id: userId } as never },
      collegeId,
      { page: 1, size: 10 },
    );
    expect(result.message).toBe(COLLEGE_MESSAGES.FETCH_ALL_SUCCESS);

    await expect(
      controller.listCollegeStudents(
        { user: { id: userId } as never },
        'bad-id',
        { page: 1, size: 10 } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.listCollegeStudents(
        { user: { id: userId } as never },
        collegeId,
        { page: 0, size: 10 } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should invite and remove student with payload/id validation', async () => {
    collegeService.inviteStudentToCollege.mockResolvedValue({
      workspace: { id: collegeId },
      inviteeEmail: 'student@example.com',
      emailSent: true,
    } as never);
    collegeService.removeStudentFromCollege.mockResolvedValue({
      college: { id: collegeId },
      studentProfile: { id: 'membership-1' },
    } as never);

    const invited = await controller.inviteStudentToCollege(
      { user: { id: userId } as never },
      collegeId,
      { email: 'student@example.com', program: 'BCA', year: 2 },
    );
    expect(invited.message).toBe(COLLEGE_MESSAGES.INVITE_CREATE_SUCCESS);

    const removed = await controller.removeStudentFromCollege(
      { user: { id: userId } as never },
      collegeId,
      studentId,
    );
    expect(removed.message).toBe(COLLEGE_MESSAGES.STUDENT_DELETE_SUCCESS);

    await expect(
      controller.inviteStudentToCollege(
        { user: { id: userId } as never },
        'bad-id',
        { email: 'student@example.com' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.inviteStudentToCollege(
        { user: { id: userId } as never },
        collegeId,
        { email: 'bad-email' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.removeStudentFromCollege(
        { user: { id: userId } as never },
        'bad-id',
        studentId,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.removeStudentFromCollege(
        { user: { id: userId } as never },
        collegeId,
        'bad-id',
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get college metrics and validate id', async () => {
    collegeService.getCollegeMetrics.mockResolvedValue({
      workspace: { id: collegeId },
      summary: { students: 0, applications: 0 },
      statusBreakdown: {},
      leaderboard: [],
    } as never);

    const result = await controller.getCollegeMetrics(
      { user: { id: userId } as never },
      collegeId,
    );
    expect(result.message).toBe(COLLEGE_MESSAGES.METRICS_FETCH_SUCCESS);

    await expect(
      controller.getCollegeMetrics({ user: { id: userId } as never }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });
});


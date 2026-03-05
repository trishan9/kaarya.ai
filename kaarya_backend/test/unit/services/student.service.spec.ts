import { HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { COLLEGE_MESSAGES, USER_MESSAGES } from 'src/constants/messages.constants';
import { ACStudentRepository } from 'src/repositories/student.repository';
import { StudentService } from 'src/services/student.service';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';

describe('StudentService', () => {
  let service: StudentService;
  let studentRepository: jest.Mocked<ACStudentRepository>;
  let userService: jest.Mocked<UserService>;

  const studentId = new Types.ObjectId().toString();
  const collegeId = new Types.ObjectId().toString();

  beforeEach(() => {
    studentRepository = {
      findByStudentAndCollege: jest.fn(),
      findAllByStudentId: jest.fn(),
      findStudentIdsByCollegeId: jest.fn(),
      findCollegeIdsByStudentId: jest.fn(),
      upsertByStudentAndCollege: jest.fn(),
      deleteByStudentAndCollege: jest.fn(),
      deleteManyByCollegeId: jest.fn(),
    } as unknown as jest.Mocked<ACStudentRepository>;

    userService = {
      getUserByIdRaw: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    service = new StudentService(studentRepository, userService);
  });

  const expectApiError = async (
    fn: () => Promise<unknown>,
    status: number,
    message?: string,
  ) => {
    try {
      await fn();
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.getStatus()).toBe(status);
      if (message) {
        expect(apiError.getResponse()).toEqual(
          expect.objectContaining({ message }),
        );
      }
    }
  };

  it('should validate ids for membership lookup', async () => {
    await expectApiError(
      () =>
        service.getMembershipByStudentAndCollege({
          studentId: 'bad',
          collegeId,
        }),
      HttpStatus.BAD_REQUEST,
      USER_MESSAGES.INVALID_ID,
    );
    await expectApiError(
      () =>
        service.getMembershipByStudentAndCollege({
          studentId,
          collegeId: 'bad',
        }),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );
  });

  it('should fetch membership and throw forbidden when missing', async () => {
    studentRepository.findByStudentAndCollege
      .mockResolvedValueOnce({ id: 'm1' } as never)
      .mockResolvedValueOnce(null as never);

    const found = await service.getMembershipByStudentAndCollege({
      studentId,
      collegeId,
    });
    expect(found).toEqual({ id: 'm1' });

    await expectApiError(
      () =>
        service.getMembershipByStudentAndCollegeOrThrow({
          studentId,
          collegeId,
        }),
      HttpStatus.FORBIDDEN,
      COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
    );
  });

  it('should assert membership by delegating to throw helper', async () => {
    studentRepository.findByStudentAndCollege.mockResolvedValue({ id: 'm1' } as never);
    await expect(
      service.assertStudentMembership({ studentId, collegeId }),
    ).resolves.toBeUndefined();
  });

  it('should list memberships and ids with validation', async () => {
    studentRepository.findAllByStudentId.mockResolvedValue({
      students: [],
      total: 0,
    } as never);
    studentRepository.findStudentIdsByCollegeId.mockResolvedValue([studentId]);
    studentRepository.findCollegeIdsByStudentId.mockResolvedValue([collegeId]);

    const memberships = await service.listStudentMemberships({
      studentId,
      page: 1,
      size: 10,
    });
    expect(memberships).toEqual({ students: [], total: 0 });

    await expectApiError(
      () => service.listStudentMemberships({ studentId: 'bad', page: 1, size: 10 }),
      HttpStatus.BAD_REQUEST,
      USER_MESSAGES.INVALID_ID,
    );

    expect(await service.listCollegeStudentIds(collegeId)).toEqual([studentId]);
    await expectApiError(
      () => service.listCollegeStudentIds('bad'),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    expect(await service.listStudentCollegeIds(studentId)).toEqual([collegeId]);
    await expectApiError(
      () => service.listStudentCollegeIds('bad'),
      HttpStatus.BAD_REQUEST,
      USER_MESSAGES.INVALID_ID,
    );
  });

  it('should assign student to college and preserve existing membership values', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: studentId,
      role: UserRole.STUDENT,
    } as never);
    studentRepository.findByStudentAndCollege.mockResolvedValue({
      program: 'BCA',
      year: 2,
    } as never);
    studentRepository.upsertByStudentAndCollege.mockResolvedValue({
      id: 'm1',
      program: 'BCA',
      year: 2,
    } as never);

    const assigned = await service.assignStudentToCollege({
      studentId,
      collegeId,
    });
    expect(assigned).toEqual({ id: 'm1', program: 'BCA', year: 2 });
    expect(studentRepository.upsertByStudentAndCollege).toHaveBeenCalledWith(
      studentId,
      collegeId,
      expect.objectContaining({
        studentId: expect.any(Types.ObjectId),
        collegeId: expect.any(Types.ObjectId),
        program: 'BCA',
        year: 2,
      }),
    );
  });

  it('should reject assign when ids are invalid or user role is not candidate', async () => {
    await expectApiError(
      () =>
        service.assignStudentToCollege({
          studentId: 'bad',
          collegeId,
        }),
      HttpStatus.BAD_REQUEST,
      USER_MESSAGES.INVALID_ID,
    );

    await expectApiError(
      () =>
        service.assignStudentToCollege({
          studentId,
          collegeId: 'bad',
        }),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );

    userService.getUserByIdRaw.mockResolvedValue({
      id: studentId,
      role: UserRole.RECRUITER,
    } as never);
    await expectApiError(
      () =>
        service.assignStudentToCollege({
          studentId,
          collegeId,
        }),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.STUDENT_ROLE_REQUIRED,
    );
  });

  it('should remove student membership and all memberships by college', async () => {
    studentRepository.deleteByStudentAndCollege
      .mockResolvedValueOnce({ id: 'm1' } as never)
      .mockResolvedValueOnce(null as never);
    studentRepository.deleteManyByCollegeId.mockResolvedValue({
      deletedCount: 3,
    } as never);

    const removed = await service.removeStudentFromCollege({ studentId, collegeId });
    expect(removed).toEqual({ id: 'm1' });

    await expectApiError(
      () => service.removeStudentFromCollege({ studentId, collegeId }),
      HttpStatus.NOT_FOUND,
      COLLEGE_MESSAGES.STUDENT_NOT_IN_COLLEGE,
    );

    expect(await service.removeAllByCollegeId(collegeId)).toEqual({
      deletedCount: 3,
    });
  });

  it('should validate ids on removal operations', async () => {
    await expectApiError(
      () => service.removeStudentFromCollege({ studentId, collegeId: 'bad' }),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );
    await expectApiError(
      () => service.removeAllByCollegeId('bad'),
      HttpStatus.BAD_REQUEST,
      COLLEGE_MESSAGES.INVALID_ID,
    );
  });
});


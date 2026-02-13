import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import {
  COLLEGE_MESSAGES,
  USER_MESSAGES,
} from 'src/constants/messages.constants';
import { ACStudentRepository } from 'src/repositories/student.repository';
import { UserRole } from 'src/types/user-role.enum';
import { UserService } from './user.service';

@Injectable()
export class StudentService {
  constructor(
    private readonly studentRepository: ACStudentRepository,
    private readonly userService: UserService,
  ) {}

  async getMembershipByStudentAndCollege(input: {
    studentId: string;
    collegeId: string;
  }) {
    const { studentId, collegeId } = input;

    if (!studentId || !isValidObjectId(studentId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    return await this.studentRepository.findByStudentAndCollege({
      studentId,
      collegeId,
    });
  }

  async getMembershipByStudentAndCollegeOrThrow(input: {
    studentId: string;
    collegeId: string;
  }) {
    const membership = await this.getMembershipByStudentAndCollege(input);
    if (!membership) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COLLEGE_MESSAGES.FORBIDDEN_COLLEGE_ACCESS,
      });
    }

    return membership;
  }

  async assertStudentMembership(input: { studentId: string; collegeId: string }) {
    await this.getMembershipByStudentAndCollegeOrThrow(input);
  }

  async listStudentMemberships(input: {
    studentId: string;
    page: number;
    size: number;
  }) {
    const { studentId, page, size } = input;

    if (!studentId || !isValidObjectId(studentId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    return await this.studentRepository.findAllByStudentId({
      studentId,
      page,
      size,
    });
  }

  async listCollegeStudentIds(collegeId: string) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    return await this.studentRepository.findStudentIdsByCollegeId(collegeId);
  }

  async listStudentCollegeIds(studentId: string) {
    if (!studentId || !isValidObjectId(studentId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    return await this.studentRepository.findCollegeIdsByStudentId(studentId);
  }

  async assignStudentToCollege(input: {
    studentId: string;
    collegeId: string;
    program?: string;
    year?: number;
  }) {
    const { studentId, collegeId, program, year } = input;

    if (!studentId || !isValidObjectId(studentId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    await this.assertStudentRole(studentId);

    const existingMembership =
      await this.studentRepository.findByStudentAndCollege({
        studentId,
        collegeId,
      });

    const membership = await this.studentRepository.upsertByStudentAndCollege(
      studentId,
      collegeId,
      {
        studentId: new Types.ObjectId(studentId),
        collegeId: new Types.ObjectId(collegeId),
        program: program ?? existingMembership?.program ?? null,
        year: year ?? existingMembership?.year ?? null,
      },
    );

    return membership;
  }

  async removeStudentFromCollege(input: { studentId: string; collegeId: string }) {
    const { studentId, collegeId } = input;

    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    const deletedMembership = await this.studentRepository.deleteByStudentAndCollege({
      studentId,
      collegeId,
    });
    if (!deletedMembership) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COLLEGE_MESSAGES.STUDENT_NOT_IN_COLLEGE,
      });
    }

    return deletedMembership;
  }

  async removeAllByCollegeId(collegeId: string) {
    if (!collegeId || !isValidObjectId(collegeId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.INVALID_ID,
      });
    }

    return await this.studentRepository.deleteManyByCollegeId(collegeId);
  }

  private async assertStudentRole(studentId: string) {
    const studentUser = await this.userService.getUserByIdRaw(studentId);
    if (
      studentUser.role !== UserRole.USER &&
      studentUser.role !== UserRole.STUDENT
    ) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COLLEGE_MESSAGES.STUDENT_ROLE_REQUIRED,
      });
    }
  }
}

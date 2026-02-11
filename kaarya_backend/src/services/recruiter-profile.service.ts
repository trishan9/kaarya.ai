import { HttpStatus, Injectable } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import {
  COMPANY_MESSAGES,
  USER_MESSAGES,
} from 'src/constants/messages.constants';
import { ACRecruiterProfileRepository } from 'src/repositories/recruiter-profile.repository';
import { UserRole } from 'src/types/user-role.enum';
import { UserService } from './user.service';

@Injectable()
export class RecruiterProfileService {
  constructor(
    private readonly recruiterProfileRepository: ACRecruiterProfileRepository,
    private readonly userService: UserService,
  ) {}

  async getRecruiterProfileByUserId(recruiterId: string) {
    if (!recruiterId || !isValidObjectId(recruiterId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    return await this.recruiterProfileRepository.findFirstByRecruiterId(
      recruiterId,
    );
  }

  async getRecruiterProfileByUserIdOrThrow(recruiterId: string) {
    const profile = await this.getRecruiterProfileByUserId(recruiterId);
    if (!profile) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COMPANY_MESSAGES.RECRUITER_PROFILE_MISSING,
      });
    }

    return profile;
  }

  async getMembershipByRecruiterAndCompany(input: {
    recruiterId: string;
    companyId: string;
  }) {
    const { recruiterId, companyId } = input;
    if (!recruiterId || !isValidObjectId(recruiterId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    return await this.recruiterProfileRepository.findByRecruiterAndCompany({
      recruiterId,
      companyId,
    });
  }

  async getMembershipByRecruiterAndCompanyOrThrow(input: {
    recruiterId: string;
    companyId: string;
  }) {
    const membership = await this.getMembershipByRecruiterAndCompany(input);
    if (!membership) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
      });
    }

    return membership;
  }

  async assertRecruiterMembership(input: { recruiterId: string; companyId: string }) {
    await this.getMembershipByRecruiterAndCompanyOrThrow(input);
  }

  async listRecruiterMemberships(input: {
    recruiterId: string;
    page: number;
    size: number;
  }) {
    const { recruiterId, page, size } = input;

    if (!recruiterId || !isValidObjectId(recruiterId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    return await this.recruiterProfileRepository.findAllByRecruiterId({
      recruiterId,
      page,
      size,
    });
  }

  async assignRecruiterToCompany(input: {
    recruiterId: string;
    companyId: string;
    designation?: string;
  }) {
    const { recruiterId, companyId, designation } = input;

    if (!recruiterId || !isValidObjectId(recruiterId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: USER_MESSAGES.INVALID_ID,
      });
    }

    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    await this.assertRecruiterRole(recruiterId);

    const existingMembership =
      await this.recruiterProfileRepository.findByRecruiterAndCompany({
        recruiterId,
        companyId,
      });

    const membership =
      await this.recruiterProfileRepository.upsertByRecruiterAndCompany(
        recruiterId,
        companyId,
        {
          recruiterId: new Types.ObjectId(recruiterId),
          companyId: new Types.ObjectId(companyId),
          designation: designation ?? existingMembership?.designation ?? null,
        },
      );

    return membership;
  }

  async removeRecruiterFromCompany(input: {
    recruiterId: string;
    companyId: string;
  }) {
    const { recruiterId, companyId } = input;

    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    const deletedMembership =
      await this.recruiterProfileRepository.deleteByRecruiterAndCompany({
        recruiterId,
        companyId,
      });
    if (!deletedMembership) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COMPANY_MESSAGES.RECRUITER_NOT_IN_COMPANY,
      });
    }

    return deletedMembership;
  }

  async resolveWritableCompanyIdForRecruiter(input: {
    recruiterId: string;
    requestedCompanyId?: string;
  }) {
    const { recruiterId, requestedCompanyId } = input;
    await this.assertRecruiterRole(recruiterId);

    if (!requestedCompanyId) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.COMPANY_CONTEXT_REQUIRED,
      });
    }

    if (!isValidObjectId(requestedCompanyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    await this.assertRecruiterMembership({
      recruiterId,
      companyId: requestedCompanyId,
    });

    return requestedCompanyId;
  }

  async removeAllByCompanyId(companyId: string) {
    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    return await this.recruiterProfileRepository.deleteManyByCompanyId(companyId);
  }

  private async assertRecruiterRole(recruiterId: string) {
    const recruiterUser = await this.userService.getUserByIdRaw(recruiterId);
    if (recruiterUser.role !== UserRole.RECRUITER) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.RECRUITER_ROLE_REQUIRED,
      });
    }
  }
}

import { HttpStatus } from '@nestjs/common';
import { ApiError } from 'src/common/errors/api-error';
import { COMPANY_MESSAGES, USER_MESSAGES } from 'src/constants/messages.constants';
import { ACRecruiterProfileRepository } from 'src/repositories/recruiter-profile.repository';
import { RecruiterProfileService } from 'src/services/recruiter-profile.service';
import { UserService } from 'src/services/user.service';
import { UserRole } from 'src/types/user-role.enum';

describe('RecruiterProfileService', () => {
  let service: RecruiterProfileService;
  let recruiterProfileRepository: jest.Mocked<ACRecruiterProfileRepository>;
  let userService: jest.Mocked<UserService>;

  const recruiterId = '507f191e810c19729de860ea';
  const companyId = '507f191e810c19729de860eb';

  const expectApiError = async (
    promise: Promise<unknown>,
    status: HttpStatus,
    message: string,
  ) => {
    try {
      await promise;
      throw new Error('Expected ApiError');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.getStatus()).toBe(status);
      expect(apiError.getResponse()).toMatchObject({ message });
    }
  };

  beforeEach(() => {
    recruiterProfileRepository = {
      create: jest.fn(),
      findFirstByRecruiterId: jest.fn(),
      findByRecruiterAndCompany: jest.fn(),
      upsertByRecruiterAndCompany: jest.fn(),
      existsByRecruiterAndCompany: jest.fn(),
      findAllByRecruiterId: jest.fn(),
      deleteByRecruiterAndCompany: jest.fn(),
      deleteManyByCompanyId: jest.fn(),
      findAllByCompanyId: jest.fn(),
    } as unknown as jest.Mocked<ACRecruiterProfileRepository>;

    userService = {
      getUserByIdRaw: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    service = new RecruiterProfileService(recruiterProfileRepository, userService);
  });

  it('should reject invalid recruiter id for lookup', async () => {
    await expectApiError(
      service.getRecruiterProfileByUserId('bad-id'),
      HttpStatus.BAD_REQUEST,
      USER_MESSAGES.INVALID_ID,
    );
  });

  it('should assign recruiter to company with incoming designation', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: recruiterId,
      role: UserRole.RECRUITER,
    } as never);
    recruiterProfileRepository.findByRecruiterAndCompany.mockResolvedValue(null);
    recruiterProfileRepository.upsertByRecruiterAndCompany.mockResolvedValue({
      id: 'membership-1',
      recruiterId,
      companyId,
      designation: 'Senior Recruiter',
    } as never);

    const result = await service.assignRecruiterToCompany({
      recruiterId,
      companyId,
      designation: 'Senior Recruiter',
    });

    expect(recruiterProfileRepository.upsertByRecruiterAndCompany).toHaveBeenCalledWith(
      recruiterId,
      companyId,
      expect.objectContaining({
        designation: 'Senior Recruiter',
      }),
    );
    expect(result).toEqual(expect.objectContaining({ id: 'membership-1' }));
  });

  it('should preserve existing designation when new designation is missing', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: recruiterId,
      role: UserRole.RECRUITER,
    } as never);
    recruiterProfileRepository.findByRecruiterAndCompany.mockResolvedValue({
      id: 'membership-1',
      designation: 'Existing Designation',
    } as never);
    recruiterProfileRepository.upsertByRecruiterAndCompany.mockResolvedValue({
      id: 'membership-1',
      designation: 'Existing Designation',
    } as never);

    await service.assignRecruiterToCompany({
      recruiterId,
      companyId,
    });

    expect(recruiterProfileRepository.upsertByRecruiterAndCompany).toHaveBeenCalledWith(
      recruiterId,
      companyId,
      expect.objectContaining({
        designation: 'Existing Designation',
      }),
    );
  });

  it('should reject assignment when user is not recruiter', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: recruiterId,
      role: UserRole.STUDENT,
    } as never);

    await expectApiError(
      service.assignRecruiterToCompany({
        recruiterId,
        companyId,
      }),
      HttpStatus.BAD_REQUEST,
      COMPANY_MESSAGES.RECRUITER_ROLE_REQUIRED,
    );
  });

  it('should require company context for writable company resolution', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: recruiterId,
      role: UserRole.RECRUITER,
    } as never);

    await expectApiError(
      service.resolveWritableCompanyIdForRecruiter({
        recruiterId,
      }),
      HttpStatus.BAD_REQUEST,
      COMPANY_MESSAGES.COMPANY_CONTEXT_REQUIRED,
    );
  });

  it('should reject invalid company id for writable resolution', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: recruiterId,
      role: UserRole.RECRUITER,
    } as never);

    await expectApiError(
      service.resolveWritableCompanyIdForRecruiter({
        recruiterId,
        requestedCompanyId: 'invalid',
      }),
      HttpStatus.BAD_REQUEST,
      COMPANY_MESSAGES.INVALID_ID,
    );
  });

  it('should resolve writable company when membership check passes', async () => {
    userService.getUserByIdRaw.mockResolvedValue({
      id: recruiterId,
      role: UserRole.RECRUITER,
    } as never);
    recruiterProfileRepository.findByRecruiterAndCompany.mockResolvedValue({
      id: 'membership-1',
    } as never);

    const result = await service.resolveWritableCompanyIdForRecruiter({
      recruiterId,
      requestedCompanyId: companyId,
    });

    expect(result).toBe(companyId);
  });

  it('should throw when removing recruiter membership that does not exist', async () => {
    recruiterProfileRepository.deleteByRecruiterAndCompany.mockResolvedValue(null);

    await expectApiError(
      service.removeRecruiterFromCompany({
        recruiterId,
        companyId,
      }),
      HttpStatus.NOT_FOUND,
      COMPANY_MESSAGES.RECRUITER_NOT_IN_COMPANY,
    );
  });

  it('should delete all memberships by company id', async () => {
    recruiterProfileRepository.deleteManyByCompanyId.mockResolvedValue(3);

    const result = await service.removeAllByCompanyId(companyId);

    expect(recruiterProfileRepository.deleteManyByCompanyId).toHaveBeenCalledWith(
      companyId,
    );
    expect(result).toBe(3);
  });
});

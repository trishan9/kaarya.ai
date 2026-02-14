import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError } from 'src/common/errors/api-error';
import { COMPANY_MESSAGES } from 'src/constants/messages.constants';
import { CompanyService } from 'src/services/company.service';
import { EmailService } from 'src/services/email.service';
import { RecruiterProfileService } from 'src/services/recruiter-profile.service';
import { UserService } from 'src/services/user.service';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACRecruiterProfileRepository } from 'src/repositories/recruiter-profile.repository';
import { UserRole } from 'src/types/user-role.enum';

describe('CompanyService', () => {
  let service: CompanyService;
  let configService: jest.Mocked<ConfigService>;
  let companyRepository: jest.Mocked<ACCompanyRepository>;
  let jobPostingRepository: jest.Mocked<ACJobPostingRepository>;
  let recruiterProfileRepository: jest.Mocked<ACRecruiterProfileRepository>;
  let recruiterProfileService: jest.Mocked<RecruiterProfileService>;
  let userService: jest.Mocked<UserService>;
  let emailService: jest.Mocked<EmailService>;

  const recruiterId = '507f191e810c19729de860ea';
  const recruiter2Id = '507f191e810c19729de860eb';
  const companyId = '507f191e810c19729de860ec';

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
    configService = {
      get: jest.fn().mockReturnValue('https://app.kaarya.test'),
    } as unknown as jest.Mocked<ConfigService>;

    companyRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findByIds: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ACCompanyRepository>;

    jobPostingRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteManyByCompanyId: jest.fn(),
      incrementViewsCount: jest.fn(),
      setApplicationsCount: jest.fn(),
    } as unknown as jest.Mocked<ACJobPostingRepository>;

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

    recruiterProfileService = {
      assignRecruiterToCompany: jest.fn(),
      removeAllByCompanyId: jest.fn(),
      listRecruiterMemberships: jest.fn(),
      getMembershipByRecruiterAndCompany: jest.fn(),
      getRecruiterProfileByUserIdOrThrow: jest.fn(),
      assertRecruiterMembership: jest.fn(),
      removeRecruiterFromCompany: jest.fn(),
    } as unknown as jest.Mocked<RecruiterProfileService>;

    userService = {
      getUserByEmail: jest.fn(),
      getUserByIdRaw: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    emailService = {
      sendCompanyInvite: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    service = new CompanyService(
      configService,
      companyRepository,
      jobPostingRepository,
      recruiterProfileRepository,
      recruiterProfileService,
      userService,
      emailService,
    );
  });

  it('should create company and auto-assign recruiter creator', async () => {
    companyRepository.create.mockResolvedValue({
      id: companyId,
      name: 'Acme',
      inviteCode: 'KR-ABCD1234',
      verifiedStatus: false,
    } as never);

    const result = await service.createCompany(
      {
        id: recruiterId,
        role: UserRole.RECRUITER,
        email: 'recruiter@example.com',
      },
      {
        name: 'Acme',
        designation: 'Talent Partner',
      },
    );

    expect(companyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme',
        verifiedStatus: false,
        createdBy: expect.anything(),
      }),
    );
    expect(recruiterProfileService.assignRecruiterToCompany).toHaveBeenCalledWith(
      {
        recruiterId,
        companyId,
        designation: 'Talent Partner',
      },
    );
    expect(result).toEqual(expect.objectContaining({ id: companyId }));
  });

  it('should allow admin to set verifiedStatus on create', async () => {
    companyRepository.create.mockResolvedValue({
      id: companyId,
      name: 'Admin Co',
      inviteCode: 'KR-ADMIN',
      verifiedStatus: true,
    } as never);

    await service.createCompany(
      { id: recruiterId, role: UserRole.ADMIN },
      {
        name: 'Admin Co',
        verifiedStatus: true,
      },
    );

    expect(companyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        verifiedStatus: true,
      }),
    );
    expect(recruiterProfileService.assignRecruiterToCompany).not.toHaveBeenCalled();
  });

  it('should reject company update for invalid id', async () => {
    await expectApiError(
      service.updateCompany(
        { id: recruiterId, role: UserRole.ADMIN },
        'bad-id',
        { name: 'Updated' },
      ),
      HttpStatus.BAD_REQUEST,
      COMPANY_MESSAGES.INVALID_ID,
    );
  });

  it('should strip recruiter attempt to update verifiedStatus', async () => {
    companyRepository.updateById.mockResolvedValue({
      id: companyId,
      name: 'Updated Co',
      verifiedStatus: false,
    } as never);
    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);

    await service.updateCompany(
      { id: recruiterId, role: UserRole.RECRUITER },
      companyId,
      {
        verifiedStatus: true,
        name: 'Updated Co',
      },
    );

    expect(companyRepository.updateById).toHaveBeenCalledWith(
      companyId,
      expect.objectContaining({
        name: 'Updated Co',
        verifiedStatus: undefined,
      }),
    );
  });

  it('should block non-recruiters from joining by code', async () => {
    await expectApiError(
      service.joinCompanyByInviteCode(
        { id: recruiterId, role: UserRole.STUDENT },
        { inviteCode: 'KR-TEST' },
      ),
      HttpStatus.FORBIDDEN,
      COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );
  });

  it('should fail join-by-code for unknown invite code', async () => {
    companyRepository.findByInviteCode.mockResolvedValue(null);

    await expectApiError(
      service.joinCompanyByInviteCode(
        { id: recruiterId, role: UserRole.RECRUITER },
        { inviteCode: 'KR-MISSING' },
      ),
      HttpStatus.NOT_FOUND,
      COMPANY_MESSAGES.INVITE_CODE_INVALID,
    );
  });

  it('should reject invite when invitee exists with non-recruiter role', async () => {
    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    companyRepository.findById.mockResolvedValue({
      id: companyId,
      name: 'Acme',
      inviteCode: 'KR-READY',
    } as never);
    userService.getUserByEmail.mockResolvedValue({
      id: recruiter2Id,
      role: UserRole.STUDENT,
    } as never);

    await expectApiError(
      service.inviteRecruiterToCompany(
        { id: recruiterId, role: UserRole.RECRUITER },
        companyId,
        { email: 'student@example.com' },
      ),
      HttpStatus.BAD_REQUEST,
      COMPANY_MESSAGES.INVITEE_ROLE_REQUIRED,
    );
  });

  it('should return inviteCode and inviteLink when inviting recruiter', async () => {
    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    companyRepository.findById.mockResolvedValue({
      id: companyId,
      name: 'Acme',
      inviteCode: null,
      logo: 'https://img/logo.png',
    } as never);
    companyRepository.findByInviteCode.mockResolvedValue(null);
    companyRepository.updateById.mockResolvedValue({
      id: companyId,
      name: 'Acme',
      inviteCode: 'KR-AB12CD34',
    } as never);
    userService.getUserByEmail.mockResolvedValue(null);
    userService.getUserByIdRaw.mockResolvedValue({
      id: recruiterId,
      name: 'Recruiter Owner',
    } as never);
    emailService.sendCompanyInvite.mockRejectedValue(new Error('SMTP down'));

    const result = await service.inviteRecruiterToCompany(
      { id: recruiterId, role: UserRole.RECRUITER },
      companyId,
      { email: 'invitee@example.com', designation: 'Hiring Manager' },
    );

    expect(companyRepository.updateById).toHaveBeenCalledWith(companyId, {
      inviteCode: expect.stringMatching(/^KR-/),
    });
    expect(emailService.sendCompanyInvite).toHaveBeenCalledWith(
      'invitee@example.com',
      expect.objectContaining({
        inviteCode: expect.stringMatching(/^KR-/),
        inviteLink: expect.stringContaining('company-invites?companyId='),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        inviteeEmail: 'invitee@example.com',
        inviteCode: expect.stringMatching(/^KR-/),
        inviteLink: expect.stringContaining('inviteCode='),
        emailSent: false,
      }),
    );
  });

  it('should reject invite when invitee already belongs to workspace', async () => {
    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    companyRepository.findById.mockResolvedValue({
      id: companyId,
      name: 'Acme',
      inviteCode: 'KR-READY',
    } as never);
    userService.getUserByEmail.mockResolvedValue({
      id: recruiter2Id,
      role: UserRole.RECRUITER,
    } as never);
    recruiterProfileService.getMembershipByRecruiterAndCompany.mockResolvedValue(
      { id: 'membership-1' } as never,
    );

    await expectApiError(
      service.inviteRecruiterToCompany(
        { id: recruiterId, role: UserRole.RECRUITER },
        companyId,
        { email: 'recruiter2@example.com' },
      ),
      HttpStatus.CONFLICT,
      COMPANY_MESSAGES.INVITEE_ALREADY_IN_COMPANY,
    );
  });

  it('should reset invite code for authorized recruiter', async () => {
    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    companyRepository.findByInviteCode.mockResolvedValue(null);
    companyRepository.updateById.mockResolvedValue({
      id: companyId,
      name: 'Acme',
      logo: null,
      inviteCode: 'KR-NEWCODE',
    } as never);

    const result = await service.resetCompanyInviteCode(
      { id: recruiterId, role: UserRole.RECRUITER },
      companyId,
    );

    expect(result).toEqual(
      expect.objectContaining({
        inviteCode: 'KR-NEWCODE',
      }),
    );
  });

  it('should block non-recruiter workspace listing', async () => {
    await expectApiError(
      service.listRecruiterWorkspaces(
        { id: recruiterId, role: UserRole.USER },
        { page: 1, size: 10 },
      ),
      HttpStatus.FORBIDDEN,
      COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
    );
  });

  it('should remove jobs and memberships when deleting company', async () => {
    recruiterProfileService.assertRecruiterMembership.mockResolvedValue(undefined);
    jobPostingRepository.deleteManyByCompanyId.mockResolvedValue(3);
    recruiterProfileService.removeAllByCompanyId.mockResolvedValue(2 as never);
    companyRepository.deleteById.mockResolvedValue({
      id: companyId,
      name: 'Acme',
    } as never);

    const result = await service.deleteCompany(
      { id: recruiterId, role: UserRole.RECRUITER },
      companyId,
    );

    expect(jobPostingRepository.deleteManyByCompanyId).toHaveBeenCalledWith(
      companyId,
    );
    expect(recruiterProfileService.removeAllByCompanyId).toHaveBeenCalledWith(
      companyId,
    );
    expect(result).toEqual(expect.objectContaining({ id: companyId }));
  });

  it('should throw when invite code generation cannot find unique value', async () => {
    companyRepository.findByInviteCode.mockResolvedValue({ id: 'taken' } as never);

    await expectApiError(
      service.createCompany(
        { id: recruiterId, role: UserRole.ADMIN },
        {
          name: 'No Code Co',
        },
      ),
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Unable to generate a unique invite code.',
    );
  });
});

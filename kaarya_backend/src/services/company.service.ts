import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { isValidObjectId, Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { buildPaginationMeta } from 'src/common/utils/pagination';
import { sanitizeDocument } from 'src/common/utils/sanitize-document';
import { CONFIG_KEYS } from 'src/constants/config.constants';
import { COMPANY_MESSAGES } from 'src/constants/messages.constants';
import {
  TCompaniesQueryDTO,
  TCompanyRecruitersQueryDTO,
  TCreateCompanyDTO,
  TJoinCompanyByCodeDTO,
  TInviteRecruiterToCompanyDTO,
  TUpdateCompanyDTO,
} from 'src/dtos/companies/company.dto';
import { ACCompanyRepository } from 'src/repositories/company.repository';
import { ACJobPostingRepository } from 'src/repositories/job-posting.repository';
import { ACRecruiterProfileRepository } from 'src/repositories/recruiter-profile.repository';
import { TAuthenticatedUser } from 'src/types/authenticated-user.type';
import { AllConfigType } from 'src/types/config.type';
import { UserRole } from 'src/types/user-role.enum';
import { EmailService } from './email.service';
import { RecruiterProfileService } from './recruiter-profile.service';
import { UserService } from './user.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly companyRepository: ACCompanyRepository,
    private readonly jobPostingRepository: ACJobPostingRepository,
    private readonly recruiterProfileRepository: ACRecruiterProfileRepository,
    private readonly recruiterProfileService: RecruiterProfileService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  async createCompany(
    currentUser: TAuthenticatedUser,
    payload: TCreateCompanyDTO,
  ) {
    const inviteCode = await this.generateUniqueInviteCode();
    const company = await this.companyRepository.create({
      name: payload.name,
      industry: payload.industry ?? null,
      location: payload.location ?? null,
      logo: payload.logo ?? null,
      inviteCode,
      verifiedStatus:
        currentUser.role === UserRole.ADMIN
          ? Boolean(payload.verifiedStatus)
          : false,
      createdBy: new Types.ObjectId(currentUser.id),
    });

    if (currentUser.role === UserRole.RECRUITER) {
      await this.recruiterProfileService.assignRecruiterToCompany({
        recruiterId: currentUser.id,
        companyId: company.id,
        designation: payload.designation,
      });
    }

    return sanitizeDocument(company);
  }

  async updateCompany(
    currentUser: TAuthenticatedUser,
    companyId: string,
    payload: TUpdateCompanyDTO,
  ) {
    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCompany(currentUser, companyId);

    const updatePayload = {
      ...payload,
      ...(currentUser.role !== UserRole.ADMIN &&
      Object.prototype.hasOwnProperty.call(payload, 'verifiedStatus')
        ? { verifiedStatus: undefined }
        : {}),
    };

    const company = await this.companyRepository.updateById(
      companyId,
      updatePayload,
    );

    if (!company) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COMPANY_MESSAGES.NOT_FOUND,
      });
    }

    return sanitizeDocument(company);
  }

  async deleteCompany(currentUser: TAuthenticatedUser, companyId: string) {
    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCompany(currentUser, companyId);

    await Promise.all([
      this.jobPostingRepository.deleteManyByCompanyId(companyId),
      this.recruiterProfileService.removeAllByCompanyId(companyId),
    ]);

    const deletedCompany = await this.companyRepository.deleteById(companyId);
    if (!deletedCompany) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COMPANY_MESSAGES.NOT_FOUND,
      });
    }

    return sanitizeDocument(deletedCompany);
  }

  async listCompanies(query: TCompaniesQueryDTO) {
    const { companies, total } = await this.companyRepository.findAll(query);

    return {
      companies: companies
        .map((company) => sanitizeDocument(company))
        .filter((company): company is Record<string, unknown> => !!company),
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
        search: query.search,
      }),
    };
  }

  async listRecruiterWorkspaces(
    currentUser: TAuthenticatedUser,
    query: TCompanyRecruitersQueryDTO,
  ) {
    if (currentUser.role !== UserRole.RECRUITER) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
      });
    }

    const { recruiterProfiles, total } =
      await this.recruiterProfileService.listRecruiterMemberships({
        recruiterId: currentUser.id,
        page: query.page,
        size: query.size,
      });

    return {
      workspaces: recruiterProfiles
        .map((profile) => this.buildWorkspaceSwitcherItem(profile))
        .filter(Boolean) as Array<Record<string, unknown>>,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
    };
  }

  async listCompanyRecruiters(
    currentUser: TAuthenticatedUser,
    companyId: string,
    query: TCompanyRecruitersQueryDTO,
  ) {
    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCompany(currentUser, companyId);
    await this.getCompanyByIdRaw(companyId);

    const { recruiterProfiles, total } =
      await this.recruiterProfileRepository.findAllByCompanyId({
        companyId,
        page: query.page,
        size: query.size,
      });

    const company = await this.getCompanyByIdRaw(companyId);

    return {
      workspace: {
        id: company.id,
        name: company.name,
        logo: company.logo ?? null,
        inviteCode: company.inviteCode ?? null,
      },
      members: recruiterProfiles
        .map((profile) => this.buildRecruiterProfileResponse(profile))
        .filter(Boolean) as Array<Record<string, unknown>>,
      meta: buildPaginationMeta({
        page: query.page,
        size: query.size,
        totalItems: total,
      }),
    };
  }

  async joinCompanyByInviteCode(
    currentUser: TAuthenticatedUser,
    payload: TJoinCompanyByCodeDTO,
  ) {
    if (currentUser.role !== UserRole.RECRUITER) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
      });
    }

    const company = await this.companyRepository.findByInviteCode(
      payload.inviteCode,
    );
    if (!company) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COMPANY_MESSAGES.INVITE_CODE_INVALID,
      });
    }

    const membership =
      await this.recruiterProfileService.assignRecruiterToCompany({
        recruiterId: currentUser.id,
        companyId: company.id,
        designation: payload.designation,
      });

    return {
      workspace: {
        id: company.id,
        name: company.name,
        logo: company.logo ?? null,
        inviteCode: company.inviteCode ?? null,
      },
      member: sanitizeDocument(membership),
    };
  }

  async resetCompanyInviteCode(
    currentUser: TAuthenticatedUser,
    companyId: string,
  ) {
    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCompany(currentUser, companyId);
    const inviteCode = await this.generateUniqueInviteCode();
    const company = await this.companyRepository.updateById(companyId, {
      inviteCode,
    });

    if (!company) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COMPANY_MESSAGES.NOT_FOUND,
      });
    }

    return {
      company: {
        id: company.id,
        name: company.name,
        logo: company.logo ?? null,
      },
      inviteCode: company.inviteCode,
    };
  }

  async inviteRecruiterToCompany(
    currentUser: TAuthenticatedUser,
    companyId: string,
    payload: TInviteRecruiterToCompanyDTO,
  ) {
    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    await this.assertCanManageCompany(currentUser, companyId);
    const company = await this.getCompanyByIdRaw(companyId);
    const inviteeEmail = payload.email.trim().toLowerCase();

    const inviteeUser = await this.userService.getUserByEmail(inviteeEmail);
    if (inviteeUser && inviteeUser.role !== UserRole.RECRUITER) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVITEE_ROLE_REQUIRED,
      });
    }

    if (inviteeUser) {
      const existingMembership =
        await this.recruiterProfileService.getMembershipByRecruiterAndCompany({
          recruiterId: inviteeUser.id,
          companyId: company.id,
        });

      if (existingMembership) {
        throw new ApiError({
          statusCode: HttpStatus.CONFLICT,
          message: COMPANY_MESSAGES.INVITEE_ALREADY_IN_COMPANY,
        });
      }
    }
    const inviteCode = company.inviteCode ?? (await this.generateUniqueInviteCode());
    if (inviteCode !== company.inviteCode) {
      await this.companyRepository.updateById(company.id, { inviteCode });
    }

    const inviteLink = this.buildInviteLink(company.id, inviteCode);
    const inviterUser = await this.userService.getUserByIdRaw(currentUser.id);
    let emailSent = false;
    try {
      await this.emailService.sendCompanyInvite(inviteeEmail, {
        companyName: company.name,
        inviteCode,
        inviteLink,
        inviteeEmail,
        invitedByName: inviterUser.name,
        designation: payload.designation ?? null,
      });
      emailSent = true;
    } catch {
      emailSent = false;
    }

    return {
      workspace: {
        id: company.id,
        name: company.name,
        logo: company.logo ?? null,
      },
      inviteeEmail,
      designation: payload.designation ?? null,
      inviteCode,
      inviteLink,
      emailSent,
    };
  }

  async getCompanyById(companyId: string) {
    const company = await this.getCompanyByIdRaw(companyId);
    return sanitizeDocument(company);
  }

  async getMyCompany(currentUser: TAuthenticatedUser) {
    if (currentUser.role !== UserRole.RECRUITER) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
      });
    }

    const membership =
      await this.recruiterProfileService.getRecruiterProfileByUserIdOrThrow(
        currentUser.id,
      );
    const company = await this.getCompanyByIdRaw(membership.companyId.toString());

    return {
      company: sanitizeDocument(company),
      recruiterProfile: sanitizeDocument(membership),
    };
  }

  async attachRecruiterToCompany(input: {
    recruiterId: string;
    companyId: string;
    designation?: string;
  }) {
    const company = await this.getCompanyByIdRaw(input.companyId);
    const membership =
      await this.recruiterProfileService.assignRecruiterToCompany({
        recruiterId: input.recruiterId,
        companyId: company.id,
        designation: input.designation,
      });

    return {
      company: sanitizeDocument(company),
      recruiterProfile: sanitizeDocument(membership),
    };
  }

  async assignRecruiterToCompanyByAdmin(input: {
    recruiterId: string;
    companyId: string;
    designation?: string;
  }) {
    return await this.attachRecruiterToCompany(input);
  }

  async removeRecruiterFromCompanyByAdmin(input: {
    recruiterId: string;
    companyId: string;
  }) {
    const company = await this.getCompanyByIdRaw(input.companyId);
    const removedMembership =
      await this.recruiterProfileService.removeRecruiterFromCompany({
        recruiterId: input.recruiterId,
        companyId: company.id,
      });

    return {
      company: sanitizeDocument(company),
      recruiterProfile: sanitizeDocument(removedMembership),
    };
  }

  async getCompanyByIdRaw(companyId: string) {
    if (!companyId || !isValidObjectId(companyId)) {
      throw new ApiError({
        statusCode: HttpStatus.BAD_REQUEST,
        message: COMPANY_MESSAGES.INVALID_ID,
      });
    }

    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new ApiError({
        statusCode: HttpStatus.NOT_FOUND,
        message: COMPANY_MESSAGES.NOT_FOUND,
      });
    }

    return company;
  }

  async assertCanManageCompany(
    currentUser: TAuthenticatedUser,
    companyId: string,
  ) {
    if (currentUser.role === UserRole.ADMIN) {
      return;
    }

    if (currentUser.role !== UserRole.RECRUITER) {
      throw new ApiError({
        statusCode: HttpStatus.FORBIDDEN,
        message: COMPANY_MESSAGES.FORBIDDEN_COMPANY_ACCESS,
      });
    }

    await this.recruiterProfileService.assertRecruiterMembership({
      recruiterId: currentUser.id,
      companyId,
    });
  }

  private buildWorkspaceSwitcherItem(profile: unknown) {
    const membershipData = sanitizeDocument(profile);
    if (!membershipData) {
      return null;
    }

    const companyRaw = (profile as { companyId?: unknown }).companyId;
    const company =
      typeof companyRaw === 'object' && companyRaw
        ? sanitizeDocument(companyRaw)
        : null;

    const companyId =
      typeof membershipData.companyId === 'string'
        ? membershipData.companyId
        : ((membershipData.companyId as { toString?: () => string } | undefined)
            ?.toString?.() ?? null);

    const companyData =
      company ??
      (companyId
        ? {
            id: companyId,
          }
        : null);

    if (!companyData || typeof companyData.id !== 'string') {
      return null;
    }

    return {
      company:
        typeof companyData === 'object'
          ? {
              id:
                typeof companyData.id === 'string'
                  ? companyData.id
                  : String(companyData.id),
              name:
                typeof companyData.name === 'string' ? companyData.name : null,
              logo:
                typeof companyData.logo === 'string' ? companyData.logo : null,
              inviteCode:
                typeof companyData.inviteCode === 'string'
                  ? companyData.inviteCode
                  : null,
            }
          : null,
      membershipId: membershipData.id,
      designation:
        typeof membershipData.designation === 'string'
          ? membershipData.designation
          : null,
      joinedAt:
        membershipData.createdAt instanceof Date ||
        typeof membershipData.createdAt === 'string'
          ? membershipData.createdAt
          : null,
    };
  }

  private buildRecruiterProfileResponse(profile: unknown) {
    const profileData = sanitizeDocument(profile);
    if (!profileData) return null;

    const recruiterRaw = (profile as { recruiterId?: unknown }).recruiterId;
    const recruiter =
      typeof recruiterRaw === 'object' && recruiterRaw
        ? sanitizeDocument(recruiterRaw)
        : null;

    return {
      ...profileData,
      recruiter:
        recruiter ??
        (typeof profileData.recruiterId === 'string'
          ? { id: profileData.recruiterId }
          : null),
    };
  }

  private async generateUniqueInviteCode() {
    const maxAttempts = 10;
    for (let index = 0; index < maxAttempts; index += 1) {
      const code = this.generateInviteCode();
      const existing = await this.companyRepository.findByInviteCode(code);
      if (!existing) {
        return code;
      }
    }

    throw new ApiError({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unable to generate a unique invite code.',
    });
  }

  private generateInviteCode() {
    const raw = randomBytes(4).toString('hex').toUpperCase();
    return `KR-${raw}`;
  }

  private buildInviteLink(companyId: string, inviteCode: string) {
    const frontendDomain =
      this.configService.get(CONFIG_KEYS.APP.FRONTEND_DOMAIN, {
        infer: true,
      }) ?? 'http://localhost:3000';
    const cleanBase = frontendDomain.replace(/\/$/, '');
    return `${cleanBase}/company-invites?companyId=${encodeURIComponent(companyId)}&inviteCode=${encodeURIComponent(inviteCode)}`;
  }
}

import { Types } from 'mongoose';
import { ApiError } from 'src/common/errors/api-error';
import { COMPANY_MESSAGES } from 'src/constants/messages.constants';
import { CompanyController } from 'src/controllers/company.controller';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { CompanyService } from 'src/services/company.service';

describe('CompanyController', () => {
  let controller: CompanyController;
  let companyService: jest.Mocked<CompanyService>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const userId = new Types.ObjectId().toString();
  const companyId = new Types.ObjectId().toString();
  const recruiterId = new Types.ObjectId().toString();

  beforeEach(() => {
    companyService = {
      listCompanies: jest.fn(),
      getMyCompany: jest.fn(),
      listRecruiterWorkspaces: jest.fn(),
      getCompanyById: jest.fn(),
      joinCompanyByInviteCode: jest.fn(),
      createCompany: jest.fn(),
      updateCompany: jest.fn(),
      resetCompanyInviteCode: jest.fn(),
      deleteCompany: jest.fn(),
      listCompanyRecruiters: jest.fn(),
      inviteRecruiterToCompany: jest.fn(),
      assignRecruiterToCompanyByAdmin: jest.fn(),
      removeRecruiterFromCompanyByAdmin: jest.fn(),
    } as never;

    cloudinaryService = {
      uploadImage: jest.fn(),
    } as never;

    controller = new CompanyController(companyService, cloudinaryService);
  });

  it('should list companies and validate query', async () => {
    companyService.listCompanies.mockResolvedValue({
      companies: [],
      meta: { page: 1, size: 10, totalItems: 0 },
    } as never);

    const result = await controller.listCompanies({ page: 1, size: 10 });
    expect(result.message).toBe(COMPANY_MESSAGES.FETCH_ALL_SUCCESS);
    expect(companyService.listCompanies).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, size: 10 }),
    );

    await expect(
      controller.listCompanies({ page: 0, size: 10 } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get my company', async () => {
    companyService.getMyCompany.mockResolvedValue({ company: { id: companyId } } as never);

    const result = await controller.getMyCompany({
      user: { id: userId, role: 'recruiter' } as never,
    });

    expect(result.message).toBe(COMPANY_MESSAGES.FETCH_SUCCESS);
    expect(companyService.getMyCompany).toHaveBeenCalledWith(
      expect.objectContaining({ id: userId }),
    );
  });

  it('should list recruiter workspaces and validate query', async () => {
    companyService.listRecruiterWorkspaces.mockResolvedValue({
      workspaces: [],
      meta: { page: 1, size: 10, totalItems: 0 },
    } as never);

    const result = await controller.listMyWorkspaces(
      { user: { id: userId, role: 'recruiter' } as never },
      { page: 1, size: 10 },
    );
    expect(result.message).toBe(COMPANY_MESSAGES.WORKSPACES_FETCH_SUCCESS);

    await expect(
      controller.listMyWorkspaces(
        { user: { id: userId } as never },
        { page: 0, size: 10 } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should get company by id and reject invalid id', async () => {
    companyService.getCompanyById.mockResolvedValue({ id: companyId } as never);

    const result = await controller.getCompanyById(companyId);
    expect(result.message).toBe(COMPANY_MESSAGES.FETCH_SUCCESS);

    await expect(controller.getCompanyById('bad-id')).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('should join company by code and validate payload', async () => {
    companyService.joinCompanyByInviteCode.mockResolvedValue({
      workspace: { id: companyId },
      member: { id: 'member-1' },
    } as never);

    const result = await controller.joinCompanyByCode(
      { user: { id: userId, role: 'recruiter' } as never },
      { inviteCode: ' abcd ', designation: 'Hiring Manager' },
    );
    expect(result.message).toBe(COMPANY_MESSAGES.JOIN_BY_CODE_SUCCESS);

    await expect(
      controller.joinCompanyByCode(
        { user: { id: userId } as never },
        { inviteCode: '' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should create company with optional logo upload and validate payload', async () => {
    cloudinaryService.uploadImage.mockResolvedValue('https://cdn.example/logo.png');
    companyService.createCompany.mockResolvedValue({ id: companyId } as never);

    const created = await controller.createCompany(
      { user: { id: userId, role: 'recruiter' } as never },
      { name: 'Kaarya', industry: 'SaaS', location: 'Remote' },
      { mimetype: 'image/png' } as never,
    );

    expect(created.message).toBe(COMPANY_MESSAGES.CREATE_SUCCESS);
    expect(cloudinaryService.uploadImage).toHaveBeenCalled();

    await expect(
      controller.createCompany(
        { user: { id: userId } as never },
        { name: 'a' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should update company and validate id/payload', async () => {
    cloudinaryService.uploadImage.mockResolvedValue('https://cdn.example/logo-updated.png');
    companyService.updateCompany.mockResolvedValue({ id: companyId } as never);

    const updated = await controller.updateCompany(
      { user: { id: userId, role: 'recruiter' } as never },
      companyId,
      { name: 'Kaarya AI Updated' },
      { mimetype: 'image/png' } as never,
    );

    expect(updated.message).toBe(COMPANY_MESSAGES.UPDATE_SUCCESS);
    expect(companyService.updateCompany).toHaveBeenCalled();

    await expect(
      controller.updateCompany(
        { user: { id: userId } as never },
        'bad-id',
        { name: 'Valid Name' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.updateCompany(
        { user: { id: userId } as never },
        companyId,
        {} as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should reset invite code and delete company with id validation', async () => {
    companyService.resetCompanyInviteCode.mockResolvedValue({
      company: { id: companyId },
      inviteCode: 'KP-ABCD',
    } as never);
    companyService.deleteCompany.mockResolvedValue({ id: companyId } as never);

    const reset = await controller.resetInviteCode(
      { user: { id: userId } as never },
      companyId,
    );
    expect(reset.message).toBe(COMPANY_MESSAGES.INVITE_CODE_RESET_SUCCESS);

    const deleted = await controller.deleteCompany(
      { user: { id: userId } as never },
      companyId,
    );
    expect(deleted.message).toBe(COMPANY_MESSAGES.DELETE_SUCCESS);

    await expect(
      controller.resetInviteCode({ user: { id: userId } as never }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.deleteCompany({ user: { id: userId } as never }, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should list company recruiters and validate id/query', async () => {
    companyService.listCompanyRecruiters.mockResolvedValue({
      company: { id: companyId },
      recruiters: [],
      meta: { page: 1, size: 10, totalItems: 0 },
    } as never);

    const result = await controller.listCompanyRecruiters(
      { user: { id: userId } as never },
      companyId,
      { page: 1, size: 10 },
    );
    expect(result.message).toBe(COMPANY_MESSAGES.FETCH_ALL_SUCCESS);

    await expect(
      controller.listCompanyRecruiters(
        { user: { id: userId } as never },
        'bad-id',
        { page: 1, size: 10 } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.listCompanyRecruiters(
        { user: { id: userId } as never },
        companyId,
        { page: 0, size: 10 } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should invite recruiter and validate id/payload', async () => {
    companyService.inviteRecruiterToCompany.mockResolvedValue({
      company: { id: companyId },
      inviteeEmail: 'recruiter@example.com',
      emailSent: true,
    } as never);

    const result = await controller.inviteRecruiterToCompany(
      { user: { id: userId } as never },
      companyId,
      { email: 'recruiter@example.com', designation: 'HR' },
    );
    expect(result.message).toBe(COMPANY_MESSAGES.INVITE_CREATE_SUCCESS);

    await expect(
      controller.inviteRecruiterToCompany(
        { user: { id: userId } as never },
        'bad-id',
        { email: 'recruiter@example.com' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.inviteRecruiterToCompany(
        { user: { id: userId } as never },
        companyId,
        { email: 'bad-email' } as never,
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should assign recruiter to company and validate id/payload', async () => {
    companyService.assignRecruiterToCompanyByAdmin.mockResolvedValue({
      company: { id: companyId },
      recruiter: { id: recruiterId },
    } as never);

    const result = await controller.assignRecruiterToCompany(companyId, {
      recruiterId,
      designation: 'Lead Recruiter',
    });
    expect(result.message).toBe(COMPANY_MESSAGES.RECRUITER_ASSIGN_SUCCESS);

    await expect(
      controller.assignRecruiterToCompany('bad-id', {
        recruiterId,
      } as never),
    ).rejects.toBeInstanceOf(ApiError);

    await expect(
      controller.assignRecruiterToCompany(companyId, {
        recruiterId: 'bad-id',
      } as never),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('should remove recruiter from company and validate ids', async () => {
    companyService.removeRecruiterFromCompanyByAdmin.mockResolvedValue({
      company: { id: companyId },
      recruiter: { id: recruiterId },
    } as never);

    const result = await controller.removeRecruiterFromCompany(
      companyId,
      recruiterId,
    );
    expect(result.message).toBe(COMPANY_MESSAGES.RECRUITER_DELETE_SUCCESS);

    await expect(
      controller.removeRecruiterFromCompany('bad-id', recruiterId),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      controller.removeRecruiterFromCompany(companyId, 'bad-id'),
    ).rejects.toBeInstanceOf(ApiError);
  });
});


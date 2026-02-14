import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { RecruiterProfileRepository } from 'src/repositories/recruiter-profile.repository';
import { RecruiterProfileSchemaClass } from 'src/entities/recruiter-profile.schema';
import { UserSchemaClass } from 'src/entities/user.schema';
import { CompanySchemaClass } from 'src/entities/company.schema';
import { AuthProvider } from 'src/types/auth-provider.enum';
import { UserRole } from 'src/types/user-role.enum';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('RecruiterProfileRepository (integration)', () => {
  let module: TestingModule | undefined;
  let repository: RecruiterProfileRepository;
  let recruiterProfileModel: Model<RecruiterProfileSchemaClass>;
  let userModel: Model<UserSchemaClass>;
  let companyModel: Model<CompanySchemaClass>;
  let mongo: TestMongo | undefined;

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    repository = module.get(RecruiterProfileRepository);
    recruiterProfileModel = module.get(
      getModelToken(RecruiterProfileSchemaClass.name),
    );
    userModel = module.get(getModelToken(UserSchemaClass.name));
    companyModel = module.get(getModelToken(CompanySchemaClass.name));
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    if (mongo) {
      await stopInMemoryMongo(mongo);
    }
  });

  it('should upsert and fetch recruiter membership by recruiter+company', async () => {
    const recruiter = await userModel.create({
      email: 'repo.recruiter@example.com',
      name: 'Repo Recruiter',
      provider: AuthProvider.EMAIL,
      role: UserRole.RECRUITER,
    });
    const company = await companyModel.create({
      name: 'Repo Company',
      inviteCode: 'KR-REPOT01',
    });

    const upserted = await repository.upsertByRecruiterAndCompany(
      recruiter.id,
      company.id,
      {
        recruiterId: new Types.ObjectId(recruiter.id),
        companyId: new Types.ObjectId(company.id),
        designation: 'Talent Partner',
      },
    );

    const found = await repository.findByRecruiterAndCompany({
      recruiterId: recruiter.id,
      companyId: company.id,
    });

    expect(upserted.id).toBe(found?.id);
    expect(found?.designation).toBe('Talent Partner');
  });

  it('should list memberships by recruiter and populate company', async () => {
    const recruiter = await userModel.create({
      email: 'list.recruiter@example.com',
      name: 'List Recruiter',
      provider: AuthProvider.EMAIL,
      role: UserRole.RECRUITER,
    });
    const companyA = await companyModel.create({
      name: 'Workspace A',
      inviteCode: 'KR-LISTA01',
      logo: 'https://img/a.png',
    });
    const companyB = await companyModel.create({
      name: 'Workspace B',
      inviteCode: 'KR-LISTB01',
      logo: 'https://img/b.png',
    });

    await recruiterProfileModel.create([
      {
        recruiterId: recruiter._id,
        companyId: companyA._id,
        designation: 'A Recruiter',
      },
      {
        recruiterId: recruiter._id,
        companyId: companyB._id,
        designation: 'B Recruiter',
      },
    ]);

    const result = await repository.findAllByRecruiterId({
      recruiterId: recruiter.id,
      page: 1,
      size: 10,
    });

    expect(result.total).toBe(2);
    expect(result.recruiterProfiles).toHaveLength(2);
    const populatedCompany = result.recruiterProfiles[0].companyId as unknown as {
      name?: string;
    };
    expect(populatedCompany.name).toBeDefined();
  });

  it('should list memberships by company and populate recruiter', async () => {
    const recruiterA = await userModel.create({
      email: 'mem.a@example.com',
      name: 'Member A',
      provider: AuthProvider.EMAIL,
      role: UserRole.RECRUITER,
    });
    const recruiterB = await userModel.create({
      email: 'mem.b@example.com',
      name: 'Member B',
      provider: AuthProvider.EMAIL,
      role: UserRole.RECRUITER,
    });
    const company = await companyModel.create({
      name: 'Members Company',
      inviteCode: 'KR-MEMB001',
    });

    await recruiterProfileModel.create([
      {
        recruiterId: recruiterA._id,
        companyId: company._id,
      },
      {
        recruiterId: recruiterB._id,
        companyId: company._id,
      },
    ]);

    const result = await repository.findAllByCompanyId({
      companyId: company.id,
      page: 1,
      size: 10,
    });

    expect(result.total).toBe(2);
    expect(result.recruiterProfiles).toHaveLength(2);
    const populatedRecruiter =
      result.recruiterProfiles[0].recruiterId as unknown as { email?: string };
    expect(populatedRecruiter.email).toBeDefined();
  });

  it('should support exists and delete operations', async () => {
    const recruiter = await userModel.create({
      email: 'exists@example.com',
      name: 'Exists Recruiter',
      provider: AuthProvider.EMAIL,
      role: UserRole.RECRUITER,
    });
    const company = await companyModel.create({
      name: 'Exists Company',
      inviteCode: 'KR-EXIST01',
    });

    await repository.upsertByRecruiterAndCompany(recruiter.id, company.id, {
      recruiterId: new Types.ObjectId(recruiter.id),
      companyId: new Types.ObjectId(company.id),
      designation: 'Exists',
    });

    const existsBefore = await repository.existsByRecruiterAndCompany({
      recruiterId: recruiter.id,
      companyId: company.id,
    });
    expect(existsBefore).toBe(true);

    const deleted = await repository.deleteByRecruiterAndCompany({
      recruiterId: recruiter.id,
      companyId: company.id,
    });
    expect(deleted?.id).toBeDefined();

    const existsAfter = await repository.existsByRecruiterAndCompany({
      recruiterId: recruiter.id,
      companyId: company.id,
    });
    expect(existsAfter).toBe(false);
  });
});

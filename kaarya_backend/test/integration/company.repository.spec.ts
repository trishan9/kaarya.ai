import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { CompanyRepository } from 'src/repositories/company.repository';
import { CompanySchemaClass } from 'src/entities/company.schema';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('CompanyRepository (integration)', () => {
  let module: TestingModule | undefined;
  let repository: CompanyRepository;
  let companyModel: Model<CompanySchemaClass>;
  let mongo: TestMongo | undefined;

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    repository = module.get(CompanyRepository);
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

  it('should create company and find by invite code (case-insensitive)', async () => {
    const created = await repository.create({
      name: 'Kaarya Labs',
      industry: 'SaaS',
      inviteCode: 'KR-AB12CD34',
    });

    const found = await repository.findByInviteCode('kr-ab12cd34');

    expect(found?.id).toBe(created.id);
    expect(found?.name).toBe('Kaarya Labs');
  });

  it('should paginate and search companies', async () => {
    await companyModel.create([
      {
        name: 'Alpha Hiring',
        inviteCode: 'KR-ALPHA01',
      },
      {
        name: 'Beta Talent',
        inviteCode: 'KR-BETA01',
      },
      {
        name: 'Gamma People Ops',
        inviteCode: 'KR-GAMMA01',
      },
    ]);

    const result = await repository.findAll({
      page: 1,
      size: 2,
      search: 'Talent',
    });

    expect(result.total).toBe(1);
    expect(result.companies).toHaveLength(1);
    expect(result.companies[0].name).toBe('Beta Talent');
  });

  it('should support update, findByIds, and delete operations', async () => {
    const first = await repository.create({
      name: 'Acme One',
      inviteCode: 'KR-ACME01',
    });
    const second = await repository.create({
      name: 'Acme Two',
      inviteCode: 'KR-ACME02',
    });

    const updated = await repository.updateById(first.id, {
      name: 'Acme One Updated',
      verifiedStatus: true,
    });
    expect(updated?.name).toBe('Acme One Updated');
    expect(updated?.verifiedStatus).toBe(true);

    const foundByIds = await repository.findByIds([
      first.id,
      second.id,
      first.id,
    ]);
    expect(foundByIds).toHaveLength(2);

    const deleted = await repository.deleteById(second.id);
    expect(deleted?.id).toBe(second.id);
    expect(await repository.findById(second.id)).toBeNull();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { JobPostingRepository } from 'src/repositories/job-posting.repository';
import { JobPostingSchemaClass } from 'src/entities/job-posting.schema';
import { JobPostingStatus } from 'src/types/job-posting-status.enum';
import { JobWorkMode } from 'src/types/job-work-mode.enum';
import {
  startInMemoryMongo,
  stopInMemoryMongo,
  clearDatabase,
  TestMongo,
} from '../helpers/mongo';

describe('JobPostingRepository (integration)', () => {
  let module: TestingModule | undefined;
  let repository: JobPostingRepository;
  let jobModel: Model<JobPostingSchemaClass>;
  let mongo: TestMongo | undefined;

  beforeAll(async () => {
    mongo = await startInMemoryMongo();
    const { AppModule } = await import('src/app.module');

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    repository = module.get(JobPostingRepository);
    jobModel = module.get(getModelToken(JobPostingSchemaClass.name));
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

  it('should create and filter jobs with remoteOnly/status/company', async () => {
    const companyId = new Types.ObjectId();
    const recruiterId = new Types.ObjectId();
    const otherCompanyId = new Types.ObjectId();

    await jobModel.create([
      {
        companyId,
        createdBy: recruiterId,
        title: 'Remote Backend Engineer',
        description: 'Remote role for backend systems.',
        workMode: JobWorkMode.REMOTE,
        status: JobPostingStatus.OPEN,
        deadline: new Date('2030-01-01T00:00:00.000Z'),
      },
      {
        companyId,
        createdBy: recruiterId,
        title: 'Onsite Data Engineer',
        description: 'Onsite data pipelines role.',
        workMode: JobWorkMode.ONSITE,
        status: JobPostingStatus.CLOSED,
        deadline: new Date('2030-02-01T00:00:00.000Z'),
      },
      {
        companyId: otherCompanyId,
        createdBy: recruiterId,
        title: 'Remote QA Engineer',
        description: 'Remote QA role.',
        workMode: JobWorkMode.REMOTE,
        status: JobPostingStatus.OPEN,
        deadline: new Date('2030-03-01T00:00:00.000Z'),
      },
    ]);

    const result = await repository.findAll({
      page: 1,
      size: 10,
      companyId: companyId.toString(),
      remoteOnly: true,
      status: JobPostingStatus.OPEN,
    });

    expect(result.total).toBe(1);
    expect(result.jobs[0].title).toBe('Remote Backend Engineer');
  });

  it('should search with escaped regex and filter by deadline range', async () => {
    const companyId = new Types.ObjectId();
    const recruiterId = new Types.ObjectId();

    await jobModel.create([
      {
        companyId,
        createdBy: recruiterId,
        title: 'C++ Systems Engineer',
        description: 'Build distributed compute systems.',
        deadline: new Date('2030-04-10T00:00:00.000Z'),
      },
      {
        companyId,
        createdBy: recruiterId,
        title: 'Node Platform Engineer',
        description: 'Maintain API platform.',
        deadline: new Date('2030-06-20T00:00:00.000Z'),
      },
    ]);

    const result = await repository.findAll({
      page: 1,
      size: 10,
      search: 'C++',
      deadlineFrom: new Date('2030-04-01T00:00:00.000Z'),
      deadlineTo: new Date('2030-04-30T00:00:00.000Z'),
    });

    expect(result.total).toBe(1);
    expect(result.jobs[0].title).toBe('C++ Systems Engineer');
  });

  it('should increment views and clamp applications count to non-negative integer', async () => {
    const companyId = new Types.ObjectId();
    const recruiterId = new Types.ObjectId();
    const job = await repository.create({
      companyId,
      createdBy: recruiterId,
      title: 'Metrics Job',
      description: 'Track metrics.',
      deadline: new Date('2030-07-01T00:00:00.000Z'),
      viewsCount: 1,
      applicationsCount: 0,
    });

    const incremented = await repository.incrementViewsCount(job.id, 3);
    expect(incremented?.viewsCount).toBe(4);

    const noNegativeIncrement = await repository.incrementViewsCount(job.id, -4);
    expect(noNegativeIncrement?.viewsCount).toBe(4);

    const updatedApplications = await repository.setApplicationsCount(job.id, -2.9);
    expect(updatedApplications?.applicationsCount).toBe(0);
  });

  it('should delete jobs by company id', async () => {
    const companyId = new Types.ObjectId();
    const recruiterId = new Types.ObjectId();
    const otherCompanyId = new Types.ObjectId();

    await jobModel.create([
      {
        companyId,
        createdBy: recruiterId,
        title: 'Delete One',
        description: 'Delete one description.',
        deadline: new Date('2030-08-01T00:00:00.000Z'),
      },
      {
        companyId,
        createdBy: recruiterId,
        title: 'Delete Two',
        description: 'Delete two description.',
        deadline: new Date('2030-08-02T00:00:00.000Z'),
      },
      {
        companyId: otherCompanyId,
        createdBy: recruiterId,
        title: 'Keep',
        description: 'Keep this job.',
        deadline: new Date('2030-08-03T00:00:00.000Z'),
      },
    ]);

    const deletedCount = await repository.deleteManyByCompanyId(companyId.toString());
    expect(deletedCount).toBe(2);

    const remaining = await jobModel.countDocuments().exec();
    expect(remaining).toBe(1);
  });
});

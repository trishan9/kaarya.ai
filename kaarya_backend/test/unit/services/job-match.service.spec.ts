import { ConfigService } from '@nestjs/config';
import { JobMatchService } from 'src/services/job-match.service';
import { EmailService } from 'src/services/email.service';
import { PinoLoggerService } from 'src/logger/pino-logger.service';

describe('JobMatchService', () => {
  let service: JobMatchService;
  let userModel: { find: jest.Mock };
  let emailService: jest.Mocked<EmailService>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<PinoLoggerService>;

  beforeEach(() => {
    userModel = {
      find: jest.fn(),
    };
    emailService = {
      sendJobMatchNotification: jest.fn().mockResolvedValue(undefined),
    } as never;
    configService = {
      get: jest.fn().mockReturnValue('https://app.example.com'),
    } as never;
    logger = {
      error: jest.fn(),
    } as never;

    service = new JobMatchService(
      userModel as never,
      emailService,
      configService,
      logger,
    );
  });

  const job = {
    jobId: 'job-1',
    title: 'Backend Engineer',
    description: 'Node.js TypeScript APIs and system design',
    location: 'Remote, Nepal',
    workMode: 'remote',
    employmentType: 'Full Time',
    salaryRange: '$100k',
    requirements: {
      skills: ['node.js', 'typescript'],
    },
    company: { name: 'Acme', logo: null },
  };

  it('should compute score based on role, skills, work mode, and location', () => {
    const score = service.computeMatchScore(
      {
        preferredRoles: ['Backend Engineer'],
        preferredLocations: ['Nepal'],
        preferredWorkModes: ['remote'],
        skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
      },
      job,
    );

    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('should exercise private scoring and parsing helpers', () => {
    const internal = service as any;

    expect(internal.scoreRoleMatch(undefined, 'Backend Engineer')).toBe(0);
    expect(internal.scoreRoleMatch(['Backend Engineer'], 'Backend Engineer')).toBe(40);
    expect(internal.scoreRoleMatch(['Engineer Backend'], 'Backend Engineer')).toBeGreaterThan(0);

    expect(internal.scoreSkillsMatch(undefined, job)).toBe(0);
    expect(
      internal.scoreSkillsMatch([{ name: 'Node.js' }, { name: 'TypeScript' }], job),
    ).toBeGreaterThan(0);
    expect(
      internal.scoreSkillsMatch(
        [{ name: 'React' }, { name: 'Vue' }],
        { ...job, requirements: {}, description: 'React and Vue in frontend project' },
      ),
    ).toBeGreaterThan(0);

    expect(internal.scoreWorkModeMatch(undefined, 'remote')).toBe(0);
    expect(internal.scoreWorkModeMatch(['remote'], 'remote')).toBe(15);
    expect(internal.scoreWorkModeMatch(['onsite'], 'remote')).toBe(0);

    expect(internal.scoreLocationMatch(undefined, 'Kathmandu')).toBe(0);
    expect(internal.scoreLocationMatch(['Remote'], 'remote')).toBe(15);
    expect(internal.scoreLocationMatch(['Kathmandu'], 'Kathmandu, Nepal')).toBe(15);
    expect(internal.scoreLocationMatch(['Nepal Bagmati'], 'Bagmati Province Nepal')).toBe(
      11,
    );

    expect(internal.extractRequiredSkills(null)).toEqual([]);
    expect(internal.extractRequiredSkills({ skills: [' Node.js ', '', 1] })).toEqual([
      'node.js',
    ]);
    expect(internal.extractRequiredSkills({ requiredSkills: ['TS'] })).toEqual(['ts']);
    expect(internal.tokenize('Node.js / TypeScript + APIs')).toEqual([
      'node',
      'js',
      'typescript',
      'apis',
    ]);
  });

  it('should process new job posting and notify matching candidates', async () => {
    userModel.find.mockImplementation(() => {
      let skipValue = 0;
      const chain: any = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn((value: number) => {
          skipValue = value;
          return chain;
        }),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation(() => {
          if (skipValue === 0) {
            return Promise.resolve([
              {
                email: 'match@example.com',
                name: 'Match Candidate',
                candidateProfile: {
                  preferredRoles: ['Backend Engineer'],
                  preferredLocations: ['Nepal'],
                  preferredWorkModes: ['remote'],
                  skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
                  openToWork: true,
                  defaultResumeId: 'r1',
                },
              },
              {
                email: 'nomatch@example.com',
                name: 'No Match',
                candidateProfile: {
                  preferredRoles: ['Designer'],
                  preferredLocations: ['Berlin'],
                  preferredWorkModes: ['onsite'],
                  skills: [{ name: 'Figma' }],
                  openToWork: true,
                  defaultResumeId: 'r2',
                },
              },
            ]);
          }
          return Promise.resolve([]);
        }),
      };

      return chain;
    });

    await service.processNewJobPosting(job);

    expect(emailService.sendJobMatchNotification).toHaveBeenCalledTimes(1);
    expect(emailService.sendJobMatchNotification).toHaveBeenCalledWith(
      'match@example.com',
      expect.objectContaining({
        jobTitle: 'Backend Engineer',
        companyName: 'Acme',
        jobUrl: 'https://app.example.com/jobs/job-1',
      }),
    );
  });

  it('should swallow process errors and log failures', async () => {
    userModel.find.mockImplementation(() => {
      throw new Error('db failure');
    });

    await service.processNewJobPosting(job);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Job matching failed'),
      undefined,
      JobMatchService.name,
    );
  });

  it('should handle notification send failures without throwing', async () => {
    userModel.find.mockImplementation(() => {
      let skipValue = 0;
      const chain: any = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn((value: number) => {
          skipValue = value;
          return chain;
        }),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation(() => {
          if (skipValue === 0) {
            return Promise.resolve([
              {
                email: 'match@example.com',
                name: 'Match Candidate',
                candidateProfile: {
                  preferredRoles: ['Backend Engineer'],
                  preferredLocations: ['Nepal'],
                  preferredWorkModes: ['remote'],
                  skills: [{ name: 'Node.js' }, { name: 'TypeScript' }],
                  openToWork: true,
                  defaultResumeId: 'r1',
                },
              },
            ]);
          }
          return Promise.resolve([]);
        }),
      };
      return chain;
    });
    emailService.sendJobMatchNotification.mockRejectedValueOnce(new Error('smtp down'));

    await service.processNewJobPosting(job);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send match email to match@example.com'),
      undefined,
      JobMatchService.name,
    );
  });
});


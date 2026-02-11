import { expect } from 'chai';
import { CreateJobPostingDTO } from 'src/dtos/jobs/job-posting.dto';
import { JoinCompanyByCodeDTO } from 'src/dtos/companies/company.dto';
import { JobWorkMode } from 'src/types/job-work-mode.enum';

describe('DTO validation (mocha)', () => {
  it('should parse create job payload with optional filters and defaults', () => {
    const parsed = CreateJobPostingDTO.parse({
      title: 'Backend Engineer',
      description: 'Build and maintain scalable NestJS APIs.',
      deadline: '2031-01-01T00:00:00.000Z',
      workMode: JobWorkMode.REMOTE,
      requirements: { skills: ['NestJS', 'MongoDB'] },
    });

    expect(parsed.title).to.equal('Backend Engineer');
    expect(parsed.workMode).to.equal(JobWorkMode.REMOTE);
    expect(parsed.requirements).to.deep.equal({
      skills: ['NestJS', 'MongoDB'],
    });
  });

  it('should reject invalid create job payload', () => {
    expect(() =>
      CreateJobPostingDTO.parse({
        title: 'A',
        description: 'short',
        deadline: 'invalid-date',
      }),
    ).to.throw();
  });

  it('should normalize invite code to uppercase', () => {
    const parsed = JoinCompanyByCodeDTO.parse({
      inviteCode: 'kr-ab12cd34',
    });

    expect(parsed.inviteCode).to.equal('KR-AB12CD34');
  });
});

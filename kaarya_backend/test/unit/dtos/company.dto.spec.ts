import {
  AssignRecruiterToCompanyDTO,
  CompaniesQueryDTO,
  CompanyRecruitersQueryDTO,
  CreateCompanyDTO,
  InviteRecruiterToCompanyDTO,
  JoinCompanyByCodeDTO,
  ObjectIdDTO,
  UpdateCompanyDTO,
} from 'src/dtos/companies/company.dto';

describe('company.dto', () => {
  const validObjectId = '65f1ac85a0b5bf507c66d2c9';

  it('should validate object ids', () => {
    expect(ObjectIdDTO.parse(validObjectId)).toBe(validObjectId);
    expect(() => ObjectIdDTO.parse('invalid')).toThrow('Invalid id format.');
  });

  it('should parse create payload with trimmed fields and boolean coercion', () => {
    const parsed = CreateCompanyDTO.parse({
      name: '  Kaarya  ',
      industry: '  SaaS  ',
      location: '  Remote  ',
      logo: 'https://example.com/logo.png',
      verifiedStatus: 'true',
      designation: '  Hiring Manager  ',
    });

    expect(parsed).toEqual({
      name: 'Kaarya',
      industry: 'SaaS',
      location: 'Remote',
      logo: 'https://example.com/logo.png',
      verifiedStatus: true,
      designation: 'Hiring Manager',
    });
  });

  it('should keep optional fields undefined and parse non-string verifiedStatus', () => {
    const parsed = CreateCompanyDTO.parse({
      name: 'Acme',
      industry: '   ',
      location: '   ',
      verifiedStatus: false,
      designation: '   ',
    });

    expect(parsed).toEqual({
      name: 'Acme',
      industry: undefined,
      location: undefined,
      verifiedStatus: false,
      designation: undefined,
    });
  });

  it('should validate update payload and require at least one field', () => {
    expect(() => UpdateCompanyDTO.parse({})).toThrow(
      'At least one field is required.',
    );

    const parsed = UpdateCompanyDTO.parse({ verifiedStatus: 'false' });
    expect(parsed.verifiedStatus).toBe(false);
  });

  it('should parse recruiter assignment and invite dto payloads', () => {
    const assign = AssignRecruiterToCompanyDTO.parse({
      recruiterId: validObjectId,
      designation: '  Talent Partner  ',
    });
    expect(assign).toEqual({
      recruiterId: validObjectId,
      designation: 'Talent Partner',
    });

    const invite = InviteRecruiterToCompanyDTO.parse({
      email: '  Recruiter@Example.COM  ',
      designation: '  Recruiter  ',
    });
    expect(invite).toEqual({
      email: 'recruiter@example.com',
      designation: 'Recruiter',
    });
  });

  it('should normalize invite code and parse pagination queries', () => {
    const join = JoinCompanyByCodeDTO.parse({
      inviteCode: ' kr-abc123 ',
      designation: '  ',
    });
    expect(join).toEqual({
      inviteCode: 'KR-ABC123',
      designation: undefined,
    });

    expect(CompaniesQueryDTO.parse({})).toEqual({
      page: 1,
      size: 10,
    });

    expect(
      CompaniesQueryDTO.parse({ page: '2', size: '25', search: '  Kaarya  ' }),
    ).toEqual({
      page: 2,
      size: 25,
      search: 'Kaarya',
    });
    expect(
      CompaniesQueryDTO.parse({ page: '1', size: '10', search: '   ' }),
    ).toEqual({
      page: 1,
      size: 10,
      search: undefined,
    });

    expect(CompanyRecruitersQueryDTO.parse({})).toEqual({
      page: 1,
      size: 10,
    });
  });
});

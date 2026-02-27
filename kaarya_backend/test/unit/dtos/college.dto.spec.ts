import {
  CollegeStudentsQueryDTO,
  CollegesQueryDTO,
  CreateCollegeDTO,
  InviteStudentToCollegeDTO,
  JoinCollegeByCodeDTO,
  LeaderboardQueryDTO,
  UpdateCollegeDTO,
} from 'src/dtos/colleges/college.dto';

describe('College DTOs', () => {
  it('should parse create and update payloads with trimmed values', () => {
    const create = CreateCollegeDTO.parse({
      name: '  Test College  ',
      institutionType: '  University ',
      location: '  Kathmandu ',
      logo: 'https://img.example.com/logo.png',
    });
    const update = UpdateCollegeDTO.parse({
      name: ' Updated College ',
      institutionType: '  Private ',
      location: '  Lalitpur ',
    });

    expect(create.name).toBe('Test College');
    expect(create.institutionType).toBe('University');
    expect(update.name).toBe('Updated College');
    expect(update.location).toBe('Lalitpur');
  });

  it('should require at least one update field', () => {
    const parsed = UpdateCollegeDTO.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it('should parse invite payload and coerce year', () => {
    const invite = InviteStudentToCollegeDTO.parse({
      email: '  STUDENT@Example.com ',
      program: '  CS ',
      year: '2',
    });

    expect(invite).toEqual({
      email: 'student@example.com',
      program: 'CS',
      year: 2,
    });
  });

  it('should parse join code and uppercase transform', () => {
    const joined = JoinCollegeByCodeDTO.parse({
      inviteCode: '  abcd1234 ',
      program: '  IT ',
      year: '3',
    });
    const invalid = JoinCollegeByCodeDTO.safeParse({
      inviteCode: 'a',
    });

    expect(joined.inviteCode).toBe('ABCD1234');
    expect(joined.program).toBe('IT');
    expect(joined.year).toBe(3);
    expect(invalid.success).toBe(false);
  });

  it('should parse query DTO defaults and trim search', () => {
    const collegesDefault = CollegesQueryDTO.parse({});
    const collegesSearch = CollegesQueryDTO.parse({ search: '  abc ' });
    const collegesEmptySearch = CollegesQueryDTO.parse({ search: '   ' });
    const studentsDefault = CollegeStudentsQueryDTO.parse({});
    const leaderboardDefault = LeaderboardQueryDTO.parse({});

    expect(collegesDefault).toEqual({ page: 1, size: 10, search: undefined });
    expect(collegesSearch.search).toBe('abc');
    expect(collegesEmptySearch.search).toBeUndefined();
    expect(studentsDefault).toEqual({ page: 1, size: 10 });
    expect(leaderboardDefault).toEqual({
      scope: 'global',
      collegeId: undefined,
      page: 1,
      size: 20,
    });
  });
});


import { AdminUsersQueryDTO } from 'src/dtos/users/admin-user-query.dto';

describe('AdminUsersQueryDTO', () => {
  it('should coerce defaults for missing values', () => {
    const result = AdminUsersQueryDTO.parse({});

    expect(result).toEqual({
      page: 1,
      size: 10,
      search: undefined,
    });
  });

  it('should coerce query strings', () => {
    const result = AdminUsersQueryDTO.parse({
      page: '2',
      size: '5',
      search: '  alpha  ',
    });

    expect(result).toEqual({
      page: 2,
      size: 5,
      search: 'alpha',
    });
  });

  it('should drop empty search values', () => {
    const result = AdminUsersQueryDTO.parse({ search: '   ' });

    expect(result.search).toBeUndefined();
  });
});

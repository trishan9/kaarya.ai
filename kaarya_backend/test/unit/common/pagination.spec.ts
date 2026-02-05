import { buildPaginationMeta } from 'src/common/utils/pagination';

describe('pagination utils', () => {
  it('should return empty pagination meta when there are no items', () => {
    const result = buildPaginationMeta({ page: 1, size: 10, totalItems: 0 });

    expect(result).toEqual({
      page: 1,
      size: 10,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage: null,
      prevPage: null,
      search: null,
    });
  });

  it('should compute pagination meta for middle pages', () => {
    const result = buildPaginationMeta({
      page: 2,
      size: 10,
      totalItems: 25,
      search: 'alpha',
    });

    expect(result).toEqual({
      page: 2,
      size: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
      nextPage: 3,
      prevPage: 1,
      search: 'alpha',
    });
  });
});

import { BookmarkListQueryDTO } from 'src/dtos/bookmarks/bookmark.dto';
import { BookmarkListType } from 'src/types/bookmark-entity-type.enum';

describe('BookmarkListQueryDTO', () => {
  it('should apply defaults and trim search', () => {
    const result = BookmarkListQueryDTO.parse({
      search: '  backend  ',
    });

    expect(result).toEqual({
      type: BookmarkListType.ALL,
      search: 'backend',
      sortBy: 'saved_at_desc',
    });
  });

  it('should remove empty search and parse custom options', () => {
    const result = BookmarkListQueryDTO.parse({
      type: BookmarkListType.JOBS,
      search: '   ',
      sortBy: 'saved_at_asc',
    });

    expect(result.search).toBeUndefined();
    expect(result.type).toBe(BookmarkListType.JOBS);
    expect(result.sortBy).toBe('saved_at_asc');
  });

  it('should reject invalid values', () => {
    expect(() =>
      BookmarkListQueryDTO.parse({
        type: 'unknown',
        sortBy: 'wrong',
      }),
    ).toThrow();
  });
});


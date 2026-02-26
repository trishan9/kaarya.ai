import z from 'zod';
import { BookmarkListType } from 'src/types/bookmark-entity-type.enum';

const optionalTrimmedText = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

export const BookmarkListQueryDTO = z.object({
  type: z.nativeEnum(BookmarkListType).default(BookmarkListType.ALL),
  search: optionalTrimmedText,
  sortBy: z.enum(['saved_at_desc', 'saved_at_asc']).default('saved_at_desc'),
});

export type TBookmarkListQueryDTO = z.infer<typeof BookmarkListQueryDTO>;

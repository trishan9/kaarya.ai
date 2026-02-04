export type PaginationMeta = {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  search: string | null;
};

export type PaginationMetaInput = {
  page: number;
  size: number;
  totalItems: number;
  search?: string | null;
};

export const buildPaginationMeta = (
  input: PaginationMetaInput,
): PaginationMeta => {
  const totalPages =
    input.totalItems > 0 ? Math.ceil(input.totalItems / input.size) : 0;
  const hasPrevPage = totalPages > 0 && input.page > 1;
  const hasNextPage = totalPages > 0 && input.page < totalPages;

  return {
    page: input.page,
    size: input.size,
    totalItems: input.totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? input.page + 1 : null,
    prevPage: hasPrevPage ? input.page - 1 : null,
    search: input.search ?? null,
  };
};

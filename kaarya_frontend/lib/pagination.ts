export type PaginationQueryParams = {
  page?: string | number | null;
  size?: string | number | null;
};

export const parsePaginationParams = (
  params?: PaginationQueryParams,
): { page?: number; size?: number } => {
  const rawPage = Number(params?.page);
  const rawSize = Number(params?.size);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : undefined;
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : undefined;

  return { page, size };
};

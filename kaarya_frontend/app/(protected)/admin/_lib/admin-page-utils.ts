import type { PaginationMeta } from "@/lib/pagination";

export const readStringParam = (
  value: string | string[] | undefined,
): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const formatDateLabel = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const buildHref = (
  pathname: string,
  params: Record<string, string | number | undefined>,
) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    const stringValue = String(value).trim();
    if (stringValue.length === 0) return;
    searchParams.set(key, stringValue);
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const getShowingRange = (meta?: PaginationMeta) => {
  if (!meta || meta.totalItems <= 0 || meta.totalPages <= 0) {
    return { from: 0, to: 0 };
  }

  const from = (meta.page - 1) * meta.size + 1;
  const to = Math.min(meta.totalItems, meta.page * meta.size);
  return { from, to };
};


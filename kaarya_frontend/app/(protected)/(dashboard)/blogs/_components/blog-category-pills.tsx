import Link from "next/link";

import { cn } from "@/lib/utils";
import type { BlogCategoryPill, BlogFilterId } from "../blogs-data";

type BlogCategoryPillsProps = {
  categories: BlogCategoryPill[];
  activeFilterId: BlogFilterId;
  searchQuery: string;
};

function buildCategoryHref(filterId: BlogFilterId, searchQuery: string) {
  const params = new URLSearchParams();

  if (filterId !== "the-latest") {
    params.set("category", filterId);
  }

  if (searchQuery.trim()) {
    params.set("query", searchQuery.trim());
  }

  const queryString = params.toString();
  return queryString ? `/blogs?${queryString}` : "/blogs";
}

export function BlogCategoryPills({
  categories,
  activeFilterId,
  searchQuery,
}: BlogCategoryPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((category) => {
        const isActive = category.id === activeFilterId;
        return (
          <Link
            key={category.id}
            href={buildCategoryHref(category.id, searchQuery)}
            className={cn(
              "inline-flex h-9 items-center rounded-lg border px-3 text-sm transition-colors",
              isActive
                ? "border-primary bg-primary text-white"
                : "border-[#d8dde4] bg-white text-[#8f949e] hover:border-primary hover:text-primary",
            )}
            aria-pressed={isActive}
          >
            {category.label}
            <span
              className={cn(
                "ml-1.5 rounded-md px-1.5 py-0.5 text-[10px]",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {category.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

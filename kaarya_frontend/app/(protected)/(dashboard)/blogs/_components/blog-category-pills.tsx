import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BlogCategoryPill, BlogFilterId } from "../blogs-data";

type BlogCategoryPillsProps = {
  categories: BlogCategoryPill[];
  activeFilterId: BlogFilterId;
  searchQuery?: string;
};

export function BlogCategoryPills({
  categories,
  activeFilterId,
  searchQuery,
}: BlogCategoryPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((category) => {
        const params = new URLSearchParams();
        if (category.id !== "the-latest") {
          params.set("category", category.id);
        }
        if (searchQuery?.trim()) {
          params.set("query", searchQuery.trim());
        }

        const href = params.toString() ? `/blogs?${params.toString()}` : "/blogs";
        const isActive = category.id === activeFilterId;

        return (
          <Link
            key={category.id}
            href={href}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm",
              isActive
                ? "border-primary bg-primary text-white"
                : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            <span>{category.label}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs",
                isActive ? "bg-card/20 text-white" : "bg-muted text-foreground",
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

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BlogArticle } from "../blogs-data";

type BlogArticleCardProps = {
  article: BlogArticle;
  imageHeightClassName?: string;
  className?: string;
  showMeta?: boolean;
};

export function BlogArticleCard({
  article,
  imageHeightClassName = "h-44",
  className,
  showMeta = false,
}: BlogArticleCardProps) {
  return (
    <Card
      className={cn(
        "min-w-0 gap-0 overflow-hidden rounded-2xl border border-[#e7e9ee] bg-white p-0 shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      <Link href={`/blogs/${article.id}`} className="group block">
        <div className={cn("relative overflow-hidden", imageHeightClassName)}>
          <div
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: article.coverGradient }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
            <Badge className="rounded-md bg-white/25 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
              {article.categoryLabel}
            </Badge>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-xs">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="space-y-2 p-3">
          <h3 className="line-clamp-2 font-semibold leading-tight text-foreground">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {article.excerpt}
          </p>

          {showMeta ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{article.authorName}</span>
              <span>|</span>
              <span>{article.publishedRelative}</span>
              <span>|</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {article.readTimeMinutes} min
              </span>
            </div>
          ) : null}
        </div>
      </Link>
    </Card>
  );
}

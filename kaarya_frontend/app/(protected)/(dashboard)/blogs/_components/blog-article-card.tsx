import Link from "next/link";
import Image from "next/image";
import { Clock3, Eye, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BlogArticle } from "../blogs-data";

type BlogArticleCardProps = {
  article: BlogArticle;
  imageHeightClassName?: string;
};

export function BlogArticleCard({
  article,
  imageHeightClassName = "h-44",
}: BlogArticleCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm">
      <Link href={`/blogs/${encodeURIComponent(article.id)}`} className="group block">
        <div
          className={cn(
            "relative w-full border-b border-white/10",
            imageHeightClassName,
          )}
          style={{ background: article.coverGradient }}
        >
          <Image
            src={article.coverImageSrc}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" />
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <Badge className="border-0 bg-card/20 text-white hover:bg-card/20">
              {article.categoryLabel}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90">
            <span>{article.publishedRelative}</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {article.readTimeMinutes} min
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <h3 className="line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
              {article.title}
            </h3>
            <p className="line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold">
                  {article.authorAvatarFallback}
                </AvatarFallback>
              </Avatar>
              <p className="truncate text-sm font-medium text-foreground">
                {article.authorName}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {article.likes.toLocaleString("en-US")}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {article.views.toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Clock3, Eye, Heart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BlogArticle } from "../blogs-data";
import { BlogArticleCard } from "./blog-article-card";

type BlogArticleDetailViewProps = {
  article: BlogArticle;
  trendingTopics: string[];
  relatedArticle: BlogArticle;
};

export function BlogArticleDetailView({
  article,
  trendingTopics,
  relatedArticle,
}: BlogArticleDetailViewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <article className="space-y-4">
        <Card className="overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-sm">
          <div
            className="relative h-56 w-full border-b border-white/10 sm:h-64"
            style={{ background: article.coverGradient }}
          >
            <Image
              src={article.coverImageSrc}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 70vw"
              priority={false}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent" />
            <div className="absolute left-4 top-4">
              <Badge className="border-0 bg-card/20 text-white hover:bg-card/20">
                {article.categoryLabel}
              </Badge>
            </div>

            <div className="absolute bottom-4 left-4 right-4 space-y-2">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                {article.title}
              </h2>
              <p className="text-sm text-white/90">{article.excerpt}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs font-semibold">
                  {article.authorAvatarFallback}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{article.authorName}</p>
                <p className="text-xs text-muted-foreground">{article.publishedRelative}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {article.readTimeMinutes} min
              </span>
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

          <div className="space-y-5 px-4 py-4">
            {article.body.introduction.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-foreground">
                {paragraph}
              </p>
            ))}

            {article.body.sections.map((section) => (
              <section key={section.heading} className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{section.heading}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-foreground">
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </Card>
      </article>

      <aside className="space-y-4">
        <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Trending Topics</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {trendingTopics.map((topic) => (
              <Link
                key={topic}
                href={`/blogs?query=${encodeURIComponent(topic)}`}
                className="rounded-md border border-border bg-muted/35 px-2.5 py-1 text-xs text-foreground hover:border-primary hover:text-primary"
              >
                {topic}
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Related Article</h3>
          <BlogArticleCard article={relatedArticle} imageHeightClassName="h-36" />
        </div>
      </aside>
    </div>
  );
}

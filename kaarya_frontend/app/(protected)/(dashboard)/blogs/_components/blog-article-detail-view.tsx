import Link from "next/link";
import { ArrowUpRight, Bookmark, Ellipsis, Share2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-4">
      <Card className="gap-0 overflow-hidden rounded-2xl border border-[#e7e9ee] bg-white p-0 shadow-sm">
        <div className="relative h-[260px] overflow-hidden sm:h-[320px]">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: article.coverGradient }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />

          <div className="absolute inset-x-0 bottom-0 space-y-3 p-4 text-white sm:p-6">
            <Badge className="rounded-md bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-xs">
              {article.categoryLabel}
            </Badge>

            <h2 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-[2.05rem]">
              {article.title}
            </h2>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Avatar className="h-7 w-7 border border-white/40">
                  <AvatarFallback className="bg-white/20 text-[11px] text-white">
                    {article.authorAvatarFallback}
                  </AvatarFallback>
                </Avatar>
                <span>{article.authorName}</span>
                <span>|</span>
                <span>{article.publishedRelative}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-white/40 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                >
                  <Bookmark className="h-4 w-4" />
                  <span className="sr-only">Bookmark article</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-white/40 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share article</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-white/40 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                >
                  <Ellipsis className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-5 rounded-2xl border border-[#e7e9ee] bg-white p-4 sm:p-6">
          <div className="space-y-4 text-[15px] leading-7 text-[#4c515b]">
            {article.body.introduction.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {article.body.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h3 className="text-2xl font-semibold text-foreground sm:text-[1.85rem]">
                {section.heading}
              </h3>

              <div className="space-y-4 text-[15px] leading-7 text-[#4c515b]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {section.bullets?.length ? (
                <ol className="space-y-2 pl-5 text-[15px] leading-7 text-[#4c515b]">
                  {section.bullets.map((point, index) => (
                    <li key={point}>
                      <span className="font-semibold text-foreground">
                        {index + 1}.
                      </span>{" "}
                      {point}
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>
          ))}
        </Card>

        <aside className="space-y-4">
          <Card className="rounded-2xl border border-[#e7e9ee] bg-white p-4">
            <h3 className="text-2xl font-semibold leading-tight text-foreground">
              Trending Topic
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              {trendingTopics.map((topic, index) => (
                <li key={topic} className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    {index + 1}. {topic}
                  </span>
                  <Link
                    href={`/blogs?query=${encodeURIComponent(topic)}`}
                    className="shrink-0 text-primary"
                    aria-label={`Search ${topic}`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Related Article</p>
            <BlogArticleCard article={relatedArticle} imageHeightClassName="h-44" />
          </div>
        </aside>
      </div>
    </div>
  );
}

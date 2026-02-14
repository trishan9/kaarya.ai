import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../_components/dashboard-header";
import { OverviewHeaderActions } from "../overview/_components/overview-header-actions";
import { getBlogsPageData } from "./blogs-data";
import { BlogArticleCard } from "./_components/blog-article-card";
import { BlogCategoryPills } from "./_components/blog-category-pills";
import { BlogsSearchHero } from "./_components/blogs-search-hero";

type BlogsPageProps = {
  searchParams: Promise<{
    query?: string | string[];
    category?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = firstValue(resolvedSearchParams.query);
  const category = firstValue(resolvedSearchParams.category);

  const pageData = await getBlogsPageData({ query, category });

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="Blogs & Articles"
          actions={<OverviewHeaderActions />}
        />

        <div className="space-y-6 px-3 pb-6 sm:px-4 sm:pb-8">
          <BlogsSearchHero
            title={pageData.hero.title}
            description={pageData.hero.description}
            searchPlaceholder={pageData.hero.searchPlaceholder}
            searchQuery={pageData.searchQuery}
            selectedFilterId={pageData.selectedFilterId}
          />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold leading-tight text-foreground">
              Top 3 Articles Today
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pageData.topArticles.map((article) => (
                <BlogArticleCard
                  key={article.id}
                  article={article}
                  imageHeightClassName="h-48"
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold leading-tight text-foreground">
              All Articles
            </h2>

            <BlogCategoryPills
              categories={pageData.categories}
              activeFilterId={pageData.selectedFilterId}
              searchQuery={pageData.searchQuery}
            />

            {pageData.articles.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pageData.articles.map((article) => (
                  <BlogArticleCard
                    key={article.id}
                    article={article}
                    imageHeightClassName="h-44"
                  />
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl border border-dashed border-[#d8dde4] bg-white p-6 text-sm text-muted-foreground">
                No articles matched your current filters. Try a different search
                term or category.
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

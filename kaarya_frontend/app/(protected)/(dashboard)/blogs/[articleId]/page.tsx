import { OverviewHeaderActions } from "../../overview/_components/overview-header-actions";
import { getBlogDetailPageData } from "../blogs-data";
import { BlogArticleDetailView } from "../_components/blog-article-detail-view";
import { BlogDetailHeader } from "../_components/blog-detail-header";

type BlogArticleDetailPageProps = {
  params: Promise<{
    articleId: string;
  }>;
};

export default async function BlogArticleDetailPage({
  params,
}: BlogArticleDetailPageProps) {
  const { articleId } = await params;
  const pageData = await getBlogDetailPageData(decodeURIComponent(articleId));

  return (
    <div className="dashboard-stage">
      <div className="dashboard-surface">
        <BlogDetailHeader
          title="Detail Article"
          actions={<OverviewHeaderActions />}
          fallbackHref="/blogs"
        />

        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <BlogArticleDetailView
            article={pageData.article}
            trendingTopics={pageData.trendingTopics}
            relatedArticle={pageData.relatedArticle}
          />
        </div>
      </div>
    </div>
  );
}


export type BlogFilterId =
  | "the-latest"
  | "inspirative"
  | "job-hunter"
  | "most-liked"
  | "most-viewed";

type BlogTag = "inspirative" | "job-hunter";

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogBody = {
  introduction: string[];
  sections: BlogSection[];
};

export type BlogArticle = {
  id: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  coverGradient: string;
  authorName: string;
  authorAvatarFallback: string;
  publishedAtISO: string;
  publishedRelative: string;
  readTimeMinutes: number;
  likes: number;
  views: number;
  tags: BlogTag[];
  body: BlogBody;
};

export type BlogCategoryPill = {
  id: BlogFilterId;
  label: string;
  count: number;
};

export type BlogsPageData = {
  hero: {
    title: string;
    description: string;
    searchPlaceholder: string;
  };
  searchQuery: string;
  selectedFilterId: BlogFilterId;
  categories: BlogCategoryPill[];
  topArticles: BlogArticle[];
  articles: BlogArticle[];
};

export type BlogDetailPageData = {
  article: BlogArticle;
  trendingTopics: string[];
  relatedArticle: BlogArticle;
};

type BlogsPageQuery = {
  query?: string;
  category?: string;
};

const BLOG_CATEGORY_FILTERS: ReadonlyArray<{ id: BlogFilterId; label: string }> = [
  { id: "the-latest", label: "The Latest" },
  { id: "inspirative", label: "Inspirative" },
  { id: "job-hunter", label: "Job Hunter" },
  { id: "most-liked", label: "Most Like" },
  { id: "most-viewed", label: "Most Viewed" },
];

const TRENDING_TOPICS = [
  "AI in Healthcare",
  "Remote Work and Hybrid Models",
  "Sustainability in Business",
  "Cryptocurrency Regulation",
  "Quantum Computing",
  "Mental Health Awareness",
  "5G Technology",
  "Data Privacy and Security",
  "The Gig Economy",
  "Blockchain Beyond Cryptocurrency",
];

const REMOTE_WORK_BODY: BlogBody = {
  introduction: [
    "In recent years, remote work has transformed from a niche option to a mainstream employment model, accelerated by global events and advancements in technology. Whether you're a seasoned professional or just entering the workforce, understanding the nuances of remote work can significantly impact your career trajectory.",
    "This article covers what job seekers should know about remote opportunities, including how to evaluate role quality, manage expectations, and build habits that make distributed work sustainable over time.",
  ],
  sections: [
    {
      heading: "The Rise of Remote Work",
      paragraphs: [
        "Remote work was once the domain of freelancers and digital-first startups, but it now spans nearly every industry. Companies have discovered that distributed teams can increase hiring speed and open access to high-quality talent across different regions.",
        "What began as a temporary shift has matured into a long-term operating model, with many organizations adopting hybrid or fully remote structures as their default way of working.",
      ],
    },
    {
      heading: "Benefits of Remote Work",
      paragraphs: [
        "For many professionals, remote work creates a better work-life balance and more control over schedules. It can also unlock opportunities with international companies that may have been inaccessible before.",
      ],
      bullets: [
        "Flexibility and work-life balance through personalized schedules.",
        "Access to global opportunities without geographic limits.",
        "Reduced commuting costs, with more time for focused work.",
      ],
    },
    {
      heading: "How to Succeed in Remote Roles",
      paragraphs: [
        "Thriving remotely requires strong communication, clear documentation, and reliable follow-through. Employers prioritize candidates who can work autonomously while still collaborating effectively across teams.",
        "Before accepting a role, review collaboration tools, performance expectations, timezone overlap, and support for remote onboarding. These signals reveal whether the organization is truly remote-ready.",
      ],
    },
  ],
};

function buildGeneralBody(title: string): BlogBody {
  return {
    introduction: [
      `${title} is becoming a core topic for candidates trying to stay competitive in a changing market.`,
      "Strong outcomes usually come from balancing practical execution with long-term career positioning.",
    ],
    sections: [
      {
        heading: "What Is Changing",
        paragraphs: [
          "Employers are hiring for adaptability, communication quality, and measurable impact. Technical skills still matter, but teams now evaluate execution discipline and cross-functional collaboration just as heavily.",
          "Candidates who can describe results with clear metrics tend to stand out during both screening and final interviews.",
        ],
      },
      {
        heading: "How to Position Yourself",
        paragraphs: [
          "Build a clear narrative around your strengths, prioritize portfolio quality over quantity, and tailor each application to the target role and company context.",
        ],
        bullets: [
          "Map your experience to business outcomes and team goals.",
          "Document specific examples of ownership and delivery quality.",
          "Keep your resume and profile aligned with the role requirements.",
        ],
      },
      {
        heading: "Execution Checklist",
        paragraphs: [
          "Break your preparation into weekly milestones, track progress, and iterate based on interview feedback. A consistent process outperforms one-off bursts of activity.",
        ],
      },
    ],
  };
}

const BLOG_ARTICLE_SEEDS: BlogArticle[] = [
  {
    id: "remote-work-opportunities-what-you-need-to-know",
    title: "Remote Work Opportunities: What You Need to Know",
    excerpt:
      "Explore the rise of remote jobs and how you can evaluate remote roles with confidence before you apply.",
    categoryLabel: "Job Market Trends",
    coverGradient: "linear-gradient(130deg, #113b61 0%, #2b7198 55%, #5ca2c6 100%)",
    authorName: "Marleon Gazali",
    authorAvatarFallback: "MG",
    publishedAtISO: "2026-02-09T08:30:00.000Z",
    publishedRelative: "Published 2 minutes ago",
    readTimeMinutes: 8,
    likes: 1230,
    views: 9640,
    tags: ["job-hunter", "inspirative"],
    body: REMOTE_WORK_BODY,
  },
  {
    id: "navigating-career-changes-tips-for-a-smooth-transition",
    title: "Navigating Career Changes: Tips for a Smooth Transition",
    excerpt:
      "Considering a career switch? Learn practical ways to transition faster while lowering risk.",
    categoryLabel: "Career Advice",
    coverGradient: "linear-gradient(130deg, #5c1212 0%, #9a2d2d 45%, #d96f5a 100%)",
    authorName: "Rheya Kim",
    authorAvatarFallback: "RK",
    publishedAtISO: "2026-02-08T10:20:00.000Z",
    publishedRelative: "Published 1 day ago",
    readTimeMinutes: 7,
    likes: 980,
    views: 7210,
    tags: ["job-hunter"],
    body: buildGeneralBody("Navigating Career Changes"),
  },
  {
    id: "most-in-demand-tech-jobs-right-now",
    title: "The Most In-Demand Tech Jobs Right Now",
    excerpt:
      "Learn about hot technology roles companies are hiring for and the core skills they now expect.",
    categoryLabel: "Industry Insight",
    coverGradient: "linear-gradient(130deg, #10153a 0%, #153a8a 55%, #4ea4ff 100%)",
    authorName: "Joel Singh",
    authorAvatarFallback: "JS",
    publishedAtISO: "2026-02-07T12:00:00.000Z",
    publishedRelative: "Published 2 days ago",
    readTimeMinutes: 6,
    likes: 1640,
    views: 12410,
    tags: ["job-hunter"],
    body: buildGeneralBody("In-Demand Tech Jobs"),
  },
  {
    id: "how-to-stand-out-in-a-competitive-job-market",
    title: "How to Stand Out in a Competitive Job Market",
    excerpt:
      "Get practical strategies to differentiate your profile and improve your response rate from recruiters.",
    categoryLabel: "Job Search Tips",
    coverGradient: "linear-gradient(130deg, #31353a 0%, #557487 55%, #9fb7c3 100%)",
    authorName: "Sophie Borel",
    authorAvatarFallback: "SB",
    publishedAtISO: "2026-02-06T09:45:00.000Z",
    publishedRelative: "Published 3 days ago",
    readTimeMinutes: 9,
    likes: 1840,
    views: 8450,
    tags: ["job-hunter", "inspirative"],
    body: buildGeneralBody("Standing Out in a Competitive Job Market"),
  },
  {
    id: "impact-of-ai-on-job-hunting",
    title: "The Impact of AI on Job Hunting",
    excerpt:
      "Understand how AI is reshaping hiring, screening, and candidate preparation across industries.",
    categoryLabel: "Employment News",
    coverGradient: "linear-gradient(130deg, #24303f 0%, #4b5f72 55%, #8db4d0 100%)",
    authorName: "Nadia Ortega",
    authorAvatarFallback: "NO",
    publishedAtISO: "2026-02-05T14:15:00.000Z",
    publishedRelative: "Published 4 days ago",
    readTimeMinutes: 8,
    likes: 2120,
    views: 11930,
    tags: ["job-hunter"],
    body: buildGeneralBody("AI and Modern Job Hunting"),
  },
  {
    id: "high-growth-industries-for-job-seekers-in-2026",
    title: "High-Growth Industries for Job Seekers in 2026",
    excerpt:
      "Find out which sectors are expanding fastest and where the strongest entry opportunities are emerging.",
    categoryLabel: "Job Market Trends",
    coverGradient: "linear-gradient(130deg, #21414f 0%, #2e6f88 55%, #75b8ce 100%)",
    authorName: "Amelia Raj",
    authorAvatarFallback: "AR",
    publishedAtISO: "2026-02-04T16:00:00.000Z",
    publishedRelative: "Published 5 days ago",
    readTimeMinutes: 7,
    likes: 1330,
    views: 7010,
    tags: ["inspirative", "job-hunter"],
    body: buildGeneralBody("High-Growth Industries for Job Seekers"),
  },
  {
    id: "building-a-resume-that-gets-interviews",
    title: "Building a Resume That Gets Interviews",
    excerpt:
      "Use structure, keywords, and metrics the right way so your resume passes both ATS and recruiter reviews.",
    categoryLabel: "Resume Building",
    coverGradient: "linear-gradient(130deg, #2f3647 0%, #5a6f95 55%, #a2b3d8 100%)",
    authorName: "Zain Khan",
    authorAvatarFallback: "ZK",
    publishedAtISO: "2026-02-03T11:10:00.000Z",
    publishedRelative: "Published 6 days ago",
    readTimeMinutes: 10,
    likes: 2650,
    views: 10120,
    tags: ["job-hunter"],
    body: buildGeneralBody("Building a Resume That Gets Interviews"),
  },
  {
    id: "networking-strategies-that-open-doors",
    title: "Networking Strategies That Open Doors",
    excerpt:
      "Create meaningful professional relationships that result in referrals and high-quality opportunities.",
    categoryLabel: "Career Advice",
    coverGradient: "linear-gradient(130deg, #49322d 0%, #87574b 55%, #d29d83 100%)",
    authorName: "Isha M.",
    authorAvatarFallback: "IM",
    publishedAtISO: "2026-02-02T13:25:00.000Z",
    publishedRelative: "Published 1 week ago",
    readTimeMinutes: 6,
    likes: 1760,
    views: 6330,
    tags: ["inspirative"],
    body: buildGeneralBody("Networking Strategies"),
  },
  {
    id: "salary-negotiation-mistakes-to-avoid",
    title: "Salary Negotiation Mistakes to Avoid",
    excerpt:
      "Avoid common negotiation pitfalls and present compensation expectations with confidence.",
    categoryLabel: "Salary Guide",
    coverGradient: "linear-gradient(130deg, #283026 0%, #4f6e4d 55%, #95bc91 100%)",
    authorName: "Chris Lee",
    authorAvatarFallback: "CL",
    publishedAtISO: "2026-01-31T17:45:00.000Z",
    publishedRelative: "Published 9 days ago",
    readTimeMinutes: 7,
    likes: 1410,
    views: 5600,
    tags: ["job-hunter", "inspirative"],
    body: buildGeneralBody("Salary Negotiation"),
  },
];

const FALLBACK_GRADIENTS = [
  "linear-gradient(130deg, #1f3b5d 0%, #4f75a5 55%, #9bc6ff 100%)",
  "linear-gradient(130deg, #493525 0%, #8a6141 55%, #ddb48f 100%)",
  "linear-gradient(130deg, #1e4f4f 0%, #3d8181 55%, #83c7c7 100%)",
  "linear-gradient(130deg, #453568 0%, #7b61b2 55%, #b7a0ea 100%)",
];

const FILTER_IDS = new Set<BlogFilterId>(
  BLOG_CATEGORY_FILTERS.map((item) => item.id),
);

function hashValue(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function slugToTitle(slug: string) {
  return toTitleCase(slug.replace(/-/g, " ").trim()) || "Career Growth Guide";
}

function normalizeQuery(value: string | undefined) {
  return value?.trim().slice(0, 120) ?? "";
}

function compareByPublishedDesc(a: BlogArticle, b: BlogArticle) {
  return (
    new Date(b.publishedAtISO).getTime() - new Date(a.publishedAtISO).getTime()
  );
}

function compareByLikesDesc(a: BlogArticle, b: BlogArticle) {
  return b.likes - a.likes || compareByPublishedDesc(a, b);
}

function compareByViewsDesc(a: BlogArticle, b: BlogArticle) {
  return b.views - a.views || compareByPublishedDesc(a, b);
}

function resolveFilterId(input: string | undefined): BlogFilterId {
  if (input && FILTER_IDS.has(input as BlogFilterId)) {
    return input as BlogFilterId;
  }
  return "the-latest";
}

function includesQuery(article: BlogArticle, query: string) {
  if (!query) return true;
  const normalized = query.toLowerCase();

  return [
    article.title,
    article.excerpt,
    article.authorName,
    article.categoryLabel,
    ...article.body.introduction,
  ].some((value) => value.toLowerCase().includes(normalized));
}

function applyFilter(articles: BlogArticle[], filterId: BlogFilterId) {
  if (filterId === "the-latest") {
    return [...articles].sort(compareByPublishedDesc);
  }

  if (filterId === "inspirative") {
    return articles
      .filter((article) => article.tags.includes("inspirative"))
      .sort(compareByPublishedDesc);
  }

  if (filterId === "job-hunter") {
    return articles
      .filter((article) => article.tags.includes("job-hunter"))
      .sort(compareByPublishedDesc);
  }

  if (filterId === "most-liked") {
    return [...articles].sort(compareByLikesDesc);
  }

  return [...articles].sort(compareByViewsDesc);
}

function categoryCount(articles: BlogArticle[], filterId: BlogFilterId) {
  if (filterId === "the-latest" || filterId === "most-liked" || filterId === "most-viewed") {
    return articles.length;
  }

  if (filterId === "inspirative") {
    return articles.filter((article) => article.tags.includes("inspirative")).length;
  }

  return articles.filter((article) => article.tags.includes("job-hunter")).length;
}

function buildFallbackArticle(articleId: string): BlogArticle {
  const hash = hashValue(articleId);
  const title = slugToTitle(articleId);
  const publishedDaysAgo = (hash % 12) + 2;
  const publishedDate = new Date(Date.UTC(2026, 1, 10 - publishedDaysAgo, 9, 0, 0));
  const gradient = FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length];

  return {
    id: articleId,
    title,
    excerpt:
      "This article is generated from dynamic route data so API integration can replace mock content without changing the UI structure.",
    categoryLabel: "Career Insight",
    coverGradient: gradient,
    authorName: "Kaarya Editorial Team",
    authorAvatarFallback: "KE",
    publishedAtISO: publishedDate.toISOString(),
    publishedRelative: `Published ${publishedDaysAgo} days ago`,
    readTimeMinutes: 6,
    likes: 850 + (hash % 900),
    views: 4300 + (hash % 5000),
    tags: hash % 2 === 0 ? ["job-hunter"] : ["inspirative"],
    body: buildGeneralBody(title),
  };
}

function findArticleById(articleId: string) {
  return BLOG_ARTICLE_SEEDS.find((article) => article.id === articleId) ?? null;
}

function getRelatedArticle(currentArticle: BlogArticle) {
  const relatedFromSameTag = BLOG_ARTICLE_SEEDS
    .filter((candidate) => candidate.id !== currentArticle.id)
    .filter((candidate) =>
      candidate.tags.some((tag) => currentArticle.tags.includes(tag)),
    )
    .sort(compareByViewsDesc)[0];

  if (relatedFromSameTag) {
    return relatedFromSameTag;
  }

  return (
    BLOG_ARTICLE_SEEDS.filter((candidate) => candidate.id !== currentArticle.id).sort(
      compareByViewsDesc,
    )[0] ?? BLOG_ARTICLE_SEEDS[0]
  );
}

export async function getBlogsPageData({
  query,
  category,
}: BlogsPageQuery): Promise<BlogsPageData> {
  const searchQuery = normalizeQuery(query);
  const selectedFilterId = resolveFilterId(category);

  const queryMatched = BLOG_ARTICLE_SEEDS.filter((article) =>
    includesQuery(article, searchQuery),
  );

  return {
    hero: {
      title: "Find the Latest Job Market Insights",
      description:
        "Search through our extensive collection of articles to discover expert advice, industry trends, and tips for navigating your career journey.",
      searchPlaceholder: "Search blogs or articles...",
    },
    searchQuery,
    selectedFilterId,
    categories: BLOG_CATEGORY_FILTERS.map((item) => ({
      id: item.id,
      label: item.label,
      count: categoryCount(queryMatched, item.id),
    })),
    topArticles: [...BLOG_ARTICLE_SEEDS].sort(compareByViewsDesc).slice(0, 3),
    articles: applyFilter(queryMatched, selectedFilterId),
  };
}

export async function getBlogDetailPageData(
  articleId: string,
): Promise<BlogDetailPageData> {
  const article = findArticleById(articleId) ?? buildFallbackArticle(articleId);

  return {
    article,
    trendingTopics: TRENDING_TOPICS,
    relatedArticle: getRelatedArticle(article),
  };
}

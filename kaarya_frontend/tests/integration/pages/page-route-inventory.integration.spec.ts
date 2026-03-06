import fs from "node:fs";
import path from "node:path";

const appDirectory = path.resolve(__dirname, "../../../app");

const expectedAppRoutes = [
  "/",
  "/applications",
  "/admin",
  "/admin/colleges",
  "/admin/companies",
  "/admin/companies/[companyId]",
  "/admin/interviews",
  "/admin/interviews/[interviewId]",
  "/admin/interviews/create",
  "/admin/jobs",
  "/admin/jobs/[jobId]",
  "/admin/users",
  "/admin/users/[id]",
  "/admin/users/[id]/edit",
  "/admin/users/create",
  "/blogs",
  "/blogs/[articleId]",
  "/college-invites",
  "/college-settings",
  "/companies/[companyId]",
  "/company-invites",
  "/company-settings",
  "/forgot-password",
  "/inbox",
  "/interview-hub",
  "/interviews",
  "/interviews/[interviewId]",
  "/interviews/[interviewId]/take",
  "/interviews/create",
  "/interviews/sessions/[sessionId]/feedback",
  "/jobs",
  "/jobs/[jobId]",
  "/jobs/[jobId]/edit",
  "/jobs/new",
  "/leaderboard",
  "/oauth/callback",
  "/overview",
  "/payment/checkout",
  "/resources",
  "/resources/[courseId]",
  "/resume",
  "/saved",
  "/settings",
  "/sign-in",
  "/sign-up",
].sort();

const readPageRoutes = (directory: string): string[] => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      routes.push(...readPageRoutes(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name === "page.tsx") {
      const relativePath = path.relative(appDirectory, fullPath);
      const routeSegments = relativePath
        .split(path.sep)
        .filter((segment) => segment !== "page.tsx")
        .filter((segment) => !segment.startsWith("("));
      const route = routeSegments.length > 0 ? `/${routeSegments.join("/")}` : "/";
      routes.push(route);
    }
  }

  return routes;
};

describe("App page route inventory", () => {
  it("matches the expected route list", () => {
    const discoveredRoutes = readPageRoutes(appDirectory).sort();
    expect(discoveredRoutes).toEqual(expectedAppRoutes);
  });
});

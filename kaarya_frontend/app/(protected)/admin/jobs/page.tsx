import Link from "next/link";
import { Search } from "lucide-react";
import { getJobs } from "@/lib/actions/job-actions";
import type { TJob } from "@/lib/definitions";
import { parsePaginationParams, type PaginationMeta } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildHref,
  formatDateLabel,
  getShowingRange,
  readStringParam,
} from "../_lib/admin-page-utils";
import { DashboardHeader } from "../../(dashboard)/_components/dashboard-header";

type AdminJobsPageProps = {
  searchParams?: Promise<{
    page?: string;
    size?: string;
    search?: string;
    status?: "open" | "closed" | "draft";
    companyId?: string;
    collegeId?: string;
  }>;
};

type AdminJobsData = {
  jobs: TJob[];
  meta?: PaginationMeta;
};

export default async function AdminJobsPage({ searchParams }: AdminJobsPageProps) {
  const params = await searchParams;
  const { page, size } = parsePaginationParams(params);
  const search = readStringParam(params?.search);
  const companyId = readStringParam(params?.companyId);
  const collegeId = readStringParam(params?.collegeId);
  const status =
    params?.status === "open" || params?.status === "closed" || params?.status === "draft"
      ? params.status
      : undefined;

  const jobsResponse = await getJobs({
    page,
    size,
    search,
    status,
    companyId,
    collegeId,
  });

  const errorMessage =
    jobsResponse?.success === false ? jobsResponse?.message : undefined;
  const responseData = (jobsResponse?.data ?? null) as AdminJobsData | null;
  const jobs = Array.isArray(responseData?.jobs) ? responseData.jobs : [];
  const meta = responseData?.meta;
  const showing = getShowingRange(meta);

  const baseQuery = {
    size: meta?.size ?? size ?? 10,
    search,
    status,
    companyId,
    collegeId,
  };
  const prevHref = meta?.prevPage
    ? buildHref("/admin/jobs", {
        ...baseQuery,
        page: meta.prevPage,
      })
    : null;
  const nextHref = meta?.nextPage
    ? buildHref("/admin/jobs", {
        ...baseQuery,
        page: meta.nextPage,
      })
    : null;

  return (
    <>
      <DashboardHeader title="Job Postings" />

      <section className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
        <div className="rounded-xl border border-[#ececf0] bg-neutral-50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Monitor published, draft, and closed jobs across companies and
            colleges.
          </p>
        </div>

        <Card className="overflow-hidden py-0">
          <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-3">
            <form action="/admin/jobs" className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-md border bg-background px-2 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="Search job title..."
                  className="h-8 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                />
              </div>

              <select
                name="status"
                defaultValue={status ?? ""}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>

              <input type="hidden" name="size" value={String(meta?.size ?? size ?? 10)} />
              {companyId ? <input type="hidden" name="companyId" value={companyId} /> : null}
              {collegeId ? <input type="hidden" name="collegeId" value={collegeId} /> : null}

              <Button type="submit" variant="outline">
                Filter
              </Button>

              {search || status || companyId || collegeId ? (
                <Button asChild variant="ghost">
                  <Link href="/admin/jobs">Clear</Link>
                </Button>
              ) : null}
            </form>

            <p className="text-sm text-muted-foreground">
              {meta
                ? `Showing ${showing.from}-${showing.to} of ${meta.totalItems}`
                : `${jobs.length} results`}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorMessage ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {errorMessage}
                  </TableCell>
                </TableRow>
              ) : null}

              {!errorMessage && jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No jobs found.
                  </TableCell>
                </TableRow>
              ) : null}

              {!errorMessage
                ? jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>
                        {job.workspaceType === "college"
                          ? (job.college?.name ?? "-")
                          : (job.company?.name ?? "-")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={job.status === "open" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{job.visibility ?? "-"}</TableCell>
                      <TableCell>{job.applicationsCount ?? 0}</TableCell>
                      <TableCell>{formatDateLabel(job.deadline)}</TableCell>
                      <TableCell>{formatDateLabel(job.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/jobs/${job.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>

          {meta ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-background/50 px-4 py-3">
              {prevHref ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={prevHref}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}

              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{meta.page}</span> of{" "}
                <span className="font-medium text-foreground">{meta.totalPages}</span>
              </div>

              {nextHref ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={nextHref}>Next</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          ) : null}
        </Card>
      </section>
    </>
  );
}

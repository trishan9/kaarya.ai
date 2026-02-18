import Link from "next/link";
import { Search } from "lucide-react";
import { listInterviews } from "@/lib/actions/interview-actions";
import type { TInterview } from "@/lib/definitions";
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

type AdminInterviewsPageProps = {
  searchParams?: Promise<{
    page?: string;
    size?: string;
    search?: string;
    status?: "draft" | "published" | "archived";
    interviewType?:
      | "technical"
      | "behavioral"
      | "mixed"
      | "system_design"
      | "custom";
  }>;
};

type AdminInterviewsData = {
  interviews: TInterview[];
  meta?: PaginationMeta;
};

export default async function AdminInterviewsPage({
  searchParams,
}: AdminInterviewsPageProps) {
  const params = await searchParams;
  const { page, size } = parsePaginationParams(params);
  const search = readStringParam(params?.search);
  const status =
    params?.status === "draft" ||
    params?.status === "published" ||
    params?.status === "archived"
      ? params.status
      : undefined;
  const interviewType =
    params?.interviewType === "technical" ||
    params?.interviewType === "behavioral" ||
    params?.interviewType === "mixed" ||
    params?.interviewType === "system_design" ||
    params?.interviewType === "custom"
      ? params.interviewType
      : undefined;

  const interviewsResponse = await listInterviews({
    page,
    size,
    search,
    status,
    interviewType,
    ownership: "all",
    discover: false,
    sortBy: "updated",
  });

  const errorMessage =
    interviewsResponse?.success === false
      ? interviewsResponse?.message
      : undefined;
  const responseData = (interviewsResponse?.data ?? null) as
    | AdminInterviewsData
    | null;
  const interviews = Array.isArray(responseData?.interviews)
    ? responseData.interviews
    : [];
  const meta = responseData?.meta;
  const showing = getShowingRange(meta);

  const baseQuery = {
    size: meta?.size ?? size ?? 12,
    search,
    status,
    interviewType,
  };
  const prevHref = meta?.prevPage
    ? buildHref("/admin/interviews", {
        ...baseQuery,
        page: meta.prevPage,
      })
    : null;
  const nextHref = meta?.nextPage
    ? buildHref("/admin/interviews", {
        ...baseQuery,
        page: meta.nextPage,
      })
    : null;

  return (
    <>
      <DashboardHeader
        title="Interviews"
        actions={
          <Button asChild className="h-9 rounded-lg text-xs font-semibold">
            <Link href="/admin/interviews/create">Create Interview</Link>
          </Button>
        }
      />

      <section className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
        <div className="rounded-xl border border-[#ececf0] bg-neutral-50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Track interview assets and discoverability across all sources.
          </p>
        </div>

        <Card className="overflow-hidden py-0">
          <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-3">
            <form
              action="/admin/interviews"
              className="flex flex-wrap items-center gap-2"
            >
              <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-md border bg-background px-2 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="Search interview title..."
                  className="h-8 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                />
              </div>

              <select
                name="status"
                defaultValue={status ?? ""}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              <select
                name="interviewType"
                defaultValue={interviewType ?? ""}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">All types</option>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="mixed">Mixed</option>
                <option value="system_design">System Design</option>
                <option value="custom">Custom</option>
              </select>

              <input type="hidden" name="size" value={String(meta?.size ?? size ?? 12)} />

              <Button type="submit" variant="outline">
                Filter
              </Button>

              {search || status || interviewType ? (
                <Button asChild variant="ghost">
                  <Link href="/admin/interviews">Clear</Link>
                </Button>
              ) : null}
            </form>

            <p className="text-sm text-muted-foreground">
              {meta
                ? `Showing ${showing.from}-${showing.to} of ${meta.totalItems}`
                : `${interviews.length} results`}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Interview</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorMessage ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    {errorMessage}
                  </TableCell>
                </TableRow>
              ) : null}

              {!errorMessage && interviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No interviews found.
                  </TableCell>
                </TableRow>
              ) : null}

              {!errorMessage
                ? interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">{interview.title}</TableCell>
                      <TableCell>{interview.role}</TableCell>
                      <TableCell className="capitalize">
                        {interview.interviewType.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell className="capitalize">{interview.source}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            interview.status === "published" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {interview.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {interview.visibility.replaceAll("_", " ")}
                      </TableCell>
                      <TableCell>{interview.attemptsCount ?? 0}</TableCell>
                      <TableCell>{formatDateLabel(interview.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/interviews/${interview.id}`}>View</Link>
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

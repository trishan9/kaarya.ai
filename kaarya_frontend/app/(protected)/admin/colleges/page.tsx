import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { listColleges } from "@/lib/actions/college-actions";
import { parsePaginationParams, type PaginationMeta } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type AdminCollegesPageProps = {
  searchParams?: Promise<{
    page?: string;
    size?: string;
    search?: string;
  }>;
};

type AdminCollege = {
  id: string;
  name: string;
  institutionType?: string | null;
  location?: string | null;
  createdAt?: string;
};

type AdminCollegesData = {
  colleges: AdminCollege[];
  meta?: PaginationMeta;
};

export default async function AdminCollegesPage({
  searchParams,
}: AdminCollegesPageProps) {
  const params = await searchParams;
  const { page, size } = parsePaginationParams(params);
  const search = readStringParam(params?.search);

  const collegesResponse = await listColleges({
    page,
    size,
    search,
  });

  const errorMessage =
    collegesResponse?.success === false ? collegesResponse?.message : undefined;
  const responseData = (collegesResponse?.data ?? null) as AdminCollegesData | null;
  const colleges = Array.isArray(responseData?.colleges) ? responseData.colleges : [];
  const meta = responseData?.meta;
  const showing = getShowingRange(meta);

  const prevHref = meta?.prevPage
    ? buildHref("/admin/colleges", {
        page: meta.prevPage,
        size: meta.size,
        search,
      })
    : null;
  const nextHref = meta?.nextPage
    ? buildHref("/admin/colleges", {
        page: meta.nextPage,
        size: meta.size,
        search,
      })
    : null;

  return (
    <>
      <DashboardHeader title="Colleges" />

      <section className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
        <div className="rounded-xl border border-[#ececf0] bg-neutral-50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Review and navigate all college workspaces available to admins.
          </p>
        </div>

        <Card className="overflow-hidden py-0">
          <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <form
              action="/admin/colleges"
              className="flex w-full max-w-md items-center gap-2"
            >
              <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-2 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="Search by college name..."
                  className="h-8 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
              <input type="hidden" name="size" value={String(meta?.size ?? size ?? 10)} />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              {meta
                ? `Showing ${showing.from}-${showing.to} of ${meta.totalItems}`
                : `${colleges.length} results`}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College</TableHead>
                <TableHead>Institution Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorMessage ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {errorMessage}
                  </TableCell>
                </TableRow>
              ) : null}

              {!errorMessage && colleges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No colleges found.
                  </TableCell>
                </TableRow>
              ) : null}

              {!errorMessage
                ? colleges.map((college) => (
                    <TableRow key={college.id}>
                      <TableCell className="font-medium">{college.name}</TableCell>
                      <TableCell>{college.institutionType ?? "-"}</TableCell>
                      <TableCell>{college.location ?? "-"}</TableCell>
                      <TableCell>{formatDateLabel(college.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/jobs?collegeId=${college.id}`}>
                              Jobs
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/jobs?collegeId=${college.id}`}>
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </Link>
                          </Button>
                        </div>
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

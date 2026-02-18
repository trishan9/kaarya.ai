import Link from "next/link";
import { Search } from "lucide-react";
import { listCompanies } from "@/lib/actions/company-actions";
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

type AdminCompaniesPageProps = {
  searchParams?: Promise<{
    page?: string;
    size?: string;
    search?: string;
  }>;
};

type AdminCompany = {
  id: string;
  name: string;
  industry?: string | null;
  location?: string | null;
  verifiedStatus?: boolean;
  createdAt?: string;
};

type AdminCompaniesData = {
  companies: AdminCompany[];
  meta?: PaginationMeta;
};

export default async function AdminCompaniesPage({
  searchParams,
}: AdminCompaniesPageProps) {
  const params = await searchParams;
  const { page, size } = parsePaginationParams(params);
  const search = readStringParam(params?.search);

  const companiesResponse = await listCompanies({
    page,
    size,
    search,
  });

  const errorMessage =
    companiesResponse?.success === false ? companiesResponse?.message : undefined;
  const responseData = (companiesResponse?.data ??
    null) as AdminCompaniesData | null;
  const companies = Array.isArray(responseData?.companies)
    ? responseData.companies
    : [];
  const meta = responseData?.meta;
  const showing = getShowingRange(meta);

  const prevHref = meta?.prevPage
    ? buildHref("/admin/companies", {
        page: meta.prevPage,
        size: meta.size,
        search,
      })
    : null;
  const nextHref = meta?.nextPage
    ? buildHref("/admin/companies", {
        page: meta.nextPage,
        size: meta.size,
        search,
      })
    : null;

  return (
    <>
      <DashboardHeader title="Companies" />

      <section className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
        <div className="rounded-xl border border-[#ececf0] bg-neutral-50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Browse and review all company workspaces in the platform.
          </p>
        </div>

        <Card className="overflow-hidden py-0">
          <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <form
              action="/admin/companies"
              className="flex w-full max-w-md items-center gap-2"
            >
              <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-2 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="Search by company name..."
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
                : `${companies.length} results`}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorMessage ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {errorMessage}
                  </TableCell>
                </TableRow>
              ) : null}

              {!errorMessage && companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No companies found.
                  </TableCell>
                </TableRow>
              ) : null}

              {!errorMessage
                ? companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.industry ?? "-"}</TableCell>
                      <TableCell>{company.location ?? "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={company.verifiedStatus ? "default" : "secondary"}
                        >
                          {company.verifiedStatus ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateLabel(company.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/companies/${company.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/jobs?companyId=${company.id}`}>
                              Jobs
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

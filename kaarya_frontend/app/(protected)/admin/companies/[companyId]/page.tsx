import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, BriefcaseBusiness, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../../../(dashboard)/_components/dashboard-header";
import {
  getCompanyById,
  listCompanyRecruiters,
} from "@/lib/actions/company-actions";
import { getJobs } from "@/lib/actions/job-actions";
import type { TJob } from "@/lib/definitions";
import type { PaginationMeta } from "@/lib/pagination";

type AdminCompanyDetailsPageProps = {
  params: Promise<{
    companyId: string;
  }>;
};

const getTotalItems = (payload: unknown) => {
  const meta = (payload as { meta?: PaginationMeta } | null | undefined)?.meta;
  return typeof meta?.totalItems === "number" ? meta.totalItems : 0;
};

const initials = (value?: string | null) =>
  (value ?? "C")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatDateLabel = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default async function AdminCompanyDetailsPage({
  params,
}: AdminCompanyDetailsPageProps) {
  const { companyId } = await params;

  const [
    companyResponse,
    recruitersResponse,
    openJobsResponse,
    draftJobsResponse,
    closedJobsResponse,
    recentJobsResponse,
  ] = await Promise.all([
    getCompanyById(companyId),
    listCompanyRecruiters(companyId, { page: 1, size: 6 }),
    getJobs({ page: 1, size: 1, companyId, status: "open" }),
    getJobs({ page: 1, size: 1, companyId, status: "draft" }),
    getJobs({ page: 1, size: 1, companyId, status: "closed" }),
    getJobs({ page: 1, size: 8, companyId }),
  ]);

  if (!companyResponse?.success || !companyResponse?.data) {
    notFound();
  }

  const company = companyResponse.data as {
    id: string;
    name?: string;
    industry?: string | null;
    location?: string | null;
    logo?: string | null;
    verifiedStatus?: boolean;
    createdAt?: string;
  };

  const recruiters = Array.isArray(recruitersResponse?.data?.members)
    ? recruitersResponse.data.members
    : [];
  const recentJobs = Array.isArray(recentJobsResponse?.data?.jobs)
    ? (recentJobsResponse.data.jobs as TJob[])
    : [];
  const openJobs = getTotalItems(
    (openJobsResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
  );
  const draftJobs = getTotalItems(
    (draftJobsResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
  );
  const closedJobs = getTotalItems(
    (closedJobsResponse?.data as { meta?: PaginationMeta } | undefined) ?? null,
  );

  return (
    <>
      <DashboardHeader
        title="Company Profile"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="h-9 rounded-lg text-xs font-semibold">
              <Link href="/admin/companies">Back to Companies</Link>
            </Button>
            <Button asChild className="h-9 rounded-lg text-xs font-semibold">
              <Link href={`/admin/jobs?companyId=${company.id}`}>Open Jobs</Link>
            </Button>
          </div>
        }
      />

      <section className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
        <Card className="gap-4 rounded-2xl border border-[#ececf0] p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 text-base font-bold text-primary">
              {typeof company.logo === "string" && company.logo ? (
                <Image
                  src={company.logo}
                  alt={`${company.name ?? "Company"} logo`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg object-contain"
                />
              ) : (
                initials(company.name)
              )}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold text-foreground">
                {company.name ?? "Company"}
              </h2>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {company.location ?? "Location not specified"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={company.verifiedStatus ? "default" : "secondary"}>
              {company.verifiedStatus ? "Verified" : "Pending Verification"}
            </Badge>
            <Badge variant="outline">
              <Building2 className="mr-1 h-3.5 w-3.5" />
              {company.industry ?? "Industry not specified"}
            </Badge>
            <Badge variant="outline">
              Created {formatDateLabel(company.createdAt)}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Recruiters" value={String(recruiters.length)} />
            <MetricCard label="Open Jobs" value={String(openJobs)} />
            <MetricCard label="Draft Jobs" value={String(draftJobs)} />
            <MetricCard label="Closed Jobs" value={String(closedJobs)} />
          </div>
        </Card>

        <Card className="gap-4 rounded-2xl border border-[#ececf0] p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-semibold text-foreground">Recent Job Postings</h3>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No job postings found.</p>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#ececf0] bg-neutral-50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.location || "Remote"} - {job.employmentType || "Full-Time"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === "open" ? "default" : "secondary"} className="capitalize">
                      {job.status}
                    </Badge>
                    <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs">
                      <Link href={`/admin/jobs/${job.id}`}>
                        <BriefcaseBusiness className="mr-1 h-3.5 w-3.5" />
                        Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="gap-4 rounded-2xl border border-[#ececf0] p-4 shadow-sm sm:p-5">
          <h3 className="text-lg font-semibold text-foreground">Recruiter Members</h3>
          {recruiters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recruiter memberships found.</p>
          ) : (
            <div className="space-y-2">
              {recruiters.map((member: any, index: number) => {
                const recruiter = member?.recruiter ?? {};
                const recruiterId =
                  (typeof recruiter?.id === "string" && recruiter.id) ||
                  (typeof recruiter?._id === "string" && recruiter._id) ||
                  null;

                return (
                  <div
                    key={(typeof member?.id === "string" && member.id) || `member-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#ececf0] bg-neutral-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {(typeof recruiter?.name === "string" && recruiter.name) || "Recruiter"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(typeof recruiter?.email === "string" && recruiter.email) || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Users className="mr-1 h-3.5 w-3.5" />
                        {(typeof member?.designation === "string" && member.designation) || "Member"}
                      </Badge>
                      {recruiterId ? (
                        <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs">
                          <Link href={`/admin/users/${recruiterId}`}>User</Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#ececf0] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}


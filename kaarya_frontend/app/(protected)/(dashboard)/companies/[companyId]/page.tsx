import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, BriefcaseBusiness } from "lucide-react";
import { notFound } from "next/navigation";
import { DashboardHeader } from "../../_components/dashboard-header";
import { HeaderBackButton } from "../../_components/header-back-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCompanyById } from "@/lib/actions/company-actions";
import { getJobs } from "@/lib/actions/job-actions";

type CompanyProfilePageProps = {
  params: Promise<{
    companyId: string;
  }>;
  searchParams?: Promise<{
    from?: string;
  }>;
};

const initials = (value?: string | null) =>
  (value ?? "C")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default async function CompanyProfilePage({
  params,
  searchParams,
}: CompanyProfilePageProps) {
  const { companyId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fallbackHref =
    typeof resolvedSearchParams?.from === "string" &&
    resolvedSearchParams.from.startsWith("/")
      ? resolvedSearchParams.from
      : "/applications";
  const companyResponse = await getCompanyById(companyId);
  if (!companyResponse?.success || !companyResponse?.data) {
    notFound();
  }

  const company = companyResponse.data as {
    id: string;
    name?: string;
    industry?: string | null;
    location?: string | null;
    logo?: string | null;
  };

  const jobsResponse = await getJobs({
    page: 1,
    size: 6,
    feed: "all",
    companyId,
    status: "open",
  });
  const jobs = Array.isArray(jobsResponse?.data?.jobs) ? jobsResponse.data.jobs : [];

  return (
    <div className="min-h-svh bg-neutral-100 p-2 sm:p-4 lg:pl-0 lg:p-5">
      <div className="rounded-xl bg-white sm:rounded-2xl">
        <DashboardHeader
          title="Company Profile"
          leadingAction={<HeaderBackButton fallbackHref={fallbackHref} />}
          hideSidebarTrigger
        />

        <div className="space-y-4 px-3 pb-6 sm:px-4 sm:pb-8">
          <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
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
                <h1 className="truncate text-xl font-semibold text-foreground">
                  {company.name ?? "Company"}
                </h1>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.location ?? "Location not specified"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 font-medium text-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {company.industry ?? "Industry not specified"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 font-medium text-foreground">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                {jobs.length} open roles
              </span>
            </div>
          </Card>

          <Card className="gap-3 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Open Roles</h2>
              <Button asChild variant="outline" className="h-8">
                <Link href={`/jobs?search=${encodeURIComponent(company.name ?? "")}`}>
                  View all jobs
                </Link>
              </Button>
            </div>

            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open roles published right now.
              </p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#ececf0] bg-neutral-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.location ?? "Remote"} - {job.employmentType ?? "Full-Time"}
                      </p>
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/jobs/${job.id}`}>View Job</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

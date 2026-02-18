import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "../../../(dashboard)/_components/dashboard-header";
import { JobDescriptionPanel } from "../../../(dashboard)/jobs/_components/job-description-panel";
import { getJobApplications, getJobById } from "@/lib/actions/job-actions";
import type { TJob } from "@/lib/definitions";
import { AdminJobApplicantsPanel } from "./_components/admin-job-applicants-panel";

type AdminJobDetailsPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

type JobApplicationRow = {
  id: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  appliedAtLabel: string;
  resume?: {
    fileName?: string;
    mimeType?: string;
    previewUrl?: string;
    fileUrl?: string;
    downloadUrl?: string;
  };
};

const toDateLabel = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const toTrimmedString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const parseApplications = (response: unknown): JobApplicationRow[] => {
  const payload = response as
    | { data?: { applications?: unknown[] } | unknown[] }
    | null
    | undefined;
  const rawRows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.applications)
      ? payload.data.applications
      : [];

  return rawRows.map((row, index) => {
    const application = (row ?? {}) as Record<string, unknown>;
    const candidate =
      (application.candidate as Record<string, unknown> | undefined) ??
      (application.user as Record<string, unknown> | undefined) ??
      (application.applicant as Record<string, unknown> | undefined) ??
      (application.student as Record<string, unknown> | undefined) ??
      {};
    const resume =
      (application.resume as Record<string, unknown> | undefined) ??
      (application.resumeId as Record<string, unknown> | undefined) ??
      {};

    const candidateName =
      toTrimmedString(candidate.name) ??
      toTrimmedString(application.candidateName) ??
      "Candidate";
    const candidateEmail =
      toTrimmedString(candidate.email) ??
      toTrimmedString(application.candidateEmail) ??
      "Not available";
    const status = toTrimmedString(application.status) ?? "applied";
    const createdAt =
      toTrimmedString(application.createdAt) ??
      toTrimmedString(application.appliedAt) ??
      null;
    const resumeFileName =
      toTrimmedString(resume.fileName) ??
      toTrimmedString(application.resumeFileName) ??
      null;
    const resumeFileUrl =
      toTrimmedString(resume.fileUrl) ?? toTrimmedString(resume.url) ?? null;
    const resumePreviewUrl =
      toTrimmedString(resume.previewUrl) ?? resumeFileUrl;
    const resumeDownloadUrl =
      toTrimmedString(resume.downloadUrl) ?? resumeFileUrl ?? resumePreviewUrl;
    const resumeMimeType = toTrimmedString(resume.mimeType) ?? null;
    const id =
      toTrimmedString(application.id) ??
      toTrimmedString(application._id) ??
      `application-${index + 1}`;
    const candidateId =
      toTrimmedString(candidate.id) ??
      toTrimmedString(candidate._id) ??
      undefined;

    return {
      id,
      candidateId,
      candidateName,
      candidateEmail,
      status,
      appliedAtLabel: toDateLabel(createdAt),
      resume:
        resumePreviewUrl || resumeFileUrl || resumeDownloadUrl
          ? {
              fileName: resumeFileName ?? undefined,
              mimeType: resumeMimeType ?? undefined,
              previewUrl: resumePreviewUrl ?? undefined,
              fileUrl: resumeFileUrl ?? undefined,
              downloadUrl: resumeDownloadUrl ?? undefined,
            }
          : undefined,
    };
  });
};

export default async function AdminJobDetailsPage({
  params,
}: AdminJobDetailsPageProps) {
  const { jobId } = await params;
  const [jobResponse, applicationsResponse] = await Promise.all([
    getJobById(jobId),
    getJobApplications(jobId, { page: 1, size: 100 }),
  ]);

  if (!jobResponse?.success || !jobResponse?.data) {
    notFound();
  }

  const job = jobResponse.data as TJob;
  const applications = parseApplications(applicationsResponse);
  const qualifications = Array.isArray(job.requirements?.qualifications)
    ? (job.requirements.qualifications as string[]).filter(Boolean)
    : Array.isArray(job.requirements?.skills)
      ? (job.requirements.skills as string[]).map((skill) => `Experience with ${skill}`)
      : [];

  return (
    <>
      <DashboardHeader
        title="Job Details"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="h-9 rounded-lg text-xs font-semibold">
              <Link href="/admin/jobs">Back to Jobs</Link>
            </Button>
            {job.companyId ? (
              <Button asChild className="h-9 rounded-lg text-xs font-semibold">
                <Link href={`/admin/companies/${job.companyId}`}>Open Company</Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="space-y-5 px-3 pb-6 sm:px-4 sm:pb-8">
        <Card className="gap-4 rounded-2xl border border-[#ececf0] p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={job.status === "open" ? "default" : "secondary"} className="capitalize">
              {job.status}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {job.visibility ?? "global"}
            </Badge>
            <Badge variant="outline">
              {job.workspaceType === "college" ? "College Workspace" : "Company Workspace"}
            </Badge>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-foreground">{job.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {(job.workspaceType === "college" ? job.college?.name : job.company?.name) ?? "-"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Applications" value={String(job.applicationsCount ?? 0)} />
            <MetricCard label="Views" value={String(job.viewsCount ?? 0)} />
            <MetricCard label="Location" value={job.location || "-"} />
            <MetricCard label="Deadline" value={toDateLabel(job.deadline)} />
            <MetricCard label="Created" value={toDateLabel(job.createdAt)} />
          </div>
        </Card>

        <JobDescriptionPanel
          descriptionTitle="Job Description"
          description={job.description}
          qualificationsTitle="Qualifications"
          qualifications={qualifications}
        />

        <AdminJobApplicantsPanel applications={applications} />
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

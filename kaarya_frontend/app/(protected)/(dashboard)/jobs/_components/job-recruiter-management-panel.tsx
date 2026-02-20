"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  updateApplicationResumeActivity,
  updateJobApplication,
  updateJobPosting,
} from "@/lib/actions/job-actions";
import type {
  JobApplicantRecord,
  JobApplicantStatus,
} from "../job-detail-data";

type JobRecruiterManagementPanelProps = {
  jobId: string;
  workspaceId?: string | null;
  currentStatus: "open" | "closed" | "draft";
  applicants: JobApplicantRecord[];
};

type ApplicantLocalState = {
  status: JobApplicantStatus;
  interviewScheduledAt: string;
  interviewNote: string;
  isSaving: boolean;
};

const jobStatusOptions = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "draft", label: "Draft" },
] as const;

const applicationStatusOptions: Array<{
  value: JobApplicantStatus;
  label: string;
}> = [
  { value: "applied", label: "Applied" },
  { value: "reviewing", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "accepted", label: "Offer Sent" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const toDateTimeInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const applicationStatusLabel = (status: JobApplicantStatus) =>
  applicationStatusOptions.find((option) => option.value === status)?.label ??
  "Applied";

const applicantInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join("") || "A";

const formatBytes = (value?: number) => {
  if (!value || value <= 0) return null;
  const mb = value / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatProfileDate = (value?: string | null) => {
  if (!value) return "Present";
  const normalized = /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const WORD_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const resolveResumeExtension = (mimeType?: string, fileName?: string | null) => {
  const normalizedMimeType = mimeType?.toLowerCase();
  const trimmedFileName = fileName?.trim();

  if (trimmedFileName && /\.[a-z0-9]+$/i.test(trimmedFileName)) {
    return trimmedFileName;
  }
  if (normalizedMimeType === "application/pdf") {
    return `${trimmedFileName || "resume"}.pdf`;
  }
  if (normalizedMimeType === "application/msword") {
    return `${trimmedFileName || "resume"}.doc`;
  }
  if (
    normalizedMimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return `${trimmedFileName || "resume"}.docx`;
  }
  return trimmedFileName || "resume";
};

const isWordResume = (resume?: JobApplicantRecord["resume"], fallbackFileName?: string) => {
  const mimeType = resume?.mimeType?.toLowerCase();
  if (mimeType && WORD_MIME_TYPES.has(mimeType)) return true;
  const fileName = (resume?.fileName ?? fallbackFileName ?? "").toLowerCase();
  return fileName.endsWith(".doc") || fileName.endsWith(".docx");
};

const toOfficePreviewUrl = (fileUrl: string) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

const timeSlots = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  const value = `${String(hour).padStart(2, "0")}:${minute}`;
  const label = format(new Date(2026, 0, 1, hour, Number(minute)), "hh:mm a");
  return { value, label };
});

const toInterviewDate = (value: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const toInterviewTime = (value: string) => {
  if (!value) return "09:00";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "09:00";
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const combineDateAndTime = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map((token) => Number(token));
  const combined = new Date(date);
  combined.setHours(Number.isNaN(hours) ? 9 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
  const year = combined.getFullYear();
  const month = String(combined.getMonth() + 1).padStart(2, "0");
  const day = String(combined.getDate()).padStart(2, "0");
  const hh = String(combined.getHours()).padStart(2, "0");
  const mm = String(combined.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hh}:${mm}`;
};

export function JobRecruiterManagementPanel({
  jobId,
  workspaceId,
  currentStatus,
  applicants,
}: JobRecruiterManagementPanelProps) {
  const router = useRouter();
  const [jobStatus, setJobStatus] = React.useState(currentStatus);
  const [isSavingJobStatus, setIsSavingJobStatus] = React.useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = React.useState<string | null>(
    applicants[0]?.id ?? null,
  );
  const [previewResumeUrl, setPreviewResumeUrl] = React.useState<string | null>(null);
  const [previewResumeTitle, setPreviewResumeTitle] = React.useState("Resume Preview");
  const [applicantState, setApplicantState] = React.useState<
    Record<string, ApplicantLocalState>
  >(() =>
    applicants.reduce<Record<string, ApplicantLocalState>>((acc, applicant) => {
      acc[applicant.id] = {
        status: applicant.status,
        interviewScheduledAt: toDateTimeInputValue(applicant.interviewScheduledAt),
        interviewNote: applicant.interviewNote ?? "",
        isSaving: false,
      };
      return acc;
    }, {}),
  );

  React.useEffect(() => {
    setJobStatus(currentStatus);
  }, [currentStatus]);

  React.useEffect(() => {
    setApplicantState(
      applicants.reduce<Record<string, ApplicantLocalState>>((acc, applicant) => {
        acc[applicant.id] = {
          status: applicant.status,
          interviewScheduledAt: toDateTimeInputValue(applicant.interviewScheduledAt),
          interviewNote: applicant.interviewNote ?? "",
          isSaving: false,
        };
        return acc;
      }, {}),
    );

    if (applicants.length === 0) {
      setSelectedApplicantId(null);
      return;
    }

    if (!selectedApplicantId || !applicants.some((item) => item.id === selectedApplicantId)) {
      setSelectedApplicantId(applicants[0].id);
    }
  }, [applicants, selectedApplicantId]);

  const selectedApplicant = applicants.find(
    (applicant) => applicant.id === selectedApplicantId,
  );
  const selectedState = selectedApplicant ? applicantState[selectedApplicant.id] : null;
  const selectedApplicantProfile = selectedApplicant?.candidateProfile ?? null;

  const openResumePreview = async (applicant: JobApplicantRecord) => {
    const fileUrl = applicant.resume?.fileUrl ?? null;
    const previewUrl = applicant.resume?.previewUrl ?? fileUrl;
    if (!previewUrl) {
      toast.error("Resume preview is unavailable for this applicant.");
      return;
    }

    const resolvedPreviewUrl =
      isWordResume(applicant.resume, applicant.resumeFileName) && fileUrl
        ? toOfficePreviewUrl(fileUrl)
        : previewUrl;
    setPreviewResumeUrl(resolvedPreviewUrl);
    setPreviewResumeTitle(
      `${applicant.name} - ${resolveResumeExtension(
        applicant.resume?.mimeType,
        applicant.resume?.fileName ?? applicant.resumeFileName,
      )}`,
    );

    const response = await updateApplicationResumeActivity(
      jobId,
      applicant.id,
      "viewed",
    );
    if (!response?.success) {
      toast.error(response?.message || "Failed to track resume view activity.");
      return;
    }
    router.refresh();
  };

  const downloadResume = async (applicant: JobApplicantRecord) => {
    const downloadUrl =
      applicant.resume?.downloadUrl ?? applicant.resume?.fileUrl ?? applicant.resume?.previewUrl;
    if (!downloadUrl) {
      toast.error("Resume download is unavailable for this applicant.");
      return;
    }

    const activityResponse = await updateApplicationResumeActivity(
      jobId,
      applicant.id,
      "downloaded",
    );
    if (!activityResponse?.success) {
      toast.error(activityResponse?.message || "Failed to track resume download.");
    }

    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = resolveResumeExtension(
      applicant.resume?.mimeType,
      applicant.resume?.fileName ?? applicant.resumeFileName,
    );
    anchor.rel = "noreferrer";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success("Download started.");
    router.refresh();
  };

  const saveJobStatus = async () => {
    setIsSavingJobStatus(true);
    try {
      const response = await updateJobPosting(jobId, {
        status: jobStatus,
      });
      if (!response?.success) {
        toast.error(response?.message || "Failed to update job status.");
        return;
      }
      toast.success(response?.message || "Job status updated.");
      router.refresh();
    } finally {
      setIsSavingJobStatus(false);
    }
  };

  const updateApplicantField = (
    applicantId: string,
    patch: Partial<ApplicantLocalState>,
  ) => {
    setApplicantState((prev) => ({
      ...prev,
      [applicantId]: {
        ...prev[applicantId],
        ...patch,
      },
    }));
  };

  const saveApplicantStatus = async (applicantId: string) => {
    const state = applicantState[applicantId];
    if (!state) return;

    updateApplicantField(applicantId, { isSaving: true });
    try {
      const response = await updateJobApplication(jobId, applicantId, {
        status: state.status,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to update application status.");
        return;
      }

      toast.success(response?.message || "Application status updated.");
      router.refresh();
    } finally {
      updateApplicantField(applicantId, { isSaving: false });
    }
  };

  const inviteApplicant = async (applicantId: string) => {
    const state = applicantState[applicantId];
    if (!state) return;
    if (!state.interviewScheduledAt) {
      toast.error("Select interview date and time first.");
      return;
    }

    updateApplicantField(applicantId, { isSaving: true });
    try {
      const response = await updateJobApplication(jobId, applicantId, {
        status: "interview_scheduled",
        interviewScheduledAt: new Date(state.interviewScheduledAt).toISOString(),
        interviewNote: state.interviewNote,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to send interview invite.");
        return;
      }

      toast.success(response?.message || "Interview invite sent.");
      router.refresh();
    } finally {
      updateApplicantField(applicantId, { isSaving: false });
    }
  };

  return (
    <section id="recruiter-management" className="space-y-4">
      <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Job Controls</h3>
            <p className="text-sm text-muted-foreground">
              Control job visibility and open the full edit form with prefilled data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={workspaceId ? `/jobs?workspace=${workspaceId}` : "/jobs"}>
                Back to Jobs
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={
                  workspaceId
                    ? `/jobs/${jobId}/edit?workspace=${workspaceId}`
                    : `/jobs/${jobId}/edit`
                }
              >
                Edit Job
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-[220px] space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Job Status</p>
            <Select
              value={jobStatus}
              onValueChange={(value) =>
                setJobStatus(value as "open" | "closed" | "draft")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {jobStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={saveJobStatus} disabled={isSavingJobStatus}>
            {isSavingJobStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Status
          </Button>
        </div>
      </Card>

      <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Applicants Pipeline</h3>
          <p className="text-sm text-muted-foreground">
            Review candidates in a list-detail layout, update status, and send interview invites.
          </p>
        </div>

        {applicants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d8dde4] p-5 text-sm text-muted-foreground">
            No applications received for this role yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <div className="space-y-2 rounded-xl border border-[#ececf0] bg-neutral-50 p-2.5">
              {applicants.map((applicant) => {
                const state = applicantState[applicant.id];
                const isActive = applicant.id === selectedApplicantId;
                return (
                  <button
                    key={applicant.id}
                    type="button"
                    onClick={() => setSelectedApplicantId(applicant.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      isActive
                        ? "border-primary/40 bg-white shadow-sm"
                        : "border-transparent bg-transparent hover:border-[#d8dde4] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {applicantInitials(applicant.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {applicant.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {applicant.email}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[11px]">
                            {applicationStatusLabel(state?.status ?? applicant.status)}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            Applied {applicant.appliedAtLabel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedApplicant && selectedState ? (
              <div className="space-y-4 rounded-xl border border-[#ececf0] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {applicantInitials(selectedApplicant.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">
                        {selectedApplicant.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {selectedApplicant.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedApplicant.resume?.previewUrl ||
                    selectedApplicant.resume?.fileUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openResumePreview(selectedApplicant)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview Resume
                      </Button>
                    ) : null}
                    {selectedApplicant.resume?.downloadUrl ||
                    selectedApplicant.resume?.fileUrl ||
                    selectedApplicant.resume?.previewUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadResume(selectedApplicant)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    ) : null}
                    {selectedApplicant.resume?.fileUrl ? (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={selectedApplicant.resume.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Source
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {selectedApplicant.resumeFileName ? (
                  <div className="rounded-lg border border-[#e6e8ee] bg-neutral-50 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {selectedApplicant.resumeFileName}
                    </p>
                    <p>
                      {selectedApplicant.resume?.mimeType ?? "application/pdf"}
                      {selectedApplicant.resume?.fileSize
                        ? ` - ${formatBytes(selectedApplicant.resume.fileSize)}`
                        : ""}
                    </p>
                    {selectedApplicant.resumeActivity ? (
                      <p className="mt-1">
                        Viewed {selectedApplicant.resumeActivity.viewCount ?? 0} times,
                        downloaded {selectedApplicant.resumeActivity.downloadCount ?? 0} times.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {selectedApplicant.coverLetter ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Cover Letter
                    </p>
                    <p className="rounded-lg border border-[#e6e8ee] bg-neutral-50 p-3 text-sm leading-6 text-foreground">
                      {selectedApplicant.coverLetter}
                    </p>
                  </div>
                ) : null}

                {selectedApplicant.portfolioLinks?.length ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Portfolio
                    </p>
                    <div className="space-y-1.5">
                      {selectedApplicant.portfolioLinks.map((link) => (
                        <a
                          key={`${selectedApplicant.id}-${link}`}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm text-primary underline-offset-2 hover:underline"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedApplicantProfile ? (
                  <div className="space-y-3 rounded-lg border border-[#e6e8ee] bg-neutral-50 p-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Candidate Profile
                      </p>
                      {selectedApplicantProfile.headline ? (
                        <p className="text-sm font-medium text-foreground">
                          {selectedApplicantProfile.headline}
                        </p>
                      ) : null}
                      {selectedApplicantProfile.summary ? (
                        <p className="text-sm leading-6 text-muted-foreground">
                          {selectedApplicantProfile.summary}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {selectedApplicantProfile.location ? (
                        <span className="rounded-md border bg-white px-2 py-1">
                          Location: {selectedApplicantProfile.location}
                        </span>
                      ) : null}
                      {selectedApplicantProfile.phone ? (
                        <span className="rounded-md border bg-white px-2 py-1">
                          Phone: {selectedApplicantProfile.phone}
                        </span>
                      ) : null}
                      {selectedApplicantProfile.openToWork !== undefined ? (
                        <span className="rounded-md border bg-white px-2 py-1">
                          Open to work: {selectedApplicantProfile.openToWork ? "Yes" : "No"}
                        </span>
                      ) : null}
                    </div>

                    {selectedApplicantProfile.skills?.length ? (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedApplicantProfile.skills.map((skill) => (
                            <Badge
                              key={`${selectedApplicant.id}-skill-${skill}`}
                              variant="outline"
                              className="text-[11px]"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedApplicantProfile.preferredRoles?.length ||
                    selectedApplicantProfile.preferredLocations?.length ||
                    selectedApplicantProfile.preferredWorkModes?.length ? (
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Preferences
                        </p>
                        {selectedApplicantProfile.preferredRoles?.length ? (
                          <p>
                            Roles: {selectedApplicantProfile.preferredRoles.join(", ")}
                          </p>
                        ) : null}
                        {selectedApplicantProfile.preferredLocations?.length ? (
                          <p>
                            Locations: {selectedApplicantProfile.preferredLocations.join(", ")}
                          </p>
                        ) : null}
                        {selectedApplicantProfile.preferredWorkModes?.length ? (
                          <p>
                            Work modes: {selectedApplicantProfile.preferredWorkModes.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {selectedApplicantProfile.experience?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Experience
                        </p>
                        <div className="space-y-2">
                          {selectedApplicantProfile.experience.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="rounded-md border bg-white p-2 text-xs"
                            >
                              <p className="font-medium text-foreground">
                                {item.jobTitle} - {item.companyName}
                              </p>
                              <p className="text-muted-foreground">
                                {formatProfileDate(item.startDate)} -{" "}
                                {item.currentlyWorking
                                  ? "Present"
                                  : formatProfileDate(item.endDate)}
                                {item.location ? ` | ${item.location}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedApplicantProfile.education?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Education
                        </p>
                        <div className="space-y-2">
                          {selectedApplicantProfile.education.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="rounded-md border bg-white p-2 text-xs"
                            >
                              <p className="font-medium text-foreground">
                                {item.degree} {item.fieldOfStudy ? `in ${item.fieldOfStudy}` : ""}
                              </p>
                              <p className="text-muted-foreground">
                                {item.institution}
                                {item.startDate || item.endDate
                                  ? ` | ${formatProfileDate(item.startDate)} - ${formatProfileDate(item.endDate)}`
                                  : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedApplicantProfile.certifications?.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Certifications
                        </p>
                        <div className="space-y-2">
                          {selectedApplicantProfile.certifications.slice(0, 3).map((item) => (
                            <div
                              key={item.id}
                              className="rounded-md border bg-white p-2 text-xs"
                            >
                              <p className="font-medium text-foreground">
                                {item.name} - {item.issuer}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {item.credentialUrl ? (
                                  <a
                                    href={item.credentialUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline-offset-2 hover:underline"
                                  >
                                    Verification link
                                  </a>
                                ) : null}
                                {item.mediaUrl ? (
                                  <a
                                    href={item.mediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline-offset-2 hover:underline"
                                  >
                                    View certificate file
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-3 lg:grid-cols-[220px_auto]">
                  <Select
                    value={selectedState.status}
                    onValueChange={(value) =>
                      updateApplicantField(selectedApplicant.id, {
                        status: value as JobApplicantStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {applicationStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => saveApplicantStatus(selectedApplicant.id)}
                    disabled={selectedState.isSaving}
                  >
                    {selectedState.isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Update Status
                  </Button>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-start rounded-md border-[#d8dde4] font-normal"
                        >
                          <CalendarDays className="h-4 w-4" />
                          {toInterviewDate(selectedState.interviewScheduledAt) ? (
                            format(
                              toInterviewDate(selectedState.interviewScheduledAt)!,
                              "PPP",
                            )
                          ) : (
                            <span>Select interview date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          selected={toInterviewDate(selectedState.interviewScheduledAt)}
                          onSelect={(date) => {
                            if (!date) return;
                            const nextValue = combineDateAndTime(
                              date,
                              toInterviewTime(selectedState.interviewScheduledAt),
                            );
                            updateApplicantField(selectedApplicant.id, {
                              interviewScheduledAt: nextValue,
                            });
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <Select
                      value={toInterviewTime(selectedState.interviewScheduledAt)}
                      onValueChange={(time) => {
                        const baseDate =
                          toInterviewDate(selectedState.interviewScheduledAt) ?? new Date();
                        updateApplicantField(selectedApplicant.id, {
                          interviewScheduledAt: combineDateAndTime(baseDate, time),
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={selectedState.interviewNote}
                    onChange={(event) =>
                      updateApplicantField(selectedApplicant.id, {
                        interviewNote: event.target.value,
                      })
                    }
                    placeholder="Interview note, meeting link, or recruiter instructions"
                    className="min-h-24"
                  />
                  <Button
                    onClick={() => inviteApplicant(selectedApplicant.id)}
                    disabled={selectedState.isSaving}
                  >
                    {selectedState.isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    <UserCheck className="h-4 w-4" />
                    Send Interview Invite
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Dialog open={Boolean(previewResumeUrl)} onOpenChange={(open) => !open && setPreviewResumeUrl(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewResumeTitle}</DialogTitle>
          </DialogHeader>
          {previewResumeUrl ? (
            <iframe
              src={previewResumeUrl}
              title="Resume preview"
              className="h-[70vh] w-full rounded-md border"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

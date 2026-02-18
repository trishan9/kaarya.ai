"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AdminJobApplicationRow = {
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

type AdminJobApplicantsPanelProps = {
  applications: AdminJobApplicationRow[];
};

const WORD_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const isWordResume = (resume?: AdminJobApplicationRow["resume"]) => {
  const mimeType = resume?.mimeType?.toLowerCase();
  if (mimeType && WORD_MIME_TYPES.has(mimeType)) return true;
  const fileName = (resume?.fileName ?? "").toLowerCase();
  return fileName.endsWith(".doc") || fileName.endsWith(".docx");
};

const toOfficePreviewUrl = (fileUrl: string) =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

export function AdminJobApplicantsPanel({
  applications,
}: AdminJobApplicantsPanelProps) {
  const [previewResumeUrl, setPreviewResumeUrl] = React.useState<string | null>(null);
  const [previewResumeTitle, setPreviewResumeTitle] = React.useState("Resume Preview");

  const openResumePreview = (application: AdminJobApplicationRow) => {
    const resume = application.resume;
    const fileUrl = resume?.fileUrl ?? null;
    const previewUrl = resume?.previewUrl ?? fileUrl;
    if (!previewUrl) {
      return;
    }

    const resolvedPreviewUrl =
      isWordResume(resume) && fileUrl ? toOfficePreviewUrl(fileUrl) : previewUrl;
    setPreviewResumeUrl(resolvedPreviewUrl);
    setPreviewResumeTitle(
      `${application.candidateName} - ${resume?.fileName || "Resume"}`,
    );
  };

  return (
    <>
      <Card className="gap-4 rounded-2xl border border-[#ececf0] p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-semibold text-foreground">Applicants Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Admin-only view of applicants and application pipeline for this job.
        </p>

        {applications.length === 0 ? (
          <p className="rounded-lg border border-[#ececf0] bg-neutral-50 p-3 text-sm text-muted-foreground">
            No applications found for this job yet.
          </p>
        ) : (
          <div className="space-y-2">
            {applications.map((application) => (
              <div
                key={application.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#ececf0] bg-neutral-50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {application.candidateName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {application.candidateEmail}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {application.appliedAtLabel}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {application.status.replaceAll("_", " ")}
                  </Badge>
                  {application.candidateId ? (
                    <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs">
                      <Link href={`/admin/users/${application.candidateId}`}>User</Link>
                    </Button>
                  ) : null}
                  {application.resume?.previewUrl || application.resume?.fileUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => openResumePreview(application)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Preview Resume
                    </Button>
                  ) : (
                    <Badge variant="secondary">No Resume</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog
        open={Boolean(previewResumeUrl)}
        onOpenChange={(open) => !open && setPreviewResumeUrl(null)}
      >
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
    </>
  );
}


"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { ExternalLink, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadMyResume, deleteMyResume } from "@/lib/actions/job-actions";
import { ResumeSkillsInput } from "@/app/(protected)/(dashboard)/resume/_components/resume-form-fields";
import { TUpdateProfileSchemaInput } from "../_schemas";
import { ProfileSaveButton } from "./profile-save-button";

export type TSettingsResumeOption = {
  id: string;
  fileName: string;
  previewUrl?: string;
  downloadUrl?: string;
  uploadedAt?: string | null;
};

type ResumeInformationFormProps = {
  form: UseFormReturn<TUpdateProfileSchemaInput>;
  resumeOptions: TSettingsResumeOption[];
  isSubmitting: boolean;
};

const ACCEPTED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const validateResumeFile = (file: File) => {
  const maxSizeInMb = 10;
  const maxBytes = maxSizeInMb * 1024 * 1024;
  const extensionAllowed = /\.(pdf|doc|docx)$/i.test(file.name);
  const mimeTypeAllowed = ACCEPTED_RESUME_MIME_TYPES.includes(file.type);

  if (!extensionAllowed && !mimeTypeAllowed) {
    return "Only PDF, DOC, or DOCX files are supported.";
  }

  if (file.size > maxBytes) {
    return "File must be smaller than 10 MB.";
  }

  return null;
};

export function ResumeInformationForm({
  form,
  resumeOptions,
  isSubmitting,
}: ResumeInformationFormProps) {
  const [resumeLibrary, setResumeLibrary] = useState<TSettingsResumeOption[]>(
    resumeOptions,
  );
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedResumeId = form.watch("candidateProfile.defaultResumeId") ?? "";
  const portfolioLinks = form.watch("candidateProfile.portfolioLinks") ?? [];

  const selectedResume = useMemo(
    () => resumeLibrary.find((item) => item.id === selectedResumeId),
    [resumeLibrary, selectedResumeId],
  );

  const handleUploadResume = async (file: File | null) => {
    if (!file) return;
    const validationError = validateResumeFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploadingResume(true);
    try {
      const response = await uploadMyResume(file);
      if (!response?.success || !response?.data) {
        toast.error(response?.message || "Failed to upload resume.");
        return;
      }

      const uploaded = response.data as Record<string, unknown>;
      const mapped: TSettingsResumeOption | null =
        typeof uploaded?.id === "string"
          ? {
              id: uploaded.id,
              fileName:
                typeof uploaded.fileName === "string" && uploaded.fileName.trim()
                  ? uploaded.fileName.trim()
                  : file.name,
              previewUrl:
                typeof uploaded.previewUrl === "string"
                  ? uploaded.previewUrl
                  : typeof uploaded.fileUrl === "string"
                    ? uploaded.fileUrl
                    : undefined,
              downloadUrl:
                typeof uploaded.downloadUrl === "string"
                  ? uploaded.downloadUrl
                  : typeof uploaded.fileUrl === "string"
                    ? uploaded.fileUrl
                    : undefined,
              uploadedAt:
                typeof uploaded.createdAt === "string"
                  ? uploaded.createdAt
                  : null,
            }
          : null;

      if (!mapped) {
        toast.error("Resume uploaded but response was invalid.");
        return;
      }

      setResumeLibrary((prev) => [mapped, ...prev.filter((item) => item.id !== mapped.id)]);
      if (!form.getValues("candidateProfile.defaultResumeId")) {
        form.setValue("candidateProfile.defaultResumeId", mapped.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      toast.success("Resume uploaded to your library.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    setDeletingResumeId(resumeId);
    try {
      const response = await deleteMyResume(resumeId);
      if (!response?.success) {
        toast.error(response?.message || "Failed to delete resume.");
        return;
      }
      setResumeLibrary((prev) => prev.filter((item) => item.id !== resumeId));
      if (form.getValues("candidateProfile.defaultResumeId") === resumeId) {
        form.setValue("candidateProfile.defaultResumeId", "", {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      toast.success(response?.message || "Resume deleted.");
    } finally {
      setDeletingResumeId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume & Portfolio
          </CardTitle>
          <CardDescription>
            Upload, delete, and choose your default resume for auto-selection in job applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Resume Library</FieldLabel>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_RESUME_MIME_TYPES.join(",")}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  void handleUploadResume(file);
                  event.currentTarget.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingResume}
                >
                  {isUploadingResume ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  Upload Resume
                </Button>
                <span className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX up to 10 MB
                </span>
              </div>
            </Field>

            <Controller
              name="candidateProfile.defaultResumeId"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Default Resume</FieldLabel>
                  {resumeLibrary.length ? (
                    <Select
                      value={
                        field.value &&
                        resumeLibrary.some((resume) => resume.id === field.value)
                          ? field.value
                          : "none"
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a resume" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No default selected</SelectItem>
                        {resumeLibrary.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.fileName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No resumes saved yet. Upload one to set as default.
                    </div>
                  )}

                  <FieldDescription>
                    This resume is pre-selected whenever you apply for a job.
                  </FieldDescription>
                </Field>
              )}
            />

            {selectedResume ? (
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="font-medium">{selectedResume.fileName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedResume.previewUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={selectedResume.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ) : null}
                  {selectedResume.downloadUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={selectedResume.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open File
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700"
                    onClick={() => void handleDeleteResume(selectedResume.id)}
                    disabled={deletingResumeId === selectedResume.id}
                  >
                    {deletingResumeId === selectedResume.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="portfolioLinks">Portfolio Links</FieldLabel>
              <ResumeSkillsInput
                value={portfolioLinks}
                onChange={(next) =>
                  form.setValue("candidateProfile.portfolioLinks", next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="https://github.com/username/project"
                addButtonLabel="Add Link"
              />
              <FieldDescription>
                These links are included with your profile and applications.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resume Workspace</CardTitle>
          <CardDescription>
            Manage templates, ATS scans, and resume versions in the dedicated
            resume module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/resume">Open Resume Workspace</Link>
          </Button>
        </CardContent>
      </Card>

      <ProfileSaveButton isSubmitting={isSubmitting} label="Save Resume Settings" />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import {
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  CheckCircle2,
  File,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

function formatUploadDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

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

  const selectedResumeId =
    form.watch("candidateProfile.defaultResumeId") ?? "";
  const portfolioLinks =
    form.watch("candidateProfile.portfolioLinks") ?? [];

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
                typeof uploaded.fileName === "string" &&
                uploaded.fileName.trim()
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

      setResumeLibrary((prev) => [
        mapped,
        ...prev.filter((item) => item.id !== mapped.id),
      ]);
      if (!form.getValues("candidateProfile.defaultResumeId")) {
        form.setValue("candidateProfile.defaultResumeId", mapped.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      toast.success("Resume uploaded successfully.");
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
      setResumeLibrary((prev) =>
        prev.filter((item) => item.id !== resumeId),
      );
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

  const handleSetDefault = (resumeId: string) => {
    form.setValue("candidateProfile.defaultResumeId", resumeId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success("Default resume updated.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume & Documents
          </CardTitle>
          <CardDescription>
            Upload resumes and select a default. The default resume is
            auto-selected when you apply for jobs and visible to recruiters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Upload */}
          <div>
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
            <div className="flex flex-wrap items-center gap-3">
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
                PDF, DOC, DOCX \u2014 Max 10 MB
              </span>
            </div>
          </div>

          {/* Default resume selector */}
          <Controller
            name="candidateProfile.defaultResumeId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Default Resume for Applications</FieldLabel>
                {resumeLibrary.length ? (
                  <Select
                    value={
                      field.value &&
                      resumeLibrary.some((r) => r.id === field.value)
                        ? field.value
                        : "none"
                    }
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a default resume" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        No default selected
                      </SelectItem>
                      {resumeLibrary.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id}>
                          {resume.fileName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
                    No resumes uploaded yet. Upload one above.
                  </div>
                )}
                <FieldDescription>
                  This resume is pre-selected when you apply for a job and
                  shown on your profile to recruiters.
                </FieldDescription>
              </Field>
            )}
          />

          {/* Resume library list */}
          {resumeLibrary.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your Resumes ({resumeLibrary.length})
              </p>
              <div className="divide-y rounded-lg border">
                {resumeLibrary.map((resume) => {
                  const isDefault = resume.id === selectedResumeId;
                  const isDeleting = deletingResumeId === resume.id;
                  return (
                    <div
                      key={resume.id}
                      className={`flex items-center gap-3 p-3 transition-colors ${
                        isDefault ? "bg-primary/5" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                        <File className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {resume.fileName}
                          </p>
                          {isDefault && (
                            <Badge className="bg-primary/10 text-primary border-0 text-[10px] h-5 gap-0.5 shrink-0">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Default
                            </Badge>
                          )}
                        </div>
                        {resume.uploadedAt && (
                          <p className="text-[11px] text-muted-foreground">
                            Uploaded {formatUploadDate(resume.uploadedAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isDefault && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSetDefault(resume.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        {resume.previewUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            asChild
                          >
                            <a
                              href={resume.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Preview"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        {resume.downloadUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            asChild
                          >
                            <a
                              href={resume.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Download"
                              download
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => void handleDeleteResume(resume.id)}
                          disabled={isDeleting}
                          title="Delete resume"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portfolio Links</CardTitle>
          <CardDescription>
            Add links to projects, GitHub repos, or portfolio sites. These are
            included with your profile and applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
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
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Resume Workspace Link */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Resume Builder & ATS Scanner</p>
            <p className="text-xs text-muted-foreground">
              Build ATS-optimized resumes and scan them for improvements.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/resume">Open</Link>
          </Button>
        </CardContent>
      </Card>

      <ProfileSaveButton
        isSubmitting={isSubmitting}
        label="Save Resume Settings"
      />
    </div>
  );
}

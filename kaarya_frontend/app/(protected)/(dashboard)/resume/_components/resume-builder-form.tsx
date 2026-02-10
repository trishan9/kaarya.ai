"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ResumeUploadDropzone } from "./resume-upload-dropzone";
import { TargetedRolesEditor } from "./targeted-roles-editor";

type ResumeBuilderSubmission = {
  fileName: string;
  additionalDetails: string;
  targetedRoles: string[];
};

export type ResumeBuilderFormProps = {
  uploadLabel: string;
  uploadRequired?: boolean;
  uploadHelperText: string;
  uploadAcceptedFileLabel: string;
  uploadBrowseLabel: string;
  uploadMaxFileSizeMb: number;
  uploadAcceptedMimeTypes: string[];
  additionalDetailsLabel: string;
  additionalDetailsPlaceholder: string;
  rolesLabel: string;
  rolesRequired?: boolean;
  addRoleLabel: string;
  removeRoleLabel: string;
  initialTargetedRoles: string[];
  generateButtonLabel: string;
  generatedSummaryTitle: string;
  generatedSummaryDescription: string;
};

function sanitizeRoles(roles: string[]) {
  return roles.map((role) => role.trim()).filter((role) => role.length > 0);
}

export function ResumeBuilderForm({
  uploadLabel,
  uploadRequired,
  uploadHelperText,
  uploadAcceptedFileLabel,
  uploadBrowseLabel,
  uploadMaxFileSizeMb,
  uploadAcceptedMimeTypes,
  additionalDetailsLabel,
  additionalDetailsPlaceholder,
  rolesLabel,
  rolesRequired,
  addRoleLabel,
  removeRoleLabel,
  initialTargetedRoles,
  generateButtonLabel,
  generatedSummaryTitle,
  generatedSummaryDescription,
}: ResumeBuilderFormProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [additionalDetails, setAdditionalDetails] = React.useState("");
  const [targetedRoles, setTargetedRoles] =
    React.useState<string[]>(initialTargetedRoles);
  const [submission, setSubmission] = React.useState<ResumeBuilderSubmission | null>(
    null,
  );
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const cleanRoles = sanitizeRoles(targetedRoles);

      if (!selectedFile) {
        setFormError("Please upload your resume before generating.");
        return;
      }

      if (cleanRoles.length === 0) {
        setFormError("Please add at least one targeted role.");
        return;
      }

      setFormError(null);
      setSubmission({
        fileName: selectedFile.name,
        additionalDetails: additionalDetails.trim(),
        targetedRoles: cleanRoles,
      });
    },
    [additionalDetails, selectedFile, targetedRoles],
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <ResumeUploadDropzone
        label={uploadLabel}
        required={uploadRequired}
        helperText={uploadHelperText}
        acceptedFileLabel={uploadAcceptedFileLabel}
        browseLabel={uploadBrowseLabel}
        maxFileSizeMb={uploadMaxFileSizeMb}
        acceptedMimeTypes={uploadAcceptedMimeTypes}
        onFileChange={setSelectedFile}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {additionalDetailsLabel}
        </label>
        <Textarea
          value={additionalDetails}
          onChange={(event) => setAdditionalDetails(event.target.value)}
          placeholder={additionalDetailsPlaceholder}
          className="min-h-30 rounded-xl"
        />
      </div>

      <TargetedRolesEditor
        label={rolesLabel}
        required={rolesRequired}
        addRoleLabel={addRoleLabel}
        removeRoleLabel={removeRoleLabel}
        roles={targetedRoles}
        onChangeRoles={setTargetedRoles}
      />

      {formError ? <p className="text-xs text-rose-500">{formError}</p> : null}

      <Button
        type="submit"
        className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90"
      >
        <Sparkles className="h-4 w-4" />
        {generateButtonLabel}
      </Button>

      {submission ? (
        <Card className="rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            {generatedSummaryTitle}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {generatedSummaryDescription}
          </p>

          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-muted-foreground">Uploaded Resume</p>
              <p className="mt-1 truncate font-medium text-foreground">
                {submission.fileName}
              </p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3 sm:col-span-2">
              <p className="text-muted-foreground">Targeted Roles</p>
              <p className="mt-1 font-medium text-foreground">
                {submission.targetedRoles.join(", ")}
              </p>
            </div>
          </div>

          {submission.additionalDetails ? (
            <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-xs">
              <p className="text-muted-foreground">Additional Details</p>
              <p className="mt-1 whitespace-pre-line text-foreground">
                {submission.additionalDetails}
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}
    </form>
  );
}

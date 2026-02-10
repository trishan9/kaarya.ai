"use client";

import * as React from "react";
import { FileUp, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ResumeUploadDropzoneProps = {
  label: string;
  required?: boolean;
  helperText: string;
  acceptedMimeTypes: string[];
  acceptedFileLabel: string;
  maxFileSizeMb: number;
  browseLabel: string;
  onFileChange: (file: File | null) => void;
};

function validateFile(
  file: File,
  acceptedMimeTypes: string[],
  maxFileSizeMb: number,
) {
  const maxBytes = maxFileSizeMb * 1024 * 1024;
  const mimeTypeAllowed = acceptedMimeTypes.includes(file.type);
  const extensionAllowed = /\.(pdf|doc|docx)$/i.test(file.name);

  if (!mimeTypeAllowed && !extensionAllowed) {
    return "Only PDF, DOC, or DOCX files are supported.";
  }

  if (file.size > maxBytes) {
    return `File must be smaller than ${maxFileSizeMb} MB.`;
  }

  return null;
}

export function ResumeUploadDropzone({
  label,
  required,
  helperText,
  acceptedMimeTypes,
  acceptedFileLabel,
  maxFileSizeMb,
  browseLabel,
  onFileChange,
}: ResumeUploadDropzoneProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const acceptAttribute = React.useMemo(
    () => acceptedMimeTypes.join(","),
    [acceptedMimeTypes],
  );

  const handleFileSelection = React.useCallback(
    (file: File | null) => {
      if (!file) return;
      const validationError = validateFile(
        file,
        acceptedMimeTypes,
        maxFileSizeMb,
      );

      if (validationError) {
        setError(validationError);
        return;
      }

      setSelectedFile(file);
      setError(null);
      onFileChange(file);
    },
    [acceptedMimeTypes, maxFileSizeMb, onFileChange],
  );

  const clearFile = React.useCallback(() => {
    setSelectedFile(null);
    setError(null);
    onFileChange(null);
  }, [onFileChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>

      <div
        className={cn(
          "rounded-xl border border-dashed border-[#d8dde4] bg-white px-4 py-8 text-center transition-colors",
          dragActive && "border-primary bg-primary/5",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          const file = event.dataTransfer.files?.[0] ?? null;
          handleFileSelection(file);
        }}
      >
        <input
          id="resume-file-upload"
          name="resumeFile"
          type="file"
          accept={acceptAttribute}
          className="sr-only"
          onChange={(event) =>
            handleFileSelection(event.currentTarget.files?.[0] ?? null)
          }
        />

        {selectedFile ? (
          <div className="mx-auto max-w-xl rounded-xl border border-[#e5e7eb] bg-neutral-50 p-4">
            <p className="truncate text-sm font-medium text-foreground">
              {selectedFile.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <div className="mt-3 flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-md text-xs"
                onClick={clearFile}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove file
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-muted-foreground">
              <FileUp className="h-5 w-5" />
            </div>
            <p className="text-sm text-foreground">
              Drag and drop your file, or{" "}
              <label
                htmlFor="resume-file-upload"
                className="cursor-pointer font-medium text-primary"
              >
                {browseLabel}
              </label>
            </p>
            <p className="text-xs text-muted-foreground">
              {helperText} {acceptedFileLabel}
            </p>
          </div>
        )}
      </div>

      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
    </div>
  );
}

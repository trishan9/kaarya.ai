"use client";

import * as React from "react";
import { CirclePlus, Link2, Trash2, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type JobSheetSummary = {
  id: string;
  title: string;
  company: string;
  locationLabel: string;
  postedAtLabel: string;
  logoText: string;
  logoClassName?: string;
};

export type JobApplicationSheetProps = {
  job: JobSheetSummary;
  triggerLabel: string;
  sheetTitle: string;
  uploadLabel: string;
  uploadHelperText: string;
  uploadBrowseLabel: string;
  coverLetterLabel: string;
  coverLetterPlaceholder: string;
  portfolioLabel: string;
  portfolioPlaceholder: string;
  addPortfolioLabel: string;
  submitLabel: string;
  successTitle: string;
  successDescription: string;
  doneLabel: string;
};

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isValidPortfolioLink(value: string) {
  const normalized = value.trim();
  if (!normalized) return false;

  const withProtocol = /^https?:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized}`;

  try {
    const parsed = new URL(withProtocol);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function validateResumeFile(file: File) {
  const maxSizeInMb = 8;
  const maxBytes = maxSizeInMb * 1024 * 1024;
  const extensionAllowed = /\.(pdf|doc|docx)$/i.test(file.name);
  const mimeTypeAllowed = ACCEPTED_FILE_TYPES.includes(file.type);

  if (!extensionAllowed && !mimeTypeAllowed) {
    return "Only PDF or Word files are supported.";
  }

  if (file.size > maxBytes) {
    return "File must be smaller than 8 MB.";
  }

  return null;
}

export function JobApplicationSheet({
  job,
  triggerLabel,
  sheetTitle,
  uploadLabel,
  uploadHelperText,
  uploadBrowseLabel,
  coverLetterLabel,
  coverLetterPlaceholder,
  portfolioLabel,
  portfolioPlaceholder,
  addPortfolioLabel,
  submitLabel,
  successTitle,
  successDescription,
  doneLabel,
}: JobApplicationSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [coverLetter, setCoverLetter] = React.useState("");
  const [portfolioLinks, setPortfolioLinks] = React.useState<string[]>([""]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successOpen, setSuccessOpen] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const applyFile = React.useCallback((file: File | null) => {
    if (!file) return;

    const validationError = validateResumeFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  }, []);

  const updatePortfolioLink = React.useCallback(
    (index: number, value: string) => {
      setPortfolioLinks((prev) =>
        prev.map((link, linkIndex) => (linkIndex === index ? value : link)),
      );
    },
    [],
  );

  const addPortfolioLink = React.useCallback(() => {
    setPortfolioLinks((prev) => [...prev, ""]);
  }, []);

  const removePortfolioLink = React.useCallback((index: number) => {
    setPortfolioLinks((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, linkIndex) => linkIndex !== index);
    });
  }, []);

  const onSubmitApplication = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedFile) {
        setErrorMessage("Please upload your resume/CV before submitting.");
        return;
      }

      if (coverLetter.trim().length < 20) {
        setErrorMessage("Please provide a meaningful cover letter.");
        return;
      }

      const normalizedLinks = portfolioLinks
        .map((link) => link.trim())
        .filter(Boolean);
      if (normalizedLinks.length === 0) {
        setErrorMessage("Please add at least one portfolio link.");
        return;
      }

      if (normalizedLinks.some((link) => !isValidPortfolioLink(link))) {
        setErrorMessage("Please enter valid portfolio URL(s).");
        return;
      }

      setErrorMessage(null);
      setOpen(false);
      setSuccessOpen(true);
    },
    [coverLetter, portfolioLinks, selectedFile],
  );

  const isSubmitDisabled =
    !selectedFile ||
    coverLetter.trim().length < 20 ||
    portfolioLinks.map((link) => link.trim()).filter(Boolean).length === 0;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="h-10 min-w-[180px] rounded-xl bg-white text-sm font-semibold text-primary hover:bg-white/90">
            {triggerLabel}
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-full! sm:max-w-[560px]! p-0">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-[#ececf0] px-4 py-3 sm:px-5">
              <SheetTitle className="text-left text-xl font-semibold">
                {sheetTitle}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <form className="space-y-4" onSubmit={onSubmitApplication}>
                <div className="rounded-xl bg-linear-to-r from-[#00629F]/80 to-[#00629F] p-3 text-white">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-xl font-bold text-[#4285f4]",
                        job.logoClassName,
                      )}
                    >
                      {job.logoText}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-white/80">
                        {job.company} - {job.locationLabel}
                      </p>
                      <p className="truncate text-lg font-semibold">
                        {job.title}
                      </p>
                      <p className="text-xs text-white/80">
                        {job.postedAtLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {uploadLabel}
                    <span className="text-rose-500"> *</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept={ACCEPTED_FILE_TYPES.join(",")}
                    onChange={(event) =>
                      applyFile(event.currentTarget.files?.[0] ?? null)
                    }
                  />

                  {selectedFile ? (
                    <div className="flex items-center justify-between rounded-lg border border-[#ececf0] bg-neutral-50 px-3 py-2">
                      <div>
                        <p className="truncate text-sm font-medium text-foreground">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 rounded-md px-2 text-xs text-primary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadBrowseLabel}
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl border border-dashed border-[#d8dde4] bg-white p-6 text-center"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const file = event.dataTransfer.files?.[0] ?? null;
                        applyFile(file);
                      }}
                    >
                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-muted-foreground">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-sm text-foreground">
                        Drag and drop your file, or{" "}
                        <button
                          type="button"
                          className="font-medium text-primary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadBrowseLabel}
                        </button>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {uploadHelperText}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {coverLetterLabel}
                    <span className="text-rose-500"> *</span>
                  </label>
                  <Textarea
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    placeholder={coverLetterPlaceholder}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {portfolioLabel}
                    <span className="text-rose-500"> *</span>
                  </label>
                  <div className="space-y-2">
                    {portfolioLinks.map((link, index) => (
                      <div
                        key={`portfolio-link-${index}`}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={link}
                          onChange={(event) =>
                            updatePortfolioLink(index, event.target.value)
                          }
                          placeholder={portfolioPlaceholder}
                          className="h-10"
                        />
                        {index === 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-lg border-[#d8dde4]"
                            onClick={addPortfolioLink}
                            aria-label={addPortfolioLabel}
                          >
                            <CirclePlus className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-lg border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
                            onClick={() => removePortfolioLink(index)}
                            aria-label="Remove portfolio link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {errorMessage ? (
                  <p className="text-xs text-rose-500">{errorMessage}</p>
                ) : null}

                <div className="sticky bottom-0 bg-white pt-1">
                  <Button
                    type="submit"
                    className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90"
                    disabled={isSubmitDisabled}
                  >
                    <Link2 className="h-4 w-4" />
                    {submitLabel}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {successTitle}
            </DialogTitle>
            <DialogDescription>{successDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              className="h-9 rounded-lg px-6"
              onClick={() => setSuccessOpen(false)}
            >
              {doneLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

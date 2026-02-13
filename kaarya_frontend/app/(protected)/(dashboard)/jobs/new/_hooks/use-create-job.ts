"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createJobPosting, updateJobPosting } from "@/lib/actions/job-actions";
import {
  createJobPostingSchema,
  TCreateJobPostingSchema,
} from "../_schemas";

type UseCreateJobOptions = {
  workspaceId: string;
  workspaceType: "company" | "college";
  mode?: "create" | "edit";
  jobId?: string;
  activeWorkspaceId?: string | null;
  initialValues?: Partial<TCreateJobPostingSchema>;
};

const toIsoDeadline = (deadline: string) => {
  const date = new Date(deadline);
  return date.toISOString();
};

const defaultValues: TCreateJobPostingSchema = {
  title: "",
  description: "",
  location: "",
  employmentType: "Full-Time",
  engagementType: "Internship",
  workMode: "onsite",
  salaryRange: "NPR 10,00,000 - NPR 18,00,000",
  skills: [],
  deadline: "",
};

const resolveInitialValues = (
  initialValues?: Partial<TCreateJobPostingSchema>,
): TCreateJobPostingSchema => ({
  ...defaultValues,
  ...initialValues,
  skills: initialValues?.skills ?? defaultValues.skills,
});

export const useCreateJob = ({
  workspaceId,
  workspaceType,
  mode = "create",
  jobId,
  activeWorkspaceId,
  initialValues,
}: UseCreateJobOptions) => {
  const router = useRouter();

  const form = useForm<TCreateJobPostingSchema>({
    resolver: zodResolver(createJobPostingSchema),
    defaultValues: resolveInitialValues(initialValues),
  });

  React.useEffect(() => {
    form.reset(resolveInitialValues(initialValues));
  }, [form, initialValues]);

  async function onSubmit(values: TCreateJobPostingSchema) {
    if (mode === "edit" && !jobId) {
      toast.error("Job id is missing. Unable to update this posting.");
      return;
    }

    const skills = values.skills?.map((value) => value.trim()).filter(Boolean);

    const payload = {
      title: values.title,
      description: values.description,
      location: values.location,
      employmentType: values.employmentType,
      engagementType: values.engagementType,
      workMode: values.workMode,
      salaryRange: values.salaryRange,
      requirements: skills?.length ? { skills } : {},
      deadline: toIsoDeadline(values.deadline),
      status: "open" as const,
    };

    const response =
      mode === "edit"
        ? await updateJobPosting(jobId ?? "", payload)
        : await createJobPosting({
            ...(workspaceType === "college"
              ? {
                  collegeId: workspaceId,
                  visibility: "college_only" as const,
                }
              : { companyId: workspaceId }),
            ...payload,
          });

    if (!response?.success) {
      toast.error(
        response?.message ||
          (mode === "edit"
            ? "Failed to update job posting."
            : "Failed to create job posting."),
      );
      return;
    }

    toast.success(
      response?.message ||
        (mode === "edit" ? "Job posting updated." : "Job posting created."),
    );

    if (mode === "edit" && jobId) {
      router.push(
        activeWorkspaceId
          ? `/jobs/${jobId}?workspace=${activeWorkspaceId}`
          : `/jobs/${jobId}`,
      );
      return;
    }

    router.push(`/jobs?workspace=${workspaceId}`);
  }

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
};

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  TCandidateProfileSchema,
  TUpdateProfileSchemaInput,
  TUpdateProfileSchema,
} from "../_schemas";
import { TUser } from "@/lib/definitions";
import { updateProfile } from "@/lib/actions/auth-action";

interface UseUpdateProfileProps {
  user: TUser;
  onSuccess?: () => void;
}

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `entry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeStringArray = (values: unknown): string[] =>
  Array.isArray(values)
    ? values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
    : [];

const buildCandidateProfileDefaults = (
  profile: TUser["candidateProfile"],
): TCandidateProfileSchema => ({
  headline: profile?.headline ?? "",
  phone: profile?.phone ?? "",
  location: profile?.location ?? "",
  summary: profile?.summary ?? "",
  portfolioUrl: profile?.portfolioUrl ?? "",
  linkedinUrl: profile?.linkedinUrl ?? "",
  githubUrl: profile?.githubUrl ?? "",
  preferredRoles: normalizeStringArray(profile?.preferredRoles),
  preferredLocations: normalizeStringArray(profile?.preferredLocations),
  preferredWorkModes: Array.isArray(profile?.preferredWorkModes)
    ? profile.preferredWorkModes.filter(
        (
          mode,
        ): mode is "remote" | "onsite" | "hybrid" =>
          mode === "remote" || mode === "onsite" || mode === "hybrid",
      )
    : [],
  skills: normalizeStringArray(profile?.skills),
  education: Array.isArray(profile?.education)
    ? profile.education.map((item) => ({
        id: item.id || createId(),
        institution: item.institution ?? "",
        degree: item.degree ?? "",
        fieldOfStudy: item.fieldOfStudy ?? "",
        startDate: item.startDate ?? "",
        endDate: item.endDate ?? "",
        grade: item.grade ?? "",
        description: item.description ?? "",
      }))
    : [],
  experience: Array.isArray(profile?.experience)
    ? profile.experience.map((item) => ({
        id: item.id || createId(),
        jobTitle: item.jobTitle ?? "",
        companyName: item.companyName ?? "",
        location: item.location ?? "",
        employmentType: item.employmentType ?? "",
        startDate: item.startDate ?? "",
        endDate: item.endDate ?? "",
        currentlyWorking: Boolean(item.currentlyWorking),
        description: item.description ?? "",
      }))
    : [],
  certifications: Array.isArray(profile?.certifications)
    ? profile.certifications.map((item) => ({
        id: item.id || createId(),
        name: item.name ?? "",
        issuer: item.issuer ?? "",
        issueDate: item.issueDate ?? "",
        expiryDate: item.expiryDate ?? "",
        credentialId: item.credentialId ?? "",
        credentialUrl: item.credentialUrl ?? "",
        mediaUrl: item.mediaUrl ?? "",
        mediaMimeType: item.mediaMimeType ?? "",
        noExpiry: Boolean(item.noExpiry),
      }))
    : [],
  salary: {
    currency: profile?.salary?.currency ?? "NPR",
    minAmount:
      typeof profile?.salary?.minAmount === "number"
        ? profile.salary.minAmount
        : undefined,
    maxAmount:
      typeof profile?.salary?.maxAmount === "number"
        ? profile.salary.maxAmount
        : undefined,
    period: profile?.salary?.period ?? "yearly",
    isNegotiable: Boolean(profile?.salary?.isNegotiable),
  },
  defaultResumeId: profile?.defaultResumeId ?? "",
  portfolioLinks: normalizeStringArray(profile?.portfolioLinks),
  openToWork: profile?.openToWork ?? true,
});

export const useUpdateProfile = ({
  user,
  onSuccess,
}: UseUpdateProfileProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<
    TUpdateProfileSchemaInput,
    unknown,
    TUpdateProfileSchema
  >({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      photo: null,
      candidateProfile: buildCandidateProfileDefaults(user.candidateProfile),
    },
  });

  async function onSubmit(data: TUpdateProfileSchema) {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append(
          "candidateProfile",
          JSON.stringify(data.candidateProfile ?? {}),
        );

        if (data.photo instanceof File) {
          formData.append("photo", data.photo);
        }

        const response = await updateProfile(formData);

        if (!response?.success) {
          toast.error(
            response?.message || "Failed to update profile. Please try again.",
          );
          return;
        }

        toast.success(response.message || "Profile updated successfully!");

        form.setValue("photo", null);

        router.refresh();

        onSuccess?.();
      } catch (error: Error | any) {
        const errorMessage =
          error?.response?.data?.message ||
          error.message ||
          "An unexpected error occurred while updating profile. Please try again.";
        toast.error(errorMessage);
      }
    });
  }

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting || isPending,
  };
};

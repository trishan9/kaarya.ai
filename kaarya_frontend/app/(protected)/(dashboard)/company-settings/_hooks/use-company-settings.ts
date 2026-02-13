"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  inviteRecruiterToCompany,
  removeRecruiterFromCompany,
  resetCompanyInviteCode,
  updateCompany,
} from "@/lib/actions/company-actions";
import {
  inviteRecruiterSchema,
  TInviteRecruiterSchema,
  TUpdateCompanyProfileSchema,
  updateCompanyProfileSchema,
} from "../_schemas";

type UseCompanySettingsOptions = {
  companyId: string;
  initialCompany?: {
    name: string;
    industry?: string | null;
    location?: string | null;
  };
};

export const useCompanySettings = ({
  companyId,
  initialCompany,
}: UseCompanySettingsOptions) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const inviteForm = useForm<TInviteRecruiterSchema>({
    resolver: zodResolver(inviteRecruiterSchema),
    defaultValues: {
      email: "",
      designation: "",
    },
  });

  const companyForm = useForm<TUpdateCompanyProfileSchema>({
    resolver: zodResolver(updateCompanyProfileSchema),
    defaultValues: {
      name: initialCompany?.name ?? "",
      industry: initialCompany?.industry ?? "",
      location: initialCompany?.location ?? "",
      logo: null,
    },
  });

  async function onUpdateCompanyProfile(values: TUpdateCompanyProfileSchema) {
    const logoFile = values.logo;
    if (logoFile instanceof File) {
      if (logoFile.size > 5 * 1024 * 1024) {
        companyForm.setError("logo", {
          type: "manual",
          message: "Logo size must be less than 5MB.",
        });
        return;
      }

      if (!logoFile.type.startsWith("image/")) {
        companyForm.setError("logo", {
          type: "manual",
          message: "Only image files are allowed.",
        });
        return;
      }
    }

    startTransition(async () => {
      const response = await updateCompany(companyId, {
        name: values.name,
        industry: values.industry,
        location: values.location,
        logo: logoFile instanceof File ? logoFile : undefined,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to update company profile.");
        return;
      }

      toast.success(response?.message || "Company profile updated.");
      companyForm.setValue("logo", null);
      router.refresh();
    });
  }

  async function onInviteRecruiter(values: TInviteRecruiterSchema) {
    startTransition(async () => {
      const response = await inviteRecruiterToCompany(companyId, {
        email: values.email,
        designation: values.designation,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to send recruiter invite.");
        return;
      }

      toast.success(response?.message || "Recruiter invited.");
      inviteForm.reset();
      router.refresh();
    });
  }

  async function onResetInviteCode() {
    startTransition(async () => {
      const response = await resetCompanyInviteCode(companyId);
      if (!response?.success) {
        toast.error(response?.message || "Failed to reset invite code.");
        return;
      }

      toast.success(response?.message || "Invite code reset.");
      router.refresh();
    });
  }

  async function onRemoveRecruiter(recruiterId: string) {
    startTransition(async () => {
      const response = await removeRecruiterFromCompany(companyId, recruiterId);

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Unable to remove recruiter. You might need admin permissions.",
        );
        return;
      }

      toast.success(response?.message || "Recruiter removed from workspace.");
      router.refresh();
    });
  }

  return {
    companyForm,
    inviteForm,
    onUpdateCompanyProfile,
    onInviteRecruiter,
    onResetInviteCode,
    onRemoveRecruiter,
    isBusy:
      isPending ||
      inviteForm.formState.isSubmitting ||
      companyForm.formState.isSubmitting,
  };
};

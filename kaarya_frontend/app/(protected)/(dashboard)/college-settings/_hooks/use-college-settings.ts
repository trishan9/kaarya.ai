"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  inviteStudentToCollege,
  removeStudentFromCollege,
  resetCollegeInviteCode,
  updateCollege,
} from "@/lib/actions/college-actions";
import {
  inviteStudentSchema,
  TInviteStudentSchema,
  TUpdateCollegeProfileSchema,
  updateCollegeProfileSchema,
} from "../_schemas";

type UseCollegeSettingsOptions = {
  collegeId: string;
  initialCollege?: {
    name: string;
    institutionType?: string | null;
    location?: string | null;
  };
};

export const useCollegeSettings = ({
  collegeId,
  initialCollege,
}: UseCollegeSettingsOptions) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const inviteForm = useForm<TInviteStudentSchema>({
    resolver: zodResolver(inviteStudentSchema),
    defaultValues: {
      email: "",
      program: "",
      year: undefined,
    },
  });

  const collegeForm = useForm<TUpdateCollegeProfileSchema>({
    resolver: zodResolver(updateCollegeProfileSchema),
    defaultValues: {
      name: initialCollege?.name ?? "",
      institutionType: initialCollege?.institutionType ?? "",
      location: initialCollege?.location ?? "",
      logo: null,
    },
  });

  async function onUpdateCollegeProfile(values: TUpdateCollegeProfileSchema) {
    const logoFile = values.logo;
    if (logoFile instanceof File) {
      if (logoFile.size > 5 * 1024 * 1024) {
        collegeForm.setError("logo", {
          type: "manual",
          message: "Logo size must be less than 5MB.",
        });
        return;
      }

      if (!logoFile.type.startsWith("image/")) {
        collegeForm.setError("logo", {
          type: "manual",
          message: "Only image files are allowed.",
        });
        return;
      }
    }

    startTransition(async () => {
      const response = await updateCollege(collegeId, {
        name: values.name,
        institutionType: values.institutionType,
        location: values.location,
        logo: logoFile instanceof File ? logoFile : undefined,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to update college profile.");
        return;
      }

      toast.success(response?.message || "College profile updated.");
      collegeForm.setValue("logo", null);
      router.refresh();
    });
  }

  async function onInviteStudent(values: TInviteStudentSchema) {
    startTransition(async () => {
      const response = await inviteStudentToCollege(collegeId, {
        email: values.email,
        program: values.program,
        year: values.year,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to send student invite.");
        return;
      }

      toast.success(response?.message || "Student invited.");
      inviteForm.reset();
      router.refresh();
    });
  }

  async function onResetInviteCode() {
    startTransition(async () => {
      const response = await resetCollegeInviteCode(collegeId);
      if (!response?.success) {
        toast.error(response?.message || "Failed to reset invite code.");
        return;
      }

      toast.success(response?.message || "Invite code reset.");
      router.refresh();
    });
  }

  async function onRemoveStudent(studentId: string) {
    startTransition(async () => {
      const response = await removeStudentFromCollege(collegeId, studentId);

      if (!response?.success) {
        toast.error(response?.message || "Unable to remove student.");
        return;
      }

      toast.success(response?.message || "Student removed from workspace.");
      router.refresh();
    });
  }

  return {
    collegeForm,
    inviteForm,
    onUpdateCollegeProfile,
    onInviteStudent,
    onResetInviteCode,
    onRemoveStudent,
    isBusy:
      isPending ||
      inviteForm.formState.isSubmitting ||
      collegeForm.formState.isSubmitting,
  };
};

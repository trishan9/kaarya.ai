"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { updateProfileSchema, TUpdateProfileSchema } from "../_schemas";
import { TUser } from "@/lib/definitions";
import { updateProfile } from "@/lib/actions/auth-action";

interface UseUpdateProfileProps {
  user: TUser;
  onSuccess?: () => void;
}

export const useUpdateProfile = ({
  user,
  onSuccess,
}: UseUpdateProfileProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<TUpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      photo: null,
    },
  });

  async function onSubmit(data: TUpdateProfileSchema) {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);

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

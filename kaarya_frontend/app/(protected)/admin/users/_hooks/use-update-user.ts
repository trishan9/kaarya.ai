"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  adminUpdateUserSchema,
  TAdminUpdateUserSchema,
} from "@/app/(protected)/admin/_schemas";
import { updateAdminUser } from "@/lib/actions/admin-user-actions";

export const useUpdateUser = (
  userId: string,
  initialValues: Partial<TAdminUpdateUserSchema>,
) => {
  const router = useRouter();

  const form = useForm<TAdminUpdateUserSchema>({
    resolver: zodResolver(adminUpdateUserSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      role: initialValues?.role ?? "user",
      provider: initialValues?.provider ?? "email",
      password: "",
      confirmPassword: "",
      photo: null,
    },
  });

  async function onSubmit(values: TAdminUpdateUserSchema) {
    const response = await updateAdminUser(userId, values);
    if (!response?.success) {
      toast.error(response?.message || "Failed to update user.");
      return;
    }

    toast.success(response?.message || "User updated.");
    router.push(`/admin/users/${userId}`);
    router.refresh();
  }

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
};

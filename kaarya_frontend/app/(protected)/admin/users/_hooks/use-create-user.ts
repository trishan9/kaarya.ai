"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  adminCreateUserSchema,
  TAdminCreateUserSchema,
} from "@/app/(protected)/admin/_schemas";
import { createAdminUser } from "@/lib/actions/admin-user-actions";

export const useCreateUser = () => {
  const router = useRouter();

  const form = useForm<TAdminCreateUserSchema>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
      provider: "email",
      photo: null,
    },
  });

  async function onSubmit(values: TAdminCreateUserSchema) {
    const response = await createAdminUser(values);
    if (!response?.success) {
      toast.error(response?.message || "Failed to create user.");
      return;
    }

    toast.success(response?.message || "User created.");
    router.push("/admin/users");
    router.refresh();
  }

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
};

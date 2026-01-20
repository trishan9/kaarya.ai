"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { authActions } from "@/lib/actions/auth-action";
import { signupSchema, TSignupSchema } from "../_schemas";

export const useSignUp = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<TSignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: TSignupSchema) {
    startTransition(async () => {
      try {
        const response = await authActions.auth.signup(data);
        router.push("/auth/sign-in");

        toast.success(response.data.message);
      } catch (error: Error | any) {
        const errorMessage =
          error?.response?.data?.message ||
          error.message ||
          "An unexpected error occurred while signing up. Please try again.";
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

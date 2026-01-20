"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { authActions } from "@/lib/actions/auth-action";
import { createSession } from "@/lib/session";
import { signinSchema, TSigninSchema } from "../_schemas";

export const useSignIn = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<TSigninSchema>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: TSigninSchema) {
    startTransition(async () => {
      try {
        const response = await authActions.auth.signin(data);

        const {
          message,
          data: { accessToken },
        } = response.data;

        await createSession(accessToken);
        router.refresh();

        toast.success(message);
      } catch (error: Error | any) {
        const errorMessage =
          error?.response?.data?.message ||
          error.message ||
          "An unexpected error occurred while signing in. Please try again.";
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

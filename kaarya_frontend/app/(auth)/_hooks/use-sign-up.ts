"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "../_schemas";
import { useRouter } from "next/navigation";
import { authActions } from "@/lib/actions/auth-action";

export const useSignUp = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof signupSchema>) {
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

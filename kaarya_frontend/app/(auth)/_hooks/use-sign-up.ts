"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "../_schemas";
import { signupAction } from "../_actions/signup";

export const useSignUp = () => {
  const [isPending, startTransition] = useTransition();

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
      await signupAction(data);
      toast("Your new accoun", {
        description: `
        <pre className="bg-gray-600 mt-2 w-xs overflow-x-auto rounded-md p-4">
          <code>${JSON.stringify(data, null, 2)}</code>
        </pre>
        `,
      });
    });
  }

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting || isPending,
  };
};

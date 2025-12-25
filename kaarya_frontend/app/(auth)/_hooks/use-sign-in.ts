"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema } from "../_schemas";
import { signinAction } from "../_actions/signin";

export const useSignIn = () => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof signinSchema>>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof signinSchema>) {
    startTransition(async () => {
      await signinAction(data);
      toast("Logged in succesfully");
    });
  }

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting || isPending,
  };
};

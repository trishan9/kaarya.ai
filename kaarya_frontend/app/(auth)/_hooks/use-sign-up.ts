"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signup,
  signupCollegeWithWorkspace,
  signupRecruiterWithCompany,
} from "@/lib/actions/auth-action";
import { createSession } from "@/lib/session";
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
      role: "user",
      password: "",
      confirmPassword: "",
      companyName: "",
      companyIndustry: "",
      companyLocation: "",
      designation: "",
      collegeName: "",
      collegeInstitutionType: "",
      collegeLocation: "",
    },
  });

  async function onSubmit(data: TSignupSchema) {
    startTransition(async () => {
      try {
        const response =
          data.role === "recruiter"
            ? await signupRecruiterWithCompany(data)
            : data.role === "college"
              ? await signupCollegeWithWorkspace(data)
            : await signup(data);

        if (!response?.success) {
          toast.error(response?.message || "Signup failed. Please try again.");
          return;
        }

        if (data.role === "recruiter" || data.role === "college") {
          const accessToken = response?.data?.accessToken;
          const workspaceId =
            response?.data?.company?.id ?? response?.data?.college?.id;

          if (!accessToken) {
            toast.error("Workspace created, but session could not be created.");
            router.push("/sign-in");
            return;
          }

          await createSession(accessToken);
          toast.success(response?.message || "Workspace is ready.");
          router.replace(
            workspaceId ? `/overview?workspace=${workspaceId}` : "/overview",
          );
          router.refresh();
          return;
        }

        toast.success(response.message || "Account created.");
        router.push("/sign-in");
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

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createCompany, joinCompanyByCode } from "@/lib/actions/company-actions";
import {
  createCompanyWorkspaceSchema,
  joinWorkspaceByCodeSchema,
  TCreateCompanyWorkspaceSchema,
  TJoinWorkspaceByCodeSchema,
} from "../_schemas";

export const useWorkspaceHub = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const createCompanyForm = useForm<TCreateCompanyWorkspaceSchema>({
    resolver: zodResolver(createCompanyWorkspaceSchema),
    defaultValues: {
      name: "",
      industry: "",
      location: "",
      designation: "",
    },
  });

  const joinWorkspaceForm = useForm<TJoinWorkspaceByCodeSchema>({
    resolver: zodResolver(joinWorkspaceByCodeSchema),
    defaultValues: {
      inviteCode: "",
      designation: "",
    },
  });

  async function onCreateWorkspace(values: TCreateCompanyWorkspaceSchema) {
    startTransition(async () => {
      const response = await createCompany({
        name: values.name,
        industry: values.industry,
        location: values.location,
        designation: values.designation,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to create company workspace.");
        return;
      }

      const companyId = response?.data?.id as string | undefined;
      toast.success(response?.message || "Company workspace created.");
      router.push(companyId ? `/company-settings?workspace=${companyId}` : "/company-settings");
      router.refresh();
      createCompanyForm.reset();
    });
  }

  async function onJoinWorkspace(values: TJoinWorkspaceByCodeSchema) {
    startTransition(async () => {
      const response = await joinCompanyByCode({
        inviteCode: values.inviteCode,
        designation: values.designation,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to join company workspace.");
        return;
      }

      const workspaceId = response?.data?.workspace?.id as string | undefined;
      toast.success(response?.message || "Joined company workspace.");
      router.push(
        workspaceId ? `/company-settings?workspace=${workspaceId}` : "/company-settings",
      );
      router.refresh();
      joinWorkspaceForm.reset();
    });
  }

  return {
    createCompanyForm,
    joinWorkspaceForm,
    onCreateWorkspace,
    onJoinWorkspace,
    isSubmitting:
      isPending ||
      createCompanyForm.formState.isSubmitting ||
      joinWorkspaceForm.formState.isSubmitting,
  };
};

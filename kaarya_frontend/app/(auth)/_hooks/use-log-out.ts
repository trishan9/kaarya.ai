"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { logout } from "@/lib/actions/auth-action";

export const useLogOut = () => {
  const [isPending, startTransition] = useTransition();

  async function onLogOut() {
    startTransition(async () => {
      try {
        await logout();
        window.location.replace("/sign-in");
      } catch (error: Error | any) {
        const errorMessage =
          error?.response?.data?.message ||
          error.message ||
          "An unexpected error occurred while logging out. Please try again.";
        toast.error(errorMessage);
      }
    });
  }

  return {
    onLogOut,
    isLoggingOut: isPending,
  };
};

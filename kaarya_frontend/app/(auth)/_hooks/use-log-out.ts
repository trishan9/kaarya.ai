"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logout } from "@/lib/actions/auth-action";

export const useLogOut = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onLogOut() {
    startTransition(async () => {
      try {
        await logout();
        toast.success("Successfully logged out.");
        router.replace("/sign-in");
        router.refresh();
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

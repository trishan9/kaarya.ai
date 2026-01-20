"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { logout } from "@/lib/actions/auth-action";
import { useRouter } from "next/navigation";

export const useLogOut = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onLogOut() {
    startTransition(async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await logout();

        router.push("/sign-in");

        toast.success("Successfully logged out.");
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

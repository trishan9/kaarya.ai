"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderBackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function HeaderBackButton({
  fallbackHref = "/applications",
  label = "Back",
  className,
}: HeaderBackButtonProps) {
  const router = useRouter();

  const goBack = React.useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }, [fallbackHref, router]);

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={goBack}
      aria-label={label}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}

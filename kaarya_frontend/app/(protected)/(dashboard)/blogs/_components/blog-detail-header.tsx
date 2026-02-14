"use client";

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BlogDetailHeaderProps = {
  title: string;
  actions?: ReactNode;
  fallbackHref?: string;
  className?: string;
};

export function BlogDetailHeader({
  title,
  actions,
  fallbackHref = "/blogs",
  className,
}: BlogDetailHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 px-4 py-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg border-border bg-white text-muted-foreground shadow-sm"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }

            router.push(fallbackHref);
          }}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {actions}
      </div>
    </header>
  );
}

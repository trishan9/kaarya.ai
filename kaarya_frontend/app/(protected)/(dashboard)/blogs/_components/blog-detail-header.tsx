import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type BlogDetailHeaderProps = {
  title: string;
  actions?: ReactNode;
  fallbackHref?: string;
};

export function BlogDetailHeader({
  title,
  actions,
  fallbackHref = "/blogs",
}: BlogDetailHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/85 sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md border-border bg-card text-muted-foreground hover:bg-accent"
          >
            <Link href={fallbackHref}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-lg font-semibold leading-tight text-foreground">{title}</h1>
        </div>

        <div className="shrink-0">{actions}</div>
      </div>
    </header>
  );
}

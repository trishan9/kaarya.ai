"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export type TipsCardProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function TipsCard({
  title,
  description,
  actionHref = "/resources",
  actionLabel = "Open tips",
  className,
}: TipsCardProps) {
  const router = useRouter();

  return (
    <Card
      className={cn(
        "min-w-0 gap-4 border-0 bg-[#00629F] p-4 text-white shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-xl leading-tight sm:text-2xl">
          {title}
          <Sparkles className="ml-2 inline h-4 w-4 text-yellow-200" />
        </h3>

        <button
          className="flex h-9 p-2 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/15"
          onClick={() => router.push(actionHref)}
          aria-label={actionLabel}
        >
          <ArrowUpRight className="size-5" />
        </button>
      </div>
      <p className="text-sm text-white/80">{description}</p>
    </Card>
  );
}

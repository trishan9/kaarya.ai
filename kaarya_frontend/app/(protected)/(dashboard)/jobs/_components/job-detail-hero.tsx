import type { ReactNode } from "react";
import { Bookmark, MoreHorizontal, Share2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type JobDetailHeroProps = {
  title: string;
  company: string;
  locationLabel: string;
  hiringStatusLabel: string;
  hiringStatusTone: "open" | "closed" | "urgent";
  postedAtLabel: string;
  applicantCountLabel: string;
  viewsCountLabel?: string;
  logoText: string;
  logoUrl?: string;
  logoClassName?: string;
  applyAction: ReactNode;
};

function hiringStatusClassName(
  statusTone: JobDetailHeroProps["hiringStatusTone"],
) {
  if (statusTone === "closed") {
    return "text-[#d9f16b]";
  }

  if (statusTone === "urgent") {
    return "text-[#ffd37a]";
  }

  return "text-[#95f0b6]";
}

export function JobDetailHero({
  title,
  company,
  locationLabel,
  hiringStatusLabel,
  hiringStatusTone,
  postedAtLabel,
  applicantCountLabel,
  viewsCountLabel,
  logoText,
  logoUrl,
  logoClassName,
  applyAction,
}: JobDetailHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#00629F]/80 to-[#00629F] p-4 text-white sm:p-5">
      <div className="pointer-events-none absolute right-0 top-0 h-16 w-48 rounded-bl-2xl rounded-tr-2xl bg-white/10" />
      <div className="pointer-events-none absolute left-0 bottom-0 h-9 w-72 rounded-tr-2xl bg-white/10" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-3xl font-bold text-[#4285f4]",
                logoClassName,
              )}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${company} logo`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-lg object-contain"
                />
              ) : (
                logoText
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm text-white/85">
                {postedAtLabel} - {applicantCountLabel}
                {viewsCountLabel ? ` - ${viewsCountLabel}` : ""}
              </p>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <h2 className="truncate text-3xl font-semibold leading-tight sm:text-4xl">
                  {title}
                </h2>
                <span
                  className={cn(
                    "font-medium italic leading-tight mb-2",
                    hiringStatusClassName(hiringStatusTone),
                  )}
                >
                  {hiringStatusLabel}
                </span>
              </div>
              <p className="truncate text-sm text-white/85">
                {company} - {locationLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md border-white/20 bg-white/15 text-white hover:bg-white/20 hover:text-white"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md border-white/20 bg-white/15 text-white hover:bg-white/20 hover:text-white"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md border-white/20 bg-white/15 text-white hover:bg-white/20 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="sm:ml-auto">{applyAction}</div>
      </div>
    </section>
  );
}

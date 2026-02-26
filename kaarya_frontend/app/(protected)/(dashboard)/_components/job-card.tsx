"use client";
import Link from "next/link";
import { Briefcase, Clock3, MapPin, Wallet } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookmarkToggleButton } from "@/components/bookmark/bookmark-toggle-button";

export type JobCardProps = {
  id: string;
  title: string;
  company: string;
  statusLabel: string;
  statusTone?: "success" | "warning" | "info";
  postedAt?: string;
  location: string;
  employmentType: string;
  engagementType: string;
  salaryRange: string;
  logoText: string;
  logoUrl?: string;
  logoClassName?: string;
  extraTags?: string[];
  applyLabel?: string;
  applyHref?: string;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkChange?: (jobId: string, saved: boolean) => void;
};

export function JobCard({
  id,
  title,
  company,
  statusLabel,
  statusTone = "success",
  postedAt = "3d ago",
  location,
  employmentType,
  engagementType,
  salaryRange,
  logoText,
  logoUrl,
  logoClassName,
  extraTags = [],
  applyLabel = "Apply",
  applyHref,
  showBookmark = true,
  isBookmarked = false,
  onBookmarkChange,
}: JobCardProps) {
  const resolvedApplyHref =
    applyHref && applyHref !== "/jobs" ? applyHref : `/jobs/${id}`;

  const badgeToneClassName = {
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    info: "bg-blue-100 text-blue-600",
  }[statusTone];

  return (
    <Card className="min-w-0 gap-3 rounded-2xl border border-[#ececf0] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "w-fit rounded-md px-3 py-1 text-xs font-semibold",
            badgeToneClassName,
          )}
        >
          {statusLabel}
        </div>
        <span className="text-xs text-muted-foreground">{postedAt}</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
            logoUrl ? "bg-white p-1" : "bg-primary",
            logoClassName,
          )}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${company} logo`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-md object-contain"
            />
          ) : (
            logoText
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="wrap-break-word font-semibold leading-tight text-foreground">
            {title}
          </div>
          <div className="wrap-break-word text-sm text-muted-foreground">
            {company}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className="flex max-w-full items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 sm:max-w-[260px]"
          title={location}
        >
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
        </span>
        <span className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1">
          <Briefcase className="h-3 w-3" />
          {employmentType}
        </span>
        <span className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1">
          <Clock3 className="h-3 w-3" />
          {engagementType}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1">
          <Wallet className="h-3 w-3" />
          {salaryRange}
        </span>
        {extraTags.map((tag) => (
          <span key={tag} className="rounded-md bg-neutral-100 px-2 py-1">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          className={cn(
            "h-9 flex-1 rounded-[10px] bg-primary text-sm font-medium text-white",
            "hover:bg-primary/90",
          )}
        >
          <Link href={resolvedApplyHref}>{applyLabel}</Link>
        </Button>
        {showBookmark ? (
          <BookmarkToggleButton
            entityType="job"
            entityId={id}
            initialSaved={isBookmarked}
            onSavedChange={(saved) => onBookmarkChange?.(id, saved)}
          />
        ) : null}
      </div>
    </Card>
  );
}

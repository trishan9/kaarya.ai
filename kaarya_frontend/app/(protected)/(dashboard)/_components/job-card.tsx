"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, Briefcase, Clock3, MapPin, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  logoClassName?: string;
  extraTags?: string[];
  applyLabel?: string;
  applyHref?: string;
};

export function JobCard({
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
  logoClassName,
  extraTags = [],
  applyLabel = "Apply",
  applyHref = "/jobs",
}: JobCardProps) {
  const [bookmarked, setBookmarked] = React.useState(false);

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
            "bg-primary",
            logoClassName,
          )}
        >
          {logoText}
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
        <span className="flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1">
          <MapPin className="h-3 w-3" />
          {location}
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
          <Link href={applyHref}>{applyLabel}</Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-[10px] border-muted-foreground bg-white cursor-pointer",
            bookmarked
              ? "bg-primary/10 text-primary border-primary"
              : "text-muted-foreground",
          )}
          aria-pressed={bookmarked}
          type="button"
          onClick={() => setBookmarked((prev) => !prev)}
        >
          <Bookmark
            className={cn(
              "h-4 w-4",
              bookmarked
                ? "fill-primary text-primary"
                : "text-muted-foreground",
            )}
          />
          <span className="sr-only">
            {bookmarked ? "Remove bookmark" : "Save job"}
          </span>
        </Button>
      </div>
    </Card>
  );
}

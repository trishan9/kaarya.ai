"use client";

import * as React from "react";
import { Bookmark, Briefcase, MapPin, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type JobCardProps = {
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  badge: string;
  accent?: "blue" | "green";
  posted?: string;
  logoText?: string;
  extraTags?: string[];
  applyLabel?: string;
  applyHref?: string;
};

export function JobCard({
  title,
  company,
  location,
  type,
  salary,
  badge,
  accent = "blue",
  posted = "3d ago",
  logoText = "K",
  extraTags = [],
  applyLabel = "Apply",
  applyHref = "/jobs",
}: JobCardProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = React.useState(false);

  return (
    <Card className="min-w-0 gap-3 border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "w-fit rounded-md px-2 py-1 text-[10px] font-semibold",
            accent === "green"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-blue-100 text-blue-600",
          )}
        >
          {badge}
        </div>
        <span className="text-[10px] text-muted-foreground">{posted}</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white",
            accent === "green" ? "bg-emerald-500" : "bg-primary",
          )}
        >
          {logoText}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground break-words">
            {title}
          </div>
          <div className="text-xs text-muted-foreground break-words">{company}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1 rounded-md border border-border px-2 py-1">
          <MapPin className="h-3 w-3" />
          {location}
        </span>
        <span className="flex items-center gap-1 rounded-md border border-border px-2 py-1">
          <Briefcase className="h-3 w-3" />
          {type}
        </span>
        <span className="flex items-center gap-1 rounded-md border border-border px-2 py-1">
          <Wallet className="h-3 w-3" />
          {salary}
        </span>
        {extraTags.map((tag) => (
          <span key={tag} className="rounded-md border border-border px-2 py-1">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          className={cn(
            "h-8 flex-1 rounded-lg text-xs font-semibold cursor-pointer bg-primary text-white",
          )}
          onClick={() => router.push(applyHref)}
        >
          {applyLabel}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-lg border-border",
            bookmarked
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground",
          )}
          aria-pressed={bookmarked}
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

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { CircleAlert, Gauge } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookmarkToggleButton } from "@/components/bookmark/bookmark-toggle-button";

export type InterviewStackTechnology = {
  id: string;
  name: string;
  iconUrl: string;
};

export type MockInterviewCardProps = {
  id: string;
  title: string;
  company: string;
  categoryLabel: string;
  takenCount: number;
  takenCountLabel?: string;
  createdAtLabel: string;
  createdAtTimestamp: number;
  scoreLabel: string;
  scoreValue: number | null;
  description: string;
  attemptStatus: "attempted" | "not_attempted";
  logoText: string;
  logoUrl?: string;
  logoClassName?: string;
  stackTechnologies?: InterviewStackTechnology[];
  primaryActionLabel: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  isBookmarked?: boolean;
  onBookmarkChange?: (interviewId: string, saved: boolean) => void;
};

export function MockInterviewCard({
  id,
  title,
  company,
  categoryLabel,
  takenCount,
  takenCountLabel,
  createdAtLabel,
  scoreLabel,
  description,
  logoText,
  logoUrl,
  logoClassName,
  stackTechnologies = [],
  primaryActionLabel,
  primaryActionHref = "/interview-hub",
  secondaryActionLabel,
  secondaryActionHref = "/interview-hub",
  isBookmarked = false,
  onBookmarkChange,
}: MockInterviewCardProps) {
  const [logoFailed, setLogoFailed] = React.useState(false);
  const participationText = takenCountLabel ?? `${takenCount} people took this!`;
  const showLogoImage = Boolean(logoUrl) && !logoFailed;

  React.useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <Card className="min-w-0 gap-3 rounded-2xl border border-[#ececf0] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-7 min-w-[92px] items-center justify-center rounded-md bg-[#0b67c2] px-2.5 text-xs font-semibold text-white">
          {categoryLabel}
        </span>
        <span className="text-xs text-muted-foreground">{participationText}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-bold text-white",
                "bg-primary",
                logoClassName,
              )}
            >
              {showLogoImage ? (
                <Image
                  src={logoUrl as string}
                  alt={`${company} logo`}
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                  unoptimized
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                logoText
              )}
            </div>

            <div className="min-w-0">
              <div className="wrap-break-word font-semibold leading-tight text-foreground">
                {title}
              </div>
              <div className="wrap-break-word text-sm text-muted-foreground">
                by {company}
              </div>
            </div>
          </div>

          {stackTechnologies.length > 0 ? (
            <div className="flex shrink-0 items-center gap-1.5">
              {stackTechnologies.map((technology) => (
                <span
                  key={technology.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-[#e5e7eb]"
                >
                  <Image
                    src={technology.iconUrl}
                    alt={technology.name}
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] object-contain"
                    unoptimized
                  />
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-muted-foreground">
            <CircleAlert className="mr-1 h-3.5 w-3.5" />
            {createdAtLabel}
          </span>
          <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-muted-foreground">
            <Gauge className="mr-1 h-3.5 w-3.5" />
            {scoreLabel}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="h-9 flex-1 rounded-[10px] bg-primary text-sm font-medium text-white hover:bg-primary/90"
          >
            <Link href={primaryActionHref}>{primaryActionLabel}</Link>
          </Button>

          {secondaryActionLabel ? (
            <Button
              asChild
              variant="outline"
              className="h-9 flex-1 rounded-[10px] border-primary bg-white text-sm font-medium text-primary hover:bg-white/90 hover:text-primary"
            >
              <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
            </Button>
          ) : null}

          <BookmarkToggleButton
            entityType="interview"
            entityId={id}
            initialSaved={isBookmarked}
            onSavedChange={(saved) => onBookmarkChange?.(id, saved)}
          />
        </div>
      </div>
    </Card>
  );
}

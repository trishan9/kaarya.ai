"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  saveInterviewBookmark,
  saveJobBookmark,
  unsaveInterviewBookmark,
  unsaveJobBookmark,
} from "@/lib/actions/bookmark-actions";

type BookmarkEntityType = "job" | "interview";

type BookmarkToggleButtonProps = {
  entityType: BookmarkEntityType;
  entityId: string;
  initialSaved?: boolean;
  onSavedChange?: (saved: boolean) => void;
  className?: string;
  iconClassName?: string;
  savedClassName?: string;
  unsavedClassName?: string;
  showSuccessToast?: boolean;
  disabled?: boolean;
};

export function BookmarkToggleButton({
  entityType,
  entityId,
  initialSaved = false,
  onSavedChange,
  className,
  iconClassName,
  savedClassName,
  unsavedClassName,
  showSuccessToast = true,
  disabled = false,
}: BookmarkToggleButtonProps) {
  const [isSaved, setIsSaved] = React.useState(initialSaved);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  const toggleBookmark = React.useCallback(() => {
    if (!entityId || disabled || isPending) {
      return;
    }

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    startTransition(async () => {
      const response =
        entityType === "job"
          ? nextSaved
            ? await saveJobBookmark(entityId)
            : await unsaveJobBookmark(entityId)
          : nextSaved
            ? await saveInterviewBookmark(entityId)
            : await unsaveInterviewBookmark(entityId);

      if (!response?.success) {
        setIsSaved(!nextSaved);
        toast.error(response?.message ?? "Unable to update bookmark");
        return;
      }

      onSavedChange?.(nextSaved);
      if (showSuccessToast) {
        const label = entityType === "job" ? "Job" : "Interview";
        toast.success(
          nextSaved ? `${label} saved successfully` : `${label} removed from saved`,
        );
      }
    });
  }, [disabled, entityId, entityType, isPending, isSaved, onSavedChange, showSuccessToast]);

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "h-9 w-9 cursor-pointer rounded-[10px]",
        isSaved
          ? "border-primary bg-primary/10 text-primary"
          : "border-muted-foreground bg-white text-muted-foreground",
        isSaved ? savedClassName : unsavedClassName,
        className,
      )}
      aria-pressed={isSaved}
      type="button"
      onClick={toggleBookmark}
      disabled={disabled || isPending}
    >
      <Bookmark
        className={cn(
          "h-4 w-4",
          isSaved ? "fill-current text-current" : "text-current",
          iconClassName,
        )}
      />
      <span className="sr-only">{isSaved ? "Remove bookmark" : "Save item"}</span>
    </Button>
  );
}

"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type RatingCardProps = {
  title: string;
  rating: number;
  badgeLabel: string;
  ratingClassName?: string;
  badgeClassName?: string;
  description: string;
  suggestionTitle: string;
  suggestionBody: string;
  actionLabel?: string;
  actionHref?: string;
  showAction?: boolean;
};

export function RatingCard({
  title,
  rating,
  badgeLabel,
  ratingClassName,
  badgeClassName,
  description,
  suggestionTitle,
  suggestionBody,
  actionLabel,
  actionHref = "/resume",
  showAction = false,
}: RatingCardProps) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);

  if (isHidden) {
    return (
      <Card className="gap-3 border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              {title} removed
            </div>
            <div className="text-xs text-muted-foreground">
              Restore to keep tracking this score.
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs font-semibold"
            onClick={() => setIsHidden(false)}
          >
            Restore
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 gap-4 border-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "text-3xl font-semibold sm:text-4xl",
            ratingClassName ?? "text-foreground",
          )}
        >
          {rating}%
        </div>

        <span
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
            badgeClassName ?? "bg-muted text-muted-foreground",
          )}
        >
          {badgeLabel}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{description}</p>

      <div className="rounded-xl bg-[#eef5fb] px-4 py-3 text-xs text-muted-foreground">
        <div className="mb-1 text-sm font-semibold text-[#0b67c2]">
          {suggestionTitle}
        </div>
        <p>{suggestionBody}</p>
      </div>

      {showAction && actionLabel ? (
        <Button
          variant="outline"
          className="h-9 w-full rounded-lg border-primary bg-[#E7F2F8] text-sm font-semibold text-primary hover:bg-[#E7F2F8]/90 hover:text-primary cursor-pointer"
          onClick={() => router.push(actionHref)}
        >
          {actionLabel}
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      ) : null}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title} details</DialogTitle>
            <DialogDescription>
              Review your latest score and key suggestions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rating</span>
              <span className={cn("font-semibold", ratingClassName)}>
                {rating}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Badge</span>
              <span className={cn("font-semibold", badgeClassName)}>
                {badgeLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div>
              <div className="text-xs font-semibold text-foreground">
                {suggestionTitle}
              </div>
              <p className="text-xs text-muted-foreground">{suggestionBody}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this rating?</AlertDialogTitle>
            <AlertDialogDescription>
              The card will be hidden from your overview until you restore it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-500/90"
              onClick={() => setIsHidden(true)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

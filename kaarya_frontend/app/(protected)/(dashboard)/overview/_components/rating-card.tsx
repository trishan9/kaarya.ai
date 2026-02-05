"use client";

import * as React from "react";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type RatingCardProps = {
  title: string;
  rating: number;
  badgeLabel: string;
  ratingClassName?: string;
  badgeClassName?: string;
  description: string;
  suggestionTitle: string;
  suggestionBody: string;
  actionLabel?: string;
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
  showAction = false,
}: RatingCardProps) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [duplicateCount, setDuplicateCount] = React.useState(0);
  const [isHidden, setIsHidden] = React.useState(false);

  if (isHidden) {
    return (
      <Card className="gap-3 border-border bg-white p-5 shadow-sm">
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
    <Card className="gap-4 border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <div className="text-[10px] text-muted-foreground">
            {editMode ? "Editing targets" : "Latest rating"}
            {duplicateCount > 0 ? ` • Duplicated x${duplicateCount}` : ""}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-md text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open rating actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditMode((prev) => !prev)}>
              {editMode ? "Stop Editing" : "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDuplicateCount((prev) => prev + 1)}
            >
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="text-rose-500 focus:text-rose-500"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "text-3xl font-semibold",
            ratingClassName ?? "text-foreground"
          )}
        >
          {rating}%
        </div>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
            badgeClassName ?? "bg-muted text-muted-foreground"
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
        {showAction && actionLabel ? (
          <Button
            variant="outline"
            className="mt-3 h-9 w-full rounded-lg border-[#0b67c2] bg-white text-sm font-semibold text-[#0b67c2]"
            onClick={() => router.push("/resume")}
          >
            {actionLabel}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
      </div>

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

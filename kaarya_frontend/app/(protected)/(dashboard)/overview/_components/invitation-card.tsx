"use client";

import * as React from "react";
import { Check, MoreHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";

type InvitationCardProps = {
  title: string;
  description: string;
  eventTitle: string;
  eventTime: string;
};

export function InvitationCard({
  title,
  description,
  eventTitle,
  eventTime,
}: InvitationCardProps) {
  const [status, setStatus] = React.useState<"pending" | "accepted" | "declined">(
    "pending"
  );
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [duplicateCount, setDuplicateCount] = React.useState(0);
  const [editMode, setEditMode] = React.useState(false);
  const [rescheduled, setRescheduled] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);

  if (isHidden) {
    return (
      <Card className="gap-3 border-0 bg-[#0f6fb5] p-5 text-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">
              Invitation removed
            </div>
            <div className="text-xs text-white/70">
              Restore it if you still want to respond.
            </div>
          </div>
          <Button
            variant="secondary"
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
    <Card className="gap-4 border-0 bg-[#0f6fb5] p-5 text-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-white/70">
            {editMode ? "Editing invite" : "Invitation workflow"}
            {duplicateCount > 0 ? ` • Duplicated x${duplicateCount}` : ""}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-md text-white/80 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open invitation actions</span>
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
            <DropdownMenuItem onSelect={() => setRescheduled(true)}>
              Reschedule
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

      <p className="text-xs text-white/80">{description}</p>

      <div className="flex items-center gap-3 rounded-xl bg-[#0a5d99] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-100">
          <span className="text-xs font-semibold tracking-wide">AI</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{eventTitle}</div>
          <div className="text-xs text-white/70">{eventTime}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors",
              status === "declined" ? "bg-red-500" : "bg-red-500/20"
            )}
            onClick={() => setStatus("declined")}
            aria-pressed={status === "declined"}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Decline invitation</span>
          </button>
          <button
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors",
              status === "accepted" ? "bg-emerald-500" : "bg-emerald-400/20"
            )}
            onClick={() => setStatus("accepted")}
            aria-pressed={status === "accepted"}
          >
            <Check className="h-4 w-4" />
            <span className="sr-only">Accept invitation</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/70">
        {status !== "pending" ? (
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full border-0 px-2 py-0.5 text-[10px]",
              status === "accepted"
                ? "bg-emerald-400/20 text-emerald-100"
                : "bg-red-500/20 text-red-100"
            )}
          >
            {status === "accepted" ? "Accepted" : "Declined"}
          </Badge>
        ) : (
          <span>Awaiting your response</span>
        )}
        {rescheduled ? <span>• Reschedule requested</span> : null}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation details</DialogTitle>
            <DialogDescription>
              Review the session and confirm your availability.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Session</span>
              <span className="font-semibold text-foreground">{eventTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Time</span>
              <span className="font-semibold text-foreground">{eventTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold text-foreground">{status}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setStatus("accepted");
                setDetailsOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              You can always request a new invitation later.
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

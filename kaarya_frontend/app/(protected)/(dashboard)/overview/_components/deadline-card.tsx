"use client";

import * as React from "react";
import { Bookmark, MoreHorizontal } from "lucide-react";
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
import Image from "next/image";

type DeadlineCardProps = {
  title: string;
  company: string;
};

export function DeadlineCard({ title, company }: DeadlineCardProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = React.useState(false);
  const [reminderOn, setReminderOn] = React.useState(true);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);

  if (isHidden) {
    return (
      <Card className="gap-3 border-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Deadline reminder removed
            </div>
            <div className="text-xs text-muted-foreground">
              You can restore it anytime.
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
    <Card className="gap-3 border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Deadline Today!</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-md text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open deadline actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setReminderOn((prev) => !prev)}>
              {reminderOn ? "Mute Reminder" : "Enable Reminder"}
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

      <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg">
        <Image
          src="https://res.cloudinary.com/dnqet3vq1/image/upload/v1770473353/kaarya/acy5rbpegmme5jgree6w.png"
          alt="Anthropic"
          width={32}
          height={32}
          className="object-cover border border-white shadow-sm h-10 w-10 rounded-xl"
        />
        <div className="flex-1">
          <div className="font-semibold text-foreground">{title}</div>
          <div className="text-sm text-muted-foreground">{company}</div>
        </div>
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

      <p className="text-sm text-muted-foreground">
        One of your saved jobs has a deadline today,{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-sm font-semibold text-[#0b67c2]"
          onClick={() => router.push("/jobs")}
        >
          apply now!
        </Button>
      </p>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deadline details</DialogTitle>
            <DialogDescription>
              Review the role before submitting your application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-semibold text-foreground">{title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Company</span>
              <span className="font-semibold text-foreground">{company}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deadline</span>
              <span className="font-semibold text-foreground">Today</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => router.push("/jobs")}>Open job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the deadline card from your overview.
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

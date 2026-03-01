"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChannelStateContext } from "stream-chat-react";
import { useStreamHuddle } from "./stream-huddle-provider";

type StreamVideoCallButtonProps = {
  apiKey: string;
  userId: string;
  userName: string;
  mode: "audio" | "video";
  label?: string;
  iconOnly?: boolean;
  variant?: "outline" | "ghost";
};

export function StreamVideoCallButton({
  mode,
  label,
  iconOnly = true,
  variant = "outline",
}: StreamVideoCallButtonProps) {
  const { channel } = useChannelStateContext();
  const { isBusy, startHuddle } = useStreamHuddle();

  const ButtonIcon = mode === "audio" ? Phone : Video;
  const ariaLabel = mode === "audio" ? "Start audio huddle" : "Start video huddle";

  return (
    <Button
      type="button"
      variant={variant === "ghost" ? "ghost" : "outline"}
      size={iconOnly ? "icon" : "sm"}
      className={cn(
        iconOnly && variant === "ghost"
          ? "h-8 w-8 rounded-full border-transparent text-foreground hover:bg-accent hover:text-foreground"
          : iconOnly
            ? "h-8 w-8 rounded-full border-border bg-card hover:bg-primary/5"
            : "h-8 rounded-full border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-primary/5",
      )}
      onClick={() => {
        if (!channel?.id) return;
        void startHuddle(channel.id, mode);
      }}
      aria-label={ariaLabel}
      disabled={isBusy || !channel?.id}
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <ButtonIcon className="h-4 w-4" />
          {!iconOnly && label ? <span className="ml-1">{label}</span> : null}
        </>
      )}
    </Button>
  );
}



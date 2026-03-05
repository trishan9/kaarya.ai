"use client";

import * as React from "react";
import { Plus, SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";

type StreamSendButtonProps = React.ComponentProps<"button"> & {
  sendMessage: (event: React.BaseSyntheticEvent) => void;
};

export function StreamSendButton({
  className,
  disabled,
  sendMessage,
  ...props
}: StreamSendButtonProps) {
  return (
    <button
      type="button"
      className={cn("str-chat__send-button stream-custom-send", className)}
      onClick={sendMessage}
      disabled={disabled}
      aria-label="Send message"
      {...props}
    >
      <span className="sr-only">Send</span>
      <SendHorizonal className="h-4 w-4" />
    </button>
  );
}

type StreamAttachmentIconProps = {
  className?: string;
};

export function StreamAttachmentIcon({ className }: StreamAttachmentIconProps) {
  return <Plus className={cn("h-4 w-4", className)} />;
}

"use client";

import * as React from "react";
import type { ChannelListMessengerProps } from "stream-chat-react";
import { Loader2 } from "lucide-react";

type StreamChannelListShellProps = React.PropsWithChildren<ChannelListMessengerProps>;

export function StreamChannelListShell({
  children,
  error,
  loading,
}: StreamChannelListShellProps) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-6">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading conversations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Unable to load conversations right now.
        </p>
      </div>
    );
  }

  return <div className="h-full py-1">{children}</div>;
}


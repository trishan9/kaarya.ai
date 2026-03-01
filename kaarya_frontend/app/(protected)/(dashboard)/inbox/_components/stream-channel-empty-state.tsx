"use client";

export function StreamChannelEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-5 text-center">
      <p className="text-sm font-semibold text-foreground">No conversations yet</p>
      <p className="text-xs text-muted-foreground">
        Start a chat from applications or your workspace members to see threads here.
      </p>
    </div>
  );
}


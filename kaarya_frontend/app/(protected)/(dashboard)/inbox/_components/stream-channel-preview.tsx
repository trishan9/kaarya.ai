"use client";

import * as React from "react";
import type { Channel, LocalMessage } from "stream-chat";
import {
  useChatContext,
  type ChannelPreviewUIComponentProps,
} from "stream-chat-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initialsFromName(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getOtherMember(
  channel: Channel,
  currentUserId?: string,
): { id?: string; name?: string; image?: string; online?: boolean } | null {
  const members = Object.values(channel.state.members ?? {});
  const candidate = members.find((member) => member.user?.id !== currentUserId)
    ?.user;
  if (!candidate) return null;
  return {
    id: candidate.id,
    name: candidate.name,
    image: candidate.image,
    online: candidate.online,
  };
}

function getFallbackPreview(message?: LocalMessage) {
  if (!message) return "Start the conversation";
  if (message.text?.trim()) return message.text.trim();
  const attachmentCount = message.attachments?.length ?? 0;
  if (attachmentCount > 0) {
    return attachmentCount === 1 ? "Sent an attachment" : `Sent ${attachmentCount} attachments`;
  }
  return "Sent a message";
}

function toPreviewText(
  latestMessagePreview: React.ReactNode,
  message?: LocalMessage,
) {
  if (typeof latestMessagePreview === "string" && latestMessagePreview.trim().length > 0) {
    return latestMessagePreview.trim();
  }
  if (typeof latestMessagePreview === "number") {
    return String(latestMessagePreview);
  }
  return getFallbackPreview(message);
}

export function StreamChannelPreview({
  active,
  channel,
  latestMessagePreview,
  onSelect,
  unread,
}: ChannelPreviewUIComponentProps) {
  const { client, setActiveChannel } = useChatContext();
  const currentUserId = client.userID;
  const otherMember = getOtherMember(channel, currentUserId);
  const channelData = channel.data as {
    name?: string;
    image?: string;
    last_message_at?: string | Date | null;
  } | undefined;

  const displayName =
    channelData?.name ?? otherMember?.name ?? "Conversation";
  const displayImage = channelData?.image ?? otherMember?.image;

  const latestMessage = channel.state.messages[channel.state.messages.length - 1];
  const latestTimestamp =
    latestMessage?.created_at ??
    (channelData?.last_message_at ?? null);
  const preview = toPreviewText(latestMessagePreview, latestMessage);
  const unreadCount = unread ?? channel.countUnread();
  const handleSelect = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onSelect?.(event);
      setActiveChannel?.(channel);
      if (!channel.initialized) {
        channel.watch().catch(() => {});
      }
    },
    [channel, onSelect, setActiveChannel],
  );

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={cn(
        "group mx-2 my-1 w-[calc(100%-1rem)] rounded-xl border px-3 py-2.5 text-left transition-all",
        active
          ? "border-[#d2e2f9] bg-[#ecf4fe]"
          : "border-transparent bg-transparent hover:border-[#e8edf4] hover:bg-[#f7f9fc] active:bg-[#ecf4fe]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-11 w-11 border border-[#e8edf3]">
            <AvatarImage src={displayImage} alt={displayName} />
            <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
              {initialsFromName(displayName) || "CH"}
            </AvatarFallback>
          </Avatar>
          {otherMember?.online ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[1.04rem] font-semibold leading-tight text-slate-900">
              {displayName}
            </p>
            <span className="shrink-0 text-xs text-slate-400">
              {formatTime(latestTimestamp)}
            </span>
          </div>

          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="line-clamp-1 text-sm text-slate-400">{preview}</p>
            {unreadCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0b7dd7] px-1.5 text-[11px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

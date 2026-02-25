"use client";

import * as React from "react";
import { Channel, useChannelStateContext } from "stream-chat-react";
import { StreamVideoCallButton } from "./stream-video-call-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal } from "lucide-react";
import {
  StreamAttachmentIcon,
  StreamSendButton,
} from "./stream-message-input-controls";
import { useStreamHuddle } from "./stream-huddle-provider";
import { buildHuddleCallId } from "./stream-huddle-utils";

type ChannelWithVideoHeaderProps = {
  children: React.ReactNode;
  videoEnabled?: boolean;
  videoApiKey?: string;
  userId: string;
  userName: string;
};

function initialsFromName(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StreamChannelHeader({
  videoEnabled,
  videoApiKey,
  userId,
  userName,
}: Omit<ChannelWithVideoHeaderProps, "children">) {
  const { channel } = useChannelStateContext();
  const {
    activeCallId,
    hasActiveHuddle,
    isBusy,
    isHuddleMinimized,
    joinHuddle,
    refreshHuddlePresence,
    restoreHuddle,
    getHuddlePresence,
  } = useStreamHuddle();
  const members = Object.values(channel.state.members ?? {});
  const otherMember = members.find((member) => member.user?.id !== userId)?.user;
  const channelData = channel.data as {
    name?: string;
    image?: string;
    subtitle?: string;
    description?: string;
  } | undefined;

  const displayName =
    channelData?.name ??
    otherMember?.name ??
    "Conversation";
  const displayImage = channelData?.image ?? otherMember?.image;

  const fallbackSubtitle = otherMember
    ? otherMember.online
      ? "Online now"
      : "Direct message"
    : `${members.length} members`;
  const subtitle =
    channelData?.subtitle?.trim() ||
    channelData?.description?.trim() ||
    fallbackSubtitle;
  const huddleCallId = buildHuddleCallId(channel.id);
  const huddlePresence = getHuddlePresence(huddleCallId);
  const hasActiveCallInChannel = Boolean(huddlePresence?.active);
  const inCurrentChannelCall = Boolean(hasActiveHuddle && activeCallId === huddleCallId);

  React.useEffect(() => {
    if (!videoEnabled || !huddleCallId) return;

    void refreshHuddlePresence(huddleCallId);
    const timer = window.setInterval(() => {
      void refreshHuddlePresence(huddleCallId);
    }, 3500);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeCallId, huddleCallId, refreshHuddlePresence, videoEnabled]);

  return (
    <div className="flex items-center justify-between border-b border-[#eceef3] bg-white px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-10 w-10 border border-[#eceef3]">
          <AvatarImage src={displayImage} alt={displayName} />
          <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
            {initialsFromName(displayName) || "CH"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-[1.03rem] font-semibold leading-tight text-slate-900">
            {displayName}
          </p>
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm text-slate-400">{subtitle}</p>
            {hasActiveCallInChannel ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                In huddle
                {typeof huddlePresence?.participantCount === "number" ? (
                  <span className="text-[10px] text-emerald-700/80">
                    {Math.max(1, huddlePresence.participantCount)}
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {videoEnabled ? (
          <>
            {hasActiveCallInChannel && !inCurrentChannelCall ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-[#cfe0f9] bg-[#ecf4fe] px-3 text-xs font-semibold text-[#0b7dd7] hover:bg-[#e1eeff]"
                disabled={isBusy}
                onClick={() => {
                  if (!channel.id) return;
                  void joinHuddle(channel.id);
                }}
              >
                {isBusy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                Join Huddle
              </Button>
            ) : null}

            {inCurrentChannelCall && isHuddleMinimized ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-[#d8e4f7] bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-[#f4f7fd]"
                onClick={restoreHuddle}
              >
                Open Huddle
              </Button>
            ) : null}

            <StreamVideoCallButton
              apiKey={videoApiKey ?? ""}
              userId={userId}
              userName={userName}
              mode="video"
              iconOnly
              variant="ghost"
            />
            <StreamVideoCallButton
              apiKey={videoApiKey ?? ""}
              userId={userId}
              userName={userName}
              mode="audio"
              iconOnly
              variant="ghost"
            />
          </>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-700 hover:bg-[#f3f5f8] hover:text-slate-900"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ChannelWithVideoHeader({
  children,
  videoEnabled,
  videoApiKey,
  userId,
  userName,
}: ChannelWithVideoHeaderProps) {
  const emptyPlaceholder = (
    <div className="flex h-full flex-col items-center justify-center bg-[#fcfcfd] px-6 text-center">
      <p className="text-[1.9rem] font-semibold tracking-tight text-slate-900 sm:text-[2.05rem]">
        Let&apos;s open a message
      </p>
      <p className="mt-3 max-w-xl text-base text-slate-500">
        Open a message to view or continue your conversation. Stay connected and keep the
        conversation flowing!
      </p>
    </div>
  );

  return (
    <Channel
      EmptyPlaceholder={emptyPlaceholder}
      FileUploadIcon={StreamAttachmentIcon}
      SendButton={StreamSendButton}
      HeaderComponent={() => (
        <StreamChannelHeader
          videoEnabled={videoEnabled}
          videoApiKey={videoApiKey}
          userId={userId}
          userName={userName}
        />
      )}
    >
      {children}
    </Channel>
  );
}

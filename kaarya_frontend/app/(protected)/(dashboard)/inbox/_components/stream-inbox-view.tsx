"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import type { Channel, ChannelFilters, ChannelSort } from "stream-chat";
import {
  ChannelList,
  InfiniteScroll,
  MessageInput,
  MessageList,
  Window,
} from "stream-chat-react";
import type { TUser } from "@/lib/definitions";
import { ChannelWithVideoHeader } from "./channel-with-video-header";
import { OpenChannelWithUser } from "./open-channel-with-user";
import { StreamChatProvider } from "./stream-chat-provider";
import { StreamChannelPreview } from "./stream-channel-preview";
import { StreamChannelListShell } from "./stream-channel-list-shell";
import { StreamChannelEmptyState } from "./stream-channel-empty-state";
import { StreamHuddleProvider } from "./stream-huddle-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Inbox, Search, SlidersHorizontal, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./stream-inbox-view.module.css";

type StreamInboxViewProps = {
  apiKey: string;
  user: TUser;
  videoApiKey?: string;
  videoEnabled?: boolean;
};

const defaultFilters: ChannelFilters = {
  type: "messaging",
};

const defaultSort: ChannelSort = [
  { last_message_at: -1 },
  { updated_at: -1 },
  { created_at: -1 },
];

type InboxSection = "inbox" | "community";
type ConversationFilter = "all" | "unread" | "archived";

function channelSearchString(channel: Channel, currentUserId: string) {
  const channelData = channel.data as { name?: string } | undefined;
  const memberNames = Object.values(channel.state.members ?? {})
    .map((member) => {
      if (member.user?.id === currentUserId) return null;
      return member.user?.name?.toLowerCase() ?? null;
    })
    .filter((value): value is string => Boolean(value));

  const channelName = channelData?.name?.toLowerCase() ?? "";
  const latestMessage = channel.state.messages[channel.state.messages.length - 1];
  const latestText = latestMessage?.text?.toLowerCase() ?? "";

  return [channelName, latestText, ...memberNames].join(" ");
}

function isArchivedChannel(channel: Channel) {
  const data = channel.data as { archived?: unknown; status?: unknown } | undefined;
  if (typeof data?.archived === "boolean") return data.archived;
  if (typeof data?.status === "string") return data.status.toLowerCase() === "archived";
  return false;
}

function isCommunityChannel(channel: Channel) {
  const data = channel.data as { is_community?: unknown; community?: unknown } | undefined;
  if (typeof data?.is_community === "boolean") return data.is_community;
  if (typeof data?.community === "boolean") return data.community;
  const memberCount = Object.keys(channel.state.members ?? {}).length;
  return memberCount > 2;
}

export function StreamInboxView({
  apiKey,
  user,
  videoApiKey,
  videoEnabled,
}: StreamInboxViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [section, setSection] = React.useState<InboxSection>("inbox");
  const [conversationFilter, setConversationFilter] =
    React.useState<ConversationFilter>("all");
  const searchParams = useSearchParams();
  const openWithUserId = searchParams.get("with");
  const openWithJobId = searchParams.get("jobId");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const channelFilters = {
    ...defaultFilters,
    members: {
      $in: [user.id],
    },
  } as ChannelFilters;
  const channelRenderFilterFn = React.useCallback(
    (channels: Channel[]) => {
      let filteredChannels = channels;

      if (section === "community") {
        filteredChannels = filteredChannels.filter(isCommunityChannel);
      }

      if (conversationFilter === "unread") {
        filteredChannels = filteredChannels.filter((channel) => channel.countUnread() > 0);
      } else if (conversationFilter === "archived") {
        filteredChannels = filteredChannels.filter(isArchivedChannel);
      }

      if (!normalizedQuery) return filteredChannels;

      return filteredChannels.filter((channel) =>
        channelSearchString(channel, user.id).includes(normalizedQuery),
      );
    },
    [conversationFilter, normalizedQuery, section, user.id],
  );

  return (
    <StreamChatProvider apiKey={apiKey} user={user}>
      {openWithUserId ? (
        <OpenChannelWithUser targetUserId={openWithUserId} jobId={openWithJobId} />
      ) : null}
      <StreamHuddleProvider
        apiKey={videoApiKey?.trim() || apiKey}
        enabled={Boolean(videoEnabled)}
        userId={user.id}
        userName={user.name ?? "User"}
      >
        <div
          className={cn(
            styles.streamInbox,
            "grid h-full min-h-0 w-full gap-2 rounded-2xl bg-muted/40 p-2.5 lg:grid-cols-[320px_minmax(0,1fr)]",
          )}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card dark:bg-[#111824]">
            <div className="px-3.5 pb-3.5 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setSection("inbox")}
                  variant="ghost"
                  className={cn(
                    "h-9 rounded-lg border text-sm font-medium",
                    section === "inbox"
                      ? "border-border bg-accent text-foreground"
                      : "border-border bg-card dark:bg-[#111824] text-muted-foreground hover:bg-accent",
                  )}
                >
                  <Inbox className="mr-1.5 h-4 w-4" />
                  Inbox
                </Button>
                <Button
                  type="button"
                  onClick={() => setSection("community")}
                  variant="ghost"
                  className={cn(
                    "h-9 rounded-lg border text-sm font-medium",
                    section === "community"
                      ? "border-border bg-accent text-foreground"
                      : "border-border bg-card dark:bg-[#111824] text-muted-foreground hover:bg-accent",
                  )}
                >
                  <Users2 className="mr-1.5 h-4 w-4" />
                  Community
                </Button>
              </div>

              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Find message..."
                    className="h-10 rounded-lg border-border bg-card dark:bg-[#111824] pl-8 text-sm placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg border-border bg-card dark:bg-[#111824] text-muted-foreground hover:bg-accent"
                  aria-label="Conversation settings"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["all", "unread", "archived"] as const).map((filterKey) => (
                  <Button
                    key={filterKey}
                    type="button"
                    variant="ghost"
                    onClick={() => setConversationFilter(filterKey)}
                    className={cn(
                      "h-8 rounded-lg border text-sm font-medium capitalize",
                      conversationFilter === filterKey
                        ? "border-transparent bg-primary text-white hover:bg-primary"
                        : "border-border bg-card dark:bg-[#111824] text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {filterKey}
                  </Button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 border-t border-border">
              <ChannelList
                filters={channelFilters}
                sort={defaultSort}
                options={{ state: true, watch: true, limit: 200 }}
                channelRenderFilterFn={channelRenderFilterFn}
                List={StreamChannelListShell}
                Preview={StreamChannelPreview}
                EmptyStateIndicator={StreamChannelEmptyState}
                Paginator={InfiniteScroll}
              />
            </div>
          </div>
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card dark:bg-[#111824]">
            <ChannelWithVideoHeader
              videoEnabled={videoEnabled}
              videoApiKey={videoApiKey}
              userId={user.id}
              userName={user.name ?? "User"}
            >
              <Window>
                <MessageList messageLimit={50} />
                <MessageInput
                  additionalTextareaProps={{
                    placeholder: "Write your thoughts here...",
                  }}
                />
              </Window>
            </ChannelWithVideoHeader>
          </div>
        </div>
      </StreamHuddleProvider>
    </StreamChatProvider>
  );
}




"use client";

import { BadgeCheck, Inbox, Search, SlidersHorizontal, Users2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type InboxSortOrder = "latest" | "unread_first";
export type InboxChannelTab = { id: "inbox" | "community"; label: string };
export type InboxFolderTab = { id: "all" | "unread" | "archived"; label: string };

export type InboxConversationListItem = {
  id: string;
  name: string;
  title: string;
  verified?: boolean;
  initials: string;
  avatarUrl?: string;
  preview: string;
  lastMessageAtLabel: string;
  unreadCount: number;
};

type InboxConversationListProps = {
  channelTabs: InboxChannelTab[];
  folderTabs: InboxFolderTab[];
  currentChannel: "inbox" | "community";
  currentFolder: "all" | "unread" | "archived";
  searchQuery: string;
  sortOrder: InboxSortOrder;
  searchPlaceholder: string;
  conversations: InboxConversationListItem[];
  activeConversationId: string | null;
  onChangeChannel: (value: "inbox" | "community") => void;
  onChangeFolder: (value: "all" | "unread" | "archived") => void;
  onChangeSearchQuery: (value: string) => void;
  onChangeSortOrder: (value: InboxSortOrder) => void;
  onSelectConversation: (conversationId: string) => void;
};

function ChannelIcon({ id }: { id: "inbox" | "community" }) {
  if (id === "community") return <Users2 className="h-4 w-4" />;
  return <Inbox className="h-4 w-4" />;
}

export function InboxConversationList({
  channelTabs,
  folderTabs,
  currentChannel,
  currentFolder,
  searchQuery,
  sortOrder,
  searchPlaceholder,
  conversations,
  activeConversationId,
  onChangeChannel,
  onChangeFolder,
  onChangeSearchQuery,
  onChangeSortOrder,
  onSelectConversation,
}: InboxConversationListProps) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-[#ececf0] bg-white p-3 shadow-sm sm:p-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
          {channelTabs.map((tab) => {
            const isActive = tab.id === currentChannel;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeChannel(tab.id)}
                className={cn(
                  "flex h-8 items-center justify-center gap-1.5 rounded-lg text-sm",
                  isActive
                    ? "bg-white font-medium text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <ChannelIcon id={tab.id} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => onChangeSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 rounded-lg border-[#d8dde4] bg-white pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-[#d8dde4] bg-white"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Sort conversations</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => onChangeSortOrder("latest")}>
                Latest first
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChangeSortOrder("unread_first")}>
                Unread first
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {folderTabs.map((tab) => {
            const isActive = tab.id === currentFolder;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeFolder(tab.id)}
                className={cn(
                  "h-8 rounded-lg border text-xs font-medium",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-[#d8dde4] bg-white text-muted-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors",
                isActive ? "bg-[#ecf4fa]" : "hover:bg-neutral-50",
              )}
            >
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={conversation.avatarUrl ?? ""} alt={conversation.name} />
                <AvatarFallback className="rounded-lg bg-[#dbe7f4] text-xs font-semibold text-[#2c4d74]">
                  {conversation.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {conversation.name}
                    </p>
                    {conversation.verified ? (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2493ff]" />
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {conversation.lastMessageAtLabel}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted-foreground">
                    {conversation.preview}
                  </p>
                  {conversation.unreadCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}

        {conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d8dde4] p-5 text-center text-sm text-muted-foreground">
            No messages found.
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Sorting: {sortOrder === "latest" ? "Latest first" : "Unread first"}
      </p>
    </section>
  );
}

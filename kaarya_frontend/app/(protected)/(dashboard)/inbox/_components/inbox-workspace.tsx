"use client";

import * as React from "react";

import type { InboxConversation, InboxPageData } from "../inbox-data";
import {
  InboxConversationList,
  type InboxConversationListItem,
  type InboxSortOrder,
} from "./inbox-conversation-list";
import { InboxConversationPanel } from "./inbox-conversation-panel";
import { cn } from "@/lib/utils";

type InboxWorkspaceProps = {
  data: InboxPageData;
};

function buildTimeLabel(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getLastMessage(conversation: InboxConversation) {
  return conversation.messages.reduce((latest, current) =>
    current.sentAtTimestamp > latest.sentAtTimestamp ? current : latest,
  );
}

function toListItem(conversation: InboxConversation): InboxConversationListItem {
  const lastMessage = getLastMessage(conversation);
  const preview =
    lastMessage.body.length > 58
      ? `${lastMessage.body.slice(0, 58).trim()}...`
      : lastMessage.body;

  return {
    id: conversation.id,
    name: conversation.participant.name,
    title: conversation.participant.title,
    verified: conversation.participant.verified,
    initials: conversation.participant.initials,
    avatarUrl: conversation.participant.avatarUrl,
    preview,
    lastMessageAtLabel: lastMessage.sentAtLabel,
    unreadCount: conversation.unreadCount,
  };
}

export function InboxWorkspace({ data }: InboxWorkspaceProps) {
  const [conversations, setConversations] = React.useState(data.conversations);
  const [currentChannel, setCurrentChannel] = React.useState(data.defaultChannel);
  const [currentFolder, setCurrentFolder] = React.useState(data.defaultFolder);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<InboxSortOrder>("latest");
  const [selectedConversationId, setSelectedConversationId] = React.useState<
    string | null
  >(data.conversations[0]?.id ?? null);
  const [showMobileConversation, setShowMobileConversation] = React.useState(false);

  const visibleConversations = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const byChannel = conversations.filter(
      (conversation) => conversation.channel === currentChannel,
    );

    const byFolder = byChannel.filter((conversation) => {
      if (currentFolder === "archived") return conversation.folder === "archived";
      if (currentFolder === "unread") {
        return conversation.folder === "active" && conversation.unreadCount > 0;
      }
      return conversation.folder === "active";
    });

    const bySearch = byFolder.filter((conversation) => {
      if (!normalizedQuery) return true;

      const latestMessage = getLastMessage(conversation);
      return (
        conversation.participant.name.toLowerCase().includes(normalizedQuery) ||
        conversation.participant.title.toLowerCase().includes(normalizedQuery) ||
        latestMessage.body.toLowerCase().includes(normalizedQuery)
      );
    });

    const sorted = [...bySearch];
    if (sortOrder === "unread_first") {
      sorted.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return getLastMessage(b).sentAtTimestamp - getLastMessage(a).sentAtTimestamp;
      });
    } else {
      sorted.sort(
        (a, b) => getLastMessage(b).sentAtTimestamp - getLastMessage(a).sentAtTimestamp,
      );
    }

    return sorted;
  }, [conversations, currentChannel, currentFolder, searchQuery, sortOrder]);

  const activeConversationId = React.useMemo(() => {
    const hasSelected = visibleConversations.some(
      (conversation) => conversation.id === selectedConversationId,
    );

    if (hasSelected) return selectedConversationId;
    return visibleConversations[0]?.id ?? null;
  }, [selectedConversationId, visibleConversations]);

  const activeConversation = React.useMemo(
    () =>
      visibleConversations.find((conversation) => conversation.id === activeConversationId) ??
      null,
    [activeConversationId, visibleConversations],
  );

  const visibleConversationItems = React.useMemo(
    () => visibleConversations.map(toListItem),
    [visibleConversations],
  );

  const openConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowMobileConversation(true);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
  };

  const appendMessage = (conversationId: string, messageBody: string) => {
    const now = new Date();
    const messageTimestamp = now.getTime();

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;
        return {
          ...conversation,
          messages: [
            ...conversation.messages,
            {
              id: `msg-${conversationId}-${messageTimestamp}`,
              author: "me",
              body: messageBody,
              sentAtLabel: buildTimeLabel(now),
              sentAtTimestamp: messageTimestamp,
            },
          ],
        };
      }),
    );
  };

  return (
    <div className="grid h-full min-h-0 w-full gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div
        className={cn(
          "h-full min-h-0",
          showMobileConversation ? "hidden lg:block" : "block",
        )}
      >
        <InboxConversationList
          channelTabs={data.channelTabs}
          folderTabs={data.folderTabs}
          currentChannel={currentChannel}
          currentFolder={currentFolder}
          searchQuery={searchQuery}
          sortOrder={sortOrder}
          searchPlaceholder={data.searchPlaceholder}
          conversations={visibleConversationItems}
          activeConversationId={activeConversationId}
          onChangeChannel={(value) => {
            setCurrentChannel(value);
            setCurrentFolder("all");
            setShowMobileConversation(false);
          }}
          onChangeFolder={setCurrentFolder}
          onChangeSearchQuery={setSearchQuery}
          onChangeSortOrder={setSortOrder}
          onSelectConversation={openConversation}
        />
      </div>

      <div
        className={cn(
          "h-full min-h-0",
          showMobileConversation ? "block" : "hidden lg:block",
        )}
      >
        <InboxConversationPanel
          conversation={activeConversation}
          datePillLabel={data.datePillLabel}
          messageInputPlaceholder={data.messageInputPlaceholder}
          emptyStateTitle={data.emptyStateTitle}
          emptyStateDescription={data.emptyStateDescription}
          showMobileBack
          onMobileBack={() => setShowMobileConversation(false)}
          onSendMessage={appendMessage}
          onSendAttachment={(conversationId, fileName) =>
            appendMessage(conversationId, `Attached file: ${fileName}`)
          }
          onSendQuickActionMessage={(conversationId, action) =>
            appendMessage(
              conversationId,
              action === "call"
                ? "I can jump on a call. Please share a suitable time."
                : "I can join a quick video meeting. Please share the invite.",
            )
          }
        />
      </div>
    </div>
  );
}

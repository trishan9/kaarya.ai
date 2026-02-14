"use client";

import * as React from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  Paperclip,
  Phone,
  SendHorizonal,
  Smile,
  Video,
} from "lucide-react";

import type { InboxConversation } from "../inbox-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type InboxConversationPanelProps = {
  conversation: InboxConversation | null;
  datePillLabel: string;
  messageInputPlaceholder: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  showMobileBack: boolean;
  onMobileBack: () => void;
  onSendMessage: (conversationId: string, messageBody: string) => void;
  onSendAttachment: (conversationId: string, fileName: string) => void;
  onSendQuickActionMessage: (conversationId: string, action: "call" | "video") => void;
};

export function InboxConversationPanel({
  conversation,
  datePillLabel,
  messageInputPlaceholder,
  emptyStateTitle,
  emptyStateDescription,
  showMobileBack,
  onMobileBack,
  onSendMessage,
  onSendAttachment,
  onSendQuickActionMessage,
}: InboxConversationPanelProps) {
  const [draftMessage, setDraftMessage] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!conversation) {
    return (
      <section className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-[#ececf0] bg-white p-6 text-center shadow-sm">
        <div className="max-w-sm space-y-2">
          <h3 className="text-2xl font-semibold text-foreground">{emptyStateTitle}</h3>
          <p className="text-sm text-muted-foreground">{emptyStateDescription}</p>
        </div>
      </section>
    );
  }

  const submitMessage = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) return;
    onSendMessage(conversation.id, trimmed);
    setDraftMessage("");
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#ececf0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#ececf0] px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {showMobileBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg lg:hidden"
              onClick={onMobileBack}
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}

          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage
              src={conversation.participant.avatarUrl ?? ""}
              alt={conversation.participant.name}
            />
            <AvatarFallback className="rounded-lg bg-[#dbe7f4] text-xs font-semibold text-[#2c4d74]">
              {conversation.participant.initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">
              {conversation.participant.name}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {conversation.participant.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onSendQuickActionMessage(conversation.id, "video")}
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => onSendQuickActionMessage(conversation.id, "call")}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4">
        <div className="flex justify-center">
          <span className="rounded-md bg-neutral-100 px-3 py-1 text-xs text-muted-foreground">
            {datePillLabel}
          </span>
        </div>

        {conversation.jobContext ? (
          <Card className="gap-1 rounded-xl border border-[#ececf0] bg-neutral-50 p-3 shadow-none">
            <p className="text-sm font-semibold text-foreground">
              {conversation.jobContext.roleTitle}
            </p>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{conversation.jobContext.company}</span>
              <span>{conversation.jobContext.statusLabel}</span>
            </div>
          </Card>
        ) : null}

        <div className="space-y-3">
          {conversation.messages.map((message) => {
            const isMine = message.author === "me";

            return (
              <div
                key={message.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[84%] space-y-1", isMine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm leading-6",
                      isMine
                        ? "bg-primary text-white"
                        : "border border-[#ececf0] bg-neutral-50 text-foreground",
                    )}
                  >
                    {message.body}
                  </div>
                  <p className="text-xs text-muted-foreground">{message.sentAtLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#ececf0] px-3 py-3 sm:px-4">
        <div className="space-y-2">
          <Input
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            placeholder={messageInputPlaceholder}
            className="h-10 border-[#d8dde4]"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitMessage();
              }
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={(event) => {
              const fileName = event.currentTarget.files?.[0]?.name;
              if (fileName) onSendAttachment(conversation.id, fileName);
            }}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setDraftMessage((prev) => `${prev} :)`.trim())}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              className="h-8 rounded-md px-3 text-sm"
              onClick={submitMessage}
            >
              Send
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

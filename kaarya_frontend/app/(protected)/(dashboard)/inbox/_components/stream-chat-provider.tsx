"use client";

import * as React from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import { getStreamChatToken, ensureStreamChannels } from "@/lib/actions/inbox-actions";
import type { TUser } from "@/lib/definitions";
import { Card, CardContent } from "@/components/ui/card";

type StreamChatProviderProps = {
  apiKey: string;
  user: TUser;
  children: React.ReactNode;
};

export function StreamChatProvider({
  apiKey,
  user,
  children,
}: StreamChatProviderProps) {
  const clientRef = React.useRef<StreamChat | null>(null);
  const [client, setClient] = React.useState<StreamChat | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    if (!user?.id || clientRef.current) return;
    let cancelled = false;
    const run = async () => {
      const tokenRes = await getStreamChatToken();
      if (cancelled) return;
      if (!tokenRes?.success || !tokenRes.data?.token) {
        setError(tokenRes?.message ?? "Failed to get chat token");
        return;
      }
      const tokenApiKey = tokenRes.data.apiKey?.trim();
      const resolvedApiKey = tokenApiKey || apiKey;
      if (!resolvedApiKey) {
        setError("Stream Chat API key is missing.");
        return;
      }
      const chatClient = StreamChat.getInstance(resolvedApiKey, { timeout: 6000 });
      const streamUser = {
        id: user.id,
        name: user.name ?? "User",
        image: user.photo ?? undefined,
      };
      try {
        await chatClient.connectUser(streamUser, tokenRes.data.token);
        if (cancelled) {
          chatClient.disconnectUser().catch(() => {});
          return;
        }
        const ensured = await ensureStreamChannels();
        if (!ensured?.success) {
          throw new Error(ensured?.message ?? "Failed to ensure inbox channels");
        }
        if (cancelled) {
          chatClient.disconnectUser().catch(() => {});
          return;
        }
        clientRef.current = chatClient;
        setClient(chatClient);
      } catch (err) {
        if (!cancelled) {
          const rawMessage =
            err && typeof err === "object" && "message" in err
              ? String(err.message ?? "")
              : "";
          const normalized = rawMessage.toLowerCase();
          const isSignatureError =
            normalized.includes("jwtauth error") ||
            normalized.includes("signature is not valid");
          setError(
            isSignatureError
              ? "Stream auth failed. Ensure backend STREAM_CHAT_SECRET matches STREAM_CHAT_API_KEY and restart backend + frontend servers."
              : err instanceof Error
                ? err.message
                : "Connection failed",
          );
        }
      }
    };
    run();
    return () => {
      cancelled = true;
      if (clientRef.current) {
        clientRef.current.disconnectUser().catch(() => {});
        clientRef.current = null;
      }
    };
  }, [apiKey, user?.id, user?.name, user?.photo]);

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!client) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Connecting to chat...</p>
        </CardContent>
      </Card>
    );
  }

  return <Chat client={client}>{children}</Chat>;
}

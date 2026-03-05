"use client";

import type { InboxPageDataWithStream } from "../inbox-data";
import { InboxWorkspace } from "./inbox-workspace";
import { StreamInboxView } from "./stream-inbox-view";

type InboxContainerProps = {
  data: InboxPageDataWithStream;
};

const STREAM_CHAT_API_KEY = process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY ?? "";
const STREAM_VIDEO_API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY ?? "";

export function InboxContainer({ data }: InboxContainerProps) {
  const streamChatApiKey =
    data.streamConfig?.chatApiKey?.trim() || STREAM_CHAT_API_KEY.trim();
  const streamVideoApiKey =
    data.streamConfig?.videoApiKey?.trim() || STREAM_VIDEO_API_KEY.trim();
  const videoEnabled = Boolean(
    data.streamConfig?.videoEnabled ||
      data.streamConfig?.videoApiKey ||
      streamVideoApiKey ||
      streamChatApiKey,
  );
  const useStream =
    Boolean(streamChatApiKey) &&
    Boolean(data.user) &&
    (data.streamConfig?.chatEnabled ?? true);

  if (useStream && data.user) {
    return (
      <StreamInboxView
        apiKey={streamChatApiKey}
        user={data.user}
        videoApiKey={streamVideoApiKey || undefined}
        videoEnabled={videoEnabled}
      />
    );
  }

  return <InboxWorkspace data={data} />;
}

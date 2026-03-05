"use client";

import * as React from "react";
import { useChatContext } from "stream-chat-react";
import { usePathname, useRouter } from "next/navigation";
import { ensureStreamChannelWith } from "@/lib/actions/inbox-actions";

/**
 * Opens the 1:1 channel with the target user when ?with=userId is present.
 * Uses useEffect for async side effect (API call + channel watch) - required for this flow.
 */
export function OpenChannelWithUser({
  targetUserId,
  jobId,
}: {
  targetUserId: string;
  jobId?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { client, setActiveChannel } = useChatContext();
  const openedRef = React.useRef(false);

  React.useEffect(() => {
    const currentUserId = client?.userID;
    if (
      openedRef.current ||
      !client ||
      !setActiveChannel ||
      !currentUserId ||
      !targetUserId
    ) {
      return;
    }

    openedRef.current = true;
    let cancelled = false;

    ensureStreamChannelWith(targetUserId, jobId).then((response) => {
      if (cancelled || !response?.success) return;
      const ch = client.channel("messaging", { members: [currentUserId, targetUserId] });
      ch.watch()
        .then(() => {
          if (cancelled) return;
          setActiveChannel(ch);
          router.replace(pathname, { scroll: false });
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [client, jobId, pathname, router, setActiveChannel, targetUserId]);

  return null;
}

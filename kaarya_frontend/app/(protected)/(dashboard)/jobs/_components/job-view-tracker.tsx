"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { recordJobView } from "@/lib/actions/job-actions";

type JobViewTrackerProps = {
  jobId: string;
  enabled?: boolean;
  viewerId?: string | null;
};

export function JobViewTracker({
  jobId,
  enabled = true,
  viewerId,
}: JobViewTrackerProps) {
  const router = useRouter();

  React.useEffect(() => {
    if (!enabled) return;

    const storageKey = `kaarya.job-viewed:${viewerId ?? "anonymous"}:${jobId}`;
    const alreadyTracked = window.localStorage.getItem(storageKey);
    if (alreadyTracked) return;

    let cancelled = false;

    const track = async () => {
      const response = await recordJobView(jobId);
      if (!cancelled && response?.success) {
        window.localStorage.setItem(storageKey, "1");
        router.refresh();
      }
    };

    track();

    return () => {
      cancelled = true;
    };
  }, [enabled, jobId, router, viewerId]);

  return null;
}

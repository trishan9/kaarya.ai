"use client";

export function buildHuddleCallId(channelId?: string | null) {
  const normalized = channelId?.trim();
  if (!normalized) return null;
  return `inbox-${normalized.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}


import { formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

type RelativeTimeOptions = {
  style?: "compact" | "long";
  fallback?: string;
};

const toValidDate = (isoDate?: string) => {
  if (!isoDate) return null;
  const parsed = parseISO(isoDate);
  return isValid(parsed) ? parsed : null;
};

const toCompact = (distance: string) =>
  distance
    .replace(" seconds ago", "s ago")
    .replace(" second ago", "s ago")
    .replace(" minutes ago", "m ago")
    .replace(" minute ago", "m ago")
    .replace(" hours ago", "h ago")
    .replace(" hour ago", "h ago")
    .replace(" days ago", "d ago")
    .replace(" day ago", "d ago")
    .replace(" weeks ago", "w ago")
    .replace(" week ago", "w ago")
    .replace(" months ago", "mo ago")
    .replace(" month ago", "mo ago")
    .replace(" years ago", "y ago")
    .replace(" year ago", "y ago");

export const formatRelativeTime = (
  isoDate?: string,
  options?: RelativeTimeOptions,
) => {
  const style = options?.style ?? "compact";
  const fallback = options?.fallback ?? "just now";
  const date = toValidDate(isoDate);
  if (!date) return fallback;

  const distance = formatDistanceToNowStrict(date, {
    addSuffix: true,
    roundingMethod: "floor",
  });
  if (
    distance.includes("less than") ||
    distance.startsWith("0 second") ||
    distance === "now"
  ) {
    return fallback;
  }

  return style === "compact" ? toCompact(distance) : distance;
};

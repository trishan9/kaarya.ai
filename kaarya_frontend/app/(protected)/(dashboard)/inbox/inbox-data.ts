import type { TUser } from "@/lib/definitions";

type InboxChannel = "inbox" | "community";
type ConversationFolder = "active" | "archived";
type MessageAuthor = "me" | "them" | "system";

export type InboxMessage = {
  id: string;
  author: MessageAuthor;
  body: string;
  sentAtLabel: string;
  sentAtTimestamp: number;
};

export type InboxParticipant = {
  name: string;
  title: string;
  avatarUrl?: string;
  initials: string;
  verified?: boolean;
};

export type InboxJobContext = {
  roleTitle: string;
  company: string;
  statusLabel: string;
};

export type InboxConversation = {
  id: string;
  channel: InboxChannel;
  folder: ConversationFolder;
  participant: InboxParticipant;
  messages: InboxMessage[];
  unreadCount: number;
  jobContext?: InboxJobContext;
};

export type InboxPageData = {
  title: string;
  channelTabs: Array<{ id: InboxChannel; label: string }>;
  folderTabs: Array<{ id: "all" | "unread" | "archived"; label: string }>;
  searchPlaceholder: string;
  messageInputPlaceholder: string;
  datePillLabel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  defaultChannel: InboxChannel;
  defaultFolder: "all" | "unread" | "archived";
  conversations: InboxConversation[];
};

type ConversationSeed = Omit<InboxConversation, "messages"> & {
  messageSeeds: Array<Omit<InboxMessage, "sentAtTimestamp">>;
};

function toTimestampFromTimeLabel(timeLabel: string) {
  const [rawTime, meridiem] = timeLabel.split(" ");
  const [hoursRaw, minutesRaw] = rawTime.split(":");
  let hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0,
  ).getTime();
}

function buildConversation(seed: ConversationSeed): InboxConversation {
  const messages = seed.messageSeeds.map((message) => ({
    ...message,
    sentAtTimestamp: toTimestampFromTimeLabel(message.sentAtLabel),
  }));

  return {
    ...seed,
    messages,
  };
}

const conversationSeeds: ConversationSeed[] = [
  {
    id: "conv-jenny-wilson",
    channel: "inbox",
    folder: "active",
    unreadCount: 0,
    participant: {
      name: "Jenny Wilson",
      title: "Recruiter of Design Studio Pro",
      initials: "JW",
    },
    jobContext: {
      roleTitle: "Product Designer",
      company: "Design Studio Pro",
      statusLabel: "Applied",
    },
    messageSeeds: [
      {
        id: "msg-jw-1",
        author: "them",
        body: "Hi Ryan, I've reviewed your application, and I'm really impressed with your background, especially your experience in design UI.",
        sentAtLabel: "12:01 PM",
      },
      {
        id: "msg-jw-2",
        author: "me",
        body: "Hi Ms. Jenny Wilson, thank you for the positive feedback. I'm definitely interested in moving forward.",
        sentAtLabel: "12:10 PM",
      },
      {
        id: "msg-jw-3",
        author: "them",
        body: "That sounds great. Let's schedule the interview for tomorrow at 09:00 AM.",
        sentAtLabel: "12:19 PM",
      },
      {
        id: "msg-jw-4",
        author: "me",
        body: "Perfect, that works for me. Thanks again, and I'm excited to speak with you soon.",
        sentAtLabel: "12:22 PM",
      },
    ],
  },
  {
    id: "conv-kathryn-murphy",
    channel: "inbox",
    folder: "active",
    unreadCount: 1,
    participant: {
      name: "Kathryn Murphy",
      title: "Talent Partner at Softworks",
      initials: "KM",
      verified: true,
    },
    messageSeeds: [
      {
        id: "msg-km-1",
        author: "them",
        body: "I'd love to discuss the Software Engineer role with you. Are you available this evening?",
        sentAtLabel: "04:19 PM",
      },
    ],
  },
  {
    id: "conv-eleanor-pena",
    channel: "inbox",
    folder: "active",
    unreadCount: 0,
    participant: {
      name: "Eleanor Pena",
      title: "Recruiter at Nova Labs",
      initials: "EP",
    },
    messageSeeds: [
      {
        id: "msg-ep-1",
        author: "them",
        body: "I saw your profile and think you could be a great fit for our frontend team.",
        sentAtLabel: "03:45 PM",
      },
    ],
  },
  {
    id: "conv-annette-black",
    channel: "inbox",
    folder: "active",
    unreadCount: 0,
    participant: {
      name: "Annette Black",
      title: "Hiring Manager at Pixel Forge",
      initials: "AB",
    },
    messageSeeds: [
      {
        id: "msg-ab-1",
        author: "them",
        body: "Your resume is impressive. Let's connect for a quick screening call.",
        sentAtLabel: "01:32 PM",
      },
    ],
  },
  {
    id: "conv-cody-fisher",
    channel: "inbox",
    folder: "active",
    unreadCount: 1,
    participant: {
      name: "Cody Fisher",
      title: "Tech Recruiter at Orbit",
      initials: "CF",
      verified: true,
    },
    messageSeeds: [
      {
        id: "msg-cf-1",
        author: "them",
        body: "We'd love to invite you for an interview next week.",
        sentAtLabel: "12:02 PM",
      },
    ],
  },
  {
    id: "conv-cameron-williamson",
    channel: "community",
    folder: "active",
    unreadCount: 0,
    participant: {
      name: "Cameron Williamson",
      title: "Community Mentor",
      initials: "CW",
      verified: true,
    },
    messageSeeds: [
      {
        id: "msg-cw-1",
        author: "them",
        body: "Are you open to discussing architecture patterns for your portfolio app?",
        sentAtLabel: "11:54 AM",
      },
    ],
  },
  {
    id: "conv-theresa-webb",
    channel: "community",
    folder: "active",
    unreadCount: 0,
    participant: {
      name: "Theresa Webb",
      title: "Career Coach",
      initials: "TW",
    },
    messageSeeds: [
      {
        id: "msg-tw-1",
        author: "them",
        body: "I've reviewed your profile and have some specific advice for interview prep.",
        sentAtLabel: "08:38 AM",
      },
    ],
  },
  {
    id: "conv-bessie-cooper",
    channel: "inbox",
    folder: "archived",
    unreadCount: 0,
    participant: {
      name: "Bessie Cooper",
      title: "Recruiter at Aimline",
      initials: "BC",
      verified: true,
    },
    messageSeeds: [
      {
        id: "msg-bc-1",
        author: "them",
        body: "I found your application interesting and wanted to follow up.",
        sentAtLabel: "07:23 AM",
      },
    ],
  },
];

const INBOX_DEFAULT_DATA: InboxPageData = {
  title: "Inbox",
  channelTabs: [
    { id: "inbox", label: "Inbox" },
    { id: "community", label: "Community" },
  ],
  folderTabs: [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "archived", label: "Archived" },
  ],
  searchPlaceholder: "Find message...",
  messageInputPlaceholder: "Write your thoughts here...",
  datePillLabel: "Today, January 23, 2024",
  emptyStateTitle: "Let's open a message",
  emptyStateDescription:
    "Open a message to view or continue your conversation. Stay connected and keep the conversation flowing!",
  defaultChannel: "inbox",
  defaultFolder: "all",
  conversations: conversationSeeds.map(buildConversation),
};

export type InboxStreamConfig = {
  chatEnabled: boolean;
  videoEnabled: boolean;
  chatApiKey?: string | null;
  videoApiKey?: string | null;
};

export type InboxPageDataWithStream = InboxPageData & {
  streamConfig?: InboxStreamConfig;
  user?: TUser;
};

export async function getInboxPageData(): Promise<InboxPageDataWithStream> {
  const { getCurrentUser } = await import("@/lib/dal");
  const { getStreamConfig } = await import("@/lib/actions/inbox-actions");

  const [user, streamRes] = await Promise.all([
    getCurrentUser(),
    getStreamConfig().catch(() => ({
      success: false,
      data: {
        chatEnabled: false,
        videoEnabled: false,
        chatApiKey: null,
        videoApiKey: null,
      },
    })),
  ]);

  const streamConfig =
    streamRes?.success && streamRes?.data
      ? {
          chatEnabled: streamRes.data.chatEnabled,
          videoEnabled: streamRes.data.videoEnabled,
          chatApiKey: streamRes.data.chatApiKey ?? null,
          videoApiKey: streamRes.data.videoApiKey ?? null,
        }
      : undefined;

  return {
    ...INBOX_DEFAULT_DATA,
    streamConfig,
    user: user ?? undefined,
  };
}

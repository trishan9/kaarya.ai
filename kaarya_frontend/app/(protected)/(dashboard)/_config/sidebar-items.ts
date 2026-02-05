import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Bot,
  Mic,
  Trophy,
  Folder,
  Bookmark,
  Inbox,
  FileText,
  Newspaper,
  LifeBuoy,
} from "lucide-react";

export const sidebarNavGroups = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/overview", icon: LayoutDashboard },
      {
        label: "Explore Jobs & Internships",
        href: "/jobs",
        icon: Compass,
      },
      { label: "Resume Builder AI", href: "/resume", icon: Sparkles },
      { label: "AI Interview Hub", href: "/interview-hub", icon: Bot },
      { label: "My Interviews", href: "/interviews", icon: Mic },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "My Applications", href: "/applications", icon: Folder },
      { label: "Saved", href: "/saved", icon: Bookmark },
      { label: "Inbox", href: "/inbox", icon: Inbox },
      { label: "Resources", href: "/resources", icon: FileText },
    ],
  },
  {
    label: "Others",
    items: [
      { label: "Blogs & Articles", href: "/blogs", icon: Newspaper },
      { label: "Help Center", href: "/help", icon: LifeBuoy },
    ],
  },
];

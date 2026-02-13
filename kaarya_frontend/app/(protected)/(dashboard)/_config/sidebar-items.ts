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
  Settings,
  Building2,
  BriefcaseBusiness,
  PlusSquare,
} from "lucide-react";
import type { ComponentType } from "react";
import { Role } from "@/lib/definitions";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export type SidebarNavGroup = {
  label: string;
  items: SidebarNavItem[];
};

const candidateGroups: SidebarNavGroup[] = [
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
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const recruiterGroups: SidebarNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/overview", icon: LayoutDashboard },
      { label: "Company Jobs", href: "/jobs", icon: BriefcaseBusiness },
      { label: "Post New Job", href: "/jobs/new", icon: PlusSquare },
      {
        label: "Company Settings",
        href: "/company-settings",
        icon: Building2,
      },
    ],
  },
  {
    label: "Others",
    items: [
      { label: "Inbox", href: "/inbox", icon: Inbox },
      { label: "Blogs & Articles", href: "/blogs", icon: Newspaper },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const getSidebarNavGroups = (role?: Role | null): SidebarNavGroup[] => {
  if (role === Role.RECRUITER) {
    return recruiterGroups;
  }
  return candidateGroups;
};

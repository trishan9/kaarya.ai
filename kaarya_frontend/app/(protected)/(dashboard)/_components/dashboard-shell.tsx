"use client";

import type {
  TCollegeWorkspace,
  TRecruiterWorkspace,
  TUser,
} from "@/lib/definitions";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

type DashboardShellProps = {
  user: TUser | null;
  recruiterWorkspaces?: TRecruiterWorkspace[];
  collegeWorkspaces?: TCollegeWorkspace[];
  children: React.ReactNode;
};

export function DashboardShell({
  user,
  recruiterWorkspaces,
  collegeWorkspaces,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full bg-[#f5f6f8]">
        <AppSidebar
          user={user}
          recruiterWorkspaces={recruiterWorkspaces}
          collegeWorkspaces={collegeWorkspaces}
        />
        <SidebarInset className="min-h-svh">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}

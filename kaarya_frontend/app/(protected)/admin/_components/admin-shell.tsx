"use client";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import type { TUser } from "@/lib/definitions";
import { AppSidebar } from "../../(dashboard)/_components/app-sidebar";

type AdminShellProps = {
  user: TUser;
  children: React.ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full bg-[#f5f6f8]">
        <AppSidebar user={user} />
        <SidebarInset className="min-h-svh bg-neutral-100">
          <div className="p-2 sm:p-4 lg:pl-0 lg:p-5">
            <div className="overflow-hidden rounded-xl bg-white sm:rounded-2xl">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

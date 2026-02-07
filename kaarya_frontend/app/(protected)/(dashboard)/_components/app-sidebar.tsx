"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Loader2,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";

import { sidebarNavGroups } from "../_config/sidebar-items";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TUser } from "@/lib/definitions";
import { useLogOut } from "@/app/(auth)/_hooks/use-log-out";

type AppSidebarProps = {
  user: TUser | null;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useSidebar();
  const { onLogOut, isLoggingOut } = useLogOut();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [groupOpen, setGroupOpen] = React.useState<Record<string, boolean>>(
    () =>
      sidebarNavGroups.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.label] = true;
        return acc;
      }, {}),
  );

  const handleSearch = React.useCallback(() => {
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/search?query=${encodeURIComponent(query)}`);
  }, [router, searchQuery]);

  const handleGroupToggle = React.useCallback((label: string) => {
    setGroupOpen((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const handleProfileAction = React.useCallback(
    (path: string) => {
      setProfileOpen(false);
      router.push(path);
    },
    [router],
  );

  return (
    <Sidebar
      collapsible="icon"
      className="bg-neutral-100 border-none sticky top-0 left-0"
    >
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <Image
            src="/kaarya.svg"
            alt="Kaarya.ai"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="text-lg font-semibold tracking-tight group-data-[state=collapsed]/sidebar:hidden">
            Kaarya.ai
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="mt-3">
          {open ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Quick search..."
                className="h-9 rounded-lg border-sidebar-border bg-white pl-9 text-sm"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-sidebar-border bg-white text-muted-foreground"
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Open search</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-3">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search dashboard..."
                        className="h-9 rounded-lg border-sidebar-border bg-white pl-9 text-sm"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleSearch();
                          }
                        }}
                      />
                    </div>
                    <Button
                      className="h-8 w-full rounded-lg text-xs font-semibold"
                      onClick={handleSearch}
                    >
                      Search
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {sidebarNavGroups.map((group, index) => (
          <SidebarGroup key={group.label}>
            {index > 0 ? <Separator className="my-2" /> : null}
            <div className="flex items-center justify-between px-3">
              <SidebarGroupLabel className="px-0">
                {group.label}
              </SidebarGroupLabel>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleGroupToggle(group.label)}
                className="h-7 w-7 rounded-md text-muted-foreground group-data-[state=collapsed]/sidebar:hidden"
                aria-pressed={groupOpen[group.label]}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    groupOpen[group.label] ? "rotate-0" : "-rotate-90",
                  )}
                />
                <span className="sr-only">Toggle {group.label} navigation</span>
              </Button>
            </div>
            {groupOpen[group.label] ? (
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    const menuButton = (
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          href={item.href}
                          className="flex w-full items-center"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate group-data-[state=collapsed]/sidebar:hidden">
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    );

                    return (
                      <SidebarMenuItem key={item.label}>
                        {open ? (
                          menuButton
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {menuButton}
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            ) : null}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="space-y-3 pt-4">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl  bg-[#f0f0f0] px-3 py-3",
            "group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-2",
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.photo ?? ""} alt={user?.name ?? "User"} />
            <AvatarFallback>
              {(user?.name ?? "TW")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-sm group-data-[state=collapsed]/sidebar:hidden">
            <div className="font-semibold leading-4">
              {user?.name ?? "Trishan Wagle"}
            </div>
            <div className="text-xs text-muted-foreground">
              @
              {(user?.name ?? "trishan_wagle9")
                .toLowerCase()
                .replace(/\s+/g, "_")}
            </div>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold group-data-[state=collapsed]/sidebar:hidden"
          >
            Free
          </Badge>
          <Popover open={profileOpen} onOpenChange={setProfileOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 rounded-md text-muted-foreground"
              >
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Open profile menu</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="h-9 w-full justify-start gap-2 text-sm"
                  onClick={() => handleProfileAction("/settings")}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="h-9 w-full justify-start gap-2 text-sm text-rose-500 hover:text-rose-500"
                  onClick={() => {
                    setProfileOpen(false);
                    setLogoutOpen(true);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2 bg-[#f0f0f0] rounded-lg p-1">
          <Button
            variant={theme === "light" ? "outline" : "ghost"}
            size="sm"
            className={cn(
              "h-9 flex-1 rounded-lg text-xs font-semibold group-data-[state=collapsed]/sidebar:hidden",
              theme === "light"
                ? "border-sidebar-border bg-white text-foreground"
                : "text-muted-foreground",
            )}
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <Sun className="mr-2 h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "outline" : "ghost"}
            size="sm"
            className={cn(
              "h-9 flex-1 rounded-lg text-xs font-semibold group-data-[state=collapsed]/sidebar:hidden",
              theme === "dark"
                ? "border-sidebar-border bg-white text-foreground"
                : "text-muted-foreground",
            )}
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-sidebar-border bg-white text-muted-foreground group-data-[state=expanded]/sidebar:hidden"
            onClick={() =>
              setTheme((prev) => (prev === "light" ? "dark" : "light"))
            }
            aria-pressed={theme === "dark"}
          >
            {theme === "light" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </SidebarFooter>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of Kaarya?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onLogOut} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out
                </>
              ) : (
                "Log out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}

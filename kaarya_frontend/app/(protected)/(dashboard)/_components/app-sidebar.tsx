"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Wallet,
  Workflow,
} from "lucide-react";

import { getSidebarNavGroups } from "../_config/sidebar-items";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Role,
  TCollegeWorkspace,
  TRecruiterWorkspace,
  TUser,
} from "@/lib/definitions";
import {
  extractCollegeWorkspaces,
  extractRecruiterWorkspaces,
  resolveCollegeWorkspace,
  resolveRecruiterWorkspace,
} from "@/lib/workspaces";
import { useLogOut } from "@/app/(auth)/_hooks/use-log-out";
import { createCompany, joinCompanyByCode } from "@/lib/actions/company-actions";
import { LocationPicker } from "@/components/location/location-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createCompanyWorkspaceSchema,
  joinWorkspaceByCodeSchema,
  TCreateCompanyWorkspaceSchema,
  TJoinWorkspaceByCodeSchema,
} from "../company-settings/_schemas";

type AppSidebarProps = {
  user: TUser | null;
  recruiterWorkspaces?: TRecruiterWorkspace[];
  collegeWorkspaces?: TCollegeWorkspace[];
};

const EMPTY_RECRUITER_WORKSPACES: TRecruiterWorkspace[] = [];
const EMPTY_COLLEGE_WORKSPACES: TCollegeWorkspace[] = [];

const workspaceScopedPrefixes = [
  "/overview",
  "/jobs",
  "/interviews",
  "/company-settings",
  "/college-settings",
  "/leaderboard",
  "/inbox",
];

const industryOptions = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "E-commerce",
  "Manufacturing",
  "Consulting",
  "Media",
  "Telecommunications",
  "Government",
];

const workspaceInitials = (name?: string | null) => {
  const parts = (name ?? "Workspace")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "WS";
};

const routeMatches = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function AppSidebar({
  user,
  recruiterWorkspaces = EMPTY_RECRUITER_WORKSPACES,
  collegeWorkspaces = EMPTY_COLLEGE_WORKSPACES,
}: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { open } = useSidebar();
  const { onLogOut, isLoggingOut } = useLogOut();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = React.useState(false);
  const [isJoiningWorkspace, setIsJoiningWorkspace] = React.useState(false);
  const safeRecruiterWorkspaces = React.useMemo(
    () => extractRecruiterWorkspaces(recruiterWorkspaces as unknown[]),
    [recruiterWorkspaces],
  );
  const safeCollegeWorkspaces = React.useMemo(
    () => extractCollegeWorkspaces(collegeWorkspaces as unknown[]),
    [collegeWorkspaces],
  );
  const [recruiterWorkspaceOptions, setRecruiterWorkspaceOptions] = React.useState<
    TRecruiterWorkspace[]
  >(safeRecruiterWorkspaces);

  const isAdmin = user?.role === Role.ADMIN;
  const isRecruiter = user?.role === Role.RECRUITER;
  const isCollegeUser = user?.role === Role.COLLEGE;
  const canUseCollegeWorkspaces =
    user?.role === Role.USER ||
    user?.role === Role.STUDENT ||
    user?.role === Role.COLLEGE;
  const showCollegeWorkspaceSwitcher =
    canUseCollegeWorkspaces && safeCollegeWorkspaces.length > 0;
  const sidebarNavGroups = React.useMemo(
    () => getSidebarNavGroups(user?.role),
    [user?.role],
  );

  const [groupOpen, setGroupOpen] = React.useState<Record<string, boolean>>(
    () =>
      sidebarNavGroups.reduce<Record<string, boolean>>((acc, group) => {
        acc[group.label] = true;
        return acc;
      }, {}),
  );

  React.useEffect(() => {
    setRecruiterWorkspaceOptions(safeRecruiterWorkspaces);
  }, [safeRecruiterWorkspaces]);

  const activeWorkspaceIdFromQuery = searchParams.get("workspace");
  const activeRecruiterWorkspace = resolveRecruiterWorkspace({
    workspaces: recruiterWorkspaceOptions,
    requestedId: activeWorkspaceIdFromQuery,
  });
  const activeCollegeWorkspace = resolveCollegeWorkspace({
    workspaces: safeCollegeWorkspaces,
    requestedId: activeWorkspaceIdFromQuery,
  });

  const activeWorkspaceId = isRecruiter
    ? (activeRecruiterWorkspace?.company?.id ?? null)
    : showCollegeWorkspaceSwitcher
      ? (activeCollegeWorkspace?.college?.id ?? null)
      : null;

  const withWorkspace = React.useCallback(
    (href: string) => {
      if (!activeWorkspaceId) return href;
      if (!isRecruiter && !showCollegeWorkspaceSwitcher) return href;
      if (!workspaceScopedPrefixes.some((prefix) => href.startsWith(prefix))) {
        return href;
      }

      const url = new URL(href, "http://kaarya.local");
      if (!url.searchParams.has("workspace")) {
        url.searchParams.set("workspace", activeWorkspaceId);
      }

      return `${url.pathname}${url.search}`;
    },
    [activeWorkspaceId, isRecruiter, showCollegeWorkspaceSwitcher],
  );

  const workspaceSwitchHref = React.useCallback(
    (workspaceId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("workspace", workspaceId);
      const query = params.toString();
      return `${pathname}${query ? `?${query}` : ""}`;
    },
    [pathname, searchParams],
  );

  const handleSearch = React.useCallback(() => {
    const query = searchQuery.trim();
    if (!query) return;
    const destination = isAdmin
      ? `/admin/jobs?search=${encodeURIComponent(query)}`
      : `/jobs?search=${encodeURIComponent(query)}`;
    router.push(withWorkspace(destination));
  }, [isAdmin, router, searchQuery, withWorkspace]);

  const handleGroupToggle = React.useCallback((label: string) => {
    setGroupOpen((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const createWorkspaceForm = useForm<TCreateCompanyWorkspaceSchema>({
    resolver: zodResolver(createCompanyWorkspaceSchema),
    defaultValues: {
      name: "",
      industry: "",
      location: "",
      designation: "",
    },
  });
  const joinWorkspaceForm = useForm<TJoinWorkspaceByCodeSchema>({
    resolver: zodResolver(joinWorkspaceByCodeSchema),
    defaultValues: {
      inviteCode: "",
      designation: "",
    },
  });

  const getActiveHref = React.useCallback(
    (hrefs: string[]) => {
      const matches = hrefs.filter((href) => routeMatches(pathname, href));
      if (matches.length === 0) return null;
      return matches.sort((a, b) => b.length - a.length)[0];
    },
    [pathname],
  );

  const onCreateWorkspace = React.useCallback(
    async (values: TCreateCompanyWorkspaceSchema) => {
      setIsCreatingWorkspace(true);
      try {
        const response = await createCompany({
          name: values.name,
          industry: values.industry,
          location: values.location,
          designation: values.designation,
        });

        if (!response?.success) {
          toast.error(response?.message || "Failed to create company workspace.");
          return;
        }

        const workspaceId = (response?.data?.id ??
          response?.data?.company?.id) as string | undefined;
        const workspaceName = (response?.data?.name ??
          response?.data?.company?.name) as string | undefined;
        const workspaceLogo =
          (response?.data?.logo as string | null | undefined) ??
          (response?.data?.company?.logo as string | null | undefined) ??
          null;
        const membershipId =
          (response?.data?.membershipId as string | undefined) ??
          `workspace-${workspaceId ?? crypto.randomUUID()}`;
        const joinedAt =
          (response?.data?.joinedAt as string | undefined) ??
          new Date().toISOString();

        if (workspaceId) {
          setRecruiterWorkspaceOptions((current) => {
            if (current.some((workspace) => workspace.company.id === workspaceId)) {
              return current;
            }

            const optimisticWorkspace: TRecruiterWorkspace = {
              company: {
                id: workspaceId,
                name: workspaceName ?? values.name,
                logo: workspaceLogo,
              },
              membershipId,
              designation:
                (response?.data?.designation as string | null | undefined) ??
                (values.designation?.trim() || "Recruiter"),
              joinedAt,
            };

            return [optimisticWorkspace, ...current];
          });
        }

        toast.success(response?.message || "Company workspace created.");
        setCreateWorkspaceOpen(false);
        createWorkspaceForm.reset();

        if (workspaceId) {
          router.replace(workspaceSwitchHref(workspaceId));
        }
      } finally {
        setIsCreatingWorkspace(false);
      }
    },
    [createWorkspaceForm, router, workspaceSwitchHref],
  );

  const onJoinWorkspace = React.useCallback(
    async (values: TJoinWorkspaceByCodeSchema) => {
      setIsJoiningWorkspace(true);
      try {
        const response = await joinCompanyByCode({
          inviteCode: values.inviteCode,
          designation: values.designation,
        });

        if (!response?.success) {
          toast.error(response?.message || "Failed to join workspace.");
          return;
        }

        const workspaceId = (response?.data?.workspace?.id as string | undefined) ?? null;
        const workspaceName = (response?.data?.workspace?.name as string | undefined) ?? null;
        const workspaceLogo =
          (response?.data?.workspace?.logo as string | null | undefined) ?? null;
        const workspaceInviteCode =
          (response?.data?.workspace?.inviteCode as string | null | undefined) ??
          values.inviteCode.trim().toUpperCase();
        const membershipId =
          (response?.data?.member?.id as string | undefined) ??
          (response?.data?.member?._id as string | undefined) ??
          `workspace-${workspaceId ?? crypto.randomUUID()}`;
        const designation =
          (response?.data?.member?.designation as string | null | undefined) ??
          (values.designation?.trim() || "Recruiter");
        const joinedAt =
          (response?.data?.member?.createdAt as string | undefined) ??
          new Date().toISOString();

        if (workspaceId) {
          setRecruiterWorkspaceOptions((current) => {
            const existingIndex = current.findIndex(
              (workspace) => workspace.company.id === workspaceId,
            );
            const nextWorkspace: TRecruiterWorkspace = {
              company: {
                id: workspaceId,
                name: workspaceName ?? "Company Workspace",
                logo: workspaceLogo,
                inviteCode: workspaceInviteCode,
              },
              membershipId,
              designation,
              joinedAt,
            };

            if (existingIndex === -1) {
              return [nextWorkspace, ...current];
            }

            const next = [...current];
            next[existingIndex] = {
              ...next[existingIndex],
              ...nextWorkspace,
            };
            return next;
          });
        }

        toast.success(response?.message || "Joined company workspace.");
        setCreateWorkspaceOpen(false);
        joinWorkspaceForm.reset();

        if (workspaceId) {
          router.replace(`/overview?workspace=${workspaceId}`);
        } else {
          router.replace("/overview");
        }
      } finally {
        setIsJoiningWorkspace(false);
      }
    },
    [joinWorkspaceForm, router],
  );

  const handleCreateWorkspaceModalChange = React.useCallback(
    (openState: boolean) => {
      setCreateWorkspaceOpen(openState);
      if (!openState) {
        createWorkspaceForm.reset();
        joinWorkspaceForm.reset();
      }
    },
    [createWorkspaceForm, joinWorkspaceForm],
  );

  return (
    <Sidebar
      collapsible="icon"
      className="bg-neutral-100 border-none sticky top-0 left-0"
    >
      <SidebarHeader className="group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-2">
        <div className="flex w-full items-center gap-3 group-data-[state=collapsed]/sidebar:justify-center">
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

      <SidebarContent className="group-data-[state=collapsed]/sidebar:px-2">
        <div className="mt-3">
          {open ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  isAdmin
                    ? "Search admin records..."
                    : isRecruiter
                    ? "Search company jobs..."
                    : isCollegeUser
                      ? "Search college jobs..."
                      : "Quick search..."
                }
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
                    className="h-9 w-9 rounded-lg border-sidebar-border bg-transparent text-muted-foreground hover:bg-sidebar-accent"
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

        {isRecruiter ? (
          <SidebarGroup className="group-data-[state=collapsed]/sidebar:gap-1.5">
            <div className="flex items-center justify-between px-3 group-data-[state=collapsed]/sidebar:hidden">
              <SidebarGroupLabel className="px-0">Workspaces</SidebarGroupLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 rounded-md text-muted-foreground"
                    onClick={() => setCreateWorkspaceOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Create or join workspace</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Create or join workspace
                </TooltipContent>
              </Tooltip>
            </div>
            <SidebarGroupContent>
              {open ? (
                <div className="space-y-2 px-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full justify-between rounded-lg border-[#d8dde4] bg-white px-3 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar className="h-6 w-6 rounded-md">
                            <AvatarImage
                              src={activeRecruiterWorkspace?.company.logo ?? ""}
                              alt={activeRecruiterWorkspace?.company.name ?? "Workspace"}
                            />
                            <AvatarFallback className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                              {workspaceInitials(activeRecruiterWorkspace?.company.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {activeRecruiterWorkspace?.company.name ?? "Select workspace"}
                          </span>
                        </span>
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {recruiterWorkspaceOptions.length === 0 ? (
                        <DropdownMenuItem disabled>
                          No workspaces yet. Create one.
                        </DropdownMenuItem>
                      ) : null}
                      {recruiterWorkspaceOptions.map((workspace) => {
                        const isActiveWorkspace =
                          workspace.company.id === activeWorkspaceId;
                        return (
                          <DropdownMenuItem key={workspace.membershipId} asChild>
                            <Link
                              href={workspaceSwitchHref(workspace.company.id)}
                              className="flex w-full items-center justify-between gap-2"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <Avatar className="h-7 w-7 rounded-md">
                                  <AvatarImage
                                    src={workspace.company.logo ?? ""}
                                    alt={workspace.company.name ?? "Workspace"}
                                  />
                                  <AvatarFallback className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                                    {workspaceInitials(workspace.company.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium">
                                    {workspace.company.name ?? "Untitled company"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {workspace.designation ?? "Recruiter"}
                                  </span>
                                </div>
                              </div>
                              {isActiveWorkspace ? (
                                <Check className="h-4 w-4 text-primary" />
                              ) : null}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="mx-auto h-9 w-9 rounded-lg"
                      onClick={() => setCreateWorkspaceOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Create or join workspace</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    Create or join workspace
                  </TooltipContent>
                </Tooltip>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {showCollegeWorkspaceSwitcher && !isRecruiter ? (
          <SidebarGroup className="group-data-[state=collapsed]/sidebar:gap-1.5">
            <div className="flex items-center justify-between px-3 group-data-[state=collapsed]/sidebar:hidden">
              <SidebarGroupLabel className="px-0">Colleges</SidebarGroupLabel>
            </div>
            <SidebarGroupContent>
              {open ? (
                <div className="space-y-2 px-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 w-full justify-between rounded-lg border-[#d8dde4] bg-white px-3 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Avatar className="h-6 w-6 rounded-md">
                            <AvatarImage
                              src={activeCollegeWorkspace?.college.logo ?? ""}
                              alt={activeCollegeWorkspace?.college.name ?? "College"}
                            />
                            <AvatarFallback className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                              {workspaceInitials(activeCollegeWorkspace?.college.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {activeCollegeWorkspace?.college.name ?? "Select college"}
                          </span>
                        </span>
                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      {safeCollegeWorkspaces.map((workspace) => {
                        const isActiveWorkspace =
                          workspace.college.id === activeWorkspaceId;
                        const membershipLabel = isCollegeUser
                          ? "College Admin"
                          : [workspace.program, workspace.year ? `Year ${workspace.year}` : null]
                              .filter(Boolean)
                              .join(" - ") || "Student";

                        return (
                          <DropdownMenuItem key={workspace.membershipId} asChild>
                            <Link
                              href={workspaceSwitchHref(workspace.college.id)}
                              className="flex w-full items-center justify-between gap-2"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <Avatar className="h-7 w-7 rounded-md">
                                  <AvatarImage
                                    src={workspace.college.logo ?? ""}
                                    alt={workspace.college.name ?? "College"}
                                  />
                                  <AvatarFallback className="rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                                    {workspaceInitials(workspace.college.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium">
                                    {workspace.college.name ?? "College workspace"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {membershipLabel}
                                  </span>
                                </div>
                              </div>
                              {isActiveWorkspace ? (
                                <Check className="h-4 w-4 text-primary" />
                              ) : null}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="mx-auto h-9 w-9 rounded-lg"
                    >
                      <ChevronsUpDown className="h-4 w-4" />
                      <span className="sr-only">Switch college workspace</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    Switch college workspace
                  </TooltipContent>
                </Tooltip>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {sidebarNavGroups.map((group, index) => {
          const activeHref = getActiveHref(group.items.map((item) => item.href));

          return (
            <SidebarGroup
              key={group.label}
              className="group-data-[state=collapsed]/sidebar:gap-1.5"
            >
              {index > 0 && open ? <Separator className="my-2" /> : null}
              <div className="flex items-center justify-between px-3 group-data-[state=collapsed]/sidebar:hidden">
                <SidebarGroupLabel className="px-0">
                  {group.label}
                </SidebarGroupLabel>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleGroupToggle(group.label)}
                  className="h-7 w-7 rounded-md text-muted-foreground group-data-[state=collapsed]/sidebar:hidden"
                  aria-pressed={groupOpen[group.label] ?? true}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      groupOpen[group.label] ?? true ? "rotate-0" : "-rotate-90",
                    )}
                  />
                  <span className="sr-only">Toggle {group.label} navigation</span>
                </Button>
              </div>
              {groupOpen[group.label] ?? true ? (
                <SidebarGroupContent>
                  <SidebarMenu className="group-data-[state=collapsed]/sidebar:items-center group-data-[state=collapsed]/sidebar:justify-center">
                    {group.items.map((item) => {
                      const resolvedHref = withWorkspace(item.href);
                      const isActive = item.href === activeHref;
                      const Icon = item.icon;

                      const menuButton = (
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="group-data-[state=collapsed]/sidebar:h-9 group-data-[state=collapsed]/sidebar:w-9"
                        >
                          <Link href={resolvedHref} className="flex w-full items-center">
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
          );
        })}
      </SidebarContent>

      <SidebarFooter className="space-y-3 pt-4 group-data-[state=collapsed]/sidebar:space-y-2">
        {open ? (
          <>
            <div className="flex items-center gap-3 rounded-xl bg-[#f0f0f0] px-3 py-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user?.photo ?? ""}
                  alt={user?.name ?? "User"}
                />
                <AvatarFallback>
                  {(user?.name ?? "TW")
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-sm">
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
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              >
                {isRecruiter
                  ? "Recruiter"
                  : isAdmin
                    ? "Admin"
                    : isCollegeUser
                    ? "College"
                    : "Candidate"}
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
                    >
                      <Wallet className="h-4 w-4" />
                      Plans
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
                  "h-9 flex-1 rounded-lg text-xs font-semibold",
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
                  "h-9 flex-1 rounded-lg text-xs font-semibold",
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
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center rounded-xl bg-transparent px-0 py-0">
              <Popover open={profileOpen} onOpenChange={setProfileOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full p-0 hover:bg-white/70"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={user?.photo ?? ""}
                        alt={user?.name ?? "User"}
                      />
                      <AvatarFallback>
                        {(user?.name ?? "TW")
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Open profile menu</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  side="right"
                  sideOffset={10}
                  className="w-56 p-2"
                >
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="h-9 w-full justify-start gap-2 text-sm"
                    >
                      <Wallet className="h-4 w-4" />
                      Plans
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

            <div className="rounded-xl bg-transparent p-0 flex items-center justify-center">
              <Button
                variant="outline"
                className="h-9 w-9 justify-center rounded-lg border-sidebar-border bg-white p-0 text-foreground hover:bg-white"
                onClick={() =>
                  setTheme((prev) => (prev === "light" ? "dark" : "light"))
                }
                aria-pressed={theme === "dark"}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </>
        )}
      </SidebarFooter>

      {isRecruiter ? (
        <Dialog
          open={createWorkspaceOpen}
          onOpenChange={handleCreateWorkspaceModalChange}
        >
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create or Join Workspace</DialogTitle>
              <DialogDescription>
                Create a new company workspace or join an existing one via invite code.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="create" className="pt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create Workspace</TabsTrigger>
                <TabsTrigger value="join">Join By Code</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <form
                  onSubmit={createWorkspaceForm.handleSubmit(onCreateWorkspace)}
                  className="pt-2"
                >
                  <FieldGroup>
                    <Controller
                      name="name"
                      control={createWorkspaceForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="newWorkspaceName">Company Name</FieldLabel>
                          <Input
                            {...field}
                            id="newWorkspaceName"
                            placeholder="Kaarya AI"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="industry"
                      control={createWorkspaceForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="newWorkspaceIndustry">Industry</FieldLabel>
                          <Select
                            value={field.value || ""}
                            onValueChange={(nextValue) => field.onChange(nextValue)}
                          >
                            <SelectTrigger
                              id="newWorkspaceIndustry"
                              className="w-full"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {industryOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="location"
                      control={createWorkspaceForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="newWorkspaceLocation">Location</FieldLabel>
                          <LocationPicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Search city, office, or click on map"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="designation"
                      control={createWorkspaceForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="newWorkspaceDesignation">
                            Your Designation
                          </FieldLabel>
                          <Input
                            {...field}
                            id="newWorkspaceDesignation"
                            placeholder="Hiring Manager"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Button type="submit" disabled={isCreatingWorkspace || isJoiningWorkspace}>
                      {isCreatingWorkspace ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating Workspace...
                        </>
                      ) : (
                        "Create Workspace"
                      )}
                    </Button>
                  </FieldGroup>
                </form>
              </TabsContent>

              <TabsContent value="join">
                <form
                  onSubmit={joinWorkspaceForm.handleSubmit(onJoinWorkspace)}
                  className="pt-2"
                >
                  <FieldGroup>
                    <Controller
                      name="inviteCode"
                      control={joinWorkspaceForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="sidebarJoinInviteCode">Invite Code</FieldLabel>
                          <Input
                            {...field}
                            id="sidebarJoinInviteCode"
                            placeholder="KR-AB12CD34"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name="designation"
                      control={joinWorkspaceForm.control}
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel htmlFor="sidebarJoinDesignation">Designation</FieldLabel>
                          <Input
                            {...field}
                            id="sidebarJoinDesignation"
                            placeholder="Talent Partner"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="outline"
                      disabled={isCreatingWorkspace || isJoiningWorkspace}
                    >
                      {isJoiningWorkspace ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Joining Workspace...
                        </>
                      ) : (
                        <>
                          <Workflow className="h-4 w-4" />
                          Join Workspace
                        </>
                      )}
                    </Button>
                  </FieldGroup>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      ) : null}

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

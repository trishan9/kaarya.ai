"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, MapPin, Workflow } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { joinCompanyByCode } from "@/lib/actions/company-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  joinWorkspaceByCodeSchema,
  TJoinWorkspaceByCodeSchema,
} from "@/app/(protected)/(dashboard)/company-settings/_schemas";

type CompanyInviteJoinCardProps = {
  companyId?: string | null;
  initialInviteCode?: string | null;
  initialDesignation?: string | null;
  companyName?: string | null;
  companyLogo?: string | null;
  companyIndustry?: string | null;
  companyLocation?: string | null;
  openRolesCount?: number | null;
  alreadyMember?: boolean;
  existingWorkspaceId?: string | null;
  currentUserName?: string | null;
  currentUserEmail?: string | null;
};

const initials = (value?: string | null) =>
  (value ?? "CW")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CW";

export function CompanyInviteJoinCard({
  companyId,
  initialInviteCode,
  initialDesignation,
  companyName,
  companyLogo,
  companyIndustry,
  companyLocation,
  openRolesCount,
  alreadyMember = false,
  existingWorkspaceId,
  currentUserName,
  currentUserEmail,
}: CompanyInviteJoinCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const joinForm = useForm<TJoinWorkspaceByCodeSchema>({
    resolver: zodResolver(joinWorkspaceByCodeSchema),
    defaultValues: {
      inviteCode: initialInviteCode ?? "",
      designation: initialDesignation ?? "",
    },
  });

  const onJoinWorkspace = React.useCallback(
    async (values: TJoinWorkspaceByCodeSchema) => {
      setIsPending(true);
      try {
        const response = await joinCompanyByCode({
          inviteCode: values.inviteCode,
          designation: values.designation,
        });

        if (!response?.success) {
          toast.error(response?.message || "Failed to join workspace.");
          return;
        }

        const workspaceId = response?.data?.workspace?.id as string | undefined;
        toast.success(response?.message || "Joined company workspace.");
        router.replace(workspaceId ? `/overview?workspace=${workspaceId}` : "/overview");
      } finally {
        setIsPending(false);
      }
    },
    [router],
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Join Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Accept this invite and switch to the company workspace dashboard.
        </p>
      </div>

      <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dfe5ec] bg-white text-sm font-semibold text-primary shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt={`${companyName ?? "Company"} logo`}
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            ) : (
              initials(companyName)
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-base font-semibold text-foreground">
              {companyName ?? "Company Workspace"}
            </p>
            {companyLocation ? (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {companyLocation}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {companyIndustry ? (
                <Badge variant="secondary" className="rounded-md bg-neutral-100">
                  <Building2 className="h-3.5 w-3.5" />
                  {companyIndustry}
                </Badge>
              ) : null}
              {typeof openRolesCount === "number" ? (
                <Badge variant="secondary" className="rounded-md bg-neutral-100">
                  {openRolesCount} open roles
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-[#d8dde4] bg-neutral-50 p-3 text-xs text-muted-foreground">
          <p>
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {currentUserName ?? "Recruiter"}
            </span>
            {currentUserEmail ? ` (${currentUserEmail})` : ""}.
          </p>
          {companyId ? (
            <p className="mt-1">Workspace ID: {companyId}</p>
          ) : null}
        </div>
      </Card>

      {alreadyMember ? (
        <Card className="gap-3 rounded-2xl border border-[#d8e8fb] bg-[#f5faff] p-4 shadow-sm">
          <p className="text-sm text-[#275b85]">
            You are already a member of this workspace.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="h-9 rounded-lg">
              <Link href={existingWorkspaceId ? `/overview?workspace=${existingWorkspaceId}` : "/overview"}>
                Open Workspace Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-9 rounded-lg">
              <Link
                href={
                  existingWorkspaceId
                    ? `/company-settings?workspace=${existingWorkspaceId}`
                    : "/company-settings"
                }
              >
                Open Company Settings
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm">
          <form onSubmit={joinForm.handleSubmit(onJoinWorkspace)}>
            <FieldGroup>
              <Controller
                name="inviteCode"
                control={joinForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="inviteCode">Invite Code</FieldLabel>
                    <Input
                      {...field}
                      id="inviteCode"
                      placeholder="KR-AB12CD34"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Paste the workspace invite code shared by the company.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="designation"
                control={joinForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="designation">Designation (Optional)</FieldLabel>
                    <Input
                      {...field}
                      id="designation"
                      placeholder="Talent Partner"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button type="submit" disabled={isPending} className="h-10 rounded-lg">
                {isPending ? (
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
        </Card>
      )}
    </div>
  );
}

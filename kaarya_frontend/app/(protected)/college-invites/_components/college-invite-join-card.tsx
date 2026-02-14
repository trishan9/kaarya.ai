"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Loader2, MapPin, Workflow } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { joinCollegeByCode } from "@/lib/actions/college-actions";
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
  joinCollegeByCodeSchema,
  TJoinCollegeByCodeSchema,
} from "@/app/(protected)/(dashboard)/college-settings/_schemas";

type CollegeInviteJoinCardProps = {
  collegeId?: string | null;
  initialInviteCode?: string | null;
  initialProgram?: string | null;
  initialYear?: number | null;
  collegeName?: string | null;
  collegeLogo?: string | null;
  collegeInstitutionType?: string | null;
  collegeLocation?: string | null;
  openRolesCount?: number | null;
  alreadyMember?: boolean;
  existingWorkspaceId?: string | null;
  currentUserName?: string | null;
  currentUserEmail?: string | null;
};

const initials = (value?: string | null) =>
  (value ?? "CL")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CL";

export function CollegeInviteJoinCard({
  collegeId,
  initialInviteCode,
  initialProgram,
  initialYear,
  collegeName,
  collegeLogo,
  collegeInstitutionType,
  collegeLocation,
  openRolesCount,
  alreadyMember = false,
  existingWorkspaceId,
  currentUserName,
  currentUserEmail,
}: CollegeInviteJoinCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const joinForm = useForm<TJoinCollegeByCodeSchema>({
    resolver: zodResolver(joinCollegeByCodeSchema),
    defaultValues: {
      inviteCode: initialInviteCode ?? "",
      program: initialProgram ?? "",
      year: initialYear ?? undefined,
    },
  });

  const onJoinWorkspace = React.useCallback(
    async (values: TJoinCollegeByCodeSchema) => {
      setIsPending(true);
      try {
        const response = await joinCollegeByCode({
          inviteCode: values.inviteCode,
          program: values.program,
          year: values.year,
        });

        if (!response?.success) {
          toast.error(response?.message || "Failed to join college workspace.");
          return;
        }

        const workspaceId = response?.data?.workspace?.id as string | undefined;
        toast.success(response?.message || "Joined college workspace.");
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
        <h1 className="text-xl font-semibold text-foreground">Join College Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Accept this invite to join your college workspace and access internal
          opportunities.
        </p>
      </div>

      <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dfe5ec] bg-white text-sm font-semibold text-primary shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
            {collegeLogo ? (
              <Image
                src={collegeLogo}
                alt={`${collegeName ?? "College"} logo`}
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            ) : (
              initials(collegeName)
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-base font-semibold text-foreground">
              {collegeName ?? "College Workspace"}
            </p>
            {collegeLocation ? (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {collegeLocation}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {collegeInstitutionType ? (
                <Badge variant="secondary" className="rounded-md bg-neutral-100">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {collegeInstitutionType}
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
              {currentUserName ?? "Candidate"}
            </span>
            {currentUserEmail ? ` (${currentUserEmail})` : ""}.
          </p>
          {collegeId ? <p className="mt-1">Workspace ID: {collegeId}</p> : null}
        </div>
      </Card>

      {alreadyMember ? (
        <Card className="gap-3 rounded-2xl border border-[#d8e8fb] bg-[#f5faff] p-4 shadow-sm">
          <p className="text-sm text-[#275b85]">
            You are already a member of this college workspace.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="h-9 rounded-lg">
              <Link
                href={
                  existingWorkspaceId
                    ? `/overview?workspace=${existingWorkspaceId}`
                    : "/overview"
                }
              >
                Open Workspace Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-9 rounded-lg">
              <Link
                href={
                  existingWorkspaceId
                    ? `/leaderboard?scope=college&workspace=${existingWorkspaceId}`
                    : "/leaderboard"
                }
              >
                Open Leaderboard
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
                      placeholder="KC-AB12CD34"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Paste the workspace invite code shared by your college.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="program"
                control={joinForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="program">Program (Optional)</FieldLabel>
                    <Input
                      {...field}
                      id="program"
                      placeholder="BSc Computer Science"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="year"
                control={joinForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="year">Year (Optional)</FieldLabel>
                    <Input
                      id="year"
                      type="number"
                      min={1}
                      max={10}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
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

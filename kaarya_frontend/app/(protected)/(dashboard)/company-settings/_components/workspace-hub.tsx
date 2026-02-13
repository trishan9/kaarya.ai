"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";
import { ArrowRight, Building2, Loader2, Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TRecruiterWorkspace } from "@/lib/definitions";
import { useWorkspaceHub } from "../_hooks/use-workspace-hub";

type WorkspaceHubProps = {
  workspaces: TRecruiterWorkspace[];
  activeWorkspaceId?: string | null;
};

export function WorkspaceHub({
  workspaces,
  activeWorkspaceId,
}: WorkspaceHubProps) {
  const { createCompanyForm, joinWorkspaceForm, onCreateWorkspace, onJoinWorkspace, isSubmitting } =
    useWorkspaceHub();

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Your Workspaces</h2>
          <Badge variant="secondary">{workspaces.length}</Badge>
        </div>
        {workspaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You do not have any workspace yet. Create a company to start posting
            jobs.
          </p>
        ) : (
          <div className="space-y-3">
            {workspaces.map((workspace) => (
              <div
                key={workspace.membershipId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf0] bg-neutral-50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {workspace.company.name ?? "Untitled company"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {workspace.designation ?? "Recruiter"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activeWorkspaceId === workspace.company.id ? (
                    <Badge className="bg-primary text-white">Active</Badge>
                  ) : null}
                  <Button asChild variant="outline" size="sm" className="h-8">
                    <Link href={`/company-settings?workspace=${workspace.company.id}`}>
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Create New Company</h3>
            <p className="text-sm text-muted-foreground">
              Start a new workspace and become its first recruiter member.
            </p>
          </div>
          <form onSubmit={createCompanyForm.handleSubmit(onCreateWorkspace)}>
            <FieldGroup>
              <Controller
                name="name"
                control={createCompanyForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="workspaceName">Company Name</FieldLabel>
                    <Input
                      {...field}
                      id="workspaceName"
                      placeholder="Kaarya AI"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="industry"
                control={createCompanyForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="workspaceIndustry">Industry</FieldLabel>
                    <Input
                      {...field}
                      id="workspaceIndustry"
                      placeholder="Technology"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="location"
                control={createCompanyForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="workspaceLocation">Location</FieldLabel>
                    <Input
                      {...field}
                      id="workspaceLocation"
                      placeholder="Kathmandu, Nepal"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button disabled={isSubmitting} type="submit">
                {isSubmitting && <Loader2 className="animate-spin" />}
                <Plus className="h-4 w-4" />
                Create Workspace
              </Button>
            </FieldGroup>
          </form>
        </Card>

        <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Join By Invite Code</h3>
            <p className="text-sm text-muted-foreground">
              Enter a company invite code to join another recruiter workspace.
            </p>
          </div>
          <form onSubmit={joinWorkspaceForm.handleSubmit(onJoinWorkspace)}>
            <FieldGroup>
              <Controller
                name="inviteCode"
                control={joinWorkspaceForm.control}
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
                      Codes usually look like KR-XXXXXXXX.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="designation"
                control={joinWorkspaceForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="joinDesignation">Designation</FieldLabel>
                    <Input
                      {...field}
                      id="joinDesignation"
                      placeholder="Talent Partner"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button disabled={isSubmitting} type="submit" variant="outline">
                {isSubmitting && <Loader2 className="animate-spin" />}
                <Workflow className="h-4 w-4" />
                Join Workspace
              </Button>
            </FieldGroup>
          </form>
        </Card>

        <Card className="gap-3 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            Manage invites, members, and settings in the company settings screen.
          </div>
          <Button asChild variant="outline">
            <Link href={activeWorkspaceId ? `/company-settings?workspace=${activeWorkspaceId}` : "/company-settings"}>
              Open Company Settings
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}

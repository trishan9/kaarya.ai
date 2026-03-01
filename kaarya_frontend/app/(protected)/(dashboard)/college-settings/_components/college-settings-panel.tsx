"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import {
  Copy,
  Link2,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TCollegeMetrics, TStudentWorkspaceMember } from "@/lib/definitions";
import { useCollegeSettings } from "../_hooks/use-college-settings";

type CollegeSettingsPanelProps = {
  collegeId: string;
  workspaceName: string;
  workspaceLogo?: string | null;
  workspaceInstitutionType?: string | null;
  workspaceLocation?: string | null;
  inviteCode?: string | null;
  members: TStudentWorkspaceMember[];
  metrics?: TCollegeMetrics | null;
  currentUserId?: string;
};

const initials = (value?: string | null) =>
  (value ?? "C")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const statValue = (value?: number) => (typeof value === "number" ? value : 0);

export function CollegeSettingsPanel({
  collegeId,
  workspaceName,
  workspaceLogo,
  workspaceInstitutionType,
  workspaceLocation,
  inviteCode,
  members,
  metrics,
}: CollegeSettingsPanelProps) {
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(
    workspaceLogo ?? null,
  );

  const {
    collegeForm,
    inviteForm,
    onUpdateCollegeProfile,
    onInviteStudent,
    onResetInviteCode,
    onRemoveStudent,
    isBusy,
  } = useCollegeSettings({
    collegeId,
    initialCollege: {
      name: workspaceName,
      institutionType: workspaceInstitutionType,
      location: workspaceLocation,
    },
  });

  const watchedCollegeName = collegeForm.watch("name");
  const summary = metrics?.summary ?? null;

  const handleLogoFileChange = React.useCallback(
    (file?: File) => {
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        collegeForm.setError("logo", {
          type: "manual",
          message: "Logo size must be less than 5MB.",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        collegeForm.setError("logo", {
          type: "manual",
          message: "Only image files are allowed.",
        });
        return;
      }

      collegeForm.setValue("logo", file, { shouldDirty: true });
      collegeForm.clearErrors("logo");

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview((reader.result as string) ?? null);
      };
      reader.readAsDataURL(file);
    },
    [collegeForm],
  );

  const handleRemoveLogo = React.useCallback(() => {
    collegeForm.setValue("logo", null, { shouldDirty: true });
    collegeForm.clearErrors("logo");
    setLogoPreview(workspaceLogo ?? null);

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }, [collegeForm, workspaceLogo]);

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">College Profile</h2>
            <p className="text-sm text-muted-foreground">
              Update college details displayed across student workspace views.
            </p>
          </div>

          <form onSubmit={collegeForm.handleSubmit(onUpdateCollegeProfile)}>
            <FieldGroup>
              <Field>
                <FieldLabel>College Logo</FieldLabel>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                  <Avatar className="h-14 w-14 rounded-xl">
                    <AvatarImage
                      src={logoPreview ?? ""}
                      alt={watchedCollegeName || workspaceName}
                    />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-base font-semibold text-primary">
                      {initials(watchedCollegeName || workspaceName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        handleLogoFileChange(event.target.files?.[0])
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload Logo
                      </Button>
                      {logoPreview ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 text-muted-foreground"
                          onClick={handleRemoveLogo}
                        >
                          Reset
                        </Button>
                      ) : null}
                    </div>
                    <FieldDescription>PNG, JPG, or WebP up to 5MB.</FieldDescription>
                  </div>
                </div>
                {collegeForm.formState.errors.logo ? (
                  <FieldError errors={[collegeForm.formState.errors.logo]} />
                ) : null}
              </Field>

              <Controller
                name="name"
                control={collegeForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="collegeName">College Name</FieldLabel>
                    <Input
                      {...field}
                      id="collegeName"
                      placeholder="College name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="institutionType"
                control={collegeForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="institutionType">Institution Type</FieldLabel>
                    <Input
                      {...field}
                      id="institutionType"
                      placeholder="Engineering College"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="location"
                control={collegeForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="collegeLocation">Location</FieldLabel>
                    <Input
                      {...field}
                      id="collegeLocation"
                      placeholder="City, Country"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="animate-spin" />}
                Save College Changes
              </Button>
            </FieldGroup>
          </form>
        </Card>

        <Card className="gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Student Access</h2>
            <p className="text-sm text-muted-foreground">
              Invite students and share workspace access.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Invite Code
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="font-semibold">{inviteCode ?? "Unavailable"}</code>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
                    if (!inviteCode) return;
                    await navigator.clipboard.writeText(inviteCode);
                    toast.success("Invite code copied.");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={async () => {
                    if (!inviteCode) return;
                    const inviteLink =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/college-invites?collegeId=${encodeURIComponent(collegeId)}&inviteCode=${encodeURIComponent(inviteCode)}`
                        : `/college-invites?collegeId=${encodeURIComponent(collegeId)}&inviteCode=${encodeURIComponent(inviteCode)}`;
                    await navigator.clipboard.writeText(inviteLink);
                    toast.success("Invite link copied.");
                  }}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onResetInviteCode}
                  disabled={isBusy}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={inviteForm.handleSubmit(onInviteStudent)}>
            <FieldGroup>
              <Controller
                name="email"
                control={inviteForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="inviteStudentEmail">Student Email</FieldLabel>
                    <Input
                      {...field}
                      id="inviteStudentEmail"
                      placeholder="student@college.edu"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="program"
                control={inviteForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="inviteProgram">Program (Optional)</FieldLabel>
                    <Input
                      {...field}
                      id="inviteProgram"
                      placeholder="BSc Computer Science"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="year"
                control={inviteForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="inviteYear">Year (Optional)</FieldLabel>
                    <Input
                      id="inviteYear"
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

              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="animate-spin" />}
                <UserPlus className="h-4 w-4" />
                Invite Student
              </Button>
            </FieldGroup>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">College Metrics</h3>
            <Badge variant="secondary">
              {statValue(summary?.students)} students
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Applications</p>
              <p className="text-xl font-semibold">
                {statValue(summary?.applications)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Interviews</p>
              <p className="text-xl font-semibold">
                {statValue(summary?.interviewScheduled)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Accepted</p>
              <p className="text-xl font-semibold">
                {statValue(summary?.accepted)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Open Jobs</p>
              <p className="text-xl font-semibold">
                {statValue(summary?.openCollegeJobs)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Students</h3>
            <Badge variant="secondary">{members.length}</Badge>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students in this workspace yet.
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const student = member.student ?? null;
                const studentId = student?.id || member.studentId || member.id;
                const memberName = student?.name ?? "Student";
                const memberEmail = student?.email ?? "No email available";
                const membershipLabel =
                  [member.program, member.year ? `Year ${member.year}` : null]
                    .filter(Boolean)
                    .join(" - ") || "Student";

                return (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student?.photo ?? ""} alt={memberName} />
                        <AvatarFallback>{initials(memberName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{memberName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {memberEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{membershipLabel}</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-rose-200 text-rose-600 hover:text-rose-700"
                        onClick={() => onRemoveStudent(studentId)}
                        disabled={isBusy}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


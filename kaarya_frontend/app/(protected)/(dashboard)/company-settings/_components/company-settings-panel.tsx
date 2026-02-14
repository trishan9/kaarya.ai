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
import { TWorkspaceMember } from "@/lib/definitions";
import { useCompanySettings } from "../_hooks/use-company-settings";

type CompanySettingsPanelProps = {
  companyId: string;
  workspaceName: string;
  workspaceLogo?: string | null;
  workspaceIndustry?: string | null;
  workspaceLocation?: string | null;
  inviteCode?: string | null;
  members: TWorkspaceMember[];
  currentUserId?: string;
};

const initials = (value?: string | null) =>
  (value ?? "R")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function CompanySettingsPanel({
  companyId,
  workspaceName,
  workspaceLogo,
  workspaceIndustry,
  workspaceLocation,
  inviteCode,
  members,
  currentUserId,
}: CompanySettingsPanelProps) {
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(
    workspaceLogo ?? null,
  );

  const {
    companyForm,
    inviteForm,
    onUpdateCompanyProfile,
    onInviteRecruiter,
    onResetInviteCode,
    onRemoveRecruiter,
    isBusy,
  } = useCompanySettings({
    companyId,
    initialCompany: {
      name: workspaceName,
      industry: workspaceIndustry,
      location: workspaceLocation,
    },
  });

  const watchedCompanyName = companyForm.watch("name");

  const handleLogoFileChange = React.useCallback(
    (file?: File) => {
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        companyForm.setError("logo", {
          type: "manual",
          message: "Logo size must be less than 5MB.",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        companyForm.setError("logo", {
          type: "manual",
          message: "Only image files are allowed.",
        });
        return;
      }

      companyForm.setValue("logo", file, { shouldDirty: true });
      companyForm.clearErrors("logo");

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview((reader.result as string) ?? null);
      };
      reader.readAsDataURL(file);
    },
    [companyForm],
  );

  const handleRemoveLogo = React.useCallback(() => {
    companyForm.setValue("logo", null, { shouldDirty: true });
    companyForm.clearErrors("logo");
    setLogoPreview(workspaceLogo ?? null);

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }, [companyForm, workspaceLogo]);

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Company Profile</h2>
            <p className="text-sm text-muted-foreground">
              Update the company details and brand logo shown in recruiter
              workspace views.
            </p>
          </div>

          <form onSubmit={companyForm.handleSubmit(onUpdateCompanyProfile)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Company Logo</FieldLabel>
                <div className="flex items-center gap-3 rounded-xl border border-[#ececf0] bg-neutral-50 p-3">
                  <Avatar className="h-14 w-14 rounded-xl">
                    <AvatarImage
                      src={logoPreview ?? ""}
                      alt={watchedCompanyName || workspaceName}
                    />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-base font-semibold text-primary">
                      {initials(watchedCompanyName || workspaceName)}
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
                    <FieldDescription>
                      PNG, JPG, or WebP up to 5MB.
                    </FieldDescription>
                  </div>
                </div>
                {companyForm.formState.errors.logo ? (
                  <FieldError errors={[companyForm.formState.errors.logo]} />
                ) : null}
              </Field>

              <Controller
                name="name"
                control={companyForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
                    <Input
                      {...field}
                      id="companyName"
                      placeholder="Company name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="industry"
                control={companyForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="companyIndustry">Industry</FieldLabel>
                    <Input
                      {...field}
                      id="companyIndustry"
                      placeholder="Technology"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="location"
                control={companyForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="companyLocation">Location</FieldLabel>
                    <Input
                      {...field}
                      id="companyLocation"
                      placeholder="City, Country"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="animate-spin" />}
                Save Company Changes
              </Button>
            </FieldGroup>
          </form>
        </Card>

        <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Workspace Access</h2>
            <p className="text-sm text-muted-foreground">
              Invite recruiters and manage workspace access.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-[#d8dde4] bg-neutral-50 p-3">
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
                        ? `${window.location.origin}/company-invites?companyId=${encodeURIComponent(companyId)}&inviteCode=${encodeURIComponent(inviteCode)}`
                        : `/company-invites?companyId=${encodeURIComponent(companyId)}&inviteCode=${encodeURIComponent(inviteCode)}`;
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

          <form onSubmit={inviteForm.handleSubmit(onInviteRecruiter)}>
            <FieldGroup>
              <Controller
                name="email"
                control={inviteForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="inviteEmail">Recruiter Email</FieldLabel>
                    <Input
                      {...field}
                      id="inviteEmail"
                      placeholder="recruiter@company.com"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="designation"
                control={inviteForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="inviteDesignation">Designation</FieldLabel>
                    <Input
                      {...field}
                      id="inviteDesignation"
                      placeholder="Talent Partner"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Optional role title for the invited recruiter.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="animate-spin" />}
                <UserPlus className="h-4 w-4" />
                Invite Recruiter
              </Button>
            </FieldGroup>
          </form>
        </Card>
      </div>

      <Card className="gap-4 rounded-2xl border border-[#ececf0] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Current Members</h3>
          <Badge variant="secondary">{members.length}</Badge>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recruiter members found in this workspace yet.
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const recruiter = member.recruiter ?? null;
              const recruiterId =
                recruiter?.id || member.recruiterId || member.id;
              const memberName = recruiter?.name ?? "Recruiter";
              const memberEmail = recruiter?.email ?? "No email available";
              const isSelf = recruiterId === currentUserId;

              return (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf0] bg-neutral-50 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={recruiter?.photo ?? ""} alt={memberName} />
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
                    <Badge variant="secondary">
                      {member.designation || "Recruiter"}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-rose-200 text-rose-600 hover:text-rose-700"
                      onClick={() => onRemoveRecruiter(recruiterId)}
                      disabled={isBusy || isSelf}
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
  );
}

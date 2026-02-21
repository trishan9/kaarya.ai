"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import { UseFormReturn } from "react-hook-form";
import {
  User,
  Mail,
  Camera,
  Briefcase,
  Link as LinkIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { TUpdateProfileSchemaInput } from "../_schemas";
import { ProfilePictureUpload } from "./profile-picture-upload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { ProfileSaveButton } from "./profile-save-button";
import { generateAiSuggestions } from "@/lib/actions/resume-builder-actions";

interface GeneralInformationFormProps {
  form: UseFormReturn<TUpdateProfileSchemaInput>;
  currentPhoto?: string | null;
  userName: string;
  isSubmitting: boolean;
}

export function GeneralInformationForm({
  form,
  currentPhoto,
  userName,
  isSubmitting,
}: GeneralInformationFormProps) {
  const [isAiFilling, setIsAiFilling] = useState(false);

  const handleAiAutofill = async () => {
    const profile = form.getValues("candidateProfile");
    setIsAiFilling(true);
    try {
      const [personalSuggestion, summarySuggestion] = await Promise.all([
        generateAiSuggestions({
          focus: "personal",
          targetRole:
            profile?.preferredRoles?.[0] ??
            profile?.headline ??
            undefined,
          personalInfo: {
            firstName: form.getValues("name")?.split(" ")[0] ?? null,
            lastName:
              form.getValues("name")?.split(" ").slice(1).join(" ") || null,
            jobTitle: profile?.headline ?? null,
            email: form.getValues("email") ?? null,
            phone: profile?.phone ?? null,
            city: profile?.location ?? null,
            linkedin: profile?.linkedinUrl ?? null,
            github: profile?.githubUrl ?? null,
            portfolio: profile?.portfolioUrl ?? null,
          },
          professionalSummary: profile?.summary ?? undefined,
          skills: (profile?.skills ?? []).map((s) =>
            typeof s === "string" ? s : s.name,
          ),
        }),
        generateAiSuggestions({
          focus: "summary",
          targetRole:
            profile?.preferredRoles?.[0] ??
            profile?.headline ??
            undefined,
          professionalSummary: profile?.summary ?? undefined,
          experience: (profile?.experience ?? []).map((item) => ({
            id: item.id,
            position: item.jobTitle,
            company: item.companyName,
            startDate: item.startDate,
            endDate: item.endDate,
            currentlyWorking: item.currentlyWorking,
            bulletPoints: item.description ? [item.description] : [],
          })),
          education: (profile?.education ?? []).map((item) => ({
            id: item.id,
            school: item.institution,
            degree: item.degree,
            major: item.fieldOfStudy,
            startDate: item.startDate,
            endDate: item.endDate,
            coursework: item.description,
          })),
          skills: (profile?.skills ?? []).map((s) =>
            typeof s === "string" ? s : s.name,
          ),
        }),
      ]);

      if (personalSuggestion?.jobTitle) {
        form.setValue("candidateProfile.headline", personalSuggestion.jobTitle, {
          shouldDirty: true,
          shouldValidate: true,
        });
      } else if (personalSuggestion?.targetRole) {
        form.setValue(
          "candidateProfile.headline",
          personalSuggestion.targetRole,
          { shouldDirty: true, shouldValidate: true },
        );
      }

      if (summarySuggestion?.professionalSummary) {
        form.setValue(
          "candidateProfile.summary",
          summarySuggestion.professionalSummary,
          { shouldDirty: true, shouldValidate: true },
        );
      }

      toast.success("AI suggestions applied to headline and summary.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate AI suggestions.",
      );
    } finally {
      setIsAiFilling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Profile Picture</h3>
        </div>
        <ProfilePictureUpload
          form={form}
          currentPhoto={currentPhoto}
          userName={userName}
        />
      </div>

      <Separator />

      {/* Personal Info */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Personal Information</h3>
        </div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="name"
                    placeholder="John Doe"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            name="candidateProfile.phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="phone"
                  placeholder="+1 555 123 4567"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Optional. Visible to recruiters when you apply.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      <Separator />

      {/* Professional Snapshot */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Professional Snapshot</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => void handleAiAutofill()}
            disabled={isAiFilling}
          >
            {isAiFilling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            AI Autofill
          </Button>
        </div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="candidateProfile.headline"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="headline">Profile Headline</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="headline"
                    placeholder="Frontend Engineer | React | TypeScript"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="candidateProfile.location"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="candidateLocation">Location</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="candidateLocation"
                    placeholder="Kathmandu, Nepal"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            name="candidateProfile.openToWork"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Open To Work</FieldLabel>
                <Select
                  value={field.value ? "yes" : "no"}
                  onValueChange={(value) => field.onChange(value === "yes")}
                >
                  <SelectTrigger
                    aria-invalid={fieldState.invalid}
                    className="sm:w-40"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Enables open-to-work visibility for job recommendations.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="candidateProfile.summary"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="summary">About You</FieldLabel>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  id="summary"
                  placeholder="Share your strengths, interests, and what kind of roles you're targeting."
                  className="min-h-[120px]"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Appears in candidate previews and applications.
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      <Separator />

      {/* Professional Links */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Professional Links</h3>
        </div>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Controller
              name="candidateProfile.portfolioUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="portfolioUrl">Portfolio</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="portfolioUrl"
                    placeholder="https://your-portfolio.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="candidateProfile.linkedinUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="linkedinUrl">LinkedIn</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="linkedinUrl"
                    placeholder="https://linkedin.com/in/..."
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="candidateProfile.githubUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="githubUrl">GitHub</FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="githubUrl"
                    placeholder="https://github.com/..."
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </div>

      <ProfileSaveButton isSubmitting={isSubmitting} />
    </div>
  );
}

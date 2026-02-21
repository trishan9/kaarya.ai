"use client";

import { useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { Briefcase, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TUpdateProfileSchemaInput } from "../_schemas";
import { ProfileSaveButton } from "./profile-save-button";
import { ResumeDateInput } from "@/app/(protected)/(dashboard)/resume/_components/resume-form-fields";
import { generateExperienceBullets } from "@/lib/actions/resume-builder-actions";

type ExperienceInformationFormProps = {
  form: UseFormReturn<TUpdateProfileSchemaInput>;
  fields: Array<{ id: string }>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isSubmitting: boolean;
};

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
  "Self-employed",
  "Volunteer",
  "Apprenticeship",
] as const;

export function ExperienceInformationForm({
  form,
  fields,
  onAdd,
  onRemove,
  isSubmitting,
}: ExperienceInformationFormProps) {
  const [aiLoadingIndex, setAiLoadingIndex] = useState<number | null>(null);

  const handleAiAutofill = async (index: number) => {
    const experience = form.getValues(`candidateProfile.experience.${index}`);
    const profile = form.getValues("candidateProfile");

    if (!experience?.jobTitle && !experience?.companyName) {
      toast.error("Add a job title or company name first.");
      return;
    }

    setAiLoadingIndex(index);
    try {
      const currentDescription = experience?.description?.trim() || "";
      const result = await generateExperienceBullets({
        targetRole:
          profile?.preferredRoles?.[0] ?? profile?.headline ?? undefined,
        position: experience?.jobTitle || null,
        company: experience?.companyName || null,
        description:
          currentDescription ||
          `${experience?.jobTitle || "Role"} at ${experience?.companyName || "Company"} (${experience?.employmentType || "Full-time"})`,
      });

      if (result?.bullets && Array.isArray(result.bullets) && result.bullets.length > 0) {
        const bulletText = result.bullets
          .map((b: string) => `\u2022 ${b}`)
          .join("\n");
        const newDescription = currentDescription
          ? `${currentDescription}\n\n${bulletText}`
          : bulletText;
        form.setValue(
          `candidateProfile.experience.${index}.description`,
          newDescription,
          { shouldDirty: true },
        );
        toast.success("AI-generated bullet points added.");
      } else {
        toast.info("No bullet points generated. Try adding more context.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate bullet points.",
      );
    } finally {
      setAiLoadingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </CardTitle>
            <CardDescription>
              Add positions in reverse chronological order. Strong descriptions
              with measurable impact improve ATS scores and recruiter interest.
            </CardDescription>
          </div>
          <Button type="button" onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        </CardHeader>
      </Card>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first experience to strengthen your profile and improve
              job matching.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={onAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Experience
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {fields.map((field, index) => {
        const isAiLoading = aiLoadingIndex === index;
        return (
          <Card key={field.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">
                Experience #{index + 1}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 border-rose-200 text-rose-600 hover:text-rose-700"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    name={`candidateProfile.experience.${index}.jobTitle`}
                    control={form.control}
                    render={({ field: controlledField, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor={`jobTitle-${index}`}>
                          Job Title
                        </FieldLabel>
                        <Input
                          {...controlledField}
                          value={controlledField.value ?? ""}
                          id={`jobTitle-${index}`}
                          placeholder="Frontend Developer"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`candidateProfile.experience.${index}.companyName`}
                    control={form.control}
                    render={({ field: controlledField, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor={`companyName-${index}`}>
                          Company
                        </FieldLabel>
                        <Input
                          {...controlledField}
                          value={controlledField.value ?? ""}
                          id={`companyName-${index}`}
                          placeholder="Acme Inc."
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Controller
                    name={`candidateProfile.experience.${index}.employmentType`}
                    control={form.control}
                    render={({ field: controlledField, fieldState }) => (
                      <Field>
                        <FieldLabel>Employment Type</FieldLabel>
                        <Select
                          value={controlledField.value || "Full-time"}
                          onValueChange={controlledField.onChange}
                        >
                          <SelectTrigger aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYMENT_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`candidateProfile.experience.${index}.location`}
                    control={form.control}
                    render={({ field: controlledField, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor={`experienceLocation-${index}`}>
                          Location
                        </FieldLabel>
                        <Input
                          {...controlledField}
                          value={controlledField.value ?? ""}
                          id={`experienceLocation-${index}`}
                          placeholder="Remote / City, Country"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Controller
                    name={`candidateProfile.experience.${index}.startDate`}
                    control={form.control}
                    render={({ field: controlledField, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor={`experienceStart-${index}`}>
                          Start Date
                        </FieldLabel>
                        <ResumeDateInput
                          value={controlledField.value ?? ""}
                          onChange={(value) => controlledField.onChange(value)}
                          placeholder="Select start date"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`candidateProfile.experience.${index}.endDate`}
                    control={form.control}
                    render={({ field: controlledField, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor={`experienceEnd-${index}`}>
                          End Date
                        </FieldLabel>
                        <ResumeDateInput
                          value={controlledField.value ?? ""}
                          onChange={(value) => controlledField.onChange(value)}
                          disabled={Boolean(
                            form.watch(
                              `candidateProfile.experience.${index}.currentlyWorking`,
                            ),
                          )}
                          placeholder="Select end date"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`candidateProfile.experience.${index}.currentlyWorking`}
                    control={form.control}
                    render={({ field: controlledField, fieldState }) => (
                      <Field>
                        <FieldLabel>Current Role</FieldLabel>
                        <Select
                          value={controlledField.value ? "yes" : "no"}
                          onValueChange={(value) => {
                            const isCurrentRole = value === "yes";
                            controlledField.onChange(isCurrentRole);
                            if (isCurrentRole) {
                              form.setValue(
                                `candidateProfile.experience.${index}.endDate`,
                                "",
                                { shouldDirty: true },
                              );
                            }
                          }}
                        >
                          <SelectTrigger aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Currently here?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name={`candidateProfile.experience.${index}.description`}
                  control={form.control}
                  render={({ field: controlledField, fieldState }) => (
                    <Field>
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel htmlFor={`experienceDescription-${index}`}>
                          Responsibilities & Impact
                        </FieldLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-7 text-xs"
                          onClick={() => void handleAiAutofill(index)}
                          disabled={isAiLoading}
                        >
                          {isAiLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          AI Generate
                        </Button>
                      </div>
                      <Textarea
                        {...controlledField}
                        value={controlledField.value ?? ""}
                        id={`experienceDescription-${index}`}
                        className="min-h-[150px] font-mono text-sm"
                        placeholder={`\u2022 Led development of...\n\u2022 Improved performance by...\n\u2022 Collaborated with cross-functional teams to...`}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        Use bullet points for ATS-friendly descriptions. Click
                        &quot;AI Generate&quot; to auto-create impact-driven bullet
                        points based on your role.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>
        );
      })}

      <ProfileSaveButton
        isSubmitting={isSubmitting}
        label="Save Experience Details"
      />
    </div>
  );
}

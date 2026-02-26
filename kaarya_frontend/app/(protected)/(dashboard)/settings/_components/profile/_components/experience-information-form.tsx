"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
] as const;

export function ExperienceInformationForm({
  form,
  fields,
  onAdd,
  onRemove,
  isSubmitting,
}: ExperienceInformationFormProps) {
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
              Add internships and jobs that reflect your profile.
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
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Add your first experience entry to improve recruiter visibility.
          </CardContent>
        </Card>
      ) : null}

      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Experience #{index + 1}</CardTitle>
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-rose-200 text-rose-600 hover:text-rose-700"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name={`candidateProfile.experience.${index}.jobTitle`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`jobTitle-${index}`}>Job Title</FieldLabel>
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
                        placeholder="Remote / City"
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
              </div>

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
                        <SelectValue placeholder="Are you currently here?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      When set to yes, end date will be treated as ongoing.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`candidateProfile.experience.${index}.description`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`experienceDescription-${index}`}>
                      Responsibilities & Impact
                    </FieldLabel>
                    <Textarea
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`experienceDescription-${index}`}
                      className="min-h-[130px]"
                      placeholder="Describe outcomes, projects, tools, and measurable impact."
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      ))}

      <ProfileSaveButton
        isSubmitting={isSubmitting}
        label="Save Experience Details"
      />
    </div>
  );
}

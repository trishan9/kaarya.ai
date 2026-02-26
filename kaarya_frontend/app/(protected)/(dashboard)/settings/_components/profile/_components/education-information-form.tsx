"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
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
import { TUpdateProfileSchemaInput } from "../_schemas";
import { ProfileSaveButton } from "./profile-save-button";
import { ResumeDateInput } from "@/app/(protected)/(dashboard)/resume/_components/resume-form-fields";

type EducationInformationFormProps = {
  form: UseFormReturn<TUpdateProfileSchemaInput>;
  fields: Array<{ id: string }>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isSubmitting: boolean;
};

export function EducationInformationForm({
  form,
  fields,
  onAdd,
  onRemove,
  isSubmitting,
}: EducationInformationFormProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
            <CardDescription>
              Add your academic background in reverse chronological order.
            </CardDescription>
          </div>
          <Button type="button" onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Education
          </Button>
        </CardHeader>
      </Card>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Add at least one education entry to strengthen your profile.
          </CardContent>
        </Card>
      ) : null}

      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Education #{index + 1}</CardTitle>
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
                name={`candidateProfile.education.${index}.institution`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`institution-${index}`}>
                      Institution
                    </FieldLabel>
                    <Input
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`institution-${index}`}
                      placeholder="University / College"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`candidateProfile.education.${index}.degree`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`degree-${index}`}>Degree</FieldLabel>
                    <Input
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`degree-${index}`}
                      placeholder="Bachelors / Masters / Diploma"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`candidateProfile.education.${index}.fieldOfStudy`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`fieldOfStudy-${index}`}>
                      Field Of Study
                    </FieldLabel>
                    <Input
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`fieldOfStudy-${index}`}
                      placeholder="Computer Science"
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
                  name={`candidateProfile.education.${index}.startDate`}
                  control={form.control}
                  render={({ field: controlledField, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={`educationStart-${index}`}>
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
                  name={`candidateProfile.education.${index}.endDate`}
                  control={form.control}
                  render={({ field: controlledField, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={`educationEnd-${index}`}>
                        End Date
                      </FieldLabel>
                      <ResumeDateInput
                        value={controlledField.value ?? ""}
                        onChange={(value) => controlledField.onChange(value)}
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
                name={`candidateProfile.education.${index}.grade`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`grade-${index}`}>Grade</FieldLabel>
                    <Input
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`grade-${index}`}
                      placeholder="CGPA / Percentage"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Optional score, rank, or notable academic metric.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`candidateProfile.education.${index}.description`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`educationDescription-${index}`}>
                      Highlights
                    </FieldLabel>
                    <Textarea
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`educationDescription-${index}`}
                      className="min-h-[110px]"
                      placeholder="Mention major coursework, achievements, or activities."
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
        label="Save Education Details"
      />
    </div>
  );
}

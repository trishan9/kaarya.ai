"use client";

import { useState } from "react";
import { Code2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { generateAiSuggestions } from "@/lib/actions/resume-builder-actions";
import { ResumeSkillsInput } from "@/app/(protected)/(dashboard)/resume/_components/resume-form-fields";
import { TUpdateProfileSchemaInput } from "../_schemas";
import { ProfileSaveButton } from "./profile-save-button";

type SkillsInformationFormProps = {
  form: UseFormReturn<TUpdateProfileSchemaInput>;
  isSubmitting: boolean;
};

const WORK_MODES: Array<"remote" | "onsite" | "hybrid"> = [
  "remote",
  "onsite",
  "hybrid",
];

export function SkillsInformationForm({
  form,
  isSubmitting,
}: SkillsInformationFormProps) {
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const skills = form.watch("candidateProfile.skills") ?? [];
  const preferredRoles = form.watch("candidateProfile.preferredRoles") ?? [];
  const preferredLocations = form.watch("candidateProfile.preferredLocations") ?? [];
  const preferredWorkModes = form.watch("candidateProfile.preferredWorkModes") ?? [];

  const toggleWorkMode = (mode: "remote" | "onsite" | "hybrid") => {
    const current = form.getValues("candidateProfile.preferredWorkModes") ?? [];
    const next = current.includes(mode)
      ? current.filter((item) => item !== mode)
      : [...current, mode];
    form.setValue("candidateProfile.preferredWorkModes", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleAiSkillsAutofill = async () => {
    setIsAiGenerating(true);
    try {
      const profile = form.getValues("candidateProfile");
      const suggestion = await generateAiSuggestions({
        focus: "skills",
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
        skills: profile?.skills ?? [],
      });

      if (Array.isArray(suggestion.skills) && suggestion.skills.length > 0) {
        const mergedSkills = Array.from(
          new Set([...(form.getValues("candidateProfile.skills") ?? []), ...suggestion.skills]),
        );
        form.setValue("candidateProfile.skills", mergedSkills, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (suggestion.targetRole) {
        const currentRoles = form.getValues("candidateProfile.preferredRoles") ?? [];
        const normalized = suggestion.targetRole.trim();
        if (normalized && !currentRoles.includes(normalized)) {
          form.setValue(
            "candidateProfile.preferredRoles",
            [normalized, ...currentRoles].slice(0, 20),
            {
              shouldDirty: true,
              shouldValidate: true,
            },
          );
        }
      }

      toast.success("AI suggestions applied to skills and preferred roles.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate AI skill suggestions.",
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Skills & Job Preferences
            </CardTitle>
            <CardDescription>
              Define your primary skill stack and preferred role filters.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => void handleAiSkillsAutofill()}
            disabled={isAiGenerating}
          >
            {isAiGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI Autofill
          </Button>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="skillsInput">Skills</FieldLabel>
              <ResumeSkillsInput
                value={skills}
                onChange={(next) =>
                  form.setValue("candidateProfile.skills", next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Type a skill and press comma/enter"
                addButtonLabel="Add Skill"
              />
              <FieldDescription>
                Add practical skills recruiters should prioritize.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="rolesInput">Preferred Roles</FieldLabel>
              <ResumeSkillsInput
                value={preferredRoles}
                onChange={(next) =>
                  form.setValue("candidateProfile.preferredRoles", next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Type a preferred role and press comma/enter"
                addButtonLabel="Add Role"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="locationsInput">
                Preferred Locations
              </FieldLabel>
              <ResumeSkillsInput
                value={preferredLocations}
                onChange={(next) =>
                  form.setValue("candidateProfile.preferredLocations", next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Type a preferred location and press comma/enter"
                addButtonLabel="Add Location"
              />
            </Field>

            <Field>
              <FieldLabel>Preferred Work Modes</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {WORK_MODES.map((mode) => {
                  const active = preferredWorkModes.includes(mode);
                  return (
                    <Button
                      key={mode}
                      type="button"
                      variant={active ? "default" : "outline"}
                      className="capitalize"
                      onClick={() => toggleWorkMode(mode)}
                    >
                      {mode}
                    </Button>
                  );
                })}
              </div>
              <FieldDescription>
                Select one or more modes to improve role recommendation quality.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <ProfileSaveButton
        isSubmitting={isSubmitting}
        label="Save Skills & Preferences"
      />
    </div>
  );
}

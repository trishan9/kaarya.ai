"use client";

import { useState } from "react";
import {
  Code2,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const SKILL_CATEGORIES = [
  "Technical",
  "Frontend",
  "Backend",
  "Full Stack",
  "Mobile Development",
  "AI/ML",
  "Data Science",
  "DevOps",
  "Cloud & Infrastructure",
  "Cybersecurity",
  "Database",
  "Design",
  "UI/UX",
  "Communication",
  "Leadership",
  "Management",
  "Product Management",
  "Quality Assurance",
  "Marketing",
  "SEO",
  "Content Writing",
  "Business Analysis",
  "Finance",
  "Sales",
  "Operations",
  "Research",
  "Blockchain",
  "IoT",
  "Game Development",
  "Other",
];

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner", color: "bg-zinc-500", dot: "bg-zinc-400" },
  { value: "intermediate", label: "Intermediate", color: "bg-blue-500", dot: "bg-blue-500" },
  { value: "advanced", label: "Advanced", color: "bg-violet-500", dot: "bg-violet-500" },
  { value: "expert", label: "Expert", color: "bg-emerald-500", dot: "bg-emerald-500" },
  { value: "master", label: "Master", color: "bg-amber-500", dot: "bg-amber-500" },
] as const;

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `entry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function SkillsInformationForm({
  form,
  isSubmitting,
}: SkillsInformationFormProps) {
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Technical");
  const [newSkillProficiency, setNewSkillProficiency] = useState<string>("intermediate");

  const skillsFieldArray = useFieldArray({
    control: form.control,
    name: "candidateProfile.skills",
    keyName: "fieldKey",
  });

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

  const handleAddSkill = () => {
    if (!newSkillName.trim()) {
      toast.error("Skill name is required.");
      return;
    }
    const existing = skillsFieldArray.fields.find(
      (f) => {
        const watched = form.getValues(`candidateProfile.skills.${skillsFieldArray.fields.indexOf(f)}`);
        return watched?.name?.toLowerCase() === newSkillName.trim().toLowerCase();
      },
    );
    if (existing) {
      toast.error("This skill already exists.");
      return;
    }
    skillsFieldArray.append({
      id: createId(),
      name: newSkillName.trim(),
      category: newSkillCategory,
      proficiency: newSkillProficiency as "beginner" | "intermediate" | "advanced" | "expert" | "master",
      proofs: [],
    });
    setNewSkillName("");
    setNewSkillCategory("Technical");
    setNewSkillProficiency("intermediate");
    setShowAddSkill(false);
  };

  const handleAiSkillsAutofill = async () => {
    setIsAiGenerating(true);
    try {
      const profile = form.getValues("candidateProfile");
      const existingSkillNames = (profile?.skills ?? []).map((s) =>
        typeof s === "string" ? s : s.name,
      );
      const suggestion = await generateAiSuggestions({
        focus: "skills",
        targetRole:
          profile?.preferredRoles?.[0] ?? profile?.headline ?? undefined,
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
        skills: existingSkillNames,
      });

      if (Array.isArray(suggestion.skills) && suggestion.skills.length > 0) {
        const existingNames = new Set(
          existingSkillNames.map((n) => n.toLowerCase()),
        );
        const newSkills = suggestion.skills
          .filter((s: string) => !existingNames.has(s.toLowerCase()))
          .map((s: string) => ({
            id: createId(),
            name: s,
            category: "Technical",
            proficiency: "intermediate" as const,
            proofs: [],
          }));
        if (newSkills.length > 0) {
          skillsFieldArray.append(newSkills);
          toast.success(`Added ${newSkills.length} AI-suggested skills.`);
        } else {
          toast.info("No new skills to suggest.");
        }
      }
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

  const groupedSkills = skillsFieldArray.fields.reduce<
    Record<string, Array<{ index: number; fieldKey: string }>>
  >((acc, field, index) => {
    const skill = form.watch(`candidateProfile.skills.${index}`);
    const cat = skill?.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ index, fieldKey: field.fieldKey });
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Skills
            </CardTitle>
            <CardDescription>
              Add your skills with proficiency levels. These are shown to
              recruiters and used for job matching.
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
        <CardContent className="space-y-4">
          {/* Skills grouped by category */}
          {Object.keys(groupedSkills).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(groupedSkills).map(([category, items]) => (
                <div key={category} className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map(({ index, fieldKey }) => {
                      const skill = form.watch(`candidateProfile.skills.${index}`);
                      const profLevel = PROFICIENCY_LEVELS.find(
                        (p) => p.value === skill?.proficiency,
                      );
                      return (
                        <Badge
                          key={fieldKey}
                          variant="secondary"
                          className="gap-1.5 rounded-lg py-1 px-2.5 text-xs font-medium"
                        >
                          <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${profLevel?.dot ?? "bg-zinc-400"}`}
                          />
                          {skill?.name}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {profLevel?.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => skillsFieldArray.remove(index)}
                            className="ml-0.5 rounded-xs p-0.5 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Code2 className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                No skills added yet. Add skills manually or use AI Autofill.
              </p>
            </div>
          )}

          {/* Add Skill */}
          {showAddSkill ? (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-semibold">Add New Skill</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Skill Name
                  </label>
                  <Input
                    placeholder="e.g. React, Python, Figma"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Category
                  </label>
                  <Select
                    value={newSkillCategory}
                    onValueChange={setNewSkillCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {SKILL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Proficiency
                  </label>
                  <Select
                    value={newSkillProficiency}
                    onValueChange={setNewSkillProficiency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFICIENCY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${level.dot}`}
                            />
                            {level.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddSkill}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Skill
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSkill(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowAddSkill(true)}
            >
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
          )}

          {skillsFieldArray.fields.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {skillsFieldArray.fields.length} skill
              {skillsFieldArray.fields.length !== 1 ? "s" : ""} added across{" "}
              {Object.keys(groupedSkills).length} categor
              {Object.keys(groupedSkills).length !== 1 ? "ies" : "y"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Job Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Preferences</CardTitle>
          <CardDescription>
            Set preferred roles, locations, and work modes for better
            recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
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
                      size="sm"
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

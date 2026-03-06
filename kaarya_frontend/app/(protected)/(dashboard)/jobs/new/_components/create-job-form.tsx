"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Controller, useWatch } from "react-hook-form";
import { CalendarDays, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LocationPicker } from "@/components/location/location-picker";
import { cn } from "@/lib/utils";
import { useCreateJob } from "../_hooks/use-create-job";
import type { TCreateJobPostingSchema } from "../_schemas";

type CreateJobFormProps = {
  workspaceId: string;
  workspaceType: "company" | "college";
  mode?: "create" | "edit";
  jobId?: string;
  activeWorkspaceId?: string | null;
  initialValues?: Partial<TCreateJobPostingSchema>;
  submitLabel?: string;
};

type SkillsInputProps = {
  value: string[];
  onChange: (skills: string[]) => void;
};

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const employmentTypeOptions = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Temporary",
  "Freelance",
] as const;

const engagementTypeOptions = [
  "Internship",
  "Apprenticeship",
  "Volunteer",
  "Consulting",
  "Project-Based",
] as const;

const workModeOptions = [
  { label: "Onsite", value: "onsite" },
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
] as const;

const salaryMinBound = 300000;
const salaryMaxBound = 5000000;
const salaryStep = 50000;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["blockquote", "link", "code-block"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "bullet",
  "align",
  "blockquote",
  "link",
  "code-block",
];

const formatCurrency = (amount: number) =>
  `NPR ${amount.toLocaleString("en-IN")}`;

const toDateValueString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const parseSalaryRange = (value?: string) => {
  if (!value) return [1000000, 1800000] as [number, number];
  const numbers = value
    .match(/[\d,]+/g)
    ?.map((item) => Number(item.replaceAll(",", "")))
    .filter((num) => Number.isFinite(num));
  if (!numbers || numbers.length === 0) return [1000000, 1800000] as [number, number];
  if (numbers.length === 1) return [numbers[0], numbers[0]] as [number, number];
  return [numbers[0], numbers[1]] as [number, number];
};

function SkillsInput({ value, onChange }: SkillsInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const addSkills = React.useCallback(
    (rawValue: string) => {
      const normalizedItems = rawValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (normalizedItems.length === 0) return;

      const deduped = new Set(
        value.map((skill) => skill.toLowerCase()).concat(
          normalizedItems.map((skill) => skill.toLowerCase()),
        ),
      );

      const mergedSkills = Array.from(deduped).map((normalized) => {
        const existing = value.find((skill) => skill.toLowerCase() === normalized);
        if (existing) return existing;
        const incoming = normalizedItems.find(
          (skill) => skill.toLowerCase() === normalized,
        );
        return incoming ?? normalized;
      });

      onChange(mergedSkills);
    },
    [onChange, value],
  );

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter((skill) => skill !== skillToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-xl border border-input bg-card px-2 py-1.5">
        {value.map((skill) => (
          <Badge key={skill} variant="secondary" className="gap-1 rounded-md">
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="rounded-xs p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {skill}</span>
            </button>
          </Badge>
        ))}

        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
              event.preventDefault();
              if (!inputValue.trim()) return;
              addSkills(inputValue);
              setInputValue("");
            }

            if (event.key === "Backspace" && !inputValue && value.length > 0) {
              removeSkill(value[value.length - 1]);
            }
          }}
          onBlur={() => {
            if (!inputValue.trim()) return;
            addSkills(inputValue);
            setInputValue("");
          }}
          placeholder={value.length === 0 ? "Type a skill and press comma/enter" : ""}
          className="h-7 min-w-[180px] flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => {
          if (!inputValue.trim()) return;
          addSkills(inputValue);
          setInputValue("");
        }}
        disabled={!inputValue.trim()}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Skill
      </Button>
    </div>
  );
}

export function CreateJobForm({
  workspaceId,
  workspaceType,
  mode = "create",
  jobId,
  activeWorkspaceId,
  initialValues,
  submitLabel,
}: CreateJobFormProps) {
  const { form, onSubmit, isSubmitting } = useCreateJob({
    workspaceId,
    workspaceType,
    mode,
    jobId,
    activeWorkspaceId,
    initialValues,
  });
  const watchedSalaryRange = useWatch({
    control: form.control,
    name: "salaryRange",
  });
  const [salaryRangeValues, setSalaryRangeValues] = React.useState<[number, number]>(
    parseSalaryRange(form.getValues("salaryRange")),
  );

  React.useEffect(() => {
    const next = parseSalaryRange(watchedSalaryRange);
    setSalaryRangeValues(next);
  }, [watchedSalaryRange]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="title">Job Title</FieldLabel>
              <Input
                {...field}
                id="title"
                placeholder="Senior Backend Engineer"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Job Description</FieldLabel>
              <div
                className={cn(
                  "overflow-hidden rounded-xl border border-input bg-card shadow-sm",
                  fieldState.invalid && "border-destructive",
                )}
              >
                <ReactQuill
                  theme="snow"
                  value={field.value || ""}
                  onChange={field.onChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Describe responsibilities, outcomes, and team expectations."
                />
              </div>
              <FieldDescription>
                Rich formatting is supported and will be shown in job details.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="location"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Location</FieldLabel>
              <LocationPicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Search city/office or click map"
                className="relative z-0"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Controller
            name="employmentType"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Employment Type</FieldLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                >
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="engagementType"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Engagement Type</FieldLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={(nextValue) => field.onChange(nextValue)}
                >
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select engagement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {engagementTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="workMode"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Work Mode</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {workModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="salaryRange"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Salary Range</FieldLabel>
                <div className="space-y-3 rounded-xl border border-input bg-card p-3">
                  <Slider
                    min={salaryMinBound}
                    max={salaryMaxBound}
                    step={salaryStep}
                    value={salaryRangeValues}
                    onValueChange={(nextValues) => {
                      if (nextValues.length !== 2) return;
                      const normalized: [number, number] = [
                        Math.min(nextValues[0], nextValues[1]),
                        Math.max(nextValues[0], nextValues[1]),
                      ];
                      setSalaryRangeValues(normalized);
                      field.onChange(
                        `${formatCurrency(normalized[0])} - ${formatCurrency(normalized[1])}`,
                      );
                    }}
                  />
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>{formatCurrency(salaryRangeValues[0])}</span>
                    <span>{formatCurrency(salaryRangeValues[1])}</span>
                  </div>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="deadline"
            control={form.control}
            render={({ field, fieldState }) => {
              const selectedDate = parseDateValue(field.value);
              return (
                <Field>
                  <FieldLabel>Application Deadline</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-10 w-full justify-start rounded-md border-input bg-card px-3 text-sm font-normal",
                          !selectedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarDays className="h-4 w-4" />
                        {selectedDate ? (
                          <span>{formatDateLabel(selectedDate)}</span>
                        ) : (
                          <span>Select deadline</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="z-[1300] w-auto p-3">
                      <Calendar
                        selected={selectedDate}
                        onSelect={(date) =>
                          field.onChange(date ? toDateValueString(date) : "")
                        }
                        disabled={(date) => {
                          const today = new Date();
                          const threshold = new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate(),
                          );
                          return date < threshold;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              );
            }}
          />
        </div>

        <Controller
          name="skills"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="skills">Skills</FieldLabel>
              <SkillsInput
                value={field.value ?? []}
                onChange={(skills) => field.onChange(skills)}
              />
              <FieldDescription>
                Add one or more skills for candidate matching and role discovery.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button disabled={isSubmitting} type="submit">
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting
            ? mode === "edit"
              ? "Updating job posting..."
              : "Creating job posting..."
            : submitLabel ?? (mode === "edit" ? "Update Job Posting" : "Create Job Posting")}
        </Button>
      </FieldGroup>
    </form>
  );
}


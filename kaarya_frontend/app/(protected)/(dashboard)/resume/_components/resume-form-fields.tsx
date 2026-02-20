"use client";

import * as React from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function parseDateValue(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toDateValueString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type DateInputProps = {
  value?: string | null;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function ResumeDateInput({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
}: DateInputProps) {
  const selectedDate = parseDateValue(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start rounded-md border-input bg-white px-3 text-sm font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarDays className="h-4 w-4" />
          {selectedDate ? (
            <span>{formatDateLabel(selectedDate)}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[1300] w-auto p-3">
        <Calendar
          selected={selectedDate}
          disabled={disabled ? () => true : undefined}
          onSelect={(date) => onChange(date ? toDateValueString(date) : "")}
        />
      </PopoverContent>
    </Popover>
  );
}

type SkillsInputProps = {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  addButtonLabel?: string;
};

function normalizeSkillsInput(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ResumeSkillsInput({
  value,
  onChange,
  placeholder = "Type and press comma/enter",
  addButtonLabel = "Add Skill",
}: SkillsInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const addSkills = React.useCallback(
    (rawInput: string) => {
      const normalizedItems = normalizeSkillsInput(rawInput);
      if (normalizedItems.length === 0) return;

      const deduped = new Set(
        value.map((skill) => skill.toLowerCase()).concat(
          normalizedItems.map((skill) => skill.toLowerCase())
        )
      );

      const mergedSkills = Array.from(deduped).map((normalized) => {
        const existing = value.find((skill) => skill.toLowerCase() === normalized);
        if (existing) return existing;
        const incoming = normalizedItems.find(
          (skill) => skill.toLowerCase() === normalized
        );
        return incoming ?? normalized;
      });

      onChange(mergedSkills);
    },
    [onChange, value]
  );

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter((skill) => skill !== skillToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1 rounded-xl border border-input bg-white px-2 py-1.5">
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
          placeholder={value.length === 0 ? placeholder : ""}
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
        {addButtonLabel}
      </Button>
    </div>
  );
}

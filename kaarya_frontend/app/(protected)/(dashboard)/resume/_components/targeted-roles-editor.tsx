"use client";

import * as React from "react";
import { CirclePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TargetedRolesEditorProps = {
  label: string;
  required?: boolean;
  addRoleLabel: string;
  removeRoleLabel: string;
  roles: string[];
  onChangeRoles: (roles: string[]) => void;
};

function normalizeRoleValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function TargetedRolesEditor({
  label,
  required,
  addRoleLabel,
  removeRoleLabel,
  roles,
  onChangeRoles,
}: TargetedRolesEditorProps) {
  const updateRole = React.useCallback(
    (index: number, value: string) => {
      onChangeRoles(
        roles.map((role, roleIndex) =>
          roleIndex === index ? normalizeRoleValue(value) : role,
        ),
      );
    },
    [onChangeRoles, roles],
  );

  const addRole = React.useCallback(() => {
    onChangeRoles([...roles, ""]);
  }, [onChangeRoles, roles]);

  const removeRole = React.useCallback(
    (index: number) => {
      if (roles.length === 1) {
        onChangeRoles([""]);
        return;
      }

      onChangeRoles(roles.filter((_, roleIndex) => roleIndex !== index));
    },
    [onChangeRoles, roles],
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>

      <div className="space-y-2">
        {roles.map((role, index) => (
          <div key={`target-role-${index}`} className="flex items-center gap-2">
            <Input
              value={role}
              onChange={(event) => updateRole(index, event.target.value)}
              placeholder="Frontend Developer Intern"
              className="h-10"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-lg border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600"
              onClick={() => removeRole(index)}
              aria-label={`${removeRoleLabel} ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-9 rounded-lg border-[#d8dde4] bg-white text-sm font-medium"
        onClick={addRole}
      >
        <CirclePlus className="h-4 w-4" />
        {addRoleLabel}
      </Button>
    </div>
  );
}

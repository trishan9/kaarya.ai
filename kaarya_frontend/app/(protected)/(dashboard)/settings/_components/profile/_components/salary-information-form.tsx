"use client";

import { Controller, UseFormReturn } from "react-hook-form";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type SalaryInformationFormProps = {
  form: UseFormReturn<TUpdateProfileSchemaInput>;
  isSubmitting: boolean;
};

const CURRENCIES = ["NPR", "USD", "INR", "EUR", "GBP"] as const;
const PERIODS = [
  { value: "yearly", label: "Per Year" },
  { value: "monthly", label: "Per Month" },
  { value: "hourly", label: "Per Hour" },
] as const;

export function SalaryInformationForm({
  form,
  isSubmitting,
}: SalaryInformationFormProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Salary Expectations
          </CardTitle>
          <CardDescription>
            Set compensation preferences used for matching and visibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Controller
                name="candidateProfile.salary.currency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Currency</FieldLabel>
                    <Select
                      value={field.value || "NPR"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
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
                name="candidateProfile.salary.minAmount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="salaryMin">Minimum</FieldLabel>
                    <Input
                      id="salaryMin"
                      type="number"
                      min={0}
                      value={typeof field.value === "number" ? field.value : ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="candidateProfile.salary.maxAmount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="salaryMax">Maximum</FieldLabel>
                    <Input
                      id="salaryMax"
                      type="number"
                      min={0}
                      value={typeof field.value === "number" ? field.value : ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
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
                name="candidateProfile.salary.period"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Salary Period</FieldLabel>
                    <Select
                      value={field.value || "yearly"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODS.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
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
                name="candidateProfile.salary.isNegotiable"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Negotiable</FieldLabel>
                    <Select
                      value={field.value ? "yes" : "no"}
                      onValueChange={(value) => field.onChange(value === "yes")}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Set yes to indicate flexibility during offer discussions.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <ProfileSaveButton
        isSubmitting={isSubmitting}
        label="Save Salary Preferences"
      />
    </div>
  );
}

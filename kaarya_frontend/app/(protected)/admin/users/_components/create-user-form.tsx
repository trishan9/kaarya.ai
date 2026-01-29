"use client";

import { Controller } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TAdminCreateUserSchema } from "@/app/(protected)/admin/_schemas";
import { useCreateUser } from "../_hooks/use-create-user";

export function CreateUserForm() {
  const { form, onSubmit, isSubmitting } = useCreateUser();

  const submitHandler = async (values: TAdminCreateUserSchema) =>
    await onSubmit(values);

  return (
    <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2">
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input
                  {...field}
                  id="name"
                  placeholder="Trishan Wagle"
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
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="trishan@kaarya.com"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <select
                    id="role"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={field.value ?? "user"}
                    onChange={(event) => field.onChange(event.target.value)}
                    aria-invalid={fieldState.invalid}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="provider"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="provider">Provider</FieldLabel>
                  <select
                    id="provider"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={field.value ?? "email"}
                    onChange={(event) => field.onChange(event.target.value)}
                    aria-invalid={fieldState.invalid}
                  >
                    <option value="email">Email</option>
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                  </select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="confirmPassword">
                    Confirm password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="confirmPassword"
                    type="password"
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
            name="photo"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="photo">Profile photo</FieldLabel>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    field.onChange(file);
                  }}
                />
                <FieldDescription>
                  Optional. JPG, PNG, or WebP up to 5MB.
                </FieldDescription>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          {isSubmitting ? "Creating..." : "Create user"}
        </Button>
      </div>
    </form>
  );
}

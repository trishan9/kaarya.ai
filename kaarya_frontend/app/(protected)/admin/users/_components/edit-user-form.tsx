"use client";

import { useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { Loader2, Save, Upload, X, User, Mail, Shield, Key, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TAdminUpdateUserSchema } from "@/app/(protected)/admin/_schemas";
import { useUpdateUser } from "../_hooks/use-update-user";
import Image from "next/image";
import { cn } from "@/lib/utils";

type EditUserFormProps = {
  userId: string;
  initialValues: Partial<TAdminUpdateUserSchema>;
  imageUrl?: string | null;
};

export function EditUserForm({
  userId,
  initialValues,
  imageUrl,
}: EditUserFormProps) {
  const { form, onSubmit, isSubmitting } = useUpdateUser(userId, initialValues);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitHandler = async (values: TAdminUpdateUserSchema) =>
    await onSubmit(values);

  const showPreview = useMemo(() => !!previewImage, [previewImage]);
  const showExisting = useMemo(
    () => !!imageUrl && !previewImage,
    [imageUrl, previewImage],
  );

  const handleImageChange = (
    file: File | undefined,
    onChange: (file: File | null) => void,
  ) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
    onChange(file ?? null);
  };

  const handleDismissImage = (onChange?: (file: File | null) => void) => {
    setPreviewImage(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (
    e: React.DragEvent,
    onChange: (file: File | null) => void,
  ) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChange(file, onChange);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-6">
      {/* Profile Picture Section */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Update the user&apos;s profile picture. This will be displayed across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            name="photo"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-4">
                {/* Hidden file input - always rendered so it's always accessible */}
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    handleImageChange(file, field.onChange);
                  }}
                />
                
                {showPreview || showExisting ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="relative size-32 overflow-hidden rounded-full border-4 border-background ring-4 ring-muted shadow-lg">
                        <Image
                          width={128}
                          height={128}
                          src={previewImage ?? imageUrl ?? ""}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {(showPreview || showExisting) && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 rounded-full shadow-lg"
                          onClick={() => handleDismissImage(field.onChange)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {showPreview ? "New Preview" : "Current Photo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click the button below to {showPreview ? "change" : "update"} the image
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {showPreview ? "Change Picture" : "Update Picture"}
                    </Button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, field.onChange)}
                    className={cn(
                      "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="rounded-full bg-muted p-4">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, or WebP (max. 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Personal Information Section */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update the user&apos;s basic information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    placeholder="John Doe"
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
                  <FieldLabel htmlFor="email">Email Address</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
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

      {/* Account Settings Section */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Configure role and authentication provider for this user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-6 md:grid-cols-2">
              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="role">Role</FieldLabel>
                    <select
                      id="role"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value ?? "user"}
                      onChange={(event) => field.onChange(event.target.value)}
                      aria-invalid={fieldState.invalid}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <FieldDescription>
                      Select the user&apos;s role and permissions level.
                    </FieldDescription>
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
                    <FieldLabel htmlFor="provider">Authentication Provider</FieldLabel>
                    <select
                      id="provider"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value ?? "email"}
                      onChange={(event) => field.onChange(event.target.value)}
                      aria-invalid={fieldState.invalid}
                    >
                      <option value="email">Email</option>
                      <option value="google">Google</option>
                      <option value="facebook">Facebook</option>
                    </select>
                    <FieldDescription>
                      Choose how the user will authenticate.
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

      {/* Security Section */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Update the password. Leave blank to keep the current password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-6 md:grid-cols-2">
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="password">
                      New Password (Optional)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Leave blank to keep the current password. Minimum 8 characters recommended.
                    </FieldDescription>
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
                      Confirm Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter the new password"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Must match the password above.
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

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 transition-all hover:shadow-md min-w-[140px]"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

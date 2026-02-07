"use client";

import { Controller } from "react-hook-form";
import { UseFormReturn } from "react-hook-form";
import { Loader2, Save, User, Mail, Camera } from "lucide-react";
import { TUpdateProfileSchema } from "../_schemas";
import { ProfilePictureUpload } from "./profile-picture-upload";
import { Input } from "@/components/ui/input";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

interface GeneralInformationFormProps {
  form: UseFormReturn<TUpdateProfileSchema>;
  currentPhoto?: string | null;
  userName: string;
  isSubmitting: boolean;
}

export function GeneralInformationForm({
  form,
  currentPhoto,
  userName,
  isSubmitting,
}: GeneralInformationFormProps) {
  return (
    <div className="space-y-6">
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>

          <CardDescription>
            Upload a profile picture. This will be displayed across the
            platform.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ProfilePictureUpload
            form={form}
            currentPhoto={currentPhoto}
            userName={userName}
          />
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>

          <CardDescription>
            Update your personal details and contact information.
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

                  <FieldDescription>
                    Your full name as you&apos;d like it to appear.
                  </FieldDescription>

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
                  <FieldLabel htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </FieldLabel>

                  <Input
                    {...field}
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    aria-invalid={fieldState.invalid}
                  />

                  <FieldDescription>
                    Your email address for account notifications.
                  </FieldDescription>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
      </Card>

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
    </div>
  );
}

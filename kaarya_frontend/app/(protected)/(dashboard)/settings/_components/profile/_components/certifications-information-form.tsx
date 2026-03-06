"use client";

import { useState } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { Award, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { ResumeDateInput } from "@/app/(protected)/(dashboard)/resume/_components/resume-form-fields";
import { uploadCertificationMedia } from "@/lib/actions/auth-action";

type CertificationsInformationFormProps = {
  form: UseFormReturn<TUpdateProfileSchemaInput>;
  fields: Array<{ id: string }>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isSubmitting: boolean;
};

export function CertificationsInformationForm({
  form,
  fields,
  onAdd,
  onRemove,
  isSubmitting,
}: CertificationsInformationFormProps) {
  const [uploadingCertificationId, setUploadingCertificationId] = useState<string | null>(null);

  const handleCertificationMediaUpload = async (index: number, file: File | null) => {
    if (!file) return;
    const allowedMimeTypes = new Set([
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ]);
    if (!allowedMimeTypes.has(file.type)) {
      toast.error("Only PDF, JPG, PNG, and WEBP files are allowed.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Certification file must be smaller than 8 MB.");
      return;
    }

    const certificationId =
      form.getValues(`candidateProfile.certifications.${index}.id`) || `cert-${index}`;
    setUploadingCertificationId(certificationId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await uploadCertificationMedia(formData);
      if (!response?.success || !response?.data?.url) {
        toast.error(response?.message || "Failed to upload certification media.");
        return;
      }
      form.setValue(
        `candidateProfile.certifications.${index}.mediaUrl`,
        response.data.url,
        { shouldDirty: true },
      );
      form.setValue(
        `candidateProfile.certifications.${index}.mediaMimeType`,
        response.data.mimeType ?? file.type,
        { shouldDirty: true },
      );
      toast.success("Certification media uploaded.");
    } finally {
      setUploadingCertificationId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
            <CardDescription>
              Highlight verifiable certifications relevant to your role.
            </CardDescription>
          </div>
          <Button type="button" onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </CardHeader>
      </Card>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Add certifications if you hold official credentials.
          </CardContent>
        </Card>
      ) : null}

      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">
              Certification #{index + 1}
            </CardTitle>
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
                name={`candidateProfile.certifications.${index}.name`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`certificationName-${index}`}>
                      Certificate Name
                    </FieldLabel>
                    <Input
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`certificationName-${index}`}
                      placeholder="AWS Certified Developer"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`candidateProfile.certifications.${index}.issuer`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`certificationIssuer-${index}`}>
                      Issuing Organization
                    </FieldLabel>
                    <Input
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`certificationIssuer-${index}`}
                      placeholder="Amazon Web Services"
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
                  name={`candidateProfile.certifications.${index}.issueDate`}
                  control={form.control}
                  render={({ field: controlledField, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={`certificationIssueDate-${index}`}>
                        Issue Date
                      </FieldLabel>
                      <ResumeDateInput
                        value={controlledField.value ?? ""}
                        onChange={(value) => controlledField.onChange(value)}
                        placeholder="Select issue date"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name={`candidateProfile.certifications.${index}.expiryDate`}
                  control={form.control}
                  render={({ field: controlledField, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={`certificationExpiryDate-${index}`}>
                        Expiry Date
                      </FieldLabel>
                      <ResumeDateInput
                        value={controlledField.value ?? ""}
                        onChange={(value) => controlledField.onChange(value)}
                        disabled={Boolean(
                          form.watch(`candidateProfile.certifications.${index}.noExpiry`),
                        )}
                        placeholder="Select expiry date"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name={`candidateProfile.certifications.${index}.noExpiry`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel>Does Not Expire</FieldLabel>
                    <Select
                      value={controlledField.value ? "yes" : "no"}
                      onValueChange={(value) => {
                        const hasNoExpiry = value === "yes";
                        controlledField.onChange(hasNoExpiry);
                        if (hasNoExpiry) {
                          form.setValue(
                            `candidateProfile.certifications.${index}.expiryDate`,
                            "",
                            { shouldDirty: true },
                          );
                        }
                      }}
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
                      Mark as no-expiry for permanent credentials.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`candidateProfile.certifications.${index}.credentialId`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`certificationCredentialId-${index}`}>
                      Credential ID
                    </FieldLabel>
                    <Input
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`certificationCredentialId-${index}`}
                      placeholder="ABC-123-XYZ"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`candidateProfile.certifications.${index}.credentialUrl`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={`certificationCredentialUrl-${index}`}>
                      Verification URL
                    </FieldLabel>
                    <Input
                      {...controlledField}
                      value={controlledField.value ?? ""}
                      id={`certificationCredentialUrl-${index}`}
                      placeholder="https://example.com/verify"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Public link recruiters can use to verify.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={`candidateProfile.certifications.${index}.mediaUrl`}
                control={form.control}
                render={({ field: controlledField, fieldState }) => {
                  const currentId =
                    form.getValues(`candidateProfile.certifications.${index}.id`) ||
                    `cert-${index}`;
                  const isUploading = uploadingCertificationId === currentId;
                  const inputId = `certification-media-upload-${index}`;
                  return (
                    <Field>
                      <FieldLabel htmlFor={inputId}>Certificate File (Photo/PDF)</FieldLabel>
                      <input
                        id={inputId}
                        type="file"
                        accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0] ?? null;
                          void handleCertificationMediaUpload(index, file);
                          event.currentTarget.value = "";
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() =>
                            (document.getElementById(inputId) as HTMLInputElement | null)?.click()
                          }
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UploadCloud className="h-4 w-4" />
                          )}
                          Upload File
                        </Button>
                        {controlledField.value ? (
                          <>
                            <Button asChild type="button" variant="outline">
                              <a
                                href={controlledField.value}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Uploaded
                              </a>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-rose-600 hover:text-rose-700"
                              onClick={() => {
                                form.setValue(
                                  `candidateProfile.certifications.${index}.mediaUrl`,
                                  "",
                                  { shouldDirty: true },
                                );
                                form.setValue(
                                  `candidateProfile.certifications.${index}.mediaMimeType`,
                                  "",
                                  { shouldDirty: true },
                                );
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        ) : null}
                      </div>
                      <FieldDescription>
                        Upload certificate proof as PDF or image for recruiter verification.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      ))}

      <ProfileSaveButton
        isSubmitting={isSubmitting}
        label="Save Certifications"
      />
    </div>
  );
}

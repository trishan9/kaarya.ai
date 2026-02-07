"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { TUpdateProfileSchema } from "../_schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProfilePictureUploadProps {
  form: UseFormReturn<TUpdateProfileSchema>;
  currentPhoto?: string | null;
  userName: string;
}

export function ProfilePictureUpload({ form }: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | undefined) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        form.setError("photo", {
          type: "manual",
          message: "File size must be less than 5MB",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        form.setError("photo", {
          type: "manual",
          message: "Only image files are allowed",
        });
        return;
      }

      form.setValue("photo", file);
      form.clearErrors("photo");

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    form.setValue("photo", null);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileChange(file);
    }
  };

  const showPreview = !!preview;

  return (
    <div className="space-y-4">
      {showPreview ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="relative size-32 overflow-hidden rounded-full border-4 border-background ring-4 ring-muted shadow-lg">
              <Image
                width={128}
                height={128}
                src={preview ?? ""}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 rounded-full shadow-lg"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium">Preview</p>

            <p className="text-xs text-muted-foreground">
              Click the button below to change the image
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Change Picture
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="hidden"
          />

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

      {form.formState.errors.photo && (
        <p className="text-sm text-destructive">
          {form.formState.errors.photo.message}
        </p>
      )}
    </div>
  );
}

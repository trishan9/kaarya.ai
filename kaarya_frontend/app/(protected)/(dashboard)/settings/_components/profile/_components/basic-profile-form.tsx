"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Mail, Save, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { TUser } from "@/lib/definitions";
import { updateProfile } from "@/lib/actions/auth-action";

interface BasicProfileFormProps {
  user: TUser;
}

export function BasicProfileForm({ user }: BasicProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const initials = (user.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5 MB.");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("email", email.trim());
        if (photo) formData.append("photo", photo);

        const response = await updateProfile(formData);

        if (!response?.success) {
          toast.error(response?.message || "Failed to update profile.");
          return;
        }

        toast.success("Profile updated successfully!");
        setPhoto(null);
        setPreview(null);
        router.refresh();
      } catch {
        toast.error("An unexpected error occurred.");
      }
    });
  };

  const displayPhoto = preview ?? user.photo;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Update your display name, email address, and profile photo.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-border">
                  {displayPhoto ? (
                    <AvatarImage src={displayPhoto} alt={name} />
                  ) : null}
                  <AvatarFallback className="text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{name || "User"}</p>
                <p>Click the camera icon to change your photo.</p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="basic-name">
                  <User className="mr-1 inline h-3.5 w-3.5" />
                  Full Name
                </FieldLabel>
                <Input
                  id="basic-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="basic-email">
                  <Mail className="mr-1 inline h-3.5 w-3.5" />
                  Email Address
                </FieldLabel>
                <Input
                  id="basic-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="min-w-[148px] gap-2"
                size="lg"
              >
                {isPending ? (
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
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

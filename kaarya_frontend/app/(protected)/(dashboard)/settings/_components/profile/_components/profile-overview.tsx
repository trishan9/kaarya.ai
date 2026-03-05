"use client";

import { Mail, User as UserIcon } from "lucide-react";
import { TUser } from "@/lib/definitions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileOverviewProps {
  user: TUser;
}

export function ProfileOverview({ user }: ProfileOverviewProps) {
  const profile = user.candidateProfile ?? {};

  const providerLabelMap: Record<string, string> = {
    email: "Email",
    google: "Google",
    github: "GitHub",
  };
  const providerOrder = ["email", "google", "github"];
  const providers = Array.from(
    new Set(
      user.linkedProviders?.length
        ? user.linkedProviders
        : user.provider
          ? [user.provider]
          : [],
    ),
  ).sort((a, b) => providerOrder.indexOf(a) - providerOrder.indexOf(b));

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const username = user.name?.toLowerCase().replace(/\s+/g, "") ?? "";

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Profile Overview</CardTitle>
        <CardDescription>Your account information and details</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20 shrink-0 ring-4 ring-muted">
            <AvatarImage src={user.photo || undefined} alt={user.name} />
            <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-semibold leading-tight">
                {user.name}
              </h3>
              {profile.headline && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {profile.headline}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-xs capitalize">
                {user.role}
              </Badge>
              {providers.map((p) => (
                <Badge
                  key={p}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {providerLabelMap[p] ?? p}
                </Badge>
              ))}
              {profile.openToWork && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-normal">
                  Open to Work
                </Badge>
              )}
            </div>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              {user.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{user.email}</span>
                </div>
              )}
              {profile.location ? (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 shrink-0" />
                  <span>@{username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

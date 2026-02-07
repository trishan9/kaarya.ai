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
        : []
    )
  ).sort((a, b) => providerOrder.indexOf(a) - providerOrder.indexOf(b));

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle>Profile Overview</CardTitle>
        <CardDescription>Your account information and details</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-muted">
            <AvatarImage src={user.photo || undefined} alt={user.name} />

            <AvatarFallback className="text-xl sm:text-2xl font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-xl font-semibold mb-1">{user.name}</h3>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>

                {providers.map((provider) => (
                  <Badge variant="outline" className="text-xs" key={provider}>
                    {providerLabelMap[provider] ?? provider}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>

              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>@{user.name?.toLowerCase().replace(/\s+/g, "")}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

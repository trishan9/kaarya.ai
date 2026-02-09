"use client";

import { ShieldCheck, ShieldEllipsis } from "lucide-react";
import { AuthProvider, TUser } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SecuritySettingsProps = {
  user: TUser;
};

const providerLabels: Record<AuthProvider, string> = {
  email: "Email & Password",
  google: "Google OAuth",
  github: "GitHub OAuth",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleDateString();
};

export function SecuritySettings({ user }: SecuritySettingsProps) {
  const providerSet = new Set<AuthProvider>(user.linkedProviders ?? []);
  if (user.provider) providerSet.add(user.provider);
  for (const account of user.linkedAccounts ?? []) {
    providerSet.add(account.provider);
  }

  const providers = Array.from(providerSet);
  const hasEmailCredentials = providerSet.has("email");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Review sign-in access and core protection settings for your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active Sign-in Providers
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {providers.length ? (
                providers.map((provider) => (
                  <Badge key={provider} variant="outline">
                    {providerLabels[provider] ?? provider}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No providers detected</Badge>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Password Login</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasEmailCredentials
                  ? "Enabled via email sign-in."
                  : "Not enabled for this account."}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Account Created</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldEllipsis className="h-5 w-5" />
            Protection Controls
          </CardTitle>
          <CardDescription>
            More protection controls are rolling out in upcoming updates.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Two-Factor Authentication</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Planned. Add an extra verification step at sign-in.
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Sign-in Activity Alerts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Planned. Get notified for unusual sign-in attempts.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            Manage OAuth connections from the <span className="font-medium">Linked Apps</span> tab.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
